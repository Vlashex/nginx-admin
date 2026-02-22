#!/usr/bin/env bash
set -euo pipefail

REPO_OWNER="${REPO_OWNER:-Vlashex}"
REPO_NAME="${REPO_NAME:-nginx-admin}"
PACKAGE_NAME="${PACKAGE_NAME:-nginx-admin}"
SERVICE_NAME="${SERVICE_NAME:-nginx-admin.service}"
TAG_PREFIX="${TAG_PREFIX:-daemon-v}"
REQUESTED_VERSION="${REQUESTED_VERSION:-}"
GITHUB_API="https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}"


TMP_DIR="$(mktemp -d)"
trap 'rm -rf "${TMP_DIR}"' EXIT

log() {
  echo "[install] $*" >&2
}

err() {
  echo "[install][error] $*" >&2
  exit 1
}

require_root() {
  [[ "${EUID}" -eq 0 ]] || err "Run as root (sudo)"
}

require_linux() {
  [[ "$(uname -s)" == "Linux" ]] || err "Linux only"
}

require_apt() {
  command -v apt-get >/dev/null 2>&1 || err "apt-get not found"
}

require_jq() {
  command -v jq >/dev/null 2>&1 || {
    log "Installing jq"
    apt-get update -y
    apt-get install -y jq
  }
}

detect_arch() {
  case "$(uname -m)" in
    x86_64|amd64) printf "amd64" ;;
    aarch64|arm64) printf "arm64" ;;
    *) err "Unsupported architecture: $(uname -m)" ;;
  esac
}

detect_distro() {
  [[ -f /etc/os-release ]] || err "/etc/os-release missing"
  # shellcheck disable=SC1091
  source /etc/os-release

  if [[ "${ID_LIKE:-} ${ID:-}" != *debian* && "${ID_LIKE:-} ${ID:-}" != *ubuntu* ]]; then
    err "Unsupported distro: ${ID:-unknown}"
  fi
}

resolve_tag() {
  if [[ -n "${REQUESTED_VERSION}" ]]; then
    printf "%s" "${TAG_PREFIX}${REQUESTED_VERSION}"
    return
  fi

  log "Resolving latest release tag"

  local tag
  tag="$(curl -fsSL "${GITHUB_API}/releases/latest" | jq -r '.tag_name')"

  [[ -n "${tag}" && "${tag}" != "null" ]] || err "Unable to resolve latest release"

  printf "%s" "${tag}"
}

extract_version() {
  local tag="$1"
  local version="${tag#${TAG_PREFIX}}"

  [[ "${version}" != "${tag}" ]] || err "Tag ${tag} does not match prefix ${TAG_PREFIX}"

  printf "%s" "${version}"
}

download_asset() {
  local tag="$1"
  local filename="$2"
  local out="${TMP_DIR}/${filename}"
  local url="https://github.com/${REPO_OWNER}/${REPO_NAME}/releases/download/${tag}/${filename}"

  log "Downloading ${filename}"

  curl -fL --retry 3 --retry-delay 1 -o "${out}" "${url}" || err "Download failed"

  printf "%s" "${out}"
}

verify_checksum_if_exists() {
  local tag="$1"
  local version="$2"
  local arch="$3"

  local checksum_file="${PACKAGE_NAME}_${version}_${arch}.deb.sha256"
  local checksum_url="https://github.com/${REPO_OWNER}/${REPO_NAME}/releases/download/${tag}/${checksum_file}"
  local checksum_path="${TMP_DIR}/${checksum_file}"

  if curl -fsSL -o "${checksum_path}" "${checksum_url}"; then
    log "Verifying checksum"
    (cd "${TMP_DIR}" && sha256sum -c "${checksum_file}") || err "Checksum verification failed"
  else
    log "Checksum not found, skipping verification"
  fi
}

already_installed() {
  dpkg -s "${PACKAGE_NAME}" >/dev/null 2>&1 || return 1
  local installed
  installed="$(dpkg -s "${PACKAGE_NAME}" | awk '/Version:/ {print $2}')"
  [[ "${installed}" == "$1" ]]
}

install_deb() {
  local deb="$1"

  log "Installing package"
  dpkg -i "${deb}" || {
    log "Fixing dependencies"
    apt-get install -f -y
  }
}

post_install() {
  systemctl daemon-reload

  systemctl enable "${SERVICE_NAME}" || true
  systemctl restart "${SERVICE_NAME}"

  if ! systemctl is-active --quiet "${SERVICE_NAME}"; then
    systemctl status "${SERVICE_NAME}" --no-pager || true
    err "Service failed to start"
  fi

  log "Service started successfully"

  if command -v curl >/dev/null 2>&1; then
    if curl -fsS http://127.0.0.1:8081/healthz >/dev/null 2>&1; then
      log "Health check OK"
    else
      log "Health endpoint not responding (non-fatal)"
    fi
  fi
}

main() {
  require_root
  require_linux
  detect_distro
  require_apt
  require_jq

  local arch
  arch="$(detect_arch)"
  log "Architecture: ${arch}"

  local tag
  tag="$(resolve_tag)"
  log "Using tag: ${tag}"

  local version
  version="$(extract_version "${tag}")"
  log "Version: ${version}"

  if already_installed "${version}"; then
    log "Version already installed"
    exit 0
  fi

  local filename="${PACKAGE_NAME}_${version}_${arch}.deb"
  local deb_path
  deb_path="$(download_asset "${tag}" "${filename}")"

  verify_checksum_if_exists "${tag}" "${version}" "${arch}"

  install_deb "${deb_path}"
  post_install

  log "Installation completed"
}

main "$@"
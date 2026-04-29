# nginx-admind (2.0.0 MVP)

Rust daemon implementing control plane MVP for single-host operation.

## Features

- `state.json` store with optimistic concurrency (`If-Match` revision)
- runtime status with `desiredRevision`, `observedRevision`, `syncState`
- background reconcile loop
- apply pipeline stages:
  - render staging config
  - validate (`nginx -t` command)
  - backup snapshot
  - commit runtime output
  - reload command

## API

Daemon API обслуживается через Unix socket: `/run/nginx-admin.sock`.

- `GET /v1/state`
- `PUT /v1/state` with `If-Match`
- `GET /v1/runtime/status`
- `POST /v1/reconcile`
- `GET /healthz`

## Environment

- `DAEMON_UNIX_SOCKET_PATH` (default: `/run/nginx-admin.sock`)
- `DAEMON_SOCKET_GROUP` (default: `www-data`)
- `DAEMON_STATE_PATH` (default: `/etc/nginx-admin/state.json`)
- `DAEMON_BACKUPS_DIR` (default: `/var/lib/nginx-admin/backups`)
- `DAEMON_STAGING_DIR` (default: `/etc/nginx-admin/staging`)
- `DAEMON_RUNTIME_OUTPUT_DIR` (default: `/etc/nginx-admin/generated`)
- `DAEMON_NGINX_TEST_CMD` (default: `nginx -t -p {staging_dir} -c {staging_conf}`)
- `DAEMON_RELOAD_CMD` (default: `nginx -s reload`)
- `DAEMON_RECONCILE_INTERVAL_SECS` (default: `2`)
- `DAEMON_DRY_RUN` (`true`/`false`, default: `false`)

## Run

```bash
cd daemon
cargo run
```

## Manual smoke tests

All examples assume the daemon is listening on `/run/nginx-admin.sock`.

```bash
SOCKET=/run/nginx-admin.sock
BASE=http://localhost
```

Health check:

```bash
curl -i --unix-socket "$SOCKET" "$BASE/healthz"
```

Get current state and revision:

```bash
curl -sS -D /tmp/nginx-admin.headers \
  --unix-socket "$SOCKET" \
  "$BASE/v1/state" \
  -o /tmp/nginx-admin.state.json

REVISION=$(awk -F'"' 'tolower($1) == "etag: " { print $2 }' /tmp/nginx-admin.headers)
cat /tmp/nginx-admin.state.json
```

Update state with `If-Match`:

```bash
jq '.updatedBy = "smoke-test"' /tmp/nginx-admin.state.json > /tmp/nginx-admin.next-state.json

curl -i --unix-socket "$SOCKET" \
  -X PUT "$BASE/v1/state" \
  -H "Content-Type: application/json" \
  -H "If-Match: $REVISION" \
  --data-binary @/tmp/nginx-admin.next-state.json
```

Trigger reconcile:

```bash
curl -i --unix-socket "$SOCKET" \
  -X POST "$BASE/v1/reconcile"
```

Expected response:

```json
{
  "commandId": "reconcile-...",
  "status": "ACCEPTED"
}
```

Check runtime status and generated config:

```bash
curl -sS --unix-socket "$SOCKET" "$BASE/v1/runtime/status" | jq
sudo find /etc/nginx-admin/generated -maxdepth 2 -type f -print -exec sed -n '1,160p' {} \;
```

Check drift detection:

```bash
sudo sh -c 'printf "\n# smoke drift\n" >> /etc/nginx-admin/generated/nginx.conf'

curl -sS --unix-socket "$SOCKET" "$BASE/v1/runtime/status" | jq

curl -i --unix-socket "$SOCKET" \
  -X POST "$BASE/v1/reconcile"

curl -sS --unix-socket "$SOCKET" "$BASE/v1/runtime/status" | jq
```

## Debian packaging

```bash
cd daemon
cargo install cargo-deb --locked
sudo apt-get install -y dpkg-dev
cargo build --release
cargo deb --no-build
```

Package output: `daemon/target/debian/*.deb`

`dpkg-dev` provides `dpkg-shlibdeps`, which `cargo-deb` uses for `$auto`
dependency detection.

## GitHub CI/CD release

Workflow: `.github/workflows/daemon-deb-release.yml`

- On tag push (`daemon-v*` or `v*`) it:
  - builds `nginx-admind` release binary
  - builds `.deb` package via `cargo-deb`
  - uploads package as workflow artifact
  - publishes `.deb` into GitHub Release assets for that tag

Recommended release tag format: `daemon-v0.1.0`

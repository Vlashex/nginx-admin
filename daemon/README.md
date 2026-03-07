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

- `GET /v1/state`
- `PUT /v1/state` with `If-Match`
- `GET /v1/runtime/status`
- `PUT /v1/reconcile`
- `GET /healthz`

## Environment

- `DAEMON_UNIX_SOCKET_PATH` (default: `/run/nginx-admin.sock`)
- `DAEMON_SOCKET_GROUP` (default: `www-data`)
- `DAEMON_NGINX_API_CONF_PATH` (default: `/etc/nginx/snippets/nginx-admin-location.conf`)
- `DAEMON_NGINX_SERVER_CONF_PATH` (default: `/etc/nginx/sites-enabled/default`)
- `DAEMON_STATE_PATH` (default: `/etc/nginx-admin/state.json`)
- `DAEMON_BACKUPS_DIR` (default: `/var/lib/nginx-admin/backups`)
- `DAEMON_STAGING_DIR` (default: `/etc/nginx-admin/staging`)
- `DAEMON_RUNTIME_OUTPUT_DIR` (default: `/etc/nginx-admin/generated/runtime`)
- `DAEMON_NGINX_TEST_CMD` (default: `nginx -t -c {staging_conf}`)
- `DAEMON_RELOAD_CMD` (default: `nginx -s reload`)
- `DAEMON_RECONCILE_INTERVAL_SECS` (default: `2`)
- `DAEMON_DRY_RUN` (`true`/`false`, default: `false`)

## Run

```bash
cd daemon
cargo run
```

## Debian packaging

```bash
cd daemon
cargo install cargo-deb --locked
cargo build --release
cargo deb --no-build
```

Package output: `daemon/target/debian/*.deb`

## GitHub CI/CD release

Workflow: `.github/workflows/daemon-deb-release.yml`

- On tag push (`daemon-v*` or `v*`) it:
  - builds `nginx-admind` release binary
  - builds `.deb` package via `cargo-deb`
  - uploads package as workflow artifact
  - publishes `.deb` into GitHub Release assets for that tag

Recommended release tag format: `daemon-v0.1.0`

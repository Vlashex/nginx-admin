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

- `DAEMON_BIND_ADDR` (default: `127.0.0.1:8081`)
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

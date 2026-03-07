# Data Flow (Diagram-Aligned)

## 1. Desired State Write Path

1. Operator -> API Gateway: `PUT /v1/state` (`If-Match: revision`).
2. API Gateway -> State Store: validate + persist revision.
3. API Gateway -> Operator: `200 OK` + новый `ETag`.

## 2. Daemon Apply Path

1. Daemon polling-loop читает State Store.
2. Если `desiredRevision > observedRevision`, daemon запускает apply:
   1. render staging config;
   2. `nginx -t`;
   3. backup snapshot;
   4. atomic switch runtime;
   5. `nginx reload`;
   6. update `observedRevision`.

## 3. Drift Reconcile Path

1. Reconcile loop сравнивает `Hash(Render(state))` и hash active runtime.
2. При расхождении выставляет `OUT_OF_SYNC`.
3. Инициирует controlled re-apply.
4. При повторном fail переводит систему в `DEGRADED`.

## 4. Bootstrap Path (Desktop Installer)

1. Electron Main по SSH запускает `install.sh`.
2. Скрипт устанавливает пакет, system user и systemd unit.
3. `systemd` запускает `nginx-admind`.
4. Daemon инициализирует `state.json`, локальный API через Unix socket (`/run/nginx-admin.sock`) и reconcile loop.

# 02. Architecture

## 1. Логическая архитектура

Система разделена на слои:

1. **Transport/API Layer**: UI/API/CLI, запись desired state.
2. **State Store Layer**: валидация и персистентность `state.json` с revision.
3. **Daemon Orchestration Layer**: polling revision, reconcile loop, переходы `PENDING_APPLY -> APPLYING`.
4. **Render Layer**: детерминированная генерация `nginx.conf` и `servers/*.conf`.
5. **Apply Transaction Layer**: `nginx -t`, backup, atomic commit, reload.
6. **Recovery Layer**: rollback и восстановление из backup.

## 2. Физические каталоги

- `state`: `/etc/nginx-admin/state.json`
- `generated`: `/etc/nginx-admin/generated/`
- `legacy`: `/etc/nginx-admin/legacy/`
- `backups`: `/var/lib/nginx-admin/backups/`

## 3. Граница control plane / data plane

### Control Plane

- хранение и мутация `state.json`;
- поддержка пары `desiredRevision / observedRevision`;
- daemon-driven apply (автоматическое применение новой revision);
- генерация runtime output;
- валидация и apply;
- backup/rollback;
- drift reconciliation.

### Data Plane

- `nginx` master/worker процессы;
- обработка сетевого трафика;
- выполнение `reload` как применения нового runtime.

Control plane не обслуживает пользовательский трафик; data plane не принимает решений о desired state.

## 4. Security boundaries

- UI/API не получает прямой доступ к `/etc/nginx`.
- Единственная точка изменения runtime: daemon apply-транзактор.
- Команды исполнения ограничены allow-list и контекстом (trusted sender, authenticated caller).
- Backups хранятся в выделенном каталоге с ограниченными правами.
- Операции commit/rollback требуют привилегий уровня root (или эквивалентного capability boundary).

## 5. Bootstrap and Daemon Init

Согласно диаграмме `init-daemon`:

1. Инициализация хоста выполняется через `install.sh` по SSH.
2. Пакет устанавливает бинарь, system user и systemd unit.
3. `systemd` запускает backend daemon `nginx-admind`.
4. Daemon создаёт `state.json` при первом запуске (revision=0).
5. Daemon поднимает локальный HTTP API через Unix socket (`/run/nginx-admin.sock`) и reconcile loop.
6. После этого жизненный цикл state/apply автономен от Electron UI.

## 6. Связь с текущим репозиторием

Существующие модули репозитория соответствуют целевой архитектуре так:

- `packages/core`: доменная валидация и use-cases.
- `packages/transport`: типизированный command transport.
- `packages/infra`: SSHRouteRepository как удалённый gateway.
- `apps/desktop/src/main/ssh`: исполнение и retry/timeout/cancel.
- `apps/desktop/src/main/ipc`: security boundary IPC.

Текущая реализация покрывает transport-уровень и управление маршрутами; state/apply/backup должны быть реализованы как следующий этап control plane.

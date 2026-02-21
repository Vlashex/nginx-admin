# 02. Architecture

## 1. Логическая архитектура

Система разделена на слои:

1. **State Management Layer**: загрузка, валидация, версионирование `state.json`.
2. **Render Layer**: детерминированная генерация `nginx.conf` и `servers/*.conf`.
3. **Apply Transaction Layer**: staging, `nginx -t`, backup, atomic commit, reload.
4. **Recovery Layer**: rollback и восстановление из backup.
5. **Transport/API Layer**: UI/API/CLI, управление операциями и аудит.

## 2. Физические каталоги

- `state`: `/etc/nginx-admin/state.json`
- `generated`: `/etc/nginx-admin/generated/`
- `legacy`: `/etc/nginx-admin/legacy/`
- `backups`: `/var/lib/nginx-admin/backups/`

## 3. Граница control plane / data plane

### Control Plane

- хранение и мутация `state.json`;
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
- Единственная точка изменения runtime: apply-транзактор.
- Команды исполнения ограничены allow-list и контекстом (trusted sender, authenticated caller).
- Backups хранятся в выделенном каталоге с ограниченными правами.
- Операции commit/rollback требуют привилегий уровня root (или эквивалентного capability boundary).

## 5. Связь с текущим репозиторием

Существующие модули репозитория соответствуют целевой архитектуре так:

- `packages/core`: доменная валидация и use-cases.
- `packages/transport`: типизированный command transport.
- `packages/infra`: SSHRouteRepository как удалённый gateway.
- `apps/desktop/src/main/ssh`: исполнение и retry/timeout/cancel.
- `apps/desktop/src/main/ipc`: security boundary IPC.

Текущая реализация покрывает transport-уровень и управление маршрутами; state/apply/backup должны быть реализованы как следующий этап control plane.

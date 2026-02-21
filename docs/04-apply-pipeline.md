# 04. Apply Pipeline

## 1. Pipeline phases

1. **Write Desired State**: клиент выполняет `PUT /v1/state` с `If-Match: revision`.
2. **Persist Revision**: state store валидирует и сохраняет новую revision.
3. **Detect Change**: daemon polling обнаруживает, что `desiredRevision > observedRevision`.
4. **Render to Staging**: daemon генерирует staging runtime output.
5. **Validate**: daemon выполняет `nginx -t`.
6. **Backup**: daemon создаёт snapshot (`/etc/nginx` + `state.json`).
7. **Atomic Commit + Reload**: daemon выполняет switch и `nginx reload`.
8. **Mark Observed Revision**: daemon фиксирует `observedRevision = desiredRevision`.

## 2. Модель атомарности

### 2.1 Transaction scope

Атомарность гарантируется на уровне файлового переключения runtime-конфига:

- до commit active runtime неизменен;
- commit выполняется через атомарный `rename`/symlink switch в рамках одного filesystem.

### 2.2 Failure semantics

- Ошибка в фазах 1-6: runtime не меняется.
- Ошибка после commit/reload переводит систему в `DEGRADED`.
- Выход из `DEGRADED`: `reconcile` retry или rollback к валидному snapshot.

## 3. Псевдоалгоритм

```text
PUT /v1/state (If-Match=R):
  validate(stateDraft)
  persist(stateDraft, revision=R+1)

daemon_loop:
  if desiredRevision > observedRevision:
    staged = render(state@desiredRevision)
    nginx_test(staged)
    backup_id = create_backup(/etc/nginx, /etc/nginx-admin/state.json)
    atomic_switch(staged -> runtime)
    reload_nginx()
    mark_observed_revision(desiredRevision)
```

## 4. Гарантии rollback

- rollback-операция выбирает snapshot N;
- восстанавливает `/etc/nginx` и `state.json` из snapshot;
- выполняет `nginx -t` перед reload;
- при успешном rollback система возвращается в `IN_SYNC`.

## 5. Drift prevention

- runtime read-only для операторов (policy + ACL);
- периодический reconcile job сравнивает `Render(state)` hash с active hash;
- при drift выставляется статус `OUT_OF_SYNC` и reconcile loop инициирует re-apply.

## 6. Concurrency control

- только один apply одновременно (mutex/lease);
- state mutation использует optimistic lock (`If-Match: revision`);
- конкурентные обновления state возвращают `409 Conflict`.

# 04. Apply Pipeline

## 1. Pipeline phases

1. **Accept State**: принять новый state (через API/UI/CLI), валидация схемы и бизнес-инвариантов.
2. **Persist Desired State**: записать `state.json` с новым `revision`.
3. **Render to Staging**: сгенерировать `nginx.conf` и `servers/*.conf` во временную директорию.
4. **Validate**: выполнить `nginx -t` против staging root.
5. **Backup**: создать snapshot (`/etc/nginx` + `state.json`).
6. **Atomic Commit**: атомарно переключить runtime на generated output.
7. **Reload**: выполнить `nginx reload`.
8. **Verify/Post-Check**: убедиться, что reload успешен и PID/health не деградировали.

## 2. Модель атомарности

### 2.1 Transaction scope

Атомарность гарантируется на уровне файлового переключения runtime-конфига:

- до commit active runtime неизменен;
- commit выполняется через атомарный `rename`/symlink switch в рамках одного filesystem.

### 2.2 Failure semantics

- Ошибка в фазах 1-4: runtime не меняется.
- Ошибка в фазе backup: commit не начинается.
- Ошибка после commit, но до успешного reload: выполняется rollback к snapshot.

## 3. Псевдоалгоритм

```text
apply(stateDraft):
  validate(stateDraft)
  staged = render(stateDraft)
  nginx_test(staged)
  backup_id = create_backup(/etc/nginx, /etc/nginx-admin/state.json)
  atomic_switch(staged -> runtime)
  reload_nginx()
  mark_success(backup_id)
```

## 4. Гарантии rollback

- rollback-операция выбирает snapshot N;
- восстанавливает `/etc/nginx` и `state.json` из snapshot;
- выполняет `nginx -t` перед reload;
- при успешном rollback фиксируется новая операция в журнале.

## 5. Drift prevention

- runtime read-only для операторов (policy + ACL);
- периодический reconcile job сравнивает `Render(state)` hash с active hash;
- при drift выставляется статус `OUT_OF_SYNC` и инициируется controlled re-apply.

## 6. Concurrency control

- только один apply одновременно (mutex/lease);
- state mutation использует optimistic lock (`If-Match: revision`);
- конкурентные обновления возвращают `409 Conflict`.

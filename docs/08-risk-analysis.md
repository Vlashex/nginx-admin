# 08. Risk Analysis

## 1. Риск-матрица

| ID | Риск | Вероятность | Влияние | Митигирующие меры |
|---|---|---|---|---|
| R-1 | Ошибка генератора создаёт неверный runtime | Средняя | Высокое | schema/business validation, golden tests, `nginx -t` gate |
| R-2 | Частичный commit файлов | Низкая | Критичное | atomic switch в одном FS, pre-commit backup |
| R-3 | Потеря backup | Низкая | Критичное | checksum, retention policy, off-host replication |
| R-4 | Drift из-за ручных правок | Высокая (без hardening) | Высокое | ACL, periodic reconcile, immutable managed dirs |
| R-5 | Конкурентные apply | Средняя | Высокое | single-flight mutex, optimistic lock revision |
| R-6 | Reload successful, но поведенческая регрессия | Средняя | Высокое | post-check probes, canary routes, fast rollback |
| R-7 | Компрометация API/IPC transport | Низкая | Критичное | trusted sender, authn/authz, allow-list commands |

## 2. Residual risks

- Семантические ошибки route-логики, не выявляемые синтаксическим `nginx -t`.
- Внешние зависимости upstream-сервисов, влияющие на perceived availability после apply.

## 3. Приемка риска

Перед production rollout требуется:

1. tabletop exercise по rollback и takeover.
2. chaos-сценарии (fail before/after commit).
3. проверка восстановления из backup на отдельном стенде.

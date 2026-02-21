# 11. Failure Model

## 1. Категории отказов

- **F-1 Validation Failure**: schema/business validation fail до commit.
- **F-2 Render Failure**: ошибка генерации runtime output.
- **F-3 Test Failure**: `nginx -t` неуспешен.
- **F-4 Backup Failure**: snapshot не создан.
- **F-5 Commit Failure**: атомарное переключение не завершено.
- **F-6 Reload Failure**: `nginx reload` завершился ошибкой.
- **F-7 Drift Recurrence**: повторяющийся drift после reconcile.

## 2. Обязательное поведение по отказам

- Для F-1..F-4: runtime остаётся неизменным, `syncState -> DEGRADED`.
- Для F-5: выполнить восстановление pre-commit snapshot, `syncState -> DEGRADED`.
- Для F-6: выполнить rollback последнего успешного snapshot, `syncState -> DEGRADED`.
- Для F-7: блокировать auto-reconcile и требовать ручной интервенции.

## 3. Отказоустойчивость состояния

- Состояние convergence подчиняется автомату: `IN_SYNC -> PENDING_APPLY -> APPLYING -> IN_SYNC`.
- При сбоях автомат уходит в `DEGRADED`.
- При drift автомат уходит в `OUT_OF_SYNC`, затем в `APPLYING` (успех) или `DEGRADED` (повторный fail).

## 4. Rollback guarantees

- rollback использует immutable snapshot;
- rollback проходит тот же `nginx -t` gate;
- rollback атомарен относительно runtime switch;
- успешный rollback возвращает систему в `IN_SYNC`.

## 5. Takeover-specific failure scenarios

- Неуспешный cutover в Full Control: возврат на baseline snapshot и re-enable legacy root config.
- Обнаружены unsupported legacy directives: takeover запрещён до ручного remediation.
- Недостаток прав на root-path: takeover abort без изменения runtime.

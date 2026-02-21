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

- Для F-1..F-4: runtime остаётся неизменным, операция помечается `FAILED_PRE_COMMIT`.
- Для F-5: выполнить восстановление pre-commit snapshot, статус `FAILED_COMMIT`.
- Для F-6: выполнить rollback последнего успешного snapshot, статус `FAILED_POST_COMMIT`.
- Для F-7: блокировать auto-apply и требовать ручной интервенции.

## 3. Отказоустойчивость операций

- apply-operation имеет конечный автомат статусов: `ACCEPTED -> STAGING -> VALIDATED -> BACKED_UP -> COMMITTED -> RELOADED -> SUCCEEDED`.
- Любое исключение переводит операцию в terminal fail status с кодом причины.

## 4. Rollback guarantees

- rollback использует immutable snapshot;
- rollback проходит тот же `nginx -t` gate;
- rollback атомарен относительно runtime switch;
- rollback-аудит содержит source backup id и восстановленный revision.

## 5. Takeover-specific failure scenarios

- Неуспешный cutover в Full Control: возврат на baseline snapshot и re-enable legacy root config.
- Обнаружены unsupported legacy directives: takeover запрещён до ручного remediation.
- Недостаток прав на root-path: takeover abort без изменения runtime.

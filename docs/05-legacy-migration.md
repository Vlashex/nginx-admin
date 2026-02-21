# 05. Legacy Migration

## 1. Цель миграции

Перевести unmanaged NGINX-конфигурацию в state-driven модель без потери возможности отката.

## 2. Этапы migration

1. **Discovery**: инвентаризация текущего `/etc/nginx` (include graph, symlinks, modules).
2. **Snapshot-0**: обязательный baseline backup.
3. **Import**: парсинг legacy-конфигов в промежуточную модель.
4. **Normalize**: преобразование в канонический `state.json`.
5. **Dry-Run Render**: генерация и `nginx -t` без commit.
6. **Diff Review**: сравнение expected behavior (server_name/listen/routes).
7. **Cutover**: активация Overlay или Full Control.
8. **Post-Cutover Audit**: проверка маршрутов, reload, error logs.

## 3. Migration artifacts

- `state.import.report.json` (что импортировано/пропущено).
- `legacy/` копия исходных raw файлов.
- `backups/<timestamp>.tar.gz` baseline snapshot.

## 4. Политика нерепрезентируемых директив

Если директива legacy не поддерживается моделью state:

- помечается как `unsupported` в отчёте импорта;
- блокирует Full Control до явного решения оператора;
- допускается только в Overlay через unmanaged include-zone.

## 5. Exit criteria

Migration считается завершённой, если:

- runtime полностью строится из state (для Full Control);
- rollback к baseline snapshot успешно протестирован;
- reconciliation показывает `IN_SYNC`.

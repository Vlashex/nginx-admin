# 07. Non-Functional Requirements

## 1. Надёжность

- **NFR-1**: успешный apply не должен приводить к downtime data plane.
- **NFR-2**: любой неуспешный apply должен оставлять runtime в последнем согласованном состоянии.
- **NFR-3**: backup retention policy должна поддерживать минимум N последних snapshot (по умолчанию 30).

## 2. Производительность

- **NFR-4**: p95 apply latency (без network transport) <= 5s для конфига до 500 server-блоков.
- **NFR-5**: `nginx -t` и render выполняются вне критического пути data plane request handling.

## 3. Консистентность и целостность

- **NFR-6**: состояние API и файл `state.json` должны быть линейно согласованными по revision.
- **NFR-7**: generated output должен быть детерминирован (stable order, stable formatting).

## 4. Наблюдаемость

- **NFR-8**: каждая стадия daemon lifecycle (`PENDING_APPLY`, `APPLYING`, `IN_SYNC`, `DEGRADED`) логируется структурированно.
- **NFR-9**: метрики `apply_success_total`, `apply_failure_total`, `drift_detected_total` обязательны.

## 5. Безопасность

- **NFR-10**: RBAC минимум: `viewer`, `operator`, `admin`.
- **NFR-11**: операции apply/rollback доступны только `operator+`.
- **NFR-12**: все privileged операции аудируются (кто, когда, что).

## 6. Эксплуатационные гарантии

- гарантированный пред-commit backup;
- атомарный runtime switch;
- rollback к любому валидному snapshot;
- детект drift и восстановление консистентности.

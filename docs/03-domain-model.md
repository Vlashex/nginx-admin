# 03. Domain Model

## 1. Aggregate: ControlPlaneState

Корневой агрегат состояния:

```json
{
  "schemaVersion": "1.0.0",
  "revision": 42,
  "updatedAt": "2026-02-21T10:00:00Z",
  "updatedBy": "operator@example",
  "servers": [
    {
      "id": "srv-example-com",
      "serverName": "example.com",
      "listen": [
        { "port": 80, "ssl": false }
      ],
      "routes": [
        {
          "id": "rt-api",
          "path": "/api",
          "upstream": { "type": "http", "target": "http://127.0.0.1:3000" },
          "enabled": true
        }
      ],
      "enabled": true
    }
  ]
}
```

## 2. Сущности

- **Server**: виртуальный хост и набор listener/route.
- **Route**: правило сопоставления path -> upstream/static behavior.
- **UpstreamRef**: целевой backend (URL/unix socket/static root).
- **StateMetadata**: ревизия, автор, timestamp.
- **ApplyOperation**: транзакция применения (status, timestamps, diagnostics).
- **BackupSnapshot**: архив и метаданные отката.

## 3. Инварианты

- **INV-1**: `revision` монотонно возрастает на каждую успешную мутацию state.
- **INV-2**: в пределах одного server значения `serverName` + listen tuple уникальны.
- **INV-3**: в пределах одного server path маршрутов уникален.
- **INV-4**: disabled route не попадает в generated runtime.
- **INV-5**: generated каталог всегда полностью реконструируем из state.
- **INV-6**: runtime commit разрешён только после успешного `nginx -t` на staging-конфиге.
- **INV-7**: каждое успешное применение имеет backup snapshot.
- **INV-8**: rollback не изменяет исторические snapshot; создаёт новую операцию с новым revision.

## 4. Explicit idempotency definition

Операция `Apply(state_revision = R)` считается идемпотентной, если повторный вызов при неизменном `state.json` и том же `R`:

- не меняет effective runtime bytes;
- не создаёт дополнительных side-effects, кроме audit/log записи;
- возвращает статус `NOOP` или `APPLIED` с одинаковым config hash.

## 5. Reconciliation units

Единица reconciliation:

- desired: `state.json@revision`;
- observed: hash активного runtime output;
- action: regenerate + compare + (optional) re-apply.

Это обеспечивает формальную модель drift detection.

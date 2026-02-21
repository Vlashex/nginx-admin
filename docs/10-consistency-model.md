# 10. Consistency Model

## 1. Тип согласованности

Модель: **single-writer linearizable state + eventually consistent runtime convergence**.

- State-store (`state.json`) обновляется линейно по revision.
- Runtime converges к последнему committed revision через apply/reconcile.

## 2. Revision protocol

- Каждая мутация state получает `revision = prev + 1`.
- Клиент записывает с precondition (`If-Match: <revision>`).
- При несовпадении возвращается `409 Conflict`.

## 3. Read semantics

- `GET /state` возвращает текущий committed state и revision.
- `GET /runtime/status` возвращает `desiredRevision`, `observedRevision`, `syncState`.

## 4. Runtime consistency states

- `IN_SYNC`: active runtime hash == `Render(state@revision)` hash.
- `PENDING_APPLY`: state обновлён, daemon ещё не начал apply.
- `APPLYING`: daemon выполняет pipeline `render -> test -> backup -> switch -> reload`.
- `OUT_OF_SYNC`: обнаружен drift или незавершённый convergence.
- `DEGRADED`: apply/reload failed, требуется operator action.

## 5. State reconciliation strategy

1. Daemon polling-loop сравнивает `desiredRevision` и `observedRevision`.
2. Если revision расходятся, daemon запускает apply pipeline.
3. Reconcile-loop дополнительно сверяет `Hash(Render(state))` и hash active runtime.
4. Если hash различается, фиксируется `OUT_OF_SYNC` и запускается re-apply.
5. При повторном fail система переводится в `DEGRADED`.

## 6. Explicit reconciliation guarantees

- Reconcile не модифицирует state без явной mutation-команды.
- Reconcile может модифицировать runtime только через тот же apply pipeline.
- Reconcile идемпотентен для неизменного state и отсутствия drift.

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
- `GET /operations/{id}` возвращает статус apply для трассировки асинхронного convergence.

## 4. Runtime consistency states

- `IN_SYNC`: active runtime hash == `Render(state@revision)` hash.
- `PENDING_APPLY`: state обновлён, runtime ещё не переключён.
- `OUT_OF_SYNC`: обнаружен drift или незавершённый convergence.
- `DEGRADED`: apply/reload failed, требуется operator action.

## 5. State reconciliation strategy

1. Периодический reconcile-loop читает current state/revision.
2. Строит expected runtime hash через детерминированный render.
3. Считывает observed active runtime hash.
4. Если hash различается, фиксирует drift и инициирует controlled re-apply.
5. При повторном fail переводит систему в `DEGRADED` и блокирует авто-commit.

## 6. Explicit reconciliation guarantees

- Reconcile не модифицирует state без явной mutation-команды.
- Reconcile может модифицировать runtime только через тот же apply pipeline.
- Reconcile идемпотентен для неизменного state и отсутствия drift.

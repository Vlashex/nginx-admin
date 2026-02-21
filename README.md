# nginx-admin Control Plane

`nginx-admin` определяет декларативный control plane для управления конфигурацией NGINX.

Ключевой принцип:

- `state.json` — единственный источник истины.
- `/etc/nginx` — только runtime output, полностью генерируемый из `state.json`.

## Документация

- `docs/00-overview.md` — обзор системы и терминология
- `docs/01-problem-statement.md` — постановка задачи, FR/NFR
- `docs/02-architecture.md` — архитектура control plane и boundaries
- `docs/03-domain-model.md` — доменная модель и инварианты
- `docs/04-apply-pipeline.md` — apply-пайплайн, атомарность, идемпотентность
- `docs/05-legacy-migration.md` — стратегия миграции legacy-конфигов
- `docs/06-operational-modes.md` — Overlay и Full Control режимы
- `docs/07-non-functional-requirements.md` — эксплуатационные требования
- `docs/08-risk-analysis.md` — анализ рисков и mitigations
- `docs/09-design-decisions.md` — архитектурные решения и сравнение подходов
- `docs/10-consistency-model.md` — модель согласованности и reconciliation
- `docs/11-failure-model.md` — модель отказов и rollback-поведение
- `docs/diagrams/*.puml` — формальные диаграммы
- `state-schema/state.schema.json` — JSON Schema состояния
- `api/openapi.yaml` — контракт API control plane

## Текущее состояние репозитория

Репозиторий уже содержит базовые слои:

- доменные типы и use-cases (`packages/core`)
- process/projection слой (`packages/app`)
- transport-контракты удалённых команд (`packages/transport`)
- infra-адаптер SSH (`packages/infra`, `apps/desktop/src/main/ssh`)
- UI и store (`apps/web`, `packages/shared`)

В текущем коде реализован транспорт команд `routes:list`, `routes:save`, `routes:toggle`.
Полноценный state-driven apply-транзактор описан в этой документации как целевая архитектура control plane.

# nginx-admin — Host-Centric NGINX Control Plane

`nginx-admin` — это декларативный control plane для управления standalone NGINX-инстансами.

Система реализует модель:

> **Single-writer desired state + daemon-driven runtime convergence**

---

## Ключевые принципы

* `state.json` — единственный источник истины.
* `/etc/nginx` — только runtime output, полностью генерируемый из `state.json`.
* Runtime никогда не редактируется вручную.
* Применение конфигурации выполняется транзакционно.
* Daemon автоматически приводит runtime к desired state.
* Drift обнаруживается и устраняется через reconciliation.

---

# Архитектура продукта

Продукт состоит из двух уровней:

---

## 1️⃣ Server-Side Control Plane

Компонент: **`nginx-admind`**

Запускается на целевом хосте и выполняет:

* хранение и валидацию `state.json`
* revision protocol (optimistic concurrency)
* render engine
* apply pipeline:

  * staging
  * `nginx -t`
  * backup
  * atomic switch
  * reload
* reconcile loop
* drift detection
* rollback через snapshot
* встроенный HTTP API через Unix socket (`/run/nginx-admin.sock`)

Daemon — **единственная точка изменения runtime**.

---

## 2️⃣ Client Layer

Клиенты взаимодействуют с backend через HTTP API.

### 🌐 Web UI

Базовый интерфейс управления:

* CRUD виртуальных хостов и маршрутов
* preview конфигурации
* отображение `desiredRevision / observedRevision`
* статус синхронизации
* rollback
* управление режимами Overlay / Full Control

Web может быть развернут отдельно или встроен в Electron.

---

### 🖥 Electron Desktop

Electron содержит Web UI внутри себя и расширяет его возможностями локальной системы:

* SSH bootstrap сервера
* выполнение `install.sh`
* установка и обновление daemon
* управление systemd
* emergency recovery
* локальный лог-доступ

Electron = Web UI + системные интеграции.

Он не является обязательным для эксплуатации control plane, но предоставляет расширенные сценарии.

---

# Архитектурная схема

```
            ┌─────────────────────┐
            │      Electron       │
            │  (Web UI + SSH)     │
            └──────────┬──────────┘
                       │
               (HTTP API)
                       │
               ┌───────▼────────┐
               │ nginx-admind   │
               │ (Daemon + API) │
               └───────┬────────┘
                       │
                       ▼
                    NGINX
```

Web-версия подключается напрямую к HTTP API:

```
[ Web UI ] → HTTP API → nginx-admind → NGINX
```

---

# Продуктовая позиция

`nginx-admin` — это не GUI-обёртка над `nginx -t`.

Это:

> Host-level NGINX control plane
> для bare-metal и VM-сред без Kubernetes.

Он обеспечивает:

* формальный lifecycle конфигурации
* атомарное применение изменений
* гарантированный rollback
* обнаружение drift
* управляемую миграцию legacy-конфигов

---

# Документация

* `docs/00-overview.md`
* `docs/01-problem-statement.md`
* `docs/02-architecture.md`
* `docs/03-domain-model.md`
* `docs/04-apply-pipeline.md`
* `docs/05-legacy-migration.md`
* `docs/06-operational-modes.md`
* `docs/07-non-functional-requirements.md`
* `docs/08-risk-analysis.md`
* `docs/09-design-decisions.md`
* `docs/10-consistency-model.md`
* `docs/11-failure-model.md`
* `state-schema/state.schema.json`
* `api/openapi.yaml`

---

# Текущий статус репозитория

### Core

* доменные типы и use-cases (`packages/core`)
* схемы и валидация
* transport-контракты

### Web

* SPA (React + Vite)
* формы маршрутов
* preview генерации
* UI-kit

### Desktop

* Electron shell
* SSH bootstrap-адаптер
* secure IPC

Полноценный `nginx-admind` daemon реализуется как следующий этап развития control plane.

---

# Стратегическая цель

Создать лёгкий и автономный control plane для standalone NGINX, который:

* заменяет ручное редактирование конфигураций
* формализует apply/rollback lifecycle
* снижает операционные риски
* масштабируется от single-host до multi-host сценариев

# Nginx Admin — Unified Product ROADMAP

## 0.x — Архитектурная подготовка (реализовано)

### 0.1.0 — Proof of Concept

- Инициализация проекта на **React + Vite + TailwindCSS**
- Настройка клиентского роутера (BrowserRouter / HashRouter)
- Базовый шаблон интерфейса с сайдбаром и контентной областью

### 0.2.0 — Структурирование проекта

- Определена файловая структура (`core`, `pages`, `shared`, `ui-kit`)
- Добавлены маршруты: `/`, `/routes`, `/config`, `/logs`, `/statistics`

### 0.3.0 — Система маршрутов (черновая версия)

- Создана страница `/routes`
- Реализована таблица маршрутов (`RouteList`)
- Добавлена бизнес-логика через `useRoutesPage`

### 0.4.0 — Формы и CRUD

- Интеграция `react-hook-form`
- Реализована модальная форма `RouteModal`
- Добавлены вкладки: основные, locations, advanced, preview

### 0.5.0 — Схемы и типизация

- Определены сущности `Route`, `LocationConfig` и схемы Zod
- Введена строгая типизация формовых компонентов

### 0.6.0 — UI-kit

- Созданы переиспользуемые компоненты (`Button`, `Input`, `Form`)
- Унифицирован стиль и цветовая палитра (тёмная тема)

### 0.7.0 — Preview и валидация

- Добавлен предпросмотр итогового конфига
- Реализована базовая обработка ошибок и состояний загрузки

### 0.8.0 — UX-доработки

- Единый визуальный стиль
- Отступы, тени, ховеры, визуальная консистентность

### 1.0.0 — MVP релиз

- Полностью реализован функционал страницы `/routes`
- Поддержка CRUD для маршрутов
- Предпросмотр итоговой конфигурации
- Базовая архитектура готова для масштабирования
- Публикация на GitHub Pages

---

## 1.x — Electron + transport preparation (не финальный продукт)

### 1.1.0 — Electron Shell Baseline

**Web**
- Стабилизация SPA как renderer-слоя без прямого доступа к системным операциям.
- Сохранение DDD/use-case/repository границ.

**Electron**
- Базовый `main/preload/renderer` контур.
- Безопасный IPC-канал для типизированных команд.

**Daemon**
- Не реализуется.
- Формируется целевой контракт взаимодействия для будущего daemon API.

### 1.2.0 — Transport Contract Hardening

**Web**
- Введение transport-адаптеров (mock/http/electron) без нарушения repository abstraction.
- Подготовка UI к асинхронной модели `desired state -> observed runtime`.

**Electron**
- Типизированные command contracts.
- Обработка timeout/retry/cancel/error mapping.

**Daemon**
- Не реализуется.
- Уточнение внешнего API-контракта (`state`, `runtime status`, `reconcile`, `rollback`).

### 1.3.0 — SSH Transitional Layer

**Web**
- Отсутствие прямой SSH-зависимости.
- Работа только через application/process abstraction.

**Electron**
- SSH используется как переходный transport.
- Область SSH ограничивается bootstrap-операциями и проверкой доступности хоста.

**Daemon**
- Не реализуется.
- Определяется целевой bootstrap-протокол установки daemon.

### 1.4.0 — Bootstrap UX for Daemon Install

**Web**
- Подготовка экранов/форм подключения и инициализации инстанса.

**Electron**
- Оркестрация `install.sh`/package install через SSH.
- Проверка systemd-юнита и первичного health-check daemon.

**Daemon**
- Появляется как внешняя исполняемая сущность на хосте.
- После установки должен быть автономным от Electron.

---

## 2.x — Daemon implementation (core control plane)

### 2.0.0 — Daemon MVP (Single Host)

**Web**
- Управление декларативным `state` через API.
- Отображение `desiredRevision/observedRevision/syncState`.

**Electron**
- Используется для bootstrap и диагностики инстанса.
- Не участвует в основном apply lifecycle.

**Daemon**
- Реализация `state store` (`state.json`) и revision protocol.
- Render + validate (`nginx -t`) + backup + atomic switch + reload.
- Переходы `IN_SYNC/PENDING_APPLY/APPLYING/DEGRADED`.

### 2.1.0 — Reconcile and Drift Control

**Web**
- Видимость drift-состояния и ручной запуск reconcile/rollback.

**Electron**
- Инструменты оператора для bootstrap/repair, без runtime-управления конфигом.

**Daemon**
- Periodic reconcile loop.
- Drift detection (`Render(state)` vs active runtime hash).
- Controlled re-apply, обновление `observedRevision`.

### 2.2.0 — Rollback and Failure Semantics

**Web**
- Просмотр backup snapshots и запуск rollback по snapshot id.

**Electron**
- Диагностика проблем bootstrap/system-level.

**Daemon**
- Гарантированный rollback pipeline.
- Failure handling с переводом в `DEGRADED`.
- Атомарность commit/restore на файловом уровне.

### 2.3.0 — Full Control Takeover

**Web**
- Операции переключения режимов `OVERLAY`/`FULL_CONTROL`.
- Явный контроль takeover-подтверждений.

**Electron**
- Поддержка миграционных сценариев и удалённой инсталляции обновлений daemon.

**Daemon**
- Legacy migration workflow.
- Управление `legacy` и `generated` зонами.
- Enforcement: `/etc/nginx` как runtime output, `state.json` как source of truth.

---

## 3.x — Production maturity

### 3.0.0 — Observability and Operations

**Web**
- Операционные статусы, журналы операций, диагностика состояний sync.

**Electron**
- Локальные инструменты обслуживания инстанса и recovery-runbooks.

**Daemon**
- Метрики, structured logs, health/readiness endpoints.
- SLO-ориентированная телеметрия apply/reconcile/rollback.

### 3.1.0 — Security and Access Control

**Web**
- RBAC-aware UI (viewer/operator/admin).

**Electron**
- Защищённое хранение credential-профилей подключения для bootstrap.

**Daemon**
- AuthN/AuthZ для API.
- Audit trail для state changes и privileged operations.
- Жёсткие security boundaries для runtime paths.

### 3.2.0 — Reliability Hardening

**Web**
- Явное отображение деградаций и безопасных операционных действий.

**Electron**
- Утилиты для восстановлений и проверки целостности инстанса.

**Daemon**
- Crash recovery.
- Backup retention/verification.
- Idempotent command processing и защита от конкурентных apply.

---

## 4.x — Multi-host / enterprise scale

### 4.0.0 — Multi-Host Fleet Management

**Web**
- Единая панель управления множеством daemon-инстансов.
- Хостовые статусы, групповые операции.

**Electron**
- Массовый bootstrap новых хостов (опционально).
- Инструменты начальной регистрации инстансов.

**Daemon**
- Стандартизированный host API.
- Поддержка coordinated rollout на уровне fleet orchestration.

### 4.1.0 — Policy, Governance, Compliance

**Web**
- Политики изменений, approval workflows, compliance views.

**Electron**
- Поддержка управляемой инициализации в регламентированных средах.

**Daemon**
- Policy enforcement на apply.
- Расширенный audit/compliance export.
- Контролируемые окна изменений.

### 4.2.0 — Enterprise Integrations

**Web**
- Интеграционные панели для CI/CD и внешних систем.

**Electron**
- Операционные bridge-инструменты для закрытых сред.

**Daemon**
- API-интеграции (SIEM, ITSM, secret managers, CMDB).
- Стандартизированные контракты событий и webhook/queue доставок.

---

## 5.x — Advanced platform capabilities

### 5.0.0 — Federated Control Plane

**Web**
- Управление доменами/регионами/тенантами в единой модели.

**Electron**
- Минимальная роль: bootstrap/maintenance в edge-средах.

**Daemon**
- Федерация инстансов, межрегиональная согласованность политик.
- Расширенные стратегии rollout/rollback на уровне платформы.
# 09. Design Decisions

## 1. Decision Log

### D-1: Source of Truth в локальном state-файле

- Статус: Принято
- Причина: простота эксплуатации на single-host, прозрачность и inspectability.
- Последствия: требуется строгий concurrency control и backup state вместе с runtime.

### D-2: Генерация runtime вместо inline-редактирования nginx.conf

- Статус: Принято
- Причина: детерминизм, повторяемость, проверяемость.
- Последствия: нужен render engine и нормализованный доменный state.

### D-3: Apply как транзакция с обязательным backup

- Статус: Принято
- Причина: ограничение blast radius и гарантированный rollback.
- Последствия: дополнительная задержка на backup, требования к диску.

### D-4: Режимы Overlay и Full Control

- Статус: Принято
- Причина: поэтапная миграция legacy-инфраструктуры.
- Последствия: усложнение операционной модели, но управляемый переход.

## 2. Сравнение подходов

### 2.1 Против ручного редактирования NGINX

- Ручной подход:
  - нет транзакционной модели;
  - rollback ad-hoc;
  - высокий риск drift и человеческой ошибки.
- Control plane подход:
  - формальный state;
  - проверяемый pipeline;
  - предсказуемый rollback и аудит.

### 2.2 Против Ansible templating

- Ansible:
  - обычно push-based и batch-oriented;
  - state хранится в repo/inventory, но не всегда отражает runtime immediately;
  - drift возможен между прогонами playbook.
- Control plane:
  - непрерывная модель desired vs observed;
  - встроенный apply/rollback lifecycle;
  - API-first операции и online reconciliation.

### 2.3 Против Kubernetes Ingress

- Ingress:
  - предполагает Kubernetes control loop и кластеры;
  - абстракция уровня service ingress, не host-level nginx estate.
- nginx-admin control plane:
  - host-centric управление standalone NGINX;
  - прямой контроль файлового runtime и backup;
  - подходит для bare-metal/VM без Kubernetes.

## 3. Почему не выбран direct imperative CLI-only

CLI-only режим без persisted state не обеспечивает:

- проверяемой истории desired состояния;
- корректной optimistic concurrency;
- формальной drift detection/reconciliation модели.

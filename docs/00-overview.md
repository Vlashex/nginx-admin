# 00. Overview

## 1. Назначение

Система реализует control plane для NGINX, в котором операционное состояние хранится декларативно и применяется транзакционно.

Цель:

- исключить ручное редактирование runtime-конфигов NGINX;
- обеспечить воспроизводимость и откат;
- формализовать жизненный цикл изменений.

## 2. Базовые определения

- **Control Plane**: логика управления состоянием, валидации, генерации и применения конфигурации.
- **Data Plane**: исполняемый NGINX-процесс, который обслуживает трафик.
- **Source of Truth**: `/etc/nginx-admin/state.json`.
- **Runtime Output**: сгенерированные конфиги в `/etc/nginx-admin/generated/` и/или активной runtime-зоне NGINX.
- **Legacy**: исходные unmanaged-конфиги в `/etc/nginx-admin/legacy/`, исключённые из runtime.
- **Backup Snapshot**: архив `/var/lib/nginx-admin/backups/<timestamp>.tar.gz`, включающий `/etc/nginx` и `state.json`.

## 3. Главный инвариант

`state.json` определяет желаемое состояние, а runtime output должен быть детерминированной функцией от него:

`runtime = Render(state)`

Любое расхождение `runtime != Render(state)` считается drift и требует reconciliation.

## 4. Scope

В scope:

- управление server/location маршрутами NGINX;
- атомарный apply с валидацией `nginx -t`;
- rollback через снапшоты;
- режимы Overlay и Full Control.

Вне scope:

- L7 policy engine уровня service mesh;
- распределённый control plane между несколькими кластерами;
- генерация конфигураций для прокси кроме NGINX.

## 5. Траектория от текущего кода

Текущая кодовая база уже содержит:

- доменные схемы и валидацию (`RouteSchema`, `LocationConfigSchema`);
- транспортный контракт удалённого исполнения (`RemoteExecutor`);
- SSH execution и IPC-границы Electron.

Целевая документация расширяет это до полного state-driven lifecycle: persisted state, render graph, apply transaction, backups, drift prevention.

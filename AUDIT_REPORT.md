# Технический аудит монорепозитория nginx-admin

## 📋 Общая структура монорепо

### ✅ Положительные моменты
- Структура соответствует best practices pnpm workspaces (`apps/*`, `packages/*`)
- `pnpm-workspace.yaml` настроен корректно
- Пакеты разделены на `core`, `shared`, `shared-store`

### ❌ Критические проблемы

#### 1.1 Пустая директория `apps/desktop`
**Проблема:** Директория `apps/desktop` существует, но пуста.
**Где:** `apps/desktop/`
**Решение:** 
- Удалить директорию, если не планируется desktop-приложение
- Или создать базовую структуру desktop-приложения

---

## 🔧 Конфигурация TypeScript

### ✅ Положительные моменты
- Есть `tsconfig.base.json` с базовой конфигурацией
- Пакеты используют `extends` для наследования базовой конфигурации
- Настроены `paths` для workspace-пакетов в `tsconfig.base.json`

### ❌ Критические проблемы

#### 2.1 Использование алиасов `@/core` и `@/shared` в packages
**Проблема:** В пакетах используются алиасы вида `@/core`, `@/shared` вместо workspace-импортов `@vlashex/core`, `@vlashex/shared`.

#### 2.2 Отсутствие `tsconfig.json` в packages
**Проблема:** В пакетах есть только `tsconfig.build.json`, но нет `tsconfig.json` для разработки.
**Где:** `packages/core/`, `packages/shared/`, `packages/shared-store/`
**Решение:** Создать `tsconfig.json` в каждом пакете, который extends `tsconfig.build.json` и добавляет настройки для разработки (например, `noEmit: true`).

#### 2.3 Неправильные пути в `apps/web/tsconfig.json`
**Проблема:** В `apps/web/tsconfig.json` определены пути `@vlashex/shared/*: ["./src/shared/*"]`, которые указывают на локальную директорию вместо workspace-пакета.
**Где:** `apps/web/tsconfig.json` (строка 11)
**Решение:** Удалить эти пути, так как workspace-пакеты должны резолвиться через `node_modules` или через правильные алиасы в `vite.config.ts`.

#### 2.4 Неправильные алиасы в `apps/web/vite.config.ts`
**Проблема:** В `vite.config.ts` определен алиас `@vlashex/shared: path.resolve(__dirname, "./src/shared")`, который указывает на локальную директорию.
**Где:** `apps/web/vite.config.ts` (строка 14)
**Решение:** Удалить этот алиас, так как workspace-пакеты должны резолвиться автоматически через pnpm.

---

## 🔗 Связи между пакетами

### ✅ Положительные моменты
- `shared-store` правильно зависит от `core` через `workspace:*`
- `shared` правильно зависит от `core` через `workspace:*`
- `apps/web` правильно зависит от всех workspace-пакетов

### ❌ Критические проблемы

#### 3.1 Несоответствие интерфейса RouteRepository и его использования
**Проблема:** В `RouteRepository` методы `loadAll()` и `saveAll()` закомментированы, но они используются в `routesSlice.ts`.
**Где:** 
- `packages/core/src/repositories/RouteRepository.ts` (строки 9-10)
- `packages/shared/src/store/slices/routesSlice.ts` (строки 89, 98)
- `packages/shared/src/store/adapters/RouteRepositoryAdapter.ts` (строки 31, 34)

**Решение:** 
1. Раскомментировать методы `loadAll()` и `saveAll()` в интерфейсе `RouteRepository`
2. Или переработать `routesSlice` для использования только `findAll()` и `save()`

#### 3.2 Потенциальные циклические зависимости
**Проблема:** Необходимо проверить наличие циклических зависимостей между пакетами.
**Решение:** Запустить `pnpm -r exec pnpm list --depth=0` для проверки зависимостей.

---

## 🏗️ Чистота DDD-границ

### ❌ Критические проблемы

#### 4.1 LocalStorageRouteRepository в core
**Проблема:** `LocalStorageRouteRepository` находится в `packages/core/src/repositories/`, но использует `localStorage` (браузерный API), что нарушает чистоту DDD-границ.
**Где:** `packages/core/src/repositories/LocalStorageRouteRepository.ts` (строки 32, 36)
**Код:**
```typescript
async saveAll(routes: Map<string, Route>): Promise<void> {
  const serialized = JSON.stringify(Array.from(routes.entries()));
  localStorage.setItem(this.key, serialized); // ❌ Браузерный API в core
}

async loadAll(): Promise<Map<string, Route>> {
  const data = localStorage.getItem(this.key); // ❌ Браузерный API в core
  // ...
}
```

**Решение:** 
1. Удалить `LocalStorageRouteRepository` из `packages/core/src/repositories/`
2. Убедиться, что он не экспортируется из `packages/core/src/index.ts` (уже не экспортируется ✅)
3. Использовать только `packages/shared-store/src/LocalStorageRouteRepository.ts`
4. Обновить импорты в `packages/shared/src/store/slices/routesSlice.ts`

#### 4.2 Дублирование LocalStorageRouteRepository
**Проблема:** `LocalStorageRouteRepository` существует в двух местах:
- `packages/core/src/repositories/LocalStorageRouteRepository.ts` (должен быть удален)
- `packages/shared-store/src/LocalStorageRouteRepository.ts` (правильное место)

**Решение:** Удалить файл из `core` и обновить все импорты.

#### 4.3 Использование LocalStorageRouteRepository из core в shared
**Проблема:** В `packages/shared/src/store/slices/routesSlice.ts` импортируется `LocalStorageRouteRepository` из `@/core/repositories/LocalStorageRouteRepository`, но должен импортироваться из `@vlashex/shared-store/src/LocalStorageRouteRepository`.
**Где:** `packages/shared/src/store/slices/routesSlice.ts` (строка 11)
**Решение:** Заменить импорт на `import { LocalStorageRouteRepository } from "@vlashex/shared-store/src/LocalStorageRouteRepository";`

---

## 📦 Конфигурация сборки

### ✅ Положительные моменты
- Каждый пакет имеет свой `tsconfig.build.json`
- Настроены `rootDir` и `outDir` корректно
- Пакеты имеют правильные `main`, `types`, `exports` в `package.json`

### ❌ Критические проблемы

#### 5.1 Несоответствие exports в package.json корня и packages/core
**Проблема:** В корневом `package.json` определены `exports` для `@vlashex/core`, но это должен быть файл `packages/core/package.json`.
**Где:** Корневой `package.json` (строки 5-30)
**Решение:** Переместить `exports` в `packages/core/package.json` и удалить из корневого `package.json`.

#### 5.2 Отсутствие экспорта LocalStorageRouteRepository в shared-store
**Проблема:** `packages/shared-store/src/index.ts` экспортирует `LocalStorageRouteRepository`, но в `package.json` нет соответствующего `exports`.
**Где:** `packages/shared-store/package.json`
**Решение:** Добавить `exports` в `package.json` для экспорта `LocalStorageRouteRepository`.

---

## 🧪 Сборка и тесты

### ❌ Критические проблемы

#### 6.1 Отсутствие единых конфигов для линтинга
**Проблема:** ESLint конфиг находится только в `apps/web/eslint.config.js`, но не в корне проекта.
**Где:** `apps/web/eslint.config.js`
**Решение:** Создать корневой `eslint.config.js` и настроить его для всех пакетов.

#### 6.2 Отсутствие конфига Prettier
**Проблема:** Нет конфигурации Prettier для форматирования кода.
**Решение:** Создать `.prettierrc` и `.prettierignore` в корне проекта.

#### 6.3 Невозможность проверки сборки
**Проблема:** Не удалось проверить сборку из-за отсутствия pnpm в PATH.
**Решение:** Убедиться, что pnpm установлен, и запустить `pnpm -r build` для проверки сборки всех пакетов.

---

## 🚀 Оптимизация и поддерживаемость

### 📝 Рекомендации

#### 7.1 Структура пакетов
**Рекомендация:** Текущая структура хорошая, но можно улучшить:
- `core` - чистая бизнес-логика ✅
- `shared` - UI-компоненты и адаптеры для React ✅
- `shared-store` - инфраструктурные адаптеры (localStorage) ✅

**Улучшение:** Рассмотреть создание пакета `shared/lib` для общих утилит, если они не относятся к UI.

#### 7.2 Дублирующий код
**Рекомендация:** Проверить наличие дублирующего кода между `apps/web` и потенциальным `apps/desktop`.
**Решение:** Вынести общую логику в `packages/shared` или `packages/core`.

#### 7.3 Порядок build/deploy пайплайна
**Рекомендация:** Оптимальный порядок сборки:
1. `packages/core` - базовая бизнес-логика
2. `packages/shared-store` - зависит от core
3. `packages/shared` - зависит от core
4. `apps/web` - зависит от всех пакетов

**Решение:** Настроить `pnpm -r --filter ...build` для правильного порядка сборки.

#### 7.4 Добавление скриптов в корневой package.json
**Рекомендация:** Добавить скрипты для:
- `pnpm build` - сборка всех пакетов
- `pnpm test` - запуск всех тестов
- `pnpm lint` - линтинг всего проекта
- `pnpm type-check` - проверка типов

---

## 📊 Итоговая оценка

### Критические проблемы (требуют немедленного исправления):
1. ✅ LocalStorageRouteRepository в core (использование localStorage)
2. ✅ Дублирование LocalStorageRouteRepository
3. ✅ Использование алиасов `@/core` и `@/shared` в packages
4. ✅ Неправильные пути в `apps/web/tsconfig.json` и `vite.config.ts`
5. ✅ Несоответствие интерфейса RouteRepository и его использования
6. ✅ Пустая директория `apps/desktop`

### Рекомендации (улучшения):
1. Добавить `tsconfig.json` в каждый пакет
2. Создать единые конфиги для ESLint и Prettier
3. Настроить правильный порядок сборки
4. Добавить скрипты в корневой `package.json`
5. Проверить циклические зависимости

---

## 🔧 План действий

### Приоритет 1 (Критические проблемы):
1. Удалить `LocalStorageRouteRepository` из `packages/core/src/repositories/`
2. Заменить все алиасы `@/core` и `@/shared` на workspace-импорты в packages
3. Исправить пути в `apps/web/tsconfig.json` и `vite.config.ts`
4. Раскомментировать методы `loadAll()` и `saveAll()` в `RouteRepository` или переработать код
5. Удалить или заполнить `apps/desktop`

### Приоритет 2 (Улучшения):
1. Создать `tsconfig.json` в каждом пакете
2. Создать корневой `eslint.config.js` и `.prettierrc`
3. Добавить скрипты в корневой `package.json`
4. Настроить правильный порядок сборки
5. Проверить циклические зависимости

---

**Дата аудита:** 2025-01-27
**Версия проекта:** 1.0.1



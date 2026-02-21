# 06. Operational Modes

## 1. Overlay Mode

### Назначение

Постепенный ввод control plane без полного владения root nginx.conf.

### Поведение

- control plane управляет только выделенной include-зоной;
- legacy-конфиги остаются активны вне этой зоны;
- apply модифицирует только managed subset.

### Гарантии

- минимальный blast radius;
- быстрый откат через отключение include-зоны;
- совместимость с существующим process ручного управления.

## 2. Full Control (Takeover)

### Назначение

Полный перевод NGINX в state-driven lifecycle.

### Поведение

- создаётся полный backup текущего `/etc/nginx`;
- legacy переносится в `/etc/nginx-admin/legacy/`;
- root config и include graph становятся managed;
- дальнейшие изменения допускаются только через control plane.

### Гарантии

- единый источник истины;
- детерминированные apply/rollback;
- нулевой tolerance к ручным runtime-изменениям.

## 3. Переход Overlay -> Full Control

1. Проверить отсутствие unsupported directives.
2. Выполнить baseline backup.
3. Запустить dry-run полного render.
4. Подтвердить cutover (2-phase confirmation).
5. Выполнить atomic takeover commit.

## 4. Ограничения режимов

- Overlay не устраняет drift вне managed include-зоны.
- Full Control требует жёсткой дисциплины доступа к `/etc/nginx`.

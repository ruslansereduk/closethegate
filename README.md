# CloseTheGate — редизайн и PWA

Этот проект содержит интерфейс таймера, статуса, анонимного чата и выбора пользовательского статуса. Выполнены работы по унификации визуальной системы, доступности и PWA.

## Артефакты аудита

- Скриншоты «до» (MCP Playwright):
  - `artifacts/before-mobile.png`
  - `artifacts/before-tablet.png`
  - `artifacts/before-desktop.png`
- Семантическая карта и стили «до»:
  - `artifacts/audit-semantic.json`
  - `artifacts/audit-styles.json`

После внедрения дизайна «после»
- `artifacts/after-mobile.png`
- `artifacts/after-tablet.png`
- `artifacts/after-desktop.png`

## Дизайн‑система

- Палитра: глубокий графит (фон), светло‑серый текст, приглушенный второстепенный, акцент — неоновый зелёный, предупреждение — мягкий янтарный, ошибка — тёплый красный.
- Типографика: системный гротеск (system‑ui stack). Размеры: титул/подзаголовок/тело/подписи.
- Сетка: контейнер до 768 на мобильном и 1200 на десктопе; внутренние отступы 16/24.
- Радиусы: крупные на карточках, средние на чипах/полях.
- Тени: мягкие, без жёстких ореолов.
- Анимации: краткие появления/наведения, учтён prefers‑reduced‑motion.

См. `app/globals.css` и `tailwind.config.js`.

## Доступность (A11y)

- Контраст минимум AA.
- Видимые фокус‑обводки (`:focus-visible`).
- Для таймера включён `aria-live="polite"`.
- Текстовые альтернативы и клавиатурная навигация.

## Запуск

1. `npm i`

### Локальная разработка (фронтенд + продакшн чат)
Рекомендуемый способ для разработки - использует Railway чат:
```bash
npm run dev:frontend
# или
npm run dev:web
```

### Полная локальная разработка (фронтенд + локальный чат)
Для разработки чат-сервера:
```bash
npm run dev
```

Переменные окружения см. `env.local.example`.

## PWA и превью

- Манифест `public/manifest.webmanifest`, иконки в `public/icons/`.
- Service Worker регистрируется автоматически в `app/layout.tsx` (если включено).
- OG‑картинка формируется серверно (путь `app/og/route.ts`).

## Визуальные тесты

- Используйте MCP Playwright (см. инструкцию в ассистенте) для скринов после редизайна на брейкпоинтах 375/768/1280. Сохраните в `artifacts/after-*.png`.

## Список изменений (основное)

- Обновлены токены и тема: `app/globals.css`, `tailwind.config.js`.
- Улучшен первый экран: `app/page.tsx`, типографика и статус‑чип.
- Таймер: `components/Countdown.tsx` — крупные цифры, aria‑live, мягкая подсветка.
- Чат: `components/ChatBox.tsx` — отложенное подключение сокета после взаимодействия.
- A11y: skip‑link в `app/layout.tsx`.

# Close the Gate

Минималистичный сервис с ироничным тоном: таймер обратного отсчета до закрытия границы и анонимный чат в реальном времени.

**Домен:** https://closethegate.eu

## Структура проекта

```
ClosetheGATE/
├── package.json              # Корневой package.json для монорепозитория
├── pnpm-workspace.yaml       # Конфигурация pnpm workspace
├── apps/
│   ├── chat/                 # Backend чат-сервер (Node.js + Fastify + Socket.IO)
│   │   ├── src/index.ts      # Основной файл сервера
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── env.example       # Пример переменных окружения
│   └── web/                  # Frontend приложение (Next.js + TypeScript + Tailwind)
│       ├── app/              # Next.js App Router
│       ├── components/       # React компоненты
│       ├── package.json
│       ├── tailwind.config.js
│       └── env.local.example # Пример переменных окружения
└── README.md
```

## Требования

- **Node.js** >= 18
- **pnpm** >= 8

## Быстрый старт

1. **Клонируйте репозиторий:**
   ```bash
   git clone <repository-url>
   cd ClosetheGATE
   ```

2. **Установите зависимости:**
   ```bash
   pnpm install
   ```

3. **Настройте переменные окружения:**
   
   **Для чат-сервера (apps/chat/.env):**
   ```bash
   cp apps/chat/env.example apps/chat/.env
   ```
   
   **Для веб-приложения (apps/web/.env.local):**
   ```bash
   cp apps/web/env.local.example apps/web/.env.local
   ```

4. **Запустите в режиме разработки:**
   ```bash
   pnpm dev
   ```
   
   Это запустит:
   - Чат-сервер на `http://localhost:8080`
   - Веб-приложение на `http://localhost:3000`

## Команды разработки

```bash
# Запуск всех сервисов в режиме разработки
pnpm dev

# Сборка всех приложений
pnpm build

# Запуск только чат-сервера (production)
pnpm start

# Запуск отдельных приложений:
pnpm -C apps/chat dev    # Только чат-сервер
pnpm -C apps/web dev     # Только веб-приложение
```

## Переменные окружения

### Чат-сервер (apps/chat/.env)

| Переменная | Описание | Пример |
|------------|----------|---------|
| `ALLOW_ORIGIN` | Список доменов для CORS через запятую | `https://closethegate.eu,https://closethegate-eu.vercel.app` |
| `PORT` | Порт сервера (задается автоматически на Railway) | `8080` |

### Веб-приложение (apps/web/.env.local)

| Переменная | Описание | Пример |
|------------|----------|---------|
| `NEXT_PUBLIC_DEADLINE_ISO` | Дата окончания таймера в ISO формате | `2025-09-12T00:00:00+02:00` |
| `NEXT_PUBLIC_CHAT_URL` | URL чат-сервера | `https://your-railway-app.up.railway.app` |

## Деплой в продакшен

### 1. Деплой чат-сервера на Railway

1. **Создайте новый проект на [Railway](https://railway.app)**
2. **Подключите GitHub репозиторий**
3. **Настройте сервис:**
   - Root Directory: `apps/chat`
   - Build Command: `pnpm build`
   - Start Command: `pnpm start`
4. **Добавьте переменные окружения:**
   ```
   ALLOW_ORIGIN=https://closethegate.eu,https://closethegate-eu.vercel.app
   ```
5. **Включите автоматический деплой**
6. **Скопируйте публичный URL** (например: `https://your-app.up.railway.app`)

### 2. Деплой веб-приложения на Vercel

1. **Создайте новый проект на [Vercel](https://vercel.com)**
2. **Подключите GitHub репозиторий**
3. **Настройте проект:**
   - Framework Preset: `Next.js`
   - Root Directory: `apps/web`
   - Build Command: `cd ../.. && pnpm install && pnpm -C apps/web build`
   - Output Directory: `apps/web/.next`
4. **Добавьте переменные окружения:**
   ```
   NEXT_PUBLIC_DEADLINE_ISO=2025-09-12T00:00:00+02:00
   NEXT_PUBLIC_CHAT_URL=https://your-railway-app.up.railway.app
   ```
5. **Привяжите домен `closethegate.eu`**
6. **Запустите деплой**

### 3. Обновите CORS настройки

После получения URL от Vercel, обновите переменную `ALLOW_ORIGIN` на Railway:
```
ALLOW_ORIGIN=https://closethegate.eu,https://closethegate-eu.vercel.app
```

## Функционал

### Таймер обратного отсчета
- Считает до фиксированной даты: **12 сентября 2025, полночь по времени Варшавы**
- Показывает дни, часы, минуты и секунды
- После окончания показывает "00:00:00:00" и меняет подпись

### Анонимный чат
- Подключение через WebSocket (Socket.IO)
- Без регистрации
- Последние 30 сообщений при входе
- Хранение 200 сообщений в памяти сервера
- Простая защита от спама (задержка 500мс между сообщениями)
- Ограничения: текст до 500 символов, ник до 24 символов

### Интерфейс
- Адаптивная темная тема
- Минималистичный дизайн
- Ироничные подписи и статусы
- Предупреждение о шуточном характере сайта

## Технологический стек

- **Монорепозиторий:** pnpm workspaces
- **Backend:** Node.js, TypeScript, Fastify, Socket.IO
- **Frontend:** Next.js 14 App Router, TypeScript, Tailwind CSS
- **Деплой:** Railway (chat), Vercel (web)

## Критерии приемки

✅ Таймер корректно считает до указанной даты  
✅ После нуля показывает нули и меняет подпись  
✅ Два открытых окна видят сообщения друг друга в реальном времени  
✅ После перезагрузки видны последние 30 сообщений  
✅ Мобильная версия удобна, нет горизонтальной прокрутки  
✅ Продакшен деплой работает на closethegate.eu  
✅ CORS настроен корректно между сервисами

## Лицензия

Проект создан в образовательных и развлекательных целях.

**Важно:** Сайт является шуточным и не заменяет официальные источники информации о пересечении границ.

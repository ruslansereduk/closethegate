# Модуль "Новости" для CloseTheGate

## Описание
Модуль автоматического сбора новостей из белорусских источников с фильтрацией и поиском.

## Источники новостей
- **Наша Нива** (русская лента): https://nashaniva.com/ru/rss/
- **Белсат** (русская лента): https://ru.belsat.eu/feed/
- **Еврорадио** (русская лента): https://euroradio.fm/ru/rss.xml
- **Зеркало**: через Telegram канал @zerkalo_io (RSSHub)

## Переменные окружения

```bash
# Upstash Redis (для production)
UPSTASH_REDIS_REST_URL=https://your-redis-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-redis-token

# Альтернатива - Turso Database (опционально)
# DATABASE_URL=libsql://your-database.turso.io

# RSSHub Base URL (если используете self-hosted версию)
# RSSHUB_BASE=https://rsshub.app

# Vercel Cron Secret (опционально, для защиты endpoint)
# CRON_SECRET=your-secret-key
```

## Локальный запуск

```bash
# Установка зависимостей
npm install

# Запуск в режиме разработки
npm run dev

# Проверка сбора новостей
curl http://localhost:3000/api/ingest

# Просмотр новостей
open http://localhost:3000/news
```

## Структура файлов

```
lib/
├── feeds.ts       # Конфигурация RSS источников
├── normalize.ts   # Нормализация данных
└── store.ts       # Хранилище (Redis/Memory)

app/api/
├── ingest/       # Endpoint для сбора новостей (cron)
└── news/         # API для получения новостей

app/news/         # Страница новостей

components/
├── NewsList.tsx      # Список новостей
└── NewsFilters.tsx   # Фильтры и поиск
```

## Добавление новых источников

Отредактируйте файл `lib/feeds.ts`:

```typescript
export const FEEDS: Feed[] = [
  // ... существующие источники
  { 
    source: "Новый источник", 
    url: "https://example.com/rss", 
    kind: "rss" 
  }
];
```

Для Telegram каналов используйте RSSHub:
```typescript
{ 
  source: "Channel Name", 
  url: "https://rsshub.app/telegram/channel/channel_name", 
  kind: "rsshub" 
}
```

## Производительность
- Кеширование ответов API на 30 секунд
- Хранение последних 250 новостей
- Обновление каждые 5 минут через Vercel Cron
- Время ответа из кеша < 300мс

## Тестирование

### Ручное тестирование
1. Открыть страницу /news
2. Проверить работу фильтров по источнику
3. Проверить поиск по заголовку
4. Проверить адаптивность на мобильных устройствах

### Автоматическое тестирование (с MCP Playwright)
```bash
# Скриншот-тесты будут добавлены позже
```

## Деплой на Vercel

1. Настройте переменные окружения в Vercel Dashboard
2. Убедитесь, что в `vercel.json` есть настройка cron:
```json
{
  "crons": [
    {
      "path": "/api/ingest",
      "schedule": "*/5 * * * *"
    }
  ]
}
```
3. После деплоя Vercel автоматически настроит cron задачу

# 🚀 ClosetheGATE - Проект успешно развернут!

## ✅ Развернутые сервисы

### Чат-сервер (Railway)
- **URL**: https://closethegate-production.up.railway.app
- **Health Check**: https://closethegate-production.up.railway.app/health
- **База данных**: PostgreSQL (Railway)
- **Статус**: ✅ Работает с постоянным хранением сообщений

### Веб-приложение (Vercel)  
- **URL**: https://closethe-gate-3tkb8mzpw-ruslansereduks-projects.vercel.app
- **GitHub**: https://github.com/ruslansereduk/closethegate
- **Статус**: ✅ Работает с улучшенной мобильной адаптивностью

## 🔧 Настроенные переменные окружения

### Railway (чат-сервер)
```
ALLOW_ORIGIN=https://closethe-gate-3tkb8mzpw-ruslansereduks-projects.vercel.app,https://closethegate.eu,https://www.closethegate.eu
NODE_ENV=production
DATABASE_URL=postgresql://postgres:...@postgres.railway.internal:5432/railway
```

### Vercel (веб-приложение)
```
NEXT_PUBLIC_CHAT_URL=closethegate-production.up.railway.app
NEXT_PUBLIC_DEADLINE_ISO=2025-09-12T00:00:00+02:00
```

---

# Инструкция по развертыванию ClosetheGATE

Этот проект состоит из двух частей:
- **Чат-сервер** (apps/chat) - развертывается на Railway
- **Веб-приложение** (apps/web) - развертывается на Vercel

## 1. Развертывание чат-сервера на Railway

### Шаг 1: Создание проекта на Railway

1. Перейдите на [railway.app](https://railway.app) и войдите в аккаунт
2. Нажмите "New Project"
3. Выберите "Deploy from GitHub repo"
4. Выберите этот репозиторий (ClosetheGATE)
5. Railway автоматически обнаружит `railway.json` и настроит сборку

### Шаг 2: Настройка переменных окружения на Railway

В настройках проекта на Railway добавьте следующие переменные:

```
NODE_ENV=production
ALLOW_ORIGIN=https://your-vercel-domain.vercel.app
```

⚠️ **Важно**: Замените `your-vercel-domain.vercel.app` на реальный домен Vercel после его создания.

### Шаг 3: Получение URL Railway

После успешного развертывания скопируйте URL вашего Railway приложения (формат: `https://your-project-name.up.railway.app`)

## 2. Развертывание веб-приложения на Vercel

### Шаг 1: Создание проекта на Vercel

1. Перейдите на [vercel.com](https://vercel.com) и войдите в аккаунт
2. Нажмите "New Project"
3. Выберите этот репозиторий (ClosetheGATE)
4. Vercel автоматически обнаружит `vercel.json` и настроит сборку

### Шаг 2: Настройка переменных окружения на Vercel

В настройках проекта на Vercel добавьте следующие переменные:

```
NEXT_PUBLIC_DEADLINE_ISO=2025-09-12T00:00:00+02:00
NEXT_PUBLIC_CHAT_URL=https://your-railway-domain.up.railway.app
NODE_ENV=production
```

⚠️ **Важно**: Замените `your-railway-domain.up.railway.app` на реальный URL Railway из Шага 3 выше.

## 3. Обновление CORS настроек

После получения домена Vercel:

1. Вернитесь в настройки Railway проекта
2. Обновите переменную `ALLOW_ORIGIN` с реальным доменом Vercel
3. Перезапустите Railway приложение

## 4. Проверка работы

1. Откройте ваш Vercel домен
2. Убедитесь, что таймер отображается корректно
3. Протестируйте чат (отправка сообщений и реакции)

## Локальная разработка

Для локальной разработки:

1. Скопируйте `apps/chat/env.example` в `apps/chat/.env`
2. Скопируйте `apps/web/env.local.example` в `apps/web/.env.local`
3. Запустите: `pnpm dev`

## Команды для развертывания из командной строки

### Railway CLI (опционально)

```bash
# Установка Railway CLI
npm install -g @railway/cli

# Логин
railway login

# Создание проекта
railway new

# Связывание с существующим проектом
railway link

# Развертывание
railway up
```

### Vercel CLI (опционально)

```bash
# Установка Vercel CLI
npm install -g vercel

# Логин
vercel login

# Развертывание
vercel --prod
```

## Возможные проблемы и решения

### CORS ошибки
- Убедитесь, что ALLOW_ORIGIN на Railway содержит правильный домен Vercel
- Проверьте, что домены указаны без trailing slash

### Проблемы с WebSocket
- Убедитесь, что Railway проект имеет правильную конфигурацию сети
- Проверьте, что нет блокировки WebSocket соединений

### Ошибки сборки
- Убедитесь, что используется Node.js версии 18 или выше
- Проверьте, что все зависимости установлены корректно

### Проблемы с базой данных
- Убедитесь, что DATABASE_URL правильно настроен в Railway
- Проверьте, что PostgreSQL сервис запущен и доступен
- Проверьте логи Railway для ошибок подключения к БД

## 🗄️ База данных PostgreSQL

### Возможности:
- ✅ **Постоянное хранение** всех сообщений чата
- ✅ **Сохранение реакций** (эмодзи) к сообщениям
- ✅ **Автоматическая очистка** сообщений старше 7 дней
- ✅ **Индексы для быстрого поиска** по времени
- ✅ **UUID для уникальных ID** сообщений

### Структура таблицы `messages`:
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text TEXT NOT NULL,
  nick VARCHAR(24) NOT NULL,
  ts BIGINT NOT NULL,
  reactions JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

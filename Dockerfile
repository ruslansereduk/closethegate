# Используем официальный Node.js образ
FROM node:18-alpine

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем package.json для кэширования зависимостей
COPY package.json package-lock.json ./
COPY apps/chat/package.json ./apps/chat/

# Устанавливаем зависимости
RUN npm install
RUN cd apps/chat && npm install

# Копируем остальные файлы
COPY . .

# Собираем приложение
RUN cd apps/chat && npm run build

# Экспонируем порт
EXPOSE 8080

# Указываем команду запуска
CMD ["sh", "-c", "cd apps/chat && npm start"]

# Используем официальный Node.js образ
FROM node:18-alpine

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем package.json для кэширования зависимостей
COPY package.json package-lock.json ./
COPY apps/chat/package.json ./apps/chat/

# Устанавливаем зависимости корневого проекта
RUN npm install

# Переходим в директорию чата и устанавливаем зависимости
WORKDIR /app/apps/chat
RUN npm install

# Возвращаемся в корень и копируем остальные файлы
WORKDIR /app
COPY . .

# Переходим в директорию чата и собираем приложение
WORKDIR /app/apps/chat
RUN npm run build

# Экспонируем порт
EXPOSE 8080

# Меняем рабочую директорию и указываем команду запуска
WORKDIR /app/apps/chat
CMD ["npm", "start"]

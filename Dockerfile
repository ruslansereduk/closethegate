FROM node:18-alpine

WORKDIR /app

# Копируем только чат-сервер
COPY apps/chat/package.json apps/chat/package-lock.json ./
COPY apps/chat/ ./

# Устанавливаем зависимости
RUN npm install

# Собираем TypeScript
RUN npm run build

EXPOSE 3001

CMD ["npm", "start"]

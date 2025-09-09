FROM node:18-alpine

WORKDIR /app

# Копируем только чат-сервер
COPY apps/chat/ ./

# Устанавливаем зависимости и собираем
RUN npm install && npm run build

EXPOSE 3001

CMD ["npm", "start"]

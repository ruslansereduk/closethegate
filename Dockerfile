FROM node:18-alpine

WORKDIR /app

# Копируем только чат-сервер
COPY apps/chat/package.json apps/chat/package-lock.json ./
COPY apps/chat/ ./

# Устанавливаем зависимости
RUN npm ci

# Собираем TypeScript
RUN npm run build

# Удаляем исходники и dev зависимости
RUN rm -rf src tsconfig.json && \
    npm ci --omit=dev && \
    npm cache clean --force

EXPOSE 3001

CMD ["npm", "start"]

FROM node:18-alpine

WORKDIR /app

# Копируем только package.json для установки зависимостей
COPY package.json ./
COPY package-lock.json* ./

# Устанавливаем только production зависимости
RUN npm ci --only=production

# Копируем исходный код
COPY . .

# Собираем TypeScript
RUN npm run build

# Удаляем исходники и dev зависимости
RUN rm -rf src tsconfig.json

EXPOSE 3001

CMD ["npm", "start"]

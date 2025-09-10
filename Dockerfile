FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY apps/chat/package*.json ./apps/chat/

# Install dependencies
RUN npm install
RUN npm install --prefix apps/chat

# Copy source code
COPY . .

# Build the chat application
RUN npm run build

# Expose port
EXPOSE 8080

# Start the application
CMD ["npm", "start"]

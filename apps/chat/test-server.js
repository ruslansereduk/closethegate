const { Server: SocketIOServer } = require('socket.io');
const { createServer } = require('http');
const Fastify = require('fastify');

const PORT = process.env.PORT || 8081;
const ALLOW_ORIGIN = process.env.ALLOW_ORIGIN || 'http://localhost:3000';

console.log('🚀 Запуск тестового чат-сервера...');

// Создаем Fastify приложение
const fastify = Fastify({ logger: true });

// Создаем HTTP сервер
const server = createServer(fastify.server);

// Инициализируем Socket.IO
const io = new SocketIOServer(server, {
  cors: {
    origin: ALLOW_ORIGIN.split(','),
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Временное хранилище сообщений в памяти
let messages = [];

// Health check endpoint
fastify.get('/health', async (request, reply) => {
  return { 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    database: 'in-memory',
    messagesCount: messages.length
  };
});

// Socket.IO обработчики
io.on('connection', (socket) => {
  console.log(`👤 Пользователь подключился: ${socket.id}`);
  
  // Отправляем последние сообщения при подключении
  socket.emit('recent', messages.slice(-20));
  
  // Обработчик отправки сообщения
  socket.on('msg', (data) => {
    const message = {
      id: Date.now().toString(),
      ...data,
      ts: Date.now()
    };
    
    // Сохраняем в память
    messages.push(message);
    
    // Ограничиваем количество сообщений в памяти
    if (messages.length > 100) {
      messages = messages.slice(-100);
    }
    
    // Отправляем всем подключенным пользователям
    io.emit('msg', message);
    
    console.log(`💬 Новое сообщение от ${message.nick}: ${message.text.substring(0, 50)}...`);
  });
  
  // Обработчик реакций
  socket.on('react', (data) => {
    const messageIndex = messages.findIndex(msg => msg.id === data.msgId);
    if (messageIndex !== -1) {
      if (!messages[messageIndex].reactions) {
        messages[messageIndex].reactions = {};
      }
      messages[messageIndex].reactions[data.emoji] = 
        (messages[messageIndex].reactions[data.emoji] || 0) + 1;
      
      // Отправляем обновленные реакции всем пользователям
      io.emit('reaction', {
        msgId: data.msgId,
        emoji: data.emoji,
        count: messages[messageIndex].reactions[data.emoji]
      });
      
      console.log(`👍 Реакция ${data.emoji} на сообщение ${data.msgId}`);
    }
  });
  
  // Обработчик отключения
  socket.on('disconnect', () => {
    console.log(`👋 Пользователь отключился: ${socket.id}`);
  });
});

// Запуск сервера
async function start() {
  try {
    await server.listen({ port: PORT, host: '0.0.0.0' });
    console.log(`🚀 Тестовый сервер запущен на порту ${PORT}`);
    console.log(`🌐 CORS настроен для: ${ALLOW_ORIGIN}`);
    console.log(`💾 Использует in-memory хранилище`);
  } catch (error) {
    console.error('❌ Ошибка запуска сервера:', error);
    process.exit(1);
  }
}

start();



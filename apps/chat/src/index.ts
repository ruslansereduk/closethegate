import Fastify from 'fastify';
import { Server as SocketIOServer } from 'socket.io';
import { createServer } from 'http';
import cors from 'cors';
import { Pool } from 'pg';

// Типы для сообщений
interface Message {
  id: string;
  text: string;
  nick: string;
  ts: number;
  reactions?: { [emoji: string]: number };
  userColor?: string;
  userStatus?: string;
}

interface LoadOlderRequest {
  beforeId: string;
  limit: number;
}

// Конфигурация
const PORT = process.env.PORT || 8080;
const ALLOW_ORIGIN = process.env.ALLOW_ORIGIN || 'http://localhost:3000';
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/closethegate';

// Создание пула подключений к БД
const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Инициализация Fastify
const fastify = Fastify({
  logger: true
});

// Создание HTTP сервера
const server = createServer(fastify.server);

// Инициализация Socket.IO
const io = new SocketIOServer(server, {
  cors: {
    origin: ALLOW_ORIGIN.split(','),
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Инициализация CORS middleware
async function setupCors() {
  await fastify.register(import('@fastify/cors'), {
    origin: ALLOW_ORIGIN.split(','),
    credentials: true
  });
}

// Функция для инициализации базы данных
async function initDatabase() {
  try {
    const client = await pool.connect();
    
    // Создаем таблицу сообщений если её нет
    await client.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        text TEXT NOT NULL,
        nick VARCHAR(24) NOT NULL,
        ts BIGINT NOT NULL,
        reactions JSONB DEFAULT '{}'::jsonb,
        user_color VARCHAR(7),
        user_status VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Создаем индекс для быстрого поиска по времени
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_messages_ts ON messages(ts DESC)
    `);
    
    // Создаем индекс для пагинации
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_messages_id_ts ON messages(id, ts DESC)
    `);
    
    client.release();
    console.log('✅ База данных инициализирована');
  } catch (error) {
    console.error('❌ Ошибка инициализации базы данных:', error);
    throw error;
  }
}

// Функция для получения последних сообщений
async function getRecentMessages(limit: number = 20): Promise<Message[]> {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT id, text, nick, ts, reactions, user_color, user_status
      FROM messages 
      ORDER BY ts DESC 
      LIMIT $1
    `, [limit]);
    
    return result.rows.map(row => ({
      id: row.id,
      text: row.text,
      nick: row.nick,
      ts: parseInt(row.ts),
      reactions: row.reactions || {},
      userColor: row.user_color,
      userStatus: row.user_status
    })); // Возвращаем в обратном хронологическом порядке (новые первыми)
  } finally {
    client.release();
  }
}

// Функция для получения старых сообщений (пагинация)
async function getOlderMessages(beforeId: string, limit: number = 20): Promise<Message[]> {
  const client = await pool.connect();
  try {
    // Получаем timestamp сообщения, до которого нужно загрузить
    const beforeResult = await client.query(`
      SELECT ts FROM messages WHERE id = $1
    `, [beforeId]);
    
    if (beforeResult.rows.length === 0) {
      return [];
    }
    
    const beforeTs = beforeResult.rows[0].ts;
    
    // Получаем сообщения старше указанного
    const result = await client.query(`
      SELECT id, text, nick, ts, reactions, user_color, user_status
      FROM messages 
      WHERE ts < $1
      ORDER BY ts DESC 
      LIMIT $2
    `, [beforeTs, limit]);
    
    return result.rows.map(row => ({
      id: row.id,
      text: row.text,
      nick: row.nick,
      ts: parseInt(row.ts),
      reactions: row.reactions || {},
      userColor: row.user_color,
      userStatus: row.user_status
    })); // Возвращаем в обратном хронологическом порядке (новые первыми)
  } finally {
    client.release();
  }
}

// Функция для сохранения сообщения
async function saveMessage(message: Omit<Message, 'id'>): Promise<Message> {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      INSERT INTO messages (text, nick, ts, reactions, user_color, user_status)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, text, nick, ts, reactions, user_color, user_status
    `, [
      message.text,
      message.nick,
      message.ts,
      JSON.stringify(message.reactions || {}),
      message.userColor,
      message.userStatus
    ]);
    
    const row = result.rows[0];
    return {
      id: row.id,
      text: row.text,
      nick: row.nick,
      ts: parseInt(row.ts),
      reactions: row.reactions || {},
      userColor: row.user_color,
      userStatus: row.user_status
    };
  } finally {
    client.release();
  }
}

// Функция для обновления реакций
async function updateReactions(messageId: string, emoji: string): Promise<{ [emoji: string]: number }> {
  const client = await pool.connect();
  try {
    // Получаем текущие реакции
    const result = await client.query(`
      SELECT reactions FROM messages WHERE id = $1
    `, [messageId]);
    
    if (result.rows.length === 0) {
      throw new Error('Message not found');
    }
    
    const currentReactions = result.rows[0].reactions || {};
    const newCount = (currentReactions[emoji] || 0) + 1;
    const updatedReactions = { ...currentReactions, [emoji]: newCount };
    
    // Обновляем реакции
    await client.query(`
      UPDATE messages SET reactions = $1 WHERE id = $2
    `, [JSON.stringify(updatedReactions), messageId]);
    
    return updatedReactions;
  } finally {
    client.release();
  }
}

// Health check endpoint
fastify.get('/health', async (request, reply) => {
  try {
    // Проверяем подключение к БД
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    
    return { 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      database: 'connected'
    };
  } catch (error) {
    reply.code(500);
    return { 
      status: 'error', 
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
});

// Socket.IO обработчики
io.on('connection', async (socket) => {
  console.log(`👤 Пользователь подключился: ${socket.id}`);
  
  try {
    // Отправляем последние сообщения при подключении
    const recentMessages = await getRecentMessages(20);
    socket.emit('recent', recentMessages);
  } catch (error) {
    console.error('Ошибка загрузки сообщений:', error);
    socket.emit('error', { message: 'Ошибка загрузки сообщений' });
  }
  
  // Обработчик отправки сообщения
  socket.on('msg', async (data: Omit<Message, 'id' | 'ts'>) => {
    try {
      const message: Omit<Message, 'id'> = {
        ...data,
        ts: Date.now()
      };
      
      // Валидация
      if (!message.text || message.text.length > 500) {
        socket.emit('error', { message: 'Сообщение слишком длинное (максимум 500 символов)' });
        return;
      }
      
      if (!message.nick || message.nick.length > 24) {
        socket.emit('error', { message: 'Никнейм слишком длинный (максимум 24 символа)' });
        return;
      }
      
      // Сохраняем сообщение
      const savedMessage = await saveMessage(message);
      
      // Отправляем всем подключенным пользователям
      io.emit('msg', savedMessage);
      
      console.log(`💬 Новое сообщение от ${message.nick}: ${message.text.substring(0, 50)}...`);
    } catch (error) {
      console.error('Ошибка сохранения сообщения:', error);
      socket.emit('error', { message: 'Ошибка отправки сообщения' });
    }
  });
  
  // Обработчик реакций
  socket.on('react', async (data: { msgId: string; emoji: string }) => {
    try {
      const reactions = await updateReactions(data.msgId, data.emoji);
      
      // Отправляем обновленные реакции всем пользователям
      io.emit('reaction', {
        msgId: data.msgId,
        emoji: data.emoji,
        count: reactions[data.emoji]
      });
      
      console.log(`👍 Реакция ${data.emoji} на сообщение ${data.msgId}`);
    } catch (error) {
      console.error('Ошибка обновления реакции:', error);
      socket.emit('error', { message: 'Ошибка добавления реакции' });
    }
  });
  
  // Обработчик загрузки старых сообщений (пагинация)
  socket.on('loadOlder', async (data: LoadOlderRequest) => {
    try {
      console.log(`📜 Загрузка старых сообщений до ${data.beforeId}, лимит: ${data.limit}`);
      
      const olderMessages = await getOlderMessages(data.beforeId, data.limit);
      
      // Отправляем старые сообщения только запросившему пользователю
      socket.emit('olderMessages', olderMessages);
      
      console.log(`📜 Загружено ${olderMessages.length} старых сообщений`);
    } catch (error) {
      console.error('Ошибка загрузки старых сообщений:', error);
      socket.emit('error', { message: 'Ошибка загрузки старых сообщений' });
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
    // Настраиваем CORS
    await setupCors();
    
    // Инициализируем базу данных
    await initDatabase();
    
    // Запускаем сервер
    await server.listen({ port: PORT, host: '0.0.0.0' });
    console.log(`🚀 Сервер запущен на порту ${PORT}`);
    console.log(`🌐 CORS настроен для: ${ALLOW_ORIGIN}`);
    console.log(`💾 База данных: ${DATABASE_URL.split('@')[1] || 'localhost'}`);
  } catch (error) {
    console.error('❌ Ошибка запуска сервера:', error);
    process.exit(1);
  }
}

// Обработка сигналов завершения
process.on('SIGINT', async () => {
  console.log('\n🛑 Получен сигнал SIGINT, завершаем работу...');
  await pool.end();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Получен сигнал SIGTERM, завершаем работу...');
  await pool.end();
  process.exit(0);
});

// Запускаем сервер
start();

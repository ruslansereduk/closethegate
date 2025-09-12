import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Функция для создания ответа с правильными заголовками кеширования
function createApiResponse(data: any, status: number = 200): NextResponse {
  const response = NextResponse.json(data, { status });
  
  // Заголовки для предотвращения кеширования API
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  
  return response;
}

// Конфигурация Supabase
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qvwwmtgtzfdojulugngf.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2d3dtdGd0emZkb2p1bHVnbmdmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzUwMTg3NSwiZXhwIjoyMDczMDc3ODc1fQ.kboDI9L44rBFFZzSqCGL7THYuXwehnT1hqC-_7AmUF0';

console.log('🔧 Supabase URL:', SUPABASE_URL);
console.log('🔧 Supabase Key exists:', !!SUPABASE_SERVICE_KEY);

// Создание Supabase клиента
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Типы для сообщений
interface Message {
  id: string;
  text: string;
  nick: string;
  ts: number;
  reactions?: { [emoji: string]: number };
  userColor?: string;
  userStatus?: string;
  parentId?: string | null; // ID главного сообщения, если это ответ
  replies?: Message[]; // Ответы на это сообщение
}

interface LoadOlderRequest {
  beforeId: string;
  limit: number;
}

// Функция для инициализации базы данных
async function initDatabase() {
  try {
    // Проверяем существование таблицы
    const { data, error } = await supabase
      .from('messages')
      .select('id')
      .limit(1);

    if (error && error.code === 'PGRST116') {
      console.log('⚠️ Таблица messages не существует');
      console.log('Создайте таблицу в Supabase Dashboard:');
      console.log(`
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text TEXT NOT NULL,
  nick VARCHAR(24) NOT NULL,
  ts BIGINT NOT NULL,
  reactions JSONB DEFAULT '{}'::jsonb,
  user_color VARCHAR(7),
  user_status VARCHAR(50),
        -- parent_id UUID REFERENCES messages(id), -- Убрано, так как колонка не существует в продакшн БД
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_messages_ts ON messages(ts DESC);
CREATE INDEX idx_messages_id_ts ON messages(id, ts DESC);
-- CREATE INDEX idx_messages_parent_id ON messages(parent_id); -- Убрано, так как колонка не существует в продакшн БД
      `);
    } else if (error) {
      console.error('❌ Ошибка подключения к Supabase:', error.message);
    } else {
      console.log('✅ Таблица messages существует');
    }
  } catch (error) {
    console.error('❌ Ошибка инициализации базы данных:', error);
  }
}

// Функция для получения последних сообщений с ответами
async function getRecentMessages(limit: number = 20): Promise<Message[]> {
  // Получаем основные сообщения (без parent_id)
  const { data: mainMessages, error: mainError } = await supabase
    .from('messages')
    .select('id, text, nick, ts, reactions, user_color, user_status, parent_id')
    .is('parent_id', null)
    .order('ts', { ascending: false })
    .limit(limit);

  if (mainError) {
    console.error('Ошибка получения основных сообщений:', mainError);
    throw mainError;
  }

  if (!mainMessages || mainMessages.length === 0) {
    return [];
  }

  // Получаем все ответы для этих сообщений
  const mainMessageIds = mainMessages.map(msg => msg.id);
  const { data: replies, error: repliesError } = await supabase
    .from('messages')
    .select('id, text, nick, ts, reactions, user_color, user_status, parent_id')
    .in('parent_id', mainMessageIds)
    .order('ts', { ascending: true }); // Ответы в хронологическом порядке

  if (repliesError) {
    console.error('Ошибка получения ответов:', repliesError);
    // Продолжаем без ответов, если есть ошибка
  }

  // Группируем ответы по родительским сообщениям
  const repliesByParent: { [key: string]: Message[] } = {};
  if (replies) {
    replies.forEach(reply => {
      if (!repliesByParent[reply.parent_id]) {
        repliesByParent[reply.parent_id] = [];
      }
      repliesByParent[reply.parent_id].push({
        id: reply.id,
        text: reply.text,
        nick: reply.nick,
        ts: parseInt(reply.ts),
        reactions: reply.reactions || {},
        userColor: reply.user_color,
        userStatus: reply.user_status,
        parentId: reply.parent_id
      });
    });
  }

  // Объединяем основные сообщения с их ответами
  return mainMessages.map(row => ({
    id: row.id,
    text: row.text,
    nick: row.nick,
    ts: parseInt(row.ts),
    reactions: row.reactions || {},
    userColor: row.user_color,
    userStatus: row.user_status,
    parentId: null,
    replies: repliesByParent[row.id] || []
  }));
}

// Функция для получения старых сообщений с ответами (пагинация)
async function getOlderMessages(beforeId: string, limit: number = 20): Promise<Message[]> {
  // Получаем timestamp сообщения, до которого нужно загрузить
  const { data: beforeData, error: beforeError } = await supabase
    .from('messages')
    .select('ts')
    .eq('id', beforeId)
    .single();

  if (beforeError || !beforeData) {
    return [];
  }

  // Получаем основные сообщения старше указанного (без parent_id)
  const { data: mainMessages, error: mainError } = await supabase
    .from('messages')
    .select('id, text, nick, ts, reactions, user_color, user_status, parent_id')
    .is('parent_id', null)
    .lt('ts', beforeData.ts)
    .order('ts', { ascending: false })
    .limit(limit);

  if (mainError) {
    console.error('Ошибка получения старых основных сообщений:', mainError);
    throw mainError;
  }

  if (!mainMessages || mainMessages.length === 0) {
    return [];
  }

  // Получаем все ответы для этих сообщений
  const mainMessageIds = mainMessages.map(msg => msg.id);
  const { data: replies, error: repliesError } = await supabase
    .from('messages')
    .select('id, text, nick, ts, reactions, user_color, user_status, parent_id')
    .in('parent_id', mainMessageIds)
    .order('ts', { ascending: true }); // Ответы в хронологическом порядке

  if (repliesError) {
    console.error('Ошибка получения ответов для старых сообщений:', repliesError);
    // Продолжаем без ответов, если есть ошибка
  }

  // Группируем ответы по родительским сообщениям
  const repliesByParent: { [key: string]: Message[] } = {};
  if (replies) {
    replies.forEach(reply => {
      if (!repliesByParent[reply.parent_id]) {
        repliesByParent[reply.parent_id] = [];
      }
      repliesByParent[reply.parent_id].push({
        id: reply.id,
        text: reply.text,
        nick: reply.nick,
        ts: parseInt(reply.ts),
        reactions: reply.reactions || {},
        userColor: reply.user_color,
        userStatus: reply.user_status,
        parentId: reply.parent_id
      });
    });
  }

  // Объединяем основные сообщения с их ответами
  return mainMessages.map(row => ({
    id: row.id,
    text: row.text,
    nick: row.nick,
    ts: parseInt(row.ts),
    reactions: row.reactions || {},
    userColor: row.user_color,
    userStatus: row.user_status,
    parentId: null,
    replies: repliesByParent[row.id] || []
  }));
}

// Функция для сохранения сообщения
async function saveMessage(message: Omit<Message, 'id'>): Promise<Message> {
  const insertData: any = {
    text: message.text,
    nick: message.nick,
    ts: message.ts,
    reactions: message.reactions || {},
    user_color: message.userColor,
    user_status: message.userStatus,
  };

  // Добавляем parent_id только если колонка существует
  if (message.parentId) {
    insertData.parent_id = message.parentId;
  }

  const { data, error } = await supabase
    .from('messages')
    .insert(insertData)
    .select('id, text, nick, ts, reactions, user_color, user_status, parent_id')
    .single();

  if (error) {
    console.error('Ошибка сохранения сообщения:', error);
    throw error;
  }

  return {
    id: data.id,
    text: data.text,
    nick: data.nick,
    ts: parseInt(data.ts),
    reactions: data.reactions || {},
    userColor: data.user_color,
    userStatus: data.user_status,
    parentId: data.parent_id || null
  };
}

// Функция для обновления реакций
async function updateReactions(messageId: string, emoji: string): Promise<{ [emoji: string]: number }> {
  // Получаем текущие реакции
  const { data: currentData, error: fetchError } = await supabase
    .from('messages')
    .select('reactions')
    .eq('id', messageId)
    .single();

  if (fetchError || !currentData) {
    throw new Error('Message not found');
  }

  const currentReactions = currentData.reactions || {};
  const newCount = (currentReactions[emoji] || 0) + 1;
  const updatedReactions = { ...currentReactions, [emoji]: newCount };

  // Обновляем реакции
  const { error: updateError } = await supabase
    .from('messages')
    .update({ reactions: updatedReactions })
    .eq('id', messageId);

  if (updateError) {
    console.error('Ошибка обновления реакций:', updateError);
    throw updateError;
  }

  return updatedReactions;
}

// Функция для удаления сообщения
async function deleteMessage(messageId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', messageId);

    if (error) {
      console.error('Ошибка удаления сообщения:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Ошибка при удалении сообщения:', error);
    return false;
  }
}

// API endpoint для получения последних сообщений
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    if (action === 'recent') {
      const limit = parseInt(url.searchParams.get('limit') || '20');
      const messages = await getRecentMessages(limit);
      return createApiResponse(messages);
    }

    if (action === 'older') {
      const beforeId = url.searchParams.get('beforeId');
      const limit = parseInt(url.searchParams.get('limit') || '20');

      if (!beforeId) {
        return createApiResponse({ error: 'Missing beforeId parameter' }, 400);
      }

      const messages = await getOlderMessages(beforeId, limit);
      return createApiResponse(messages);
    }

    return createApiResponse({ error: 'Unknown action' }, 400);
  } catch (error) {
    console.error('API Error:', error);
    return createApiResponse({ error: 'Internal server error' }, 500);
  }
}

// API endpoint для отправки сообщения
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'send') {
      const { text, nick, ts, reactions, userColor, userStatus, parentId } = body;

      // Валидация
      if (!text || text.length > 500) {
        return createApiResponse({ error: 'Message too long' }, 400);
      }

      if (!nick || nick.length > 24) {
        return createApiResponse({ error: 'Nickname too long' }, 400);
      }

      const message: Omit<Message, 'id'> = {
        text,
        nick,
        ts: ts || Date.now(),
        reactions: reactions || {},
        userColor,
        userStatus,
        parentId
      };

      const savedMessage = await saveMessage(message);
      return createApiResponse(savedMessage);
    }

    if (action === 'react') {
      const { messageId, emoji } = body;

      if (!messageId || !emoji) {
        return createApiResponse({ error: 'Missing parameters' }, 400);
      }

      const reactions = await updateReactions(messageId, emoji);
      return createApiResponse({ messageId, emoji, count: reactions[emoji] });
    }

    if (action === 'delete') {
      const { messageId } = body;

      if (!messageId) {
        return createApiResponse({ error: 'Missing messageId parameter' }, 400);
      }

      const success = await deleteMessage(messageId);
      if (success) {
        return createApiResponse({ success: true, messageId });
      } else {
        return createApiResponse({ error: 'Message not found or could not be deleted' }, 404);
      }
    }

    return createApiResponse({ error: 'Unknown action' }, 400);
  } catch (error) {
    console.error('API Error:', error);
    return createApiResponse({ error: 'Internal server error' }, 500);
  }
}

// Тест подключения при запуске
async function testConnection() {
  try {
    console.log('🔧 Тестирование подключения к Supabase...');
    const { data, error } = await supabase.from('messages').select('id').limit(1);
    if (error) {
      console.error('❌ Ошибка подключения к Supabase:', error.message);
    } else {
      console.log('✅ Подключение к Supabase успешно');
    }
  } catch (err) {
    console.error('❌ Ошибка тестирования:', err);
  }
}

// Инициализируем базу данных при первом запуске
initDatabase();
testConnection();

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Конфигурация Supabase
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qvwwmtgtzfdojulugngf.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'sbp_260db946c59e39c25b700f555d0e4b74d85ca333';

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
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_messages_ts ON messages(ts DESC);
CREATE INDEX idx_messages_id_ts ON messages(id, ts DESC);
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

// Функция для получения последних сообщений
async function getRecentMessages(limit: number = 20): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('id, text, nick, ts, reactions, user_color, user_status')
    .order('ts', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Ошибка получения сообщений:', error);
    throw error;
  }

  return (data || []).map(row => ({
    id: row.id,
    text: row.text,
    nick: row.nick,
    ts: parseInt(row.ts),
    reactions: row.reactions || {},
    userColor: row.user_color,
    userStatus: row.user_status
  }));
}

// Функция для получения старых сообщений (пагинация)
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

  // Получаем сообщения старше указанного
  const { data, error } = await supabase
    .from('messages')
    .select('id, text, nick, ts, reactions, user_color, user_status')
    .lt('ts', beforeData.ts)
    .order('ts', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Ошибка получения старых сообщений:', error);
    throw error;
  }

  return (data || []).map(row => ({
    id: row.id,
    text: row.text,
    nick: row.nick,
    ts: parseInt(row.ts),
    reactions: row.reactions || {},
    userColor: row.user_color,
    userStatus: row.user_status
  }));
}

// Функция для сохранения сообщения
async function saveMessage(message: Omit<Message, 'id'>): Promise<Message> {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      text: message.text,
      nick: message.nick,
      ts: message.ts,
      reactions: message.reactions || {},
      user_color: message.userColor,
      user_status: message.userStatus
    })
    .select('id, text, nick, ts, reactions, user_color, user_status')
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
    userStatus: data.user_status
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

// API endpoint для получения последних сообщений
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    if (action === 'recent') {
      const limit = parseInt(url.searchParams.get('limit') || '20');
      const messages = await getRecentMessages(limit);
      return NextResponse.json(messages);
    }

    if (action === 'older') {
      const beforeId = url.searchParams.get('beforeId');
      const limit = parseInt(url.searchParams.get('limit') || '20');

      if (!beforeId) {
        return NextResponse.json({ error: 'Missing beforeId parameter' }, { status: 400 });
      }

      const messages = await getOlderMessages(beforeId, limit);
      return NextResponse.json(messages);
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// API endpoint для отправки сообщения
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'send') {
      const { text, nick, ts, reactions, userColor, userStatus } = body;

      // Валидация
      if (!text || text.length > 500) {
        return NextResponse.json({ error: 'Message too long' }, { status: 400 });
      }

      if (!nick || nick.length > 24) {
        return NextResponse.json({ error: 'Nickname too long' }, { status: 400 });
      }

      const message: Omit<Message, 'id'> = {
        text,
        nick,
        ts: ts || Date.now(),
        reactions: reactions || {},
        userColor,
        userStatus
      };

      const savedMessage = await saveMessage(message);
      return NextResponse.json(savedMessage);
    }

    if (action === 'react') {
      const { messageId, emoji } = body;

      if (!messageId || !emoji) {
        return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
      }

      const reactions = await updateReactions(messageId, emoji);
      return NextResponse.json({ messageId, emoji, count: reactions[emoji] });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Инициализируем базу данных при первом запуске
initDatabase();

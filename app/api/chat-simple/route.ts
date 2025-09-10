import { NextRequest, NextResponse } from 'next/server';

// Простое хранилище сообщений в памяти (для тестирования)
let messages: any[] = [
  {
    id: '1',
    text: 'Привет! Это тестовое сообщение.',
    nick: 'Система',
    ts: Date.now() - 60000,
    reactions: {},
    userColor: '#ff6b6b',
    userStatus: 'тестирую'
  }
];

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    if (action === 'recent') {
      const limit = parseInt(url.searchParams.get('limit') || '20');
      const recentMessages = messages
        .sort((a, b) => b.ts - a.ts)
        .slice(0, limit);
      return NextResponse.json(recentMessages);
    }

    if (action === 'older') {
      const beforeId = url.searchParams.get('beforeId');
      const limit = parseInt(url.searchParams.get('limit') || '20');

      if (!beforeId) {
        return NextResponse.json({ error: 'Missing beforeId parameter' }, { status: 400 });
      }

      // Найдем сообщение с beforeId
      const beforeMessage = messages.find(m => m.id === beforeId);
      if (!beforeMessage) {
        return NextResponse.json([]);
      }

      // Получим сообщения старше указанного
      const olderMessages = messages
        .filter(m => m.ts < beforeMessage.ts)
        .sort((a, b) => b.ts - a.ts)
        .slice(0, limit);

      return NextResponse.json(olderMessages);
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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

      const newMessage = {
        id: Date.now().toString(),
        text: text.trim(),
        nick,
        ts: ts || Date.now(),
        reactions: reactions || {},
        userColor: userColor || '#ff6b6b',
        userStatus: userStatus || 'на границе'
      };

      messages.push(newMessage);

      // Ограничим количество сообщений в памяти
      if (messages.length > 100) {
        messages = messages.slice(-100);
      }

      return NextResponse.json(newMessage);
    }

    if (action === 'react') {
      const { messageId, emoji } = body;

      if (!messageId || !emoji) {
        return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
      }

      const message = messages.find(m => m.id === messageId);
      if (!message) {
        return NextResponse.json({ error: 'Message not found' }, { status: 404 });
      }

      if (!message.reactions) {
        message.reactions = {};
      }

      const newCount = (message.reactions[emoji] || 0) + 1;
      message.reactions[emoji] = newCount;

      return NextResponse.json({ messageId, emoji, count: newCount });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

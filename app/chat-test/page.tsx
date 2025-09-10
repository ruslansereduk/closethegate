'use client';

import { useState, useEffect } from 'react';

interface Message {
  id: string;
  text: string;
  nick: string;
  ts: number;
  reactions?: { [emoji: string]: number };
  userColor?: string;
  userStatus?: string;
}

export default function ChatTestPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [nick, setNick] = useState('Тестер');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Загружаем сообщения при загрузке страницы
  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/chat?action=recent&limit=10');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setMessages(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      console.error('Ошибка загрузки сообщений:', err);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!text.trim()) return;

    try {
      setLoading(true);
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'send',
          text: text.trim(),
          nick,
          ts: Date.now(),
          reactions: {},
          userColor: '#ff6b6b',
          userStatus: 'тестирую'
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const newMessage = await response.json();
      setMessages(prev => [newMessage, ...prev]);
      setText('');
      setError(null);
    } catch (err: any) {
      setError(err.message);
      console.error('Ошибка отправки сообщения:', err);
    } finally {
      setLoading(false);
    }
  };

  const addReaction = async (messageId: string, emoji: string) => {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'react',
          messageId,
          emoji
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      // Обновляем реакции в сообщениях
      setMessages(prev => prev.map(msg =>
        msg.id === messageId
          ? {
              ...msg,
              reactions: {
                ...msg.reactions,
                [emoji]: result.count
              }
            }
          : msg
      ));
    } catch (err: any) {
      setError(err.message);
      console.error('Ошибка добавления реакции:', err);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-center">Тест чата</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <h3 className="text-red-800 font-semibold">Ошибка:</h3>
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Панель управления */}
        <div className="bg-card border border-border rounded-lg p-4 mb-6">
          <div className="flex gap-4 mb-4">
            <input
              type="text"
              value={nick}
              onChange={(e) => setNick(e.target.value)}
              placeholder="Ваш ник"
              className="flex-1 px-3 py-2 border border-border rounded"
            />
            <button
              onClick={loadMessages}
              disabled={loading}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? 'Загрузка...' : 'Обновить'}
            </button>
          </div>
        </div>

        {/* Сообщения */}
        <div className="bg-card border border-border rounded-lg p-4 mb-6 max-h-96 overflow-y-auto">
          <h2 className="font-semibold mb-3">Сообщения ({messages.length})</h2>
          {messages.length === 0 ? (
            <p className="text-muted-foreground">Нет сообщений</p>
          ) : (
            <div className="space-y-3">
              {messages.map((msg) => (
                <div key={msg.id} className="border border-border rounded p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="font-medium"
                      style={{ color: msg.userColor }}
                    >
                      {msg.nick}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(msg.ts).toLocaleTimeString()}
                    </span>
                    {msg.userStatus && (
                      <span className="text-xs bg-muted px-2 py-0.5 rounded">
                        {msg.userStatus}
                      </span>
                    )}
                  </div>
                  <p className="mb-2">{msg.text}</p>
                  <div className="flex gap-1">
                    <button
                      onClick={() => addReaction(msg.id, '👍')}
                      className="text-sm px-2 py-1 border border-border rounded hover:bg-muted"
                    >
                      👍 {msg.reactions?.['👍'] || 0}
                    </button>
                    <button
                      onClick={() => addReaction(msg.id, '😂')}
                      className="text-sm px-2 py-1 border border-border rounded hover:bg-muted"
                    >
                      😂 {msg.reactions?.['😂'] || 0}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Форма отправки */}
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Напишите сообщение..."
              disabled={loading}
              className="flex-1 px-3 py-2 border border-border rounded"
            />
            <button
              onClick={sendMessage}
              disabled={loading || !text.trim()}
              className="px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
            >
              {loading ? 'Отправка...' : 'Отправить'}
            </button>
          </div>
        </div>

        {/* Инструкции */}
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-yellow-800 font-semibold mb-2">Инструкции:</h3>
          <ol className="text-yellow-700 text-sm space-y-1">
            <li>1. Создайте таблицу <code>messages</code> в Supabase Dashboard</li>
            <li>2. Используйте SQL из консоли браузера</li>
            <li>3. Обновите страницу после создания таблицы</li>
            <li>4. Попробуйте отправить тестовое сообщение</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

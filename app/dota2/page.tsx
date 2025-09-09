"use client";
import { useState, useEffect } from "react";

type Message = {
  id: string;
  text: string;
  nick: string;
  ts: number;
  reactions?: { [emoji: string]: number };
  userColor?: string;
  userStatus?: string;
};

type BlockedIP = {
  ip: string;
  reason: string;
  blocked_at: string;
};

export default function AdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [blockedIPs, setBlockedIPs] = useState<BlockedIP[]>([]);
  const [newBlockIP, setNewBlockIP] = useState("");
  const [blockReason, setBlockReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const chatUrl = process.env.NEXT_PUBLIC_CHAT_URL!;
  const apiUrl = chatUrl?.startsWith('http') ? chatUrl : `https://${chatUrl}`;

  // Создаем базовую аутентификацию
  const getAuthHeaders = () => ({
    'Authorization': `Basic ${btoa(`${email}:${password}`)}`,
    'Content-Type': 'application/json'
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${apiUrl}/admin/login`, {
        method: 'POST',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        setIsAuthenticated(true);
        loadData();
      } else {
        setError("Неверный логин или пароль");
      }
    } catch (err) {
      setError("Ошибка подключения");
    } finally {
      setLoading(false);
    }
  };

  const loadData = async () => {
    try {
      // Загружаем сообщения
      const messagesResponse = await fetch(`${apiUrl}/admin/messages`, {
        headers: getAuthHeaders()
      });
      if (messagesResponse.ok) {
        const messagesData = await messagesResponse.json();
        setMessages(messagesData);
      }

      // Загружаем заблокированные IP
      const blockedResponse = await fetch(`${apiUrl}/admin/blocked-ips`, {
        headers: getAuthHeaders()
      });
      if (blockedResponse.ok) {
        const blockedData = await blockedResponse.json();
        setBlockedIPs(blockedData);
      }
    } catch (err) {
      console.error("Error loading data:", err);
    }
  };

  const deleteMessage = async (messageId: string) => {
    if (!confirm("Удалить это сообщение?")) return;

    try {
      const response = await fetch(`${apiUrl}/admin/messages/delete`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ messageId })
      });

      if (response.ok) {
        setMessages(messages.filter(m => m.id !== messageId));
      } else {
        alert("Ошибка удаления сообщения");
      }
    } catch (err) {
      alert("Ошибка подключения");
    }
  };

  const blockIP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBlockIP.trim()) return;

    try {
      const response = await fetch(`${apiUrl}/admin/block-ip`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ 
          ip: newBlockIP.trim(), 
          reason: blockReason.trim() || "Заблокирован администратором" 
        })
      });

      if (response.ok) {
        setNewBlockIP("");
        setBlockReason("");
        loadData(); // Перезагружаем список
      } else {
        alert("Ошибка блокировки IP");
      }
    } catch (err) {
      alert("Ошибка подключения");
    }
  };

  const unblockIP = async (ip: string) => {
    if (!confirm(`Разблокировать IP ${ip}?`)) return;

    try {
      const response = await fetch(`${apiUrl}/admin/unblock-ip`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ ip })
      });

      if (response.ok) {
        setBlockedIPs(blockedIPs.filter(blocked => blocked.ip !== ip));
      } else {
        alert("Ошибка разблокировки IP");
      }
    } catch (err) {
      alert("Ошибка подключения");
    }
  };

  const formatDate = (timestamp: number | string) => {
    const date = typeof timestamp === 'number' ? new Date(timestamp) : new Date(timestamp);
    return date.toLocaleString('ru-RU');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center">
        <div className="bg-neutral-900 p-8 rounded-xl border border-neutral-800 w-full max-w-md">
          <h1 className="text-2xl font-bold mb-6 text-center">🔐 Админ панель</h1>
          
          {error && (
            <div className="bg-red-900/50 border border-red-700 rounded p-3 mb-4 text-red-200">
              {error}
            </div>
          )}
          
          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 outline-none focus:border-blue-500"
                required
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Пароль</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 outline-none focus:border-blue-500"
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 rounded-lg py-2 font-medium transition-colors"
            >
              {loading ? "Вход..." : "Войти"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">⚙️ Админ панель</h1>
          <button
            onClick={() => setIsAuthenticated(false)}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-colors"
          >
            Выйти
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Управление сообщениями */}
          <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              💬 Сообщения чата
              <button
                onClick={loadData}
                className="ml-auto bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm transition-colors"
              >
                🔄 Обновить
              </button>
            </h2>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {messages.length === 0 ? (
                <p className="text-neutral-400">Нет сообщений</p>
              ) : (
                messages.map((message) => (
                  <div key={message.id} className="bg-neutral-800 p-3 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <span 
                          className="font-medium"
                          style={{ color: message.userColor }}
                        >
                          {message.nick}
                        </span>
                        <span className="text-xs text-neutral-400">
                          {formatDate(message.ts)}
                        </span>
                      </div>
                      <button
                        onClick={() => deleteMessage(message.id)}
                        className="bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-xs transition-colors"
                      >
                        🗑️ Удалить
                      </button>
                    </div>
                    <p className="text-sm text-neutral-200">{message.text}</p>
                    {message.reactions && Object.keys(message.reactions).length > 0 && (
                      <div className="flex gap-1 mt-2">
                        {Object.entries(message.reactions).map(([emoji, count]) => (
                          <span key={emoji} className="text-xs bg-neutral-700 px-2 py-1 rounded">
                            {emoji} {count}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Управление IP */}
          <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-6">
            <h2 className="text-xl font-bold mb-4">🚫 Управление IP</h2>
            
            {/* Форма блокировки */}
            <form onSubmit={blockIP} className="mb-6">
              <div className="mb-3">
                <input
                  type="text"
                  placeholder="IP адрес для блокировки"
                  value={newBlockIP}
                  onChange={(e) => setNewBlockIP(e.target.value)}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 outline-none focus:border-red-500"
                />
              </div>
              <div className="mb-3">
                <input
                  type="text"
                  placeholder="Причина блокировки (необязательно)"
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 outline-none focus:border-red-500"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-red-600 hover:bg-red-700 rounded-lg py-2 font-medium transition-colors"
              >
                🚫 Заблокировать IP
              </button>
            </form>

            {/* Список заблокированных IP */}
            <div>
              <h3 className="font-medium mb-3">Заблокированные IP:</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {blockedIPs.length === 0 ? (
                  <p className="text-neutral-400 text-sm">Нет заблокированных IP</p>
                ) : (
                  blockedIPs.map((blocked) => (
                    <div key={blocked.ip} className="bg-neutral-800 p-3 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-mono text-sm">{blocked.ip}</p>
                          <p className="text-xs text-neutral-400">{blocked.reason}</p>
                          <p className="text-xs text-neutral-500">
                            {formatDate(blocked.blocked_at)}
                          </p>
                        </div>
                        <button
                          onClick={() => unblockIP(blocked.ip)}
                          className="bg-green-600 hover:bg-green-700 px-2 py-1 rounded text-xs transition-colors"
                        >
                          ✅ Разблокировать
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

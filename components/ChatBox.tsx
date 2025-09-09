"use client";
import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
dayjs.extend(duration);
type Msg = { 
  id: string; 
  text: string; 
  nick: string; 
  ts: number; 
  reactions?: { [emoji: string]: number }; 
  isNew?: boolean;
  userColor?: string;
  userStatus?: string | { text: string; emoji: string; color: string; };
};

// Цвета для никнеймов
const USER_COLORS = [
  '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57',
  '#ff9ff3', '#54a0ff', '#5f27cd', '#00d2d3', '#ff9f43',
  '#10ac84', '#ee5a24', '#0984e3', '#6c5ce7', '#a29bfe',
  '#fd79a8', '#fdcb6e', '#e17055', '#81ecec', '#fab1a0'
];

// Статусы пользователей
const USER_STATUSES = [
  { text: 'на границе', emoji: '🚧', color: 'text-red-400' },
  { text: 'в очереди', emoji: '⏳', color: 'text-yellow-400' },
  { text: 'прошел', emoji: '✅', color: 'text-green-400' },
  { text: 'вернулся', emoji: '🔄', color: 'text-blue-400' },
  { text: 'ждет', emoji: '😴', color: 'text-purple-400' },
  { text: 'паникует', emoji: '😱', color: 'text-pink-400' },
  { text: 'готовится', emoji: '🎒', color: 'text-orange-400' },
  { text: 'размышляет', emoji: '🤔', color: 'text-indigo-400' }
];

// Функция для получения цвета пользователя по никнейму
function getUserColor(nick: string): string {
  let hash = 0;
  for (let i = 0; i < nick.length; i++) {
    hash = nick.charCodeAt(i) + ((hash << 5) - hash);
  }
  return USER_COLORS[Math.abs(hash) % USER_COLORS.length];
}

// Функция для получения случайного статуса
function getRandomStatus() {
  return USER_STATUSES[Math.floor(Math.random() * USER_STATUSES.length)];
}

// Мемоизированный компонент сообщения
const MessageItem = React.memo(({ 
  m, 
  getUserColor, 
  react 
}: { 
  m: Msg; 
  getUserColor: (nick: string) => string; 
  react: (msgId: string, emoji: string) => void;
}) => {
  const handleAnimationEnd = useCallback(() => {
    if (m.isNew) {
      // Убираем флаг isNew после анимации
      // Это будет обработано в родительском компоненте
    }
  }, [m.isNew]);

  return (
    <div
      className={`text-sm group hover:bg-muted/30 p-2 rounded-lg transition-all duration-300 ${
        m.isNew ? 'animate-slide-in-right bg-primary/10 border-l-4 border-primary' : ''
      }`}
      onAnimationEnd={handleAnimationEnd}
    >
      <div className="flex justify-between items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1 mb-1">
            <span className="text-muted-foreground text-xs">{new Date(m.ts).toLocaleTimeString()}</span>
            <span 
              className="font-medium"
              style={{ color: m.userColor || getUserColor(m.nick) }}
            >
              {m.nick}:
            </span>
            {m.userStatus && (
              <span className={`text-xs px-2 py-0.5 rounded-full bg-muted ${
                typeof m.userStatus === 'string' 
                  ? 'text-muted-foreground' 
                  : (m.userStatus?.color || 'text-muted-foreground')
              }`}>
                {typeof m.userStatus === 'string' 
                  ? `👤 ${m.userStatus}` 
                  : `${m.userStatus?.emoji || '👤'} ${m.userStatus?.text || m.userStatus}`
                }
              </span>
            )}
          </div>
          <div className="break-words">{m.text}</div>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex-shrink-0">
          <button
            onClick={() => react(m.id, "👍")}
            className="text-xs hover:scale-125 transition-transform px-1 py-0.5 rounded hover:bg-muted"
            title="Нравится"
          >
            👍
          </button>
          <button
            onClick={() => react(m.id, "😂")}
            className="text-xs hover:scale-125 transition-transform px-1 py-0.5 rounded hover:bg-muted"
            title="Смешно"
          >
            😂
          </button>
          <button
            onClick={() => react(m.id, "😮")}
            className="text-xs hover:scale-125 transition-transform px-1 py-0.5 rounded hover:bg-muted"
            title="Удивительно"
          >
            😮
          </button>
          <button
            onClick={() => react(m.id, "😢")}
            className="text-xs hover:scale-125 transition-transform px-1 py-0.5 rounded hover:bg-muted"
            title="Грустно"
          >
            😢
          </button>
        </div>
      </div>
      {m.reactions && Object.keys(m.reactions).length > 0 && (
        <div className="flex gap-1 mt-1 flex-wrap">
          {Object.entries(m.reactions).map(([emoji, count]) => (
            <button
              key={emoji}
              onClick={() => react(m.id, emoji)}
              className="text-xs bg-muted hover:bg-muted/80 px-1.5 py-0.5 rounded-full flex items-center gap-1 transition-colors animate-fade-in-up"
            >
              <span>{emoji}</span>
              <span>{count}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
});

export default function ChatBox() {
  const chatUrl = process.env.NEXT_PUBLIC_CHAT_URL!;
  const url = chatUrl?.startsWith('http') ? chatUrl : `https://${chatUrl}`;
  const [socket, setSocket] = useState<Socket | null>(null);
  const [ready, setReady] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [nick, setNick] = useState("Аноним");
  const [userStatus, setUserStatus] = useState(() => getRandomStatus());
  const listRef = useRef<HTMLDivElement>(null);
  const [lastSend, setLastSend] = useState(0);
  const [isConnecting, setIsConnecting] = useState(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  useEffect(() => {
    if (!url) {
      console.warn("NEXT_PUBLIC_CHAT_URL не установлен");
      setConnectionError("URL чата не настроен");
      setIsConnecting(false);
      return;
    }

    setIsConnecting(true);
    setConnectionError(null);

    const s = io(url, { 
      transports: ["websocket"],
      timeout: 10000,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });
    
    setSocket(s);
    
    s.on("connect", () => {
      setReady(true);
      setIsConnecting(false);
      setConnectionError(null);
    });
    
    s.on("connect_error", (error) => {
      console.error("Connection error:", error);
      setConnectionError("Ошибка подключения к чату");
      setIsConnecting(false);
    });
    
    s.on("disconnect", () => {
      setReady(false);
      setIsConnecting(true);
    });
    
    s.on("recent", (items: Msg[]) => {
      const itemsWithColors = items.map(item => ({
        ...item,
        userColor: item.userColor || getUserColor(item.nick),
        userStatus: item.userStatus || getRandomStatus()
      }));
      setMsgs(itemsWithColors);
    });
    
    s.on("msg", (item: Msg) => {
      const itemWithColor = {
        ...item,
        userColor: item.userColor || getUserColor(item.nick),
        userStatus: item.userStatus || getRandomStatus(),
        isNew: true
      };
      setMsgs(prev => [...prev, itemWithColor]);
    });
    
    s.on("reaction", (data: { msgId: string; emoji: string; count: number }) => {
      setMsgs(prev => prev.map(msg =>
        msg.id === data.msgId
          ? {
              ...msg,
              reactions: {
                ...msg.reactions,
                [data.emoji]: data.count
              }
            }
          : msg
      ));
    });
    
    s.on("messageDeleted", (data: { messageId: string }) => {
      setMsgs(prev => prev.filter(msg => msg.id !== data.messageId));
    });
    
    return () => {
      s.disconnect();
    };
  }, [url]);

  useEffect(() => {
    if (listRef.current) {
      const isNearBottom = listRef.current.scrollTop + listRef.current.clientHeight >= listRef.current.scrollHeight - 100;
      if (isNearBottom) {
        listRef.current.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
      }
    }
  }, [msgs.length]);

  function send() {
    const t = text.trim();
    if (!t) return;
    const now = Date.now();
    if (now - lastSend < 500) return; // простая защита от спама
    
    // Обработка команд
    if (t.startsWith('/')) {
      handleCommand(t);
      setText("");
      return;
    }
    
    socket?.emit("msg", { 
      text: t, 
      nick, 
      userColor: getUserColor(nick),
      userStatus: typeof userStatus === 'string' ? userStatus : userStatus.text
    });
    setLastSend(now);
    setText("");
  }

  function handleCommand(command: string) {
    const cmd = command.toLowerCase();
    
    if (cmd === '/help') {
      const helpText = `Доступные команды:
/help - показать это сообщение
/time - показать оставшееся время
/joke - случайная шутка про границы`;
      
      socket?.emit("msg", { 
        text: helpText, 
        nick: "Система", 
        userColor: "#ff6b6b",
        userStatus: "система"
      });
    } else if (cmd === '/time') {
      const deadlineIso = process.env.NEXT_PUBLIC_DEADLINE_ISO || "2025-01-01T00:00:00+02:00";
      const deadline = dayjs(deadlineIso);
      const now = dayjs();
      const diff = deadline.diff(now);
      const dur = dayjs.duration(Math.max(diff, 0));
      
      const timeText = diff <= 0 
        ? "Граница уже закрыта! 😱"
        : `До закрытия: ${Math.floor(dur.asDays())}д ${dur.hours()}ч ${dur.minutes()}м ${dur.seconds()}с`;
      
      socket?.emit("msg", { 
        text: timeText, 
        nick: "Система", 
        userColor: "#4ecdc4",
        userStatus: "система"
      });
    } else if (cmd === '/joke') {
      const jokes = [
        "Почему пограничники не играют в прятки? Потому что они всегда находят! 😄",
        "Что сказал чемодан пограничнику? 'Я просто проездом!' 🧳",
        "Почему граница не закрывается в полночь? Потому что она не Золушка! 🕛",
        "Что общего у границы и кота? Оба любят сидеть на пороге! 🐱",
        "Почему туристы не боятся границ? Потому что у них есть паспорт! 📘",
        "Что сказал паспорт на границе? 'Я не виноват, что я такой толстый!' 📖"
      ];
      
      const randomJoke = jokes[Math.floor(Math.random() * jokes.length)];
      
      socket?.emit("msg", { 
        text: randomJoke, 
        nick: "Система", 
        userColor: "#f6ad55",
        userStatus: "система"
      });
    } else {
      socket?.emit("msg", { 
        text: `Неизвестная команда: ${command}. Введите /help для списка команд.`, 
        nick: "Система", 
        userColor: "#fc8181",
        userStatus: "система"
      });
    }
  }

  const react = useCallback((msgId: string, emoji: string) => {
    socket?.emit("react", { msgId, emoji });
  }, [socket]);

  if (!url) {
    return (
      <div className="w-full max-w-2xl mx-auto p-4 text-center text-muted-foreground">
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 shadow-sm">
          <div className="text-destructive font-semibold mb-2">⚠️ Чат недоступен</div>
          <div className="text-sm">URL чата не настроен (NEXT_PUBLIC_CHAT_URL)</div>
        </div>
      </div>
    );
  }

  if (connectionError) {
    return (
      <div className="w-full max-w-2xl mx-auto p-4">
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-center shadow-sm">
          <div className="text-destructive font-semibold mb-2">❌ Ошибка подключения</div>
          <div className="text-sm text-muted-foreground mb-3">{connectionError}</div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-lg text-sm transition-colors shadow-sm"
          >
            🔄 Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto px-4 sm:px-0">
      <div className="text-sm text-muted-foreground flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span>Анонимный чат</span>
          {isConnecting && (
            <div className="flex items-center gap-1 text-xs text-accent-foreground">
              <div className="w-2 h-2 bg-accent-foreground rounded-full animate-pulse"></div>
              <span>Подключение...</span>
            </div>
          )}
          {ready && !isConnecting && (
            <div className="flex items-center gap-1 text-xs text-primary">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <span>Подключен</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span 
            className="text-xs font-medium"
            style={{ color: getUserColor(nick) }}
          >
            {nick}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full bg-muted ${userStatus.color}`}>
            {userStatus.emoji} {userStatus.text}
          </span>
        </div>
      </div>
      <div ref={listRef} className="h-64 sm:h-72 overflow-y-auto rounded-2xl bg-card p-3 space-y-2 border border-border shadow-sm">
        {msgs.map(m => (
          <MessageItem
            key={m.id}
            m={m}
            getUserColor={getUserColor}
            react={react}
          />
        ))}
        {msgs.length === 0 && <div className="text-muted-foreground">Тишина на границе</div>}
      </div>
      <div className="mt-3 space-y-3">
        {/* Поле для никнейма и статуса */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              className="flex-1 bg-input border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring transition-colors shadow-sm"
              placeholder="Ваш ник (необязательно)"
              value={nick}
              onChange={e => setNick(e.target.value)}
            />
            <select
              className="bg-input border border-border rounded-xl px-3 py-2 text-sm min-w-0 outline-none focus:border-ring focus:ring-1 focus:ring-ring transition-colors shadow-sm"
              value={typeof userStatus === 'string' ? userStatus : userStatus.text}
              onChange={e => {
                const status = USER_STATUSES.find(s => s.text === e.target.value);
                if (status) setUserStatus(status);
              }}
            >
              {USER_STATUSES.map(status => (
                <option key={status.text} value={status.text}>
                  {status.emoji} {status.text}
                </option>
              ))}
            </select>
          </div>
          <div className="text-xs text-muted-foreground text-center">
            Выберите свой статус на границе
          </div>
        </div>
        
        {/* Поле для сообщения и кнопка отправки */}
        <div className="flex gap-2">
          <input
            className="flex-1 bg-input border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring transition-colors shadow-sm"
            placeholder="Напишите сообщение..."
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === "Enter" && send()}
          />
          <button
            className={`px-3 py-2 rounded-xl font-medium transition-all duration-200 text-sm flex-shrink-0 shadow-sm ${
              ready && text.trim()
                ? 'bg-primary hover:bg-primary/90 text-primary-foreground hover-lift'
                : 'bg-muted text-muted-foreground cursor-not-allowed'
            }`}
            onClick={send}
            disabled={!ready || !text.trim()}
          >
            <span className="hidden sm:inline">{ready ? '🚀 Отправить' : 'Подключение...'}</span>
            <span className="sm:hidden">{ready ? '🚀' : '⏳'}</span>
          </button>
        </div>
      </div>
      {/* Дополнительная кнопка отправки для мобильных */}
      <div className="mt-3 sm:hidden">
        <button
          className={`w-full py-3 rounded-xl font-medium transition-all duration-200 shadow-sm ${
            ready && text.trim()
              ? 'bg-primary hover:bg-primary/90 text-primary-foreground hover-lift'
              : 'bg-muted text-muted-foreground cursor-not-allowed'
          }`}
          onClick={send}
          disabled={!ready || !text.trim()}
        >
          {ready ? '🚀 Отправить сообщение' : '⏳ Подключение...'}
        </button>
      </div>
      
      <div className="mt-2 text-xs text-muted-foreground text-center space-y-1">
        <div>Просьба не публиковать персональные данные и призывы к нарушению закона</div>
      </div>
    </div>
  );
}

"use client";
import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import dayjs from "dayjs";

// Компонент-обертка для предотвращения проблем с гидратацией
function ClientOnly({ children }: { children: React.ReactNode }) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return (
      <div className="w-full max-w-2xl mx-auto p-4 text-center text-muted-foreground">
        <div className="bg-muted/10 border border-border rounded-lg p-4 shadow-sm">
          <div className="text-muted-foreground font-semibold mb-2">⏳ Загрузка чата...</div>
          <div className="text-sm">Инициализация компонента</div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

type Msg = {
  id: string;
  text: string;
  nick: string;
  ts: number;
  reactions?: { [emoji: string]: number };
  isNew?: boolean;
  userColor?: string;
  userStatus?: string | { text: string; emoji: string; color: string; };
  flagged?: boolean;
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

// Небольшой список стоп-слов для мягкой фильтрации
const STOP_WORDS = [
  'дурак', 'идиот', 'тупой', 'сука', 'мразь', 'сволочь', 'ублюдок', 'ненавижу'
];

function maskStopwords(text: string): string {
  return STOP_WORDS.reduce((acc, word) => {
    const re = new RegExp(`\\b${word}\\b`, 'gi');
    return acc.replace(re, (m) => m[0] + '***');
  }, text);
}

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
  react,
  report
}: {
  m: Msg;
  getUserColor: (nick: string) => string;
  react: (msgId: string, emoji: string) => void;
  report: (msg: Msg) => void;
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
        <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex-shrink-0">
          <button
            onClick={() => react(m.id, "👍")}
            className="text-xs hover:scale-125 transition-transform px-2 py-1 sm:px-1 sm:py-0.5 rounded hover:bg-muted touch-manipulation"
            title="Нравится"
          >
            👍
          </button>
          <button
            onClick={() => react(m.id, "😂")}
            className="text-xs hover:scale-125 transition-transform px-2 py-1 sm:px-1 sm:py-0.5 rounded hover:bg-muted touch-manipulation"
            title="Смешно"
          >
            😂
          </button>
          <button
            onClick={() => react(m.id, "😮")}
            className="text-xs hover:scale-125 transition-transform px-2 py-1 sm:px-1 sm:py-0.5 rounded hover:bg-muted touch-manipulation"
            title="Удивительно"
          >
            😮
          </button>
          <button
            onClick={() => react(m.id, "😢")}
            className="text-xs hover:scale-125 transition-transform px-2 py-1 sm:px-1 sm:py-0.5 rounded hover:bg-muted touch-manipulation"
            title="Грустно"
          >
            😢
          </button>
          <button
            onClick={() => report(m)}
            className="text-xs px-2 py-1 sm:px-1 sm:py-0.5 rounded hover:bg-destructive/10 border border-destructive/20 text-destructive touch-manipulation"
            title="Пожаловаться"
          >
            ⚑
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

function ChatBoxInner() {
  const [ready, setReady] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [nick, setNick] = useState("Аноним");
  const [userStatus, setUserStatus] = useState<{ text: string; emoji: string; color: string; } | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const [lastSend, setLastSend] = useState(0);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Состояние для пагинации
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [oldestMessageId, setOldestMessageId] = useState<string | null>(null);
  const [allMessages, setAllMessages] = useState<Msg[]>([]);
  const [displayedMessages, setDisplayedMessages] = useState<Msg[]>([]);

  // Максимальное количество сообщений для отображения (для производительности)
  const MAX_DISPLAYED_MESSAGES = 100;

  // Мемоизированная функция для получения цвета пользователя
  const getUserColorMemo = useCallback((nick: string): string => {
    return getUserColor(nick);
  }, []);

  // Инициализация после монтирования компонента
  useEffect(() => {
    setIsMounted(true);

    // Восстанавливаем данные из localStorage только на клиенте
    try {
      const savedStatus = localStorage.getItem('ctg-status');
      if (savedStatus) {
        const found = USER_STATUSES.find(s => s.text === savedStatus);
        if (found) {
          setUserStatus(found);
        } else {
          setUserStatus(getRandomStatus());
        }
      } else {
        setUserStatus(getRandomStatus());
      }

      const savedNick = localStorage.getItem('ctg-nick');
      if (savedNick) {
        setNick(savedNick);
      }
    } catch {
      setUserStatus(getRandomStatus());
    }
  }, []);

  useEffect(() => {
    // Сохраняем в localStorage только после монтирования
    if (isMounted) {
      try {
        if (userStatus && typeof userStatus !== 'string') {
          localStorage.setItem('ctg-status', userStatus.text);
        }
        localStorage.setItem('ctg-nick', nick);
      } catch {}
    }
  }, [userStatus, nick, isMounted]);

  // Загрузка сообщений при первом взаимодействии
  useEffect(() => {
    if (!isMounted) return;

    console.log('🔧 ChatBox: Начинаем настройку обработчиков взаимодействия');

    // Автоматическая загрузка через 2 секунды (если пользователь не взаимодействует)
    const autoLoadTimeout = setTimeout(() => {
      console.log('🔧 ChatBox: Автоматическая загрузка через таймаут');
      onFirstInteraction();
    }, 2000);

    const onFirstInteraction = async () => {
      console.log('🔧 ChatBox: Первое взаимодействие пользователя, загружаем сообщения');
      clearTimeout(autoLoadTimeout); // Очищаем автоматический таймер
      setIsConnecting(true);
      setConnectionError(null);

      try {
        console.log('🔧 ChatBox: Пробуем основной API');
        // Сначала пробуем основной API (Supabase)
        let response = await fetch('/api/chat?action=recent&limit=20');

        // Если основной API не работает, используем простой
        if (!response.ok) {
          console.log('🔧 ChatBox: Основной API не работает (статус:', response.status, '), переключаемся на простой');
          response = await fetch('/api/chat-simple?action=recent&limit=20');
        }

        if (!response.ok) {
          throw new Error(`Не удалось загрузить сообщения (статус: ${response.status})`);
        }

        const messages = await response.json();
        console.log('🔧 ChatBox: Получено сообщений:', messages.length);
        const messagesWithColors = messages.map((item: any) => ({
          ...item,
          userColor: item.userColor || getUserColorMemo(item.nick),
          userStatus: item.userStatus || { text: 'на границе', emoji: '🚧', color: 'text-red-400' }
        }));

        // Сортируем сообщения по времени (новые вверху)
        const sortedMessages = messagesWithColors.sort((a: Msg, b: Msg) => b.ts - a.ts);
        setAllMessages(sortedMessages);
        // Показываем только последние сообщения для быстрой загрузки
        const recentMessages = sortedMessages.slice(0, 20);
        setDisplayedMessages(recentMessages);

        // Устанавливаем ID самого старого сообщения для пагинации
        if (messagesWithColors.length > 0) {
          const oldestMsg = messagesWithColors.reduce((oldest: Msg, current: Msg) =>
            current.ts < oldest.ts ? current : oldest
          );
          setOldestMessageId(oldestMsg.id);
          setHasMoreMessages(messagesWithColors.length >= 20);
        }

        console.log('🔧 ChatBox: Сообщения загружены успешно, устанавливаем состояние');
        setReady(true);
        setIsConnecting(false);
      } catch (error) {
        console.error('🔧 ChatBox: Ошибка загрузки сообщений:', error);
        setConnectionError('Ошибка загрузки сообщений');
        setIsConnecting(false);
      }

      window.removeEventListener('pointerdown', onFirstInteraction);
      window.removeEventListener('keydown', onFirstInteraction);
    };

    window.addEventListener('pointerdown', onFirstInteraction, { once: true });
    window.addEventListener('keydown', onFirstInteraction, { once: true });

    return () => {
      clearTimeout(autoLoadTimeout);
      window.removeEventListener('pointerdown', onFirstInteraction);
      window.removeEventListener('keydown', onFirstInteraction);
    };
  }, [isMounted, getUserColorMemo]);

  useEffect(() => {
    if (listRef.current) {
      const isNearTop = listRef.current.scrollTop <= 100;
      if (isNearTop) {
        listRef.current.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  }, [displayedMessages.length]);

  // Функция для загрузки старых сообщений
  const loadOlderMessages = useCallback(async () => {
    if (isLoadingMore || !hasMoreMessages || !oldestMessageId) {
      return;
    }

    setIsLoadingMore(true);
    try {
      // Сначала пробуем основной API (Supabase)
      let response = await fetch(`/api/chat?action=older&beforeId=${oldestMessageId}&limit=20`);

      // Если основной API не работает, используем простой
      if (!response.ok) {
        console.log('Основной API не работает, переключаемся на простой...');
        response = await fetch(`/api/chat-simple?action=older&beforeId=${oldestMessageId}&limit=20`);
      }

      if (!response.ok) {
        throw new Error('Не удалось загрузить старые сообщения');
      }

      const messages = await response.json();
      const messagesWithColors = messages.map((item: any) => ({
        ...item,
        userColor: item.userColor || getUserColorMemo(item.nick),
        userStatus: item.userStatus || { text: 'на границе', emoji: '🚧', color: 'text-red-400' }
      }));

      setAllMessages(prev => {
        // Добавляем старые сообщения в начало списка
        const combined = [...messagesWithColors, ...prev];
        // Сортируем по времени (новые вверху)
        return combined.sort((a, b) => b.ts - a.ts);
      });

      setDisplayedMessages(prev => {
        // Добавляем старые сообщения в конец списка (так как новые теперь вверху)
        const combined = [...prev, ...messagesWithColors];
        // Сортируем по времени (новые вверху) и ограничиваем количество
        return combined.sort((a, b) => b.ts - a.ts).slice(0, MAX_DISPLAYED_MESSAGES);
      });

      setIsLoadingMore(false);

      // Обновляем состояние пагинации
      if (messagesWithColors.length > 0) {
        const oldestMsg = messagesWithColors.reduce((oldest: Msg, current: Msg) =>
          current.ts < oldest.ts ? current : oldest
        );
        setOldestMessageId(oldestMsg.id);
        setHasMoreMessages(messagesWithColors.length >= 20);
      } else {
        setHasMoreMessages(false);
      }
    } catch (error) {
      console.error('Ошибка загрузки старых сообщений:', error);
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMoreMessages, oldestMessageId, getUserColorMemo]);

  // Обработчик скролла для автоматической загрузки старых сообщений
  useEffect(() => {
    const listElement = listRef.current;
    if (!listElement) return;

    const handleScroll = () => {
      // Если пользователь прокрутил в самый низ и есть еще сообщения
      if (listElement.scrollTop + listElement.clientHeight >= listElement.scrollHeight - 5 && hasMoreMessages && !isLoadingMore) {
        loadOlderMessages();
      }
    };

    listElement.addEventListener('scroll', handleScroll);
    return () => listElement.removeEventListener('scroll', handleScroll);
  }, [hasMoreMessages, isLoadingMore, loadOlderMessages]);

  // Автоматическое изменение высоты textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const newHeight = Math.min(textareaRef.current.scrollHeight, 200);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, [text]);

  const send = useCallback(async () => {
    const t = text.trim();
    if (!t || !ready) return;
    const now = Date.now();
    if (now - lastSend < 500) return; // простая защита от спама

    // Обработка команд
    if (t.startsWith('/')) {
      handleCommand(t);
      setText("");
      return;
    }

    const filtered = maskStopwords(t);

    try {
      // Сначала пробуем основной API (Supabase)
      let response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send',
          text: filtered,
          nick,
          ts: now,
          reactions: {},
          userColor: getUserColorMemo(nick),
          userStatus: userStatus ? userStatus.text : 'на границе'
        })
      });

      // Если основной API не работает, используем простой
      if (!response.ok) {
        console.log('Основной API не работает, переключаемся на простой...');
        response = await fetch('/api/chat-simple', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'send',
            text: filtered,
            nick,
            ts: now,
            reactions: {},
            userColor: getUserColorMemo(nick),
            userStatus: userStatus ? userStatus.text : 'на границе'
          })
        });
      }

      if (!response.ok) {
        throw new Error('Не удалось отправить сообщение');
      }

      const savedMessage = await response.json();

      // Добавляем новое сообщение в список
      const newMessageWithColor = {
        ...savedMessage,
        userColor: savedMessage.userColor || getUserColorMemo(savedMessage.nick),
        userStatus: savedMessage.userStatus || { text: 'на границе', emoji: '🚧', color: 'text-red-400' },
        isNew: true
      };

      setAllMessages(prev => [newMessageWithColor, ...prev]);
      setDisplayedMessages(prev => {
        const updated = [newMessageWithColor, ...prev];
        // Ограничиваем количество отображаемых сообщений (новые вверху)
        return updated.slice(0, MAX_DISPLAYED_MESSAGES);
      });

      setLastSend(now);
      setText("");
    } catch (error) {
      console.error('Ошибка отправки сообщения:', error);
      setConnectionError('Ошибка отправки сообщения');
    }
  }, [text, ready, lastSend, nick, userStatus, getUserColorMemo]);

  function handleCommand(command: string) {
    const cmd = command.toLowerCase();

    if (cmd === '/help') {
      const helpText = `Доступные команды:
/help - показать это сообщение
/time - показать оставшееся время
/joke - случайная шутка про границы`;

      addSystemMessage(helpText, "Система", "#ff6b6b");
    } else if (cmd === '/time') {
      const deadlineIso = process.env.NEXT_PUBLIC_DEADLINE_ISO || "2025-01-01T00:00:00+02:00";
      const deadline = dayjs(deadlineIso);
      const now = dayjs();
      const diff = deadline.diff(now);
      const dur = dayjs.duration(Math.max(diff, 0));

      const timeText = diff <= 0
        ? "Граница уже закрыта! 😱"
        : `До закрытия: ${Math.floor(dur.asDays())}д ${dur.hours()}ч ${dur.minutes()}м ${dur.seconds()}с`;

      addSystemMessage(timeText, "Система", "#4ecdc4");
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
      addSystemMessage(randomJoke, "Система", "#f6ad55");
    } else {
      addSystemMessage(`Неизвестная команда: ${command}. Введите /help для списка команд.`, "Система", "#fc8181");
    }
  }

  const addSystemMessage = (text: string, nick: string, color: string) => {
    const systemMessage = {
      id: `system-${Date.now()}`,
      text,
      nick,
      ts: Date.now(),
      reactions: {},
      userColor: color,
      userStatus: "система"
    };

    setAllMessages(prev => [systemMessage, ...prev]);
    setDisplayedMessages(prev => {
      const updated = [systemMessage, ...prev];
      return updated.slice(0, MAX_DISPLAYED_MESSAGES);
    });
  };

  const react = useCallback(async (msgId: string, emoji: string) => {
    if (!ready) return;

    try {
      // Сначала пробуем основной API (Supabase)
      let response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'react',
          messageId: msgId,
          emoji: emoji
        })
      });

      // Если основной API не работает, используем простой
      if (!response.ok) {
        console.log('Основной API не работает, переключаемся на простой...');
        response = await fetch('/api/chat-simple', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'react',
            messageId: msgId,
            emoji: emoji
          })
        });
      }

      if (!response.ok) {
        throw new Error('Не удалось добавить реакцию');
      }

      const result = await response.json();

      // Обновляем реакции в сообщениях
      const updateReactions = (messages: Msg[]) => messages.map(msg =>
        msg.id === msgId
          ? {
              ...msg,
              reactions: {
                ...msg.reactions,
                [emoji]: result.count
              }
            }
          : msg
      );

      setAllMessages(updateReactions);
      setDisplayedMessages(updateReactions);
    } catch (error) {
      console.error('Ошибка добавления реакции:', error);
    }
  }, [ready]);

  const REPORT_ENDPOINT = "/api/report";

  const report = useCallback(async (m: Msg) => {
    try {
      await fetch(REPORT_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: m.id, text: m.text, nick: m.nick, ts: m.ts })
      });

      const updateFlagged = (messages: Msg[]) => messages.map(x => x.id === m.id ? { ...x, flagged: true } : x);
      setAllMessages(updateFlagged);
      setDisplayedMessages(updateFlagged);
    } catch {}
  }, []);

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
    <div className="w-full max-w-2xl mx-auto px-2 sm:px-4 md:px-0">
      <div className="text-sm text-muted-foreground flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span>Анонимный чат</span>
          {displayedMessages.length > 0 && (
            <span className="text-xs text-muted-foreground">
              ({displayedMessages.length} сообщений{hasMoreMessages ? '+' : ''})
            </span>
          )}
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
            style={{ color: getUserColorMemo(nick) }}
          >
            {nick}
          </span>
          {userStatus && (
            <span className={`text-xs px-2 py-0.5 rounded-full bg-muted ${userStatus.color}`}>
              {userStatus.emoji} {userStatus.text}
            </span>
          )}
        </div>
      </div>
      <div ref={listRef} className="h-80 sm:h-72 md:h-80 overflow-y-auto rounded-2xl bg-card p-3 space-y-2 border border-border shadow-sm">
        {displayedMessages.map(m => (
          <MessageItem
            key={m.id}
            m={m}
            getUserColor={getUserColorMemo}
            react={react}
            report={report}
          />
        ))}
        {displayedMessages.length === 0 && <div className="text-muted-foreground">Тишина на границе</div>}

        {/* Кнопка загрузки старых сообщений */}
        {hasMoreMessages && (
          <div className="flex justify-center py-2">
            <button
              onClick={loadOlderMessages}
              disabled={isLoadingMore}
              className="px-4 py-2 text-xs bg-muted hover:bg-muted/80 text-muted-foreground rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoadingMore ? (
                <>
                  <div className="w-3 h-3 border border-muted-foreground border-t-transparent rounded-full animate-spin"></div>
                  <span>Загрузка...</span>
                </>
              ) : (
                <>
                  <span>📜</span>
                  <span>Загрузить старые сообщения</span>
                </>
              )}
            </button>
          </div>
        )}
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
              value={userStatus ? userStatus.text : ''}
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

        {/* Единый стиль ввода: поле и кнопка в одном контейнере */}
        <div className="flex items-end bg-input border border-border rounded-xl shadow-sm focus-within:border-ring focus-within:ring-1 focus-within:ring-ring transition-all">
          <textarea
            ref={textareaRef}
            rows={2}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Напишите сообщение..."
            disabled={!ready}
            className="flex-1 resize-none bg-transparent px-3 py-2 text-sm outline-none disabled:opacity-50 border-0 focus:ring-0"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
          />
          <button
            type="button"
            onClick={send}
            disabled={!ready || !text.trim()}
            className="px-4 py-3 sm:px-3 sm:py-2 m-1 rounded-lg bg-destructive hover:bg-destructive/90 text-destructive-foreground text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1 min-w-[90px] sm:min-w-[80px] touch-manipulation"
          >
            <span>Отправить</span>
            <span className="text-xs">📤</span>
          </button>
        </div>
      </div>

      <div className="mt-2 text-xs text-muted-foreground text-center space-y-1">
        <div>Просьба не публиковать персональные данные и призывы к нарушению закона</div>
      </div>
    </div>
  );
}

export default function ChatBox() {
  return (
    <ClientOnly>
      <ChatBoxInner />
    </ClientOnly>
  );
}
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
  parentId?: string; // ID главного сообщения, если это ответ
  replies?: Msg[]; // Массив ответов на это сообщение
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

// Дефолтный статус пользователя
const DEFAULT_USER_STATUS = { text: 'размышляет', emoji: '🤔', color: 'text-indigo-400' };

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

// Функция для группировки сообщений по главным сообщениям и ответам
function groupMessagesWithReplies(messages: Msg[]): Msg[] {
  const messageMap = new Map<string, Msg>();
  const rootMessages: Msg[] = [];

  // Сначала создаем карту всех сообщений
  messages.forEach(msg => {
    messageMap.set(msg.id, { ...msg, replies: [] });
  });

  // Затем группируем ответы под главными сообщениями
  messages.forEach(msg => {
    if (msg.parentId) {
      // Это ответ на другое сообщение
      const parent = messageMap.get(msg.parentId);
      if (parent) {
        parent.replies = parent.replies || [];
        parent.replies.push(messageMap.get(msg.id)!);
      }
    } else {
      // Это главное сообщение
      rootMessages.push(messageMap.get(msg.id)!);
    }
  });

  // Сортируем главные сообщения по времени (новые вверху)
  rootMessages.sort((a, b) => b.ts - a.ts);

  // Сортируем ответы внутри каждого главного сообщения
  rootMessages.forEach(msg => {
    if (msg.replies && msg.replies.length > 0) {
      msg.replies.sort((a, b) => a.ts - b.ts); // Ответы в хронологическом порядке
    }
  });

  return rootMessages;
}

// Компонент для отображения ответа
const ReplyItem = React.memo(({
  reply,
  getUserColor,
  react,
  onReply
}: {
  reply: Msg;
  getUserColor: (nick: string) => string;
  react: (msgId: string, emoji: string) => void;
  onReply: (msg: Msg) => void;
}) => {
  console.log('🔧 Рендерим ответ:', reply.id, reply.text);
  return (
    <div className="ml-4 mt-2 p-2 bg-muted/20 border-l-2 border-primary/30 rounded-r-md">
      <div className="flex justify-between items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1 mb-1">
            <span className="text-muted-foreground text-xs">{new Date(reply.ts).toLocaleTimeString()}</span>
            <span
              className="font-medium text-sm"
              style={{ color: reply.userColor || getUserColor(reply.nick) }}
            >
              {reply.nick}:
            </span>
            {reply.userStatus && (
              <span className={`text-xs px-2 py-0.5 rounded-full bg-muted ${
                typeof reply.userStatus === 'string'
                  ? 'text-muted-foreground'
                  : (reply.userStatus?.color || 'text-muted-foreground')
              }`}>
                {typeof reply.userStatus === 'string'
                  ? `👤 ${reply.userStatus}`
                  : `${reply.userStatus?.emoji || '👤'} ${reply.userStatus?.text || reply.userStatus}`
                }
              </span>
            )}
          </div>
          <div className="break-words text-sm">{reply.text}</div>
        </div>
        <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex-shrink-0">
          <button
            onClick={() => onReply(reply)}
            className="text-xs hover:scale-125 transition-transform px-1 py-0.5 rounded hover:bg-muted touch-manipulation"
            title="Ответить"
          >
            💬
          </button>
          <button
            onClick={() => react(reply.id, "👍")}
            className="text-xs hover:scale-125 transition-transform px-1 py-0.5 rounded hover:bg-muted touch-manipulation"
            title="Нравится"
          >
            👍
          </button>
          <button
            onClick={() => react(reply.id, "😂")}
            className="text-xs hover:scale-125 transition-transform px-1 py-0.5 rounded hover:bg-muted touch-manipulation"
            title="Смешно"
          >
            😂
          </button>
        </div>
      </div>
      {reply.reactions && Object.keys(reply.reactions).length > 0 && (
        <div className="flex gap-1 mt-1 flex-wrap">
          {Object.entries(reply.reactions).map(([emoji, count]) => (
            <button
              key={emoji}
              onClick={() => react(reply.id, emoji)}
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

// Мемоизированный компонент сообщения
const MessageItem = React.memo(({
  m,
  getUserColor,
  react,
  onReply,
  createTestReply
}: {
  m: Msg;
  getUserColor: (nick: string) => string;
  react: (msgId: string, emoji: string) => void;
  onReply: (msg: Msg) => void;
  createTestReply: (msg: Msg) => void;
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
            onClick={() => {
              console.log('🔧 Кнопка ответа нажата для сообщения:', m.id);
              onReply(m);
            }}
            className="text-xs hover:scale-125 transition-transform px-2 py-1 sm:px-1 sm:py-0.5 rounded hover:bg-muted touch-manipulation"
            title="Ответить"
            style={{ backgroundColor: 'rgba(0,255,0,0.1)' }}
          >
            💬
          </button>
          <button
            onClick={() => createTestReply(m)}
            className="text-xs hover:scale-125 transition-transform px-2 py-1 sm:px-1 sm:py-0.5 rounded hover:bg-muted touch-manipulation"
            title="Тестовый ответ"
            style={{ backgroundColor: 'rgba(255,0,0,0.1)' }}
          >
            🧪
          </button>
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
      
      {/* Отображение ответов */}
      {m.replies && m.replies.length > 0 && (
        <div className="mt-2">
          <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
            <span>💬</span>
            <span>{m.replies.length} {m.replies.length === 1 ? 'ответ' : m.replies.length < 5 ? 'ответа' : 'ответов'}</span>
          </div>
          <div className="space-y-1">
            {m.replies.map((reply) => {
              console.log('🔧 Рендерим ответы для сообщения', m.id, ':', m.replies?.length, 'ответов');
              return (
              <ReplyItem
                key={reply.id}
                reply={reply}
                getUserColor={getUserColor}
                react={react}
                onReply={onReply}
              />
              );
            })}
          </div>
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
  const [userStatus, setUserStatus] = useState<{ text: string; emoji: string; color: string; } | null>(DEFAULT_USER_STATUS);
  const [isMounted, setIsMounted] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const [lastSend, setLastSend] = useState(0);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [replyingTo, setReplyingTo] = useState<Msg | null>(null);

  // Функция для автоматического изменения высоты textarea
  const adjustTextareaHeight = useCallback(() => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      
      // Сохраняем текущий фокус и позицию курсора
      const isFocused = document.activeElement === textarea;
      const cursorPosition = textarea.selectionStart;
      
      // Сбрасываем высоту для правильного расчета
      textarea.style.height = 'auto';
      
      // Получаем размеры
      const scrollHeight = textarea.scrollHeight;
      const minHeight = window.innerWidth < 640 ? 48 : 52;
      const maxHeight = 120;
      const newHeight = Math.min(Math.max(scrollHeight, minHeight), maxHeight);
      
      // Устанавливаем новую высоту
      textarea.style.height = `${newHeight}px`;
      
      // Восстанавливаем фокус и позицию курсора
      if (isFocused) {
        textarea.focus();
        textarea.setSelectionRange(cursorPosition, cursorPosition);
      }
    }
  }, []);

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

  // Инициализация высоты textarea
  useEffect(() => {
    adjustTextareaHeight();
  }, [adjustTextareaHeight]);

  // Предотвращаем масштабирование при фокусе на input
  useEffect(() => {
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        // Предотвращаем масштабирование на мобильных устройствах
        const viewport = document.querySelector('meta[name="viewport"]');
        if (viewport) {
          viewport.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover');
        }
      }
    };

    const handleFocusOut = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        // Восстанавливаем нормальный viewport
        const viewport = document.querySelector('meta[name="viewport"]');
        if (viewport) {
          viewport.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover');
        }
      }
    };

    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);

    return () => {
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
    };
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
          setUserStatus(DEFAULT_USER_STATUS);
        }
      }

      const savedNick = localStorage.getItem('ctg-nick');
      if (savedNick) {
        setNick(savedNick);
      }
    } catch {
      setUserStatus(DEFAULT_USER_STATUS);
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
        console.log('🔧 ChatBox: Загружаем сообщения из локального API');
        
        // Сначала пробуем основной локальный API
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
        console.log('🔧 ChatBox: Первое сообщение:', messages[0]);
        
        const messagesWithColors = messages.map((item: any) => ({
          ...item,
          userColor: item.userColor || getUserColorMemo(item.nick),
          userStatus: item.userStatus || { text: 'на границе', emoji: '🚧', color: 'text-red-400' }
        }));
        
        console.log('🔧 ChatBox: Сообщения с цветами:', messagesWithColors.length);

        // Группируем сообщения по главным сообщениям и ответам
        const groupedMessages = groupMessagesWithReplies(messagesWithColors);
        setAllMessages(groupedMessages);
        // Показываем только последние сообщения для быстрой загрузки
        const recentMessages = groupedMessages.slice(0, 20);
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
        console.log('🔧 ChatBox: Группированные сообщения:', groupedMessages.length);
        console.log('🔧 ChatBox: Отображаемые сообщения:', recentMessages.length);
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
      // Сначала пробуем основной локальный API
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
      adjustTextareaHeight();
      return;
    }

    const filtered = maskStopwords(t);

    // Если это ответ, обрабатываем локально
    if (replyingTo) {
      console.log('🔧 Отправляем ответ на сообщение:', replyingTo.id);
      
      // Создаем ответ локально без отправки на сервер
      const newReply = {
        id: `reply-${Date.now()}-${Math.random()}`, // Временный ID
        text: filtered,
        nick,
        ts: now,
        reactions: {},
        userColor: getUserColorMemo(nick),
        userStatus: userStatus ? userStatus.text : 'на границе',
        isNew: true
      };

      console.log('🔧 Создан новый ответ:', newReply);

      // Обновляем только локальный state
      const updateMessagesWithReply = (messages: Msg[]) => {
        return messages.map(msg => {
          if (msg.id === replyingTo.id) {
            console.log('🔧 Добавляем ответ к сообщению:', msg.id);
            return {
              ...msg,
              replies: [...(msg.replies || []), newReply]
            };
          }
          return msg;
        });
      };

      setAllMessages(updateMessagesWithReply);
      setDisplayedMessages(updateMessagesWithReply);
      
      setLastSend(now);
      setText("");
      setReplyingTo(null);
      adjustTextareaHeight();
      return; // Выходим, не отправляя на сервер
    }

    // Для главных сообщений отправляем на сервер как обычно
    try {
      // Сначала пробуем основной локальный API
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

      // Это главное сообщение - добавляем как обычно (ответы обрабатываются выше)
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
      setReplyingTo(null); // Очищаем состояние ответа
      adjustTextareaHeight();
    } catch (error) {
      console.error('Ошибка отправки сообщения:', error);
      setConnectionError('Ошибка отправки сообщения');
    }
  }, [text, ready, lastSend, nick, userStatus, getUserColorMemo, adjustTextareaHeight, replyingTo]);

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
      // Сначала пробуем основной локальный API
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

  const handleReply = useCallback((msg: Msg) => {
    console.log('🔧 Выбрано сообщение для ответа:', msg.id, msg.text);
    alert(`Ответ на сообщение: ${msg.text.substring(0, 50)}...`);
    setReplyingTo(msg);
    // Фокусируемся на поле ввода
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  // Функция для создания тестового ответа
  const createTestReply = useCallback((msg: Msg) => {
    const testReply = {
      id: `test-reply-${Date.now()}`,
      text: `Тестовый ответ на: ${msg.text.substring(0, 30)}...`,
      nick: 'Тестер',
      ts: Date.now(),
      reactions: {},
      userColor: '#ff6b6b',
      userStatus: 'тестирует',
      isNew: true
    };

    const updateMessagesWithReply = (messages: Msg[]) => {
      return messages.map(m => {
        if (m.id === msg.id) {
          return {
            ...m,
            replies: [...(m.replies || []), testReply]
          };
        }
        return m;
      });
    };

    setAllMessages(updateMessagesWithReply);
    setDisplayedMessages(updateMessagesWithReply);
    console.log('🔧 Создан тестовый ответ:', testReply);
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
    <div className="w-full max-w-2xl mx-auto px-2 sm:px-4 md:px-0 space-y-3 sm:space-y-4">
      <div ref={listRef} className="h-[28rem] sm:h-80 md:h-96 overflow-y-auto rounded-2xl bg-card p-2 sm:p-3 space-y-2 border border-border shadow-sm">
        {displayedMessages.map(m => (
          <MessageItem
            key={m.id}
            m={m}
            getUserColor={getUserColorMemo}
            react={react}
            onReply={handleReply}
            createTestReply={createTestReply}
          />
        ))}
        {displayedMessages.length === 0 && !isConnecting && (
          <div className="text-muted-foreground text-center py-4">
            <div>Тишина на границе</div>
            <div className="text-xs mt-2 opacity-60">
              Готов: {ready ? '✅' : '❌'} | Сообщений: {displayedMessages.length} | Загрузка: {isConnecting ? '🔄' : '⏸️'}
            </div>
          </div>
        )}

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
                  <span>ЗАГРУЗИТЬ СТАРЫЕ</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
      <div className="space-y-3 sm:space-y-4">
        {/* Поле для никнейма и статуса */}
        <div className="space-y-2 sm:space-y-3">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <input
              className="flex-1 bg-input border border-border rounded-xl px-3 py-2 sm:py-2.5 text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring transition-colors shadow-sm"
              placeholder="Ваш ник (необязательно)"
              value={nick}
              onChange={e => setNick(e.target.value)}
              style={{ fontSize: '16px' }}
            />
            <select
              className="bg-input border border-border rounded-xl px-3 py-2 sm:py-2.5 text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring transition-colors shadow-sm sm:min-w-[200px]"
              style={{ fontSize: '16px' }}
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

        {/* Отображение выбранного сообщения для ответа */}
        {replyingTo && (
          <div className="bg-muted/30 border border-border rounded-lg p-3 mb-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <span>↳</span>
                  <span>Ответ на сообщение от {replyingTo.nick}:</span>
                </div>
                <div className="text-sm text-muted-foreground/80 truncate">
                  {replyingTo.text}
                </div>
                <div className="text-xs text-primary mt-1">
                  💡 Ответ будет добавлен под главным сообщением
                </div>
              </div>
              <button
                onClick={() => setReplyingTo(null)}
                className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                title="Отменить ответ"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Единый стиль ввода: поле и кнопка в одном контейнере */}
        <div className="flex items-stretch bg-input border border-border rounded-xl shadow-sm focus-within:border-ring focus-within:ring-1 focus-within:ring-ring transition-all min-h-[56px] sm:min-h-[60px]">
          <textarea
            ref={textareaRef}
            rows={2}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              adjustTextareaHeight();
            }}
            placeholder="Напишите сообщение..."
            disabled={!ready}
            className="flex-1 resize-none bg-transparent px-3 py-2 sm:py-3 text-sm outline-none disabled:opacity-50 border-0 focus:ring-0 min-h-[48px] sm:min-h-[52px] max-h-[120px] overflow-y-auto"
            style={{
              fontSize: '16px', // Предотвращает масштабирование на iOS
              transform: 'none',
              zoom: 1,
              height: 'auto',
              minHeight: '52px',
              maxHeight: '120px'
            }}
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
            className="px-3 sm:px-4 py-2 sm:py-3 m-1 rounded-lg bg-destructive hover:bg-destructive/90 text-destructive-foreground text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1 min-w-[90px] sm:min-w-[100px] touch-manipulation self-end"
          >
            {replyingTo ? (
              <>
                <span className="hidden sm:inline">Ответить</span>
                <span className="sm:hidden">💬</span>
                <span className="text-xs hidden sm:inline">💬</span>
              </>
            ) : (
              <>
                <span className="hidden sm:inline">Отправить</span>
                <span className="sm:hidden">📤</span>
                <span className="text-xs hidden sm:inline">📤</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="pt-1 sm:pt-2 text-xs text-muted-foreground text-center space-y-1">
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
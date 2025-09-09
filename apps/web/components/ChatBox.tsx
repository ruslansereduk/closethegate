"use client";
import { io, Socket } from "socket.io-client";
import { useEffect, useRef, useState } from "react";
type Msg = { id: string; text: string; nick: string; ts: number; reactions?: { [emoji: string]: number }; isNew?: boolean };

export default function ChatBox() {
  const chatUrl = process.env.NEXT_PUBLIC_CHAT_URL!;
  const url = chatUrl?.startsWith('http') ? chatUrl : `https://${chatUrl}`;
  const [socket, setSocket] = useState<Socket | null>(null);
  const [ready, setReady] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [nick, setNick] = useState("Аноним");
  const listRef = useRef<HTMLDivElement>(null);
  const [lastSend, setLastSend] = useState(0);

  useEffect(() => {
    if (!url) {
      console.warn("NEXT_PUBLIC_CHAT_URL не установлен");
      return;
    }

    const s = io(url, { transports: ["websocket"] });
    setSocket(s);
    s.on("connect", () => setReady(true));
    s.on("recent", (items: Msg[]) => setMsgs(items));
    s.on("msg", (item: Msg) => setMsgs(prev => [...prev, { ...item, isNew: true }]));
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
    return () => {
      s.disconnect();
    };
  }, [url]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs.length]);

  function send() {
    const t = text.trim();
    if (!t) return;
    const now = Date.now();
    if (now - lastSend < 500) return; // простая защита от спама
    socket?.emit("msg", { text: t, nick });
    setLastSend(now);
    setText("");
  }

  function react(msgId: string, emoji: string) {
    socket?.emit("react", { msgId, emoji });
  }

  if (!url) {
    return (
      <div className="w-full max-w-2xl mx-auto p-4 text-center text-neutral-400">
        Чат недоступен (не настроен NEXT_PUBLIC_CHAT_URL)
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto px-4 sm:px-0">
      <div className="text-sm mb-2 opacity-70">Анонимный чат</div>
      <div ref={listRef} className="h-64 sm:h-72 overflow-y-auto rounded-2xl bg-neutral-900 p-3 space-y-2 border border-neutral-800">
        {msgs.map(m => (
          <div
            key={m.id}
            className={`text-sm group hover:bg-neutral-800/30 p-2 rounded-lg transition-all duration-300 ${
              m.isNew ? 'animate-slide-in-right bg-blue-900/20 border-l-4 border-blue-500' : ''
            }`}
            onAnimationEnd={() => {
              // Убираем флаг isNew после анимации
              if (m.isNew) {
                setMsgs(prev => prev.map(msg =>
                  msg.id === m.id ? { ...msg, isNew: false } : msg
                ));
              }
            }}
          >
            <div className="flex justify-between items-start gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-1 mb-1">
                  <span className="text-neutral-400 text-xs">{new Date(m.ts).toLocaleTimeString()}</span>
                  <span className="font-medium text-blue-400">{m.nick}:</span>
                </div>
                <div className="break-words">{m.text}</div>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex-shrink-0">
                <button
                  onClick={() => react(m.id, "👍")}
                  className="text-xs hover:scale-125 transition-transform px-1 py-0.5 rounded hover:bg-neutral-700"
                  title="Нравится"
                >
                  👍
                </button>
                <button
                  onClick={() => react(m.id, "😂")}
                  className="text-xs hover:scale-125 transition-transform px-1 py-0.5 rounded hover:bg-neutral-700"
                  title="Смешно"
                >
                  😂
                </button>
                <button
                  onClick={() => react(m.id, "😮")}
                  className="text-xs hover:scale-125 transition-transform px-1 py-0.5 rounded hover:bg-neutral-700"
                  title="Удивительно"
                >
                  😮
                </button>
                <button
                  onClick={() => react(m.id, "😢")}
                  className="text-xs hover:scale-125 transition-transform px-1 py-0.5 rounded hover:bg-neutral-700"
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
                    className="text-xs bg-neutral-800 hover:bg-neutral-700 px-1.5 py-0.5 rounded-full flex items-center gap-1 transition-colors animate-fade-in-up"
                  >
                    <span>{emoji}</span>
                    <span>{count}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
        {msgs.length === 0 && <div className="text-neutral-400">Тишина на границе</div>}
      </div>
      <div className="mt-3 space-y-3">
        {/* Поле для никнейма */}
        <div className="flex gap-2">
          <input
            className="flex-1 bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-sm"
            placeholder="Ваш ник (необязательно)"
            value={nick}
            onChange={e => setNick(e.target.value)}
          />
        </div>
        
        {/* Поле для сообщения и кнопка отправки */}
        <div className="flex gap-2">
          <input
            className="flex-1 bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-500 transition-colors"
            placeholder="Напишите сообщение..."
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === "Enter" && send()}
          />
          <button
            className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 text-sm min-w-[100px] ${
              ready && text.trim()
                ? 'gradient-btn hover-lift text-black'
                : 'bg-neutral-700 text-neutral-400 cursor-not-allowed'
            }`}
            onClick={send}
            disabled={!ready || !text.trim()}
          >
            {ready ? '🚀 Отправить' : 'Подключение...'}
          </button>
        </div>
      </div>
      <div className="mt-2 text-xs opacity-60">
        Просьба не публиковать персональные данные и призывы к нарушению закона
      </div>
    </div>
  );
}

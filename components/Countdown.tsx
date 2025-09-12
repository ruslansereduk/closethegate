"use client";
import { useEffect, useState, useLayoutEffect } from "react";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
dayjs.extend(duration);

const BORDER_CLOSURE_DATE = "2025-09-12T00:00:00+02:00";

// Компонент-обертка для предотвращения проблем с гидратацией
function ClientOnly({ children }: { children: React.ReactNode }) {
  const [hasMounted, setHasMounted] = useState(false);

  useLayoutEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return (
      <div className="text-center space-y-3 px-2" aria-live="polite" aria-atomic>
        <div className="text-sm text-muted-foreground">Инициализация...</div>
        <div className="text-6xl sm:text-8xl md:text-9xl lg:text-[12rem] font-semibold tracking-tight transition-all duration-200 text-gray-400 overflow-hidden break-all">
          <span className="block">--:--:--:--</span>
        </div>
        <div className="text-xs text-muted-foreground px-2">Дни · Часы · Минуты · Секунды</div>
      </div>
    );
  }

  return <>{children}</>;
}

function CountdownInner() {
  const borderClosureIso = process.env.NEXT_PUBLIC_BORDER_CLOSURE_ISO || BORDER_CLOSURE_DATE;
  const borderClosureDate = dayjs(borderClosureIso);
  const [now, setNow] = useState(() => dayjs());
  const [prevTime, setPrevTime] = useState<string>("");
  const [animate, setAnimate] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useLayoutEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;
    
    const id = setInterval(() => setNow(dayjs()), 1000);
    return () => clearInterval(id);
  }, [isClient]);

  // Вычисляем время, прошедшее с момента закрытия границы (только на клиенте)
  const timeElapsed = isClient ? now.diff(borderClosureDate) : 0;
  const isBorderClosed = timeElapsed >= 0;
  
  const dur = dayjs.duration(Math.max(timeElapsed, 0));
  const dd = String(Math.floor(dur.asDays())).padStart(2, "0");
  const hh = String(dur.hours()).padStart(2, "0");
  const mm = String(dur.minutes()).padStart(2, "0");
  const ss = String(dur.seconds()).padStart(2, "0");

  const currentTime = isBorderClosed ? `${dd}:${hh}:${mm}:${ss}` : "00:00:00:00";

  useEffect(() => {
    if (!isClient) return;
    
    if (prevTime !== currentTime && prevTime !== "") {
      setAnimate(true);
      const timer = setTimeout(() => setAnimate(false), 300);
      return () => clearTimeout(timer);
    }
    setPrevTime(currentTime);
  }, [currentTime, prevTime, isClient]);

  const urgency = isBorderClosed && dur.asDays() >= 1;

  // Определяем текст в зависимости от фазы
  const getStatusText = () => {
    if (isBorderClosed) {
      return "Граница закрыта уже";
    } else {
      return "До закрытия границы остается";
    }
  };

  const getSubText = () => {
    if (isBorderClosed) {
      return "Дни · Часы · Минуты · Секунды";
    } else {
      return "Дни · Часы · Минуты · Секунды";
    }
  };

  const getUrgencyMessage = () => {
    if (isBorderClosed && urgency) {
      return "Граница закрыта уже более суток!";
    }
    return null;
  };

  // Показываем загрузку до полной инициализации клиента
  if (!isClient) {
    return (
      <div className="text-center space-y-3 px-2" aria-live="polite" aria-atomic>
        <div className="text-sm text-muted-foreground">Загрузка...</div>
        <div className="text-6xl sm:text-8xl md:text-9xl lg:text-[12rem] font-semibold tracking-tight transition-all duration-200 text-gray-400 overflow-hidden break-all">
          <span className="block">--:--:--:--</span>
        </div>
        <div className="text-xs text-muted-foreground px-2">Дни · Часы · Минуты · Секунды</div>
      </div>
    );
  }

  return (
    <div className="text-center space-y-3 px-2 overflow-hidden" aria-live="polite" aria-atomic>
      <div className="text-sm text-muted-foreground">
        {getStatusText()}
      </div>
      <div className={`text-6xl sm:text-8xl md:text-9xl lg:text-[12rem] font-semibold tracking-tight transition-all duration-200 ${
        animate ? 'scale-105 text-red-600' : isBorderClosed ? 'text-red-600' : 'text-orange-500'
      } overflow-hidden break-all`}>
        <span className={`${animate ? 'animate-pulse' : ''} block`}>
          {currentTime}
        </span>
      </div>
      <div className="text-xs text-muted-foreground px-2">
        {getSubText()}
      </div>

      {getUrgencyMessage() && (
        <div className="mt-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-red-500/10 px-4 py-2 text-sm border border-red-500/20 shadow-sm">
            <span className="animate-pulse">⚠️</span>
            <span>{getUrgencyMessage()}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Countdown() {
  return (
    <ClientOnly>
      <CountdownInner />
    </ClientOnly>
  );
}

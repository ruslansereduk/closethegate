"use client";
import { useEffect, useState } from "react";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
dayjs.extend(duration);

const DEFAULT_DEADLINE = "2025-01-01T00:00:00+02:00";

export default function Countdown() {
  const deadlineIso = process.env.NEXT_PUBLIC_DEADLINE_ISO || DEFAULT_DEADLINE;
  const deadline = dayjs(deadlineIso);
  const [now, setNow] = useState(dayjs());
  const [prevTime, setPrevTime] = useState<string>("");
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setNow(dayjs()), 1000);
    return () => clearInterval(id);
  }, []);

  const diff = deadline.diff(now);
  const past = diff <= 0;
  const dur = dayjs.duration(Math.max(diff, 0));
  const dd = String(Math.floor(dur.asDays())).padStart(2, "0");
  const hh = String(dur.hours()).padStart(2, "0");
  const mm = String(dur.minutes()).padStart(2, "0");
  const ss = String(dur.seconds()).padStart(2, "0");

  const currentTime = past ? "00:00:00:00" : `${dd}:${hh}:${mm}:${ss}`;

  useEffect(() => {
    if (prevTime !== currentTime && prevTime !== "") {
      setAnimate(true);
      const timer = setTimeout(() => setAnimate(false), 300);
      return () => clearTimeout(timer);
    }
    setPrevTime(currentTime);
  }, [currentTime, prevTime]);

  const urgency = !past && dur.asDays() < 7;

  return (
    <div className="text-center space-y-3 px-2" aria-live="polite" aria-atomic>
      <div className="text-sm text-muted-foreground">
        {past ? "Статус сейчас" : "До закрытия остается"}
      </div>
      <div className={`text-5xl sm:text-7xl md:text-8xl font-semibold tracking-tight transition-all duration-200 ${
        animate ? 'scale-105 text-red-600' : urgency ? 'text-red-600' : 'text-red-600'
      }`}>
        <span className={`${animate ? 'animate-pulse' : ''}`}>
          {currentTime}
        </span>
      </div>
      <div className="text-xs text-muted-foreground px-2">
        {past ? "Кажется мы опоздали" : "Дни · Часы · Минуты · Секунды"}
      </div>

      {urgency && !past && (
        <div className="mt-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-red-500/10 px-4 py-2 text-sm border border-red-500/20 shadow-sm">
            <span className="animate-pulse">⚠️</span>
            <span>Время на исходе!</span>
          </div>
        </div>
      )}
    </div>
  );
}

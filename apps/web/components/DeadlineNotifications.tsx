"use client";
import { useEffect, useState } from "react";

interface Notification {
  id: string;
  message: string;
  type: 'warning' | 'danger' | 'info';
  emoji: string;
}

// Злые ироничные сообщения
const IRONIC_MESSAGES: Array<{message: string; emoji: string; type: 'warning' | 'danger' | 'info'}> = [
  { message: "Если ты на границе - ускользни, пока не поздно!", emoji: "🏃‍♂️", type: "danger" },
  { message: "Перейди в автобус поближе, там точно повезет!", emoji: "🚌", type: "warning" },
  { message: "Дай взятку... шучу, лучше не надо!", emoji: "💰", type: "info" },
  { message: "Стань невидимым - это точно сработает!", emoji: "👻", type: "danger" },
  { message: "Научись гипнозу, загипнотизируй пограничника!", emoji: "🌀", type: "warning" },
  { message: "Стань супергероем и перепрыгни границу!", emoji: "🦸‍♂️", type: "info" },
];

export default function DeadlineNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Показываем первое сообщение через 3 секунды
  useEffect(() => {
    const timer = setTimeout(() => {
      const randomMessage = IRONIC_MESSAGES[Math.floor(Math.random() * IRONIC_MESSAGES.length)];
      const notification: Notification = {
        id: `ironic-${Date.now()}`,
        message: randomMessage.message,
        type: randomMessage.type,
        emoji: randomMessage.emoji,
      };

      setNotifications([notification]);

      // Автоматически скрываем через 6 секунд
      setTimeout(() => {
        setNotifications([]);
      }, 6000);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  // Каждые 30 секунд показываем новое сообщение (для демо)
  useEffect(() => {
    const interval = setInterval(() => {
      const randomMessage = IRONIC_MESSAGES[Math.floor(Math.random() * IRONIC_MESSAGES.length)];
      const notification: Notification = {
        id: `ironic-${Date.now()}`,
        message: randomMessage.message,
        type: randomMessage.type,
        emoji: randomMessage.emoji,
      };

      setNotifications([notification]);

      setTimeout(() => {
        setNotifications([]);
      }, 6000);
    }, 30000); // 30 секунд для демо

    return () => clearInterval(interval);
  }, []);

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getNotificationStyles = (type: string) => {
    switch (type) {
      case 'danger':
        return 'bg-red-900/90 border-red-700 text-red-100';
      case 'warning':
        return 'bg-yellow-900/90 border-yellow-700 text-yellow-100';
      case 'info':
        return 'bg-blue-900/90 border-blue-700 text-blue-100';
      default:
        return 'bg-neutral-900/90 border-neutral-700 text-neutral-100';
    }
  };

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {notifications.map(notification => (
        <div
          key={notification.id}
          className={`p-4 rounded-lg border backdrop-blur-sm shadow-lg animate-slide-in-right hover-lift ${getNotificationStyles(notification.type)}`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">{notification.emoji}</span>
              <span className="font-medium text-sm">{notification.message}</span>
            </div>
            <button
              onClick={() => removeNotification(notification.id)}
              className="text-neutral-400 hover:text-neutral-200 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

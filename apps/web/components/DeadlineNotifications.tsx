"use client";
import { useEffect, useState } from "react";

interface Notification {
  id: string;
  message: string;
  type: 'warning' | 'danger' | 'info' | 'success' | 'funny';
  emoji: string;
}

// Злые ироничные сообщения
const IRONIC_MESSAGES: Array<{message: string; emoji: string; type: 'warning' | 'danger' | 'info' | 'success' | 'funny'}> = [
  // Бегство и побег
  { message: "Если ты на границе - ускользни, пока не поздно!", emoji: "🏃‍♂️", type: "danger" },
  { message: "Беги быстрее ветра, пока не закрыли!", emoji: "💨", type: "danger" },
  { message: "Стань невидимым - это точно сработает!", emoji: "👻", type: "danger" },
  { message: "Переплыви реку, как настоящий контрабандист!", emoji: "🏊‍♂️", type: "danger" },
  { message: "Выкопай туннель - у тебя есть лопата?", emoji: "⛏️", type: "danger" },
  { message: "Спрячься в багажнике - классика жанра!", emoji: "🧳", type: "danger" },
  
  // Транспорт и перемещение
  { message: "Перейди в автобус поближе, там точно повезет!", emoji: "🚌", type: "warning" },
  { message: "Сядь на поезд - железная дорога не подведет!", emoji: "🚂", type: "warning" },
  { message: "Возьми такси - водитель точно знает обходные пути!", emoji: "🚕", type: "warning" },
  { message: "Поезжай на велосипеде - экологично и быстро!", emoji: "🚲", type: "warning" },
  { message: "Скейтборд - идеальный транспорт для побега!", emoji: "🛹", type: "warning" },
  { message: "Хеликоптер - если есть знакомый пилот!", emoji: "🚁", type: "warning" },
  
  // Магические и необычные способы
  { message: "Научись гипнозу, загипнотизируй пограничника!", emoji: "🌀", type: "info" },
  { message: "Стань супергероем и перепрыгни границу!", emoji: "🦸‍♂️", type: "info" },
  { message: "Используй магию - заклинание 'Открыть границу'!", emoji: "🔮", type: "info" },
  { message: "Телепортация - если знаешь координаты!", emoji: "✨", type: "info" },
  { message: "Стань хамелеоном и замаскируйся!", emoji: "🦎", type: "info" },
  { message: "Используй портал - найди ближайший!", emoji: "🌀", type: "info" },
  
  // Взятки и подкупы
  { message: "Дай взятку... шучу, лучше не надо!", emoji: "💰", type: "info" },
  { message: "Предложи шоколадку - сладкое всегда работает!", emoji: "🍫", type: "info" },
  { message: "Купи кофе пограничнику - может сжалится!", emoji: "☕", type: "info" },
  { message: "Подари цветы - красота спасет мир!", emoji: "🌹", type: "info" },
  { message: "Угости печеньем - домашняя выпечка творит чудеса!", emoji: "🍪", type: "info" },
  
  // Социальные способы
  { message: "Женись на местной - семейные связи решают все!", emoji: "💍", type: "warning" },
  { message: "Найди работу в соседней стране - легальный способ!", emoji: "💼", type: "info" },
  { message: "Поступи в университет - студенты везде проходят!", emoji: "🎓", type: "info" },
  { message: "Стань дипломатом - дипломатический иммунитет!", emoji: "🤝", type: "info" },
  { message: "Устройся на работу в посольство!", emoji: "🏛️", type: "info" },
  
  // Креативные решения
  { message: "Создай фальшивый паспорт - но это незаконно!", emoji: "📄", type: "danger" },
  { message: "Переоденься в униформу пограничника!", emoji: "👮‍♂️", type: "danger" },
  { message: "Спрячься в почтовой посылке - как в фильме!", emoji: "📦", type: "danger" },
  { message: "Стань частью циркового представления!", emoji: "🎪", type: "info" },
  { message: "Притворись туристом - камера и рюкзак обязательны!", emoji: "📸", type: "info" },
  { message: "Создай фальшивую свадьбу - свадебные процессии не проверяют!", emoji: "💒", type: "warning" },
  
  // Философские и абсурдные
  { message: "Медитируй - может граница исчезнет сама!", emoji: "🧘‍♂️", type: "info" },
  { message: "Попроси у Вселенной - она все устроит!", emoji: "🙏", type: "info" },
  { message: "Стань космонавтом - из космоса границ не видно!", emoji: "🚀", type: "info" },
  { message: "Дождись зомби-апокалипсиса - тогда все границы падут!", emoji: "🧟‍♂️", type: "danger" },
  { message: "Попроси помощи у инопланетян - они точно помогут!", emoji: "👽", type: "info" },
  { message: "Стань невидимым через науку - квантовая физика!", emoji: "⚛️", type: "info" },
  
  // Практические советы
  { message: "Изучи все лазейки в законодательстве!", emoji: "📚", type: "info" },
  { message: "Найди лазейку в системе - они всегда есть!", emoji: "🔍", type: "warning" },
  { message: "Стань экспертом по международному праву!", emoji: "⚖️", type: "info" },
  { message: "Создай стартап - инвесторы везде нужны!", emoji: "💡", type: "info" },
  { message: "Стань блогером - известность открывает двери!", emoji: "📱", type: "info" },
  
  // Абсолютно абсурдные
  { message: "Стань президентом - тогда сам откроешь границы!", emoji: "👑", type: "danger" },
  { message: "Изобрети машину времени - вернись в прошлое!", emoji: "⏰", type: "info" },
  { message: "Стань богом - боги не знают границ!", emoji: "👼", type: "info" },
  { message: "Создай параллельную вселенную без границ!", emoji: "🌌", type: "info" },
  { message: "Стань частью матрицы - там границ нет!", emoji: "🔢", type: "info" },
  
  // Смешные и нелепые
  { message: "Притворись статуей - никто не заметит!", emoji: "🗿", type: "funny" },
  { message: "Стань пандой - панд везде любят!", emoji: "🐼", type: "funny" },
  { message: "Притворись почтальоном - почту не проверяют!", emoji: "📮", type: "funny" },
  { message: "Стань клоуном - клоуны везде проходят!", emoji: "🤡", type: "funny" },
  { message: "Притворись роботом - роботы не люди!", emoji: "🤖", type: "funny" },
  { message: "Стань пингвином - пингвины милые!", emoji: "🐧", type: "funny" },
  { message: "Притворись деревом - деревья не проверяют!", emoji: "🌳", type: "funny" },
  { message: "Стань облаком - облака летают везде!", emoji: "☁️", type: "funny" },
  
  // Позитивные и мотивирующие
  { message: "Верь в себя - ты справишься!", emoji: "💪", type: "success" },
  { message: "Не сдавайся - границы временны!", emoji: "🌟", type: "success" },
  { message: "Ты сильнее любых границ!", emoji: "🔥", type: "success" },
  { message: "Мечты сбываются - дерзай!", emoji: "✨", type: "success" },
  { message: "Ты можешь все - просто верь!", emoji: "🎯", type: "success" },
  { message: "Границы - это иллюзия!", emoji: "🌈", type: "success" },
  
  // Реалистичные советы
  { message: "Проверь все документы заранее!", emoji: "📋", type: "info" },
  { message: "Изучи маршруты заранее!", emoji: "🗺️", type: "info" },
  { message: "Возьми с собой запасные документы!", emoji: "📄", type: "info" },
  { message: "Узнай расписание заранее!", emoji: "⏰", type: "info" },
  { message: "Проверь погоду на границе!", emoji: "🌤️", type: "info" },
  { message: "Возьми с собой еду и воду!", emoji: "🍎", type: "info" },
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

  // Каждые 20-40 секунд показываем новое сообщение (случайный интервал)
  useEffect(() => {
    const showRandomNotification = () => {
      const randomMessage = IRONIC_MESSAGES[Math.floor(Math.random() * IRONIC_MESSAGES.length)];
      const notification: Notification = {
        id: `ironic-${Date.now()}`,
        message: randomMessage.message,
        type: randomMessage.type,
        emoji: randomMessage.emoji,
      };

      setNotifications([notification]);

      // Случайное время показа от 4 до 8 секунд
      const showTime = 4000 + Math.random() * 4000;
      setTimeout(() => {
        setNotifications([]);
      }, showTime);
    };

    const scheduleNext = () => {
      // Случайный интервал от 20 до 40 секунд
      const nextInterval = 20000 + Math.random() * 20000;
      setTimeout(() => {
        showRandomNotification();
        scheduleNext();
      }, nextInterval);
    };

    scheduleNext();

    return () => {
      // Очистка таймеров при размонтировании
    };
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
      case 'success':
        return 'bg-green-900/90 border-green-700 text-green-100';
      case 'funny':
        return 'bg-purple-900/90 border-purple-700 text-purple-100';
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

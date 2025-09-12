"use client";
import { useEffect, useState } from "react";

interface Notification {
  id: string;
  message: string;
  type: 'warning' | 'danger' | 'info' | 'success' | 'funny';
  emoji: string;
}

// Злые ироничные сообщения для периода до закрытия
const IRONIC_MESSAGES_BEFORE: Array<{message: string; emoji: string; type: 'warning' | 'danger' | 'info' | 'success' | 'funny'}> = [
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
  
  // Политические и абсурдные уведомления
  { message: "Ввёл план бобёр в аэропортах Польши", emoji: "🦫", type: "funny" },
  { message: "Ukraine, close the sky over NATO", emoji: "✈️", type: "funny" },
  { message: "Эксперты по Польше начали подтягиваться в сеть", emoji: "👨‍💻", type: "funny" },
  { message: "Польша всегда была дотационным членом альянса и не имела стратегической ценности", emoji: "💰", type: "funny" },
  { message: "Экстренно исключить Польшу из НАТО", emoji: "🚫", type: "funny" },
  { message: "Лютое терпение с переходом на обеспокоенность", emoji: "😤", type: "funny" },
  { message: "Польша временно выходит из состава НАТО до окончания атаки, подписываю соответствующий указ", emoji: "📜", type: "funny" },
  { message: "Украина готова принять беженцев из Польши", emoji: "🇺🇦", type: "funny" },
];

// Сообщения для периода после закрытия границ (ожидание открытия)
const IRONIC_MESSAGES_AFTER: Array<{message: string; emoji: string; type: 'warning' | 'danger' | 'info' | 'success' | 'funny'}> = [
  // Ожидание и терпение
  { message: "Ждем 17 сентября как манны небесной!", emoji: "⏰", type: "info" },
  { message: "Считаем дни до освобождения!", emoji: "📅", type: "info" },
  { message: "Терпение и труд все перетрут!", emoji: "💪", type: "success" },
  { message: "Скоро границы снова откроются!", emoji: "🚪", type: "info" },
  { message: "Осталось недолго ждать!", emoji: "⏳", type: "info" },
  { message: "Сентябрь не за горами!", emoji: "🍂", type: "info" },
  
  // Подготовка к открытию
  { message: "Готовь документы заранее!", emoji: "📋", type: "warning" },
  { message: "Проверяй обновления каждый день!", emoji: "🔄", type: "warning" },
  { message: "Следи за новостями о границах!", emoji: "📰", type: "info" },
  { message: "Планируй маршрут заранее!", emoji: "🗺️", type: "info" },
  { message: "Бронируй билеты на 17 сентября!", emoji: "🎫", type: "warning" },
  { message: "Готовь чемоданы к отъезду!", emoji: "🧳", type: "info" },
  
  // Ироничные советы
  { message: "Можешь начать учить польский язык!", emoji: "🇵🇱", type: "info" },
  { message: "Изучай карту Польши наизусть!", emoji: "🗺️", type: "info" },
  { message: "Найди работу в Польше заранее!", emoji: "💼", type: "info" },
  { message: "Заведи друзей в Польше!", emoji: "👥", type: "info" },
  { message: "Купи польский флаг для встречи!", emoji: "🏳️", type: "funny" },
  { message: "Выучи гимн Польши!", emoji: "🎵", type: "funny" },
  
  // Философские размышления
  { message: "Время лечит все раны!", emoji: "⏰", type: "success" },
  { message: "Все плохое когда-то заканчивается!", emoji: "🌈", type: "success" },
  { message: "Терпение - это добродетель!", emoji: "🧘‍♂️", type: "info" },
  { message: "Скоро все наладится!", emoji: "✨", type: "success" },
  { message: "Надежда умирает последней!", emoji: "💫", type: "success" },
  { message: "Лучшие времена впереди!", emoji: "🌟", type: "success" },
  
  // Абсурдные советы
  { message: "Можешь начать копать туннель!", emoji: "⛏️", type: "funny" },
  { message: "Построй машину времени!", emoji: "🕰️", type: "funny" },
  { message: "Стань невидимым до сентября!", emoji: "👻", type: "funny" },
  { message: "Научись телепортации!", emoji: "✨", type: "funny" },
  { message: "Создай портал в Польшу!", emoji: "🌀", type: "funny" },
  { message: "Стань супергероем!", emoji: "🦸‍♂️", type: "funny" },
  
  // Мотивационные
  { message: "Ты справишься с ожиданием!", emoji: "💪", type: "success" },
  { message: "Скоро все будет хорошо!", emoji: "😊", type: "success" },
  { message: "Держись, осталось недолго!", emoji: "🤝", type: "success" },
  { message: "Ты не один в этом ожидании!", emoji: "👥", type: "success" },
  { message: "Вместе мы переживем это!", emoji: "🤗", type: "success" },
  { message: "Скоро границы снова откроются!", emoji: "🚪", type: "success" },
  
  // Политические шутки
  { message: "Польша готовится к приему гостей!", emoji: "🏠", type: "funny" },
  { message: "НАТО пересматривает планы!", emoji: "🔄", type: "funny" },
  { message: "ЕС готовит сюрприз на 17 сентября!", emoji: "🎁", type: "funny" },
  { message: "Границы ждут не дождутся открытия!", emoji: "😄", type: "funny" },
  { message: "Пограничники скучают по работе!", emoji: "😴", type: "funny" },
  { message: "Таможня готовит подарки!", emoji: "🎁", type: "funny" },
];

export default function DeadlineNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Проверяем, прошла ли дата закрытия границ
  const isDeadlinePast = () => {
    const deadline = new Date('2025-09-12T00:00:00+02:00');
    const now = new Date();
    return now >= deadline;
  };

  // Показываем уведомление сразу при загрузке страницы
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;

    const showNotification = () => {
      const messages = isDeadlinePast() ? IRONIC_MESSAGES_AFTER : IRONIC_MESSAGES_BEFORE;
      const randomMessage = messages[Math.floor(Math.random() * messages.length)];
      const notification: Notification = {
        id: `ironic-${Date.now()}`,
        message: randomMessage.message,
        type: randomMessage.type,
        emoji: randomMessage.emoji,
      };

      setNotifications([notification]);

      // Автоматически скрываем через 6 секунд
      timeoutId = setTimeout(() => {
        setNotifications([]);
      }, 6000);
    };

    // Показываем сразу при загрузке
    showNotification();

    // Добавляем обработчик для обновления страницы
    const handleBeforeUnload = () => {
      // Сохраняем время последнего обновления
      localStorage.setItem('lastPageRefresh', Date.now().toString());
    };

    const handleLoad = () => {
      // Проверяем, было ли обновление страницы
      const lastRefresh = localStorage.getItem('lastPageRefresh');
      const now = Date.now();
      
      if (lastRefresh) {
        const timeDiff = now - parseInt(lastRefresh);
        // Если прошло меньше 5 секунд, значит страница была обновлена
        if (timeDiff < 5000) {
          showNotification();
        }
      }
    };

    // Обработчик для возврата на страницу (вкладка стала видимой)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Страница стала видимой - показываем уведомление
        showNotification();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('load', handleLoad);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('load', handleLoad);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []); // Пустой массив зависимостей - выполняется только при монтировании

  // Каждые 20-40 секунд показываем новое сообщение (случайный интервал)
  useEffect(() => {
    let timeoutIds: NodeJS.Timeout[] = [];

    const showRandomNotification = () => {
      const messages = isDeadlinePast() ? IRONIC_MESSAGES_AFTER : IRONIC_MESSAGES_BEFORE;
      const randomMessage = messages[Math.floor(Math.random() * messages.length)];
      const notification: Notification = {
        id: `ironic-${Date.now()}`,
        message: randomMessage.message,
        type: randomMessage.type,
        emoji: randomMessage.emoji,
      };

      setNotifications([notification]);

      // Случайное время показа от 4 до 8 секунд
      const showTime = 4000 + Math.random() * 4000;
      const hideTimeout = setTimeout(() => {
        setNotifications([]);
      }, showTime);
      timeoutIds.push(hideTimeout);
    };

    const scheduleNext = () => {
      // Случайный интервал от 20 до 40 секунд
      const nextInterval = 20000 + Math.random() * 20000;
      const nextTimeout = setTimeout(() => {
        showRandomNotification();
        scheduleNext();
      }, nextInterval);
      timeoutIds.push(nextTimeout);
    };

    scheduleNext();

    return () => {
      // Очистка всех таймеров при размонтировании
      timeoutIds.forEach(id => clearTimeout(id));
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
    <div className="fixed top-4 right-2 sm:right-4 z-50 space-y-2 max-w-xs sm:max-w-sm pointer-events-none">
      {notifications.map(notification => (
        <div
          key={notification.id}
          className={`p-3 rounded-lg border backdrop-blur-sm shadow-lg animate-slide-in-right hover-lift pointer-events-auto ${getNotificationStyles(notification.type)}`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2">
              <span className="text-lg flex-shrink-0">{notification.emoji}</span>
              <span className="font-medium text-xs sm:text-sm leading-relaxed">{notification.message}</span>
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

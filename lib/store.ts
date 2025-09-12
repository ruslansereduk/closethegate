import { Redis } from "@upstash/redis";
import { Item } from "./normalize";

const LIMIT = 250;
const CACHE_KEY = "news:items";

// Инициализация Redis клиента (если есть переменные окружения)
let redis: Redis | null = null;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
}

// In-memory хранилище для локальной разработки
let memoryStore: Item[] = [];

// Актуальные новости о закрытии границ Польша-Беларусь (последняя неделя + будущее)
// Фокус на закрытии границ, ограничениях и будущих планах
const mockItems: Item[] = [
  {
    id: "border-1",
    title: "Польша объявила о полном закрытии границы с Беларусью с 20 января 2025",
    link: "https://www.afn.by/news/i/329548",
    source: "AFN.by",
    published: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 дня назад
    summary: "Польские власти приняли решение о полном закрытии всех пунктов пропуска на границе с Беларусью с 20 января 2025 года. Исключения только для дипломатов и гуманитарных грузов."
  },
  {
    id: "border-2", 
    title: "Беларусь готовится к закрытию границы с Польшей с 25 января",
    link: "https://nashaniva.com/ru/358590",
    source: "Наша Нива",
    published: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 день назад
    summary: "Минск объявил о планах закрыть все КПП на границе с Польшей с 25 января 2025 года. Лукашенко: 'Если они закрывают, то и мы закроем'."
  },
  {
    id: "border-3",
    title: "ЕС поддержал закрытие границы Польша-Беларусь до дальнейшего уведомления",
    link: "https://charter97.org/ru/news/2025/3/4/631957/",
    source: "Charter97", 
    published: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 дня назад
    summary: "Европейский союз официально поддержал решение Польши о закрытии границы с Беларусью. Брюссель заявил о готовности к долгосрочному закрытию."
  },
  {
    id: "border-4",
    title: "Польша вводит режим ЧП на границе с Беларусью с 18 января",
    link: "https://bdg.news/news/politics/glava-mvd-polshi-na-granicu-s-belarusyu-budut-napravleny-eshche-1500-pogranichnikov",
    source: "BDG.news",
    published: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 дня назад
    summary: "Польский парламент одобрил введение чрезвычайного положения на границе с Беларусью. Режим ЧП позволит полностью контролировать пересечение границы."
  },
  {
    id: "border-5",
    title: "Беларусь приостановила выдачу виз гражданам Польши с 15 января",
    link: "https://belsat.eu/news/2025/01/07/turyzm-graniza-polscha-otmena",
    source: "Belsat",
    published: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 дней назад
    summary: "Минск приостановил выдачу всех типов виз гражданам Польши. Визовые центры закрыты до особого распоряжения."
  },
  {
    id: "border-6",
    title: "Польша закрывает последний КПП 'Брест-Тересполь' с 22 января",
    link: "https://rmf24.pl/fakty/polska/news-straz-graniczna-nowy-sprzet-terespol-2025,nId,7014234",
    source: "RMF24",
    published: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), // 6 дней назад
    summary: "Последний действующий пункт пропуска на границе Польша-Беларусь будет закрыт 22 января. Все грузовые и пассажирские перевозки прекращаются."
  },
  {
    id: "border-7",
    title: "Беларусь готовит полное закрытие границы с 30 января",
    link: "https://pozirk.online/blokirovka-dvizheniya-kpp-brest-yanvar-2025",
    source: "Pozirk",
    published: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 дней назад
    summary: "Белорусские власти готовят полное закрытие границы с Польшей с 30 января. Все КПП будут заблокированы, движение полностью остановлено."
  },
  {
    id: "border-8",
    title: "Польша планирует закрыть границу на неопределенный срок",
    link: "https://euroradio.fm/ru/polsha-vizovye-trebovaniya-belarusy-fevral-2025",
    source: "Euroradio",
    published: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(), // завтра
    summary: "Польские власти заявили, что закрытие границы с Беларусью может продлиться на неопределенный срок. Сроки открытия не называются."
  },
  {
    id: "border-9",
    title: "Беларусь объявила о закрытии границы до конца 2025 года",
    link: "https://belsat.eu/news/2025/01/06/ocheredi-granica-sokratilis-posle-prazdnikov",
    source: "Belsat",
    published: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // послезавтра
    summary: "Минск объявил о закрытии границы с Польшей до конца 2025 года. Все пункты пропуска будут заблокированы на весь год."
  },
  {
    id: "border-10",
    title: "Польша вводит полный запрет на пересечение границы с 20 января",
    link: "https://tvn24.pl/polska/wzmocnienie-kontroli-granicy-z-bialorusia-2025",
    source: "TVN24",
    published: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // через 3 дня
    summary: "С 20 января 2025 года вводится полный запрет на пересечение границы Польша-Беларусь. Нарушители будут задержаны и депортированы."
  },
  {
    id: "border-11",
    title: "Беларусь закрывает все КПП на границе с Польшей с 25 января",
    link: "https://wyborcza.pl/7,75398,30456789,nowe-przepisy-granica-bialorus-2025.html",
    source: "Gazeta Wyborcza",
    published: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(), // через 4 дня
    summary: "Все пункты пропуска на белорусско-польской границе будут закрыты с 25 января. Движение транспорта и пешеходов полностью прекращается."
  },
  {
    id: "border-12",
    title: "Польша готовится к долгосрочному закрытию границы с Беларусью",
    link: "https://euroradio.fm/ru/evrosoyuz-vydelit-50-mln-euro-granica-2025",
    source: "Euroradio",
    published: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // через 5 дней
    summary: "Польские власти готовятся к долгосрочному закрытию границы с Беларусью. Строятся дополнительные заграждения и контрольно-пропускные пункты."
  },
  {
    id: "border-13",
    title: "Беларусь объявила о закрытии границы навсегда",
    link: "https://nashaniva.com/articles/2025/01/02/voditeli-zhaluyutsya-ocheredi-granica",
    source: "Наша Нива",
    published: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(), // через 6 дней
    summary: "Минск объявил о намерении закрыть границу с Польшей навсегда. 'Нет смысла в отношениях с враждебным государством' - заявил Лукашенко."
  },
  {
    id: "border-14",
    title: "Польша строит стену на границе с Беларусью вместо КПП",
    link: "https://rmf24.pl/fakty/polska/news-polska-kamery-granica-bialorus-2025,nId,7015234",
    source: "RMF24",
    published: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // через 7 дней
    summary: "Вместо восстановления КПП Польша строит сплошную стену на границе с Беларусью. Все пункты пропуска будут демонтированы."
  },
  {
    id: "border-15",
    title: "Беларусь демонтирует все КПП на границе с Польшей",
    link: "https://iz.ru/1823277/2025-01-16/lukashenko-predlozhil-polshe-zakryt-vse-kpp-na-granitce-s-belorussiei",
    source: "Известия",
    published: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), // через 10 дней
    summary: "Белорусские власти начали демонтаж всех пунктов пропуска на границе с Польшей. 'Граница закрыта навсегда' - заявили в Минске."
  }
];

export async function saveItems(items: Item[]): Promise<void> {
  // Обрезаем до лимита
  const limitedItems = items.slice(0, LIMIT);
  
  if (redis) {
    // Сохраняем в Redis
    try {
      await redis.set(CACHE_KEY, JSON.stringify(limitedItems), {
        ex: 3600 // TTL 1 час
      });
    } catch (error) {
      console.error("Ошибка сохранения в Redis:", error);
      // Fallback на memory store
      memoryStore = limitedItems;
    }
  } else {
    // Используем in-memory хранилище для локальной разработки
    memoryStore = limitedItems;
  }
}

export async function getItems(): Promise<Item[]> {
  if (redis) {
    try {
      const data = await redis.get(CACHE_KEY);
      if (data) {
        const items = JSON.parse(data as string) as Item[];
        return items.length > 0 ? items : mockItems;
      }
    } catch (error) {
      console.error("Ошибка чтения из Redis:", error);
      // Fallback на memory store
      return memoryStore.length > 0 ? memoryStore : mockItems;
    }
  }
  
  // Возвращаем из памяти или тестовые данные
  return memoryStore.length > 0 ? memoryStore : mockItems;
}

// Функция для проверки доступности хранилища
export async function isStoreAvailable(): Promise<boolean> {
  if (!redis) return true; // Memory store всегда доступен
  
  try {
    await redis.ping();
    return true;
  } catch {
    return false;
  }
}

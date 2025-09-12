export type Feed = { 
  source: string; 
  url: string; 
  kind: "rss" | "rsshub" 
};

export const FEEDS: Feed[] = [
  { 
    source: "Nasha Niva", 
    url: "https://nashaniva.com/rss", 
    kind: "rss" 
  },
  { 
    source: "Charter97", 
    url: "https://charter97.org/ru/rss", 
    kind: "rss" 
  },
  // Зеркало через телеграм-канал (основной источник)
  { 
    source: "Зеркало", 
    url: "https://rsshub.app/telegram/channel/zerkalo_io", 
    kind: "rsshub" 
  }
  // Дополнительные белорусские источники можно добавлять здесь
];

// Утилита для получения всех активных RSS ссылок
export function getActiveFeeds(): Feed[] {
  return FEEDS.filter(feed => {
    // В будущем здесь можно добавить проверку доступности
    return true;
  });
}

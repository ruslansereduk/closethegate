"use client";
import React, { useEffect, useState } from "react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/ru";

dayjs.extend(relativeTime);
dayjs.locale("ru");

interface NewsItem {
  id: string;
  title: string;
  link: string;
  source: string;
  published: string;
  summary?: string;
}

// Источники новостей о закрытии границ
const NEWS_SOURCES = {
  belarus: ['Наша Нива', 'Charter97', 'Belsat', 'Pozirk', 'AFN.by', 'Известия'],
  poland: ['RMF24', 'BDG.news', 'Euroradio', 'TVN24', 'Gazeta Wyborcza']
};

function NewsItemComponent({ item }: { item: NewsItem }) {
  const timeAgo = dayjs(item.published).fromNow();
  const isBelarusSource = NEWS_SOURCES.belarus.includes(item.source);
  const sourceEmoji = isBelarusSource ? '🤍❤️🤍' : '🇵🇱';

  return (
    <a 
      href={item.link}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-neutral-900 border border-neutral-800 rounded-2xl p-4 hover:bg-neutral-850 transition-all duration-200 hover:shadow-md hover:border-neutral-700"
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm">{sourceEmoji}</span>
        <span className="text-xs text-neutral-400 font-medium">{item.source}</span>
        <span className="text-xs text-neutral-500">•</span>
        <time className="text-xs text-neutral-500" dateTime={item.published}>
          {timeAgo}
        </time>
      </div>
      
      <h3 className="font-medium text-base mb-2 line-clamp-2 leading-relaxed text-neutral-100 hover:text-neutral-200 transition-colors">
        {item.title}
      </h3>
      
      {item.summary && (
        <p className="text-sm text-neutral-400 mb-3 line-clamp-2 leading-relaxed">
          {item.summary}
        </p>
      )}
      
      <div className="flex items-center justify-end">
        <span className="text-xs text-neutral-500 hover:text-neutral-400 transition-colors flex items-center gap-1">
          Читать <span className="text-xs">↗</span>
        </span>
      </div>
    </a>
  );
}

export default function NewsFeed() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    const loadNews = async () => {
      setLoading(true);
      
      try {
        const response = await fetch('/api/news');
        if (response.ok) {
          const data = await response.json();
          if (data.items && Array.isArray(data.items)) {
            setNews(data.items);
          } else {
            console.warn('API вернул неожиданный формат данных');
            setNews([]);
          }
        } else {
          console.warn('API недоступно');
          setNews([]);
        }
        setLastUpdate(new Date());
      } catch (error) {
        console.error('Ошибка загрузки новостей:', error);
        setNews([]);
      } finally {
        setLoading(false);
      }
    };

    loadNews();
    
    // Автообновление каждые 10 минут
    const interval = setInterval(loadNews, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const filteredNews = Array.isArray(news) ? news.filter(item => {
    const sourceMatch = selectedSource === 'all' || 
      (selectedSource === 'belarus' && NEWS_SOURCES.belarus.includes(item.source)) ||
      (selectedSource === 'poland' && NEWS_SOURCES.poland.includes(item.source));
    
    const searchMatch = searchQuery === '' || 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.summary && item.summary.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return sourceMatch && searchMatch;
  }) : [];

  const refreshNews = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/news');
      if (response.ok) {
        const data = await response.json();
        if (data.items && Array.isArray(data.items)) {
          setNews(data.items);
        }
      }
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Ошибка обновления новостей:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && news.length === 0) {
    return (
      <div className="w-full max-w-3xl mx-auto space-y-4">
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 animate-pulse">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-4 w-4 bg-neutral-700 rounded"></div>
                <div className="h-3 bg-neutral-700 rounded w-1/4"></div>
                <div className="h-3 bg-neutral-700 rounded w-12"></div>
              </div>
              <div className="h-4 bg-neutral-700 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-neutral-700 rounded w-full mb-2"></div>
              <div className="h-3 bg-neutral-700 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4">
      {/* Фильтры */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
        <select 
          className="bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-sm"
          value={selectedSource}
          onChange={(e) => setSelectedSource(e.target.value)}
        >
          <option value="all">Все источники</option>
          <option value="belarus">🤍❤️🤍 Белорусские СМИ</option>
          <option value="poland">🇵🇱 Польские СМИ</option>
        </select>
        
        <input 
          className="flex-1 bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-sm"
          placeholder="Поиск по заголовку"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

                 {/* Список новостей с прокруткой */}
                 <div 
                   className="space-y-3 news-scroll overflow-y-auto" 
                   style={{
                     maxHeight: '60vh',
                     paddingRight: '8px'
                   }}
                 >
                   {filteredNews.length === 0 ? (
                     <div className="text-center text-neutral-400 py-8">
                       <div className="text-4xl mb-2">📭</div>
                       <p>Новостей по выбранным фильтрам не найдено</p>
                       <button 
                         onClick={() => {
                           setSelectedSource('all');
                           setSearchQuery('');
                         }}
                         className="text-neutral-300 hover:text-neutral-100 text-sm mt-2 underline"
                       >
                         Сбросить фильтры
                       </button>
                     </div>
                   ) : (
                     filteredNews.map(item => (
                       <NewsItemComponent key={item.id} item={item} />
                     ))
                   )}
                 </div>

      {/* Кнопка обновления */}
      <div className="text-center">
        <button 
          onClick={refreshNews}
          disabled={loading}
          className="text-xs text-neutral-400 hover:text-neutral-300 transition-colors disabled:opacity-50 flex items-center gap-1 mx-auto"
        >
          {loading ? (
            <>
              <div className="w-3 h-3 border border-neutral-400 border-t-transparent rounded-full animate-spin"></div>
              Обновление...
            </>
          ) : (
            <>
              🔄 Обновить новости
            </>
          )}
        </button>
        {lastUpdate && (
          <div className="text-xs text-neutral-500 mt-1">
            Последнее обновление: {dayjs(lastUpdate).format('HH:mm')}
          </div>
        )}
      </div>
    </div>
  );
}

"use client";
import { useEffect, useMemo, useState } from "react";
import NewsFilters from "./NewsFilters";

type Item = {
  id: string;
  title: string;
  link: string;
  source: string;
  published: string;
  summary?: string;
};

export default function NewsList() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<{ s?: string; q?: string }>({});

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/news");
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || "Ошибка загрузки новостей");
        }
        
        setItems(data.items || []);
        setError(null);
      } catch (err) {
        console.error("Ошибка загрузки новостей:", err);
        setError(err instanceof Error ? err.message : "Произошла ошибка");
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  // Получаем уникальные источники
  const sources = useMemo(() => {
    return Array.from(new Set(items.map(item => item.source))).sort();
  }, [items]);

  // Фильтруем новости
  const filteredItems = useMemo(() => {
    return items
      .filter(item => {
        if (filters.s && item.source !== filters.s) return false;
        if (filters.q && !item.title.toLowerCase().includes(filters.q.toLowerCase())) return false;
        return true;
      })
      .slice(0, 100); // Максимум 100 новостей в выдаче
  }, [items, filters]);

  // Форматирование даты
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      
      if (diffHours < 1) {
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        return `${diffMinutes} мин назад`;
      } else if (diffHours < 24) {
        return `${diffHours} ч назад`;
      } else {
        return date.toLocaleDateString('ru-RU', { 
          day: 'numeric', 
          month: 'short',
          year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
        });
      }
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-pulse text-neutral-400">Загружаем новости...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-400 py-8">
        <p>Ошибка: {error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 px-4 py-2 bg-neutral-800 rounded-xl hover:bg-neutral-700 transition-colors"
        >
          Попробовать снова
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <NewsFilters sources={sources} onChange={setFilters} />
      
      <div className="grid gap-3 max-h-[60vh] overflow-y-auto news-scroll">
        {filteredItems.map(item => (
          <a
            key={item.id}
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-2xl border border-neutral-800 bg-neutral-900 p-4 hover:bg-neutral-800 hover:border-neutral-700 transition-all duration-200"
          >
            <div className="flex items-baseline gap-2 text-xs text-neutral-500">
              <span className="text-green-500">{item.source}</span>
              <span>•</span>
              <span>{formatDate(item.published)}</span>
            </div>
            
            <h3 className="text-base font-medium mt-1 text-neutral-100 line-clamp-2">
              {item.title}
            </h3>
            
            {item.summary && (
              <p className="text-sm text-neutral-400 mt-2 line-clamp-2">
                {item.summary}
              </p>
            )}
          </a>
        ))}
        
        {filteredItems.length === 0 && (
          <div className="text-center py-8">
            <p className="text-neutral-400 text-sm">
              {filters.q || filters.s 
                ? "Ничего не найдено. Попробуйте изменить параметры поиска." 
                : "Пока пусто. Новости появятся после первого обновления."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

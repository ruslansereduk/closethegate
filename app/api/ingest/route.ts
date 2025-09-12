import Parser from "rss-parser";
import { FEEDS } from "@/lib/feeds";
import { Item, normalizeItem, deduplicateItems, sortItemsByDate } from "@/lib/normalize";
import { saveItems } from "@/lib/store";
import { NextResponse } from "next/server";

// Ключевые слова для фильтрации новостей о границе Польша-Беларусь
const BORDER_KEYWORDS = [
  // Русские ключевые слова
  'граница', 'пограничн', 'кпп', 'пересечение', 'польш', 'беларус', 'брест', 'тересполь',
  'очередь', 'задержк', 'проверк', 'документ', 'паспорт', 'виза', 'въезд', 'выезд',
  'грузовик', 'фура', 'транспорт', 'логистик', 'экспорт', 'импорт',
  // Польские ключевые слова
  'granica', 'przejście', 'białoruś', 'polska', 'terespole', 'brześć', 'kolejka', 'opóźnienie',
  'kontrola', 'dokument', 'paszport', 'wiza', 'wjazd', 'wyjazd', 'ciężarówka', 'transport',
  'logistyka', 'eksport', 'import', 'straż graniczna', 'punkt kontroli'
];

const parser = new Parser({ 
  timeout: 15000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (compatible; CloseTheGate/1.0; +https://closethegate.eu)'
  }
});

// Функция для проверки релевантности новости
function isRelevantToBorder(title: string, summary: string): boolean {
  const text = `${title} ${summary}`.toLowerCase();
  
  // Проверяем наличие ключевых слов
  const hasKeywords = BORDER_KEYWORDS.some(keyword => 
    text.includes(keyword.toLowerCase())
  );
  
  // Дополнительная проверка на упоминание обеих стран
  const hasBothCountries = (
    (text.includes('польш') || text.includes('polska') || text.includes('poland')) &&
    (text.includes('беларус') || text.includes('białoruś') || text.includes('belarus'))
  );
  
  return hasKeywords || hasBothCountries;
}

export const runtime = 'nodejs';

export async function GET(request: Request) {
  // Проверка авторизации для cron job (опционально)
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results: Item[] = [];
  const errors: string[] = [];
  
  // Собираем новости из всех источников
  for (const feed of FEEDS) {
    try {
      console.log(`Загружаем RSS: ${feed.source}`);
      const feedData = await parser.parseURL(feed.url);
      
      // Нормализуем каждую запись и фильтруем по релевантности
      for (const item of feedData.items || []) {
        const normalizedItem = normalizeItem(item, feed.source);
        if (normalizedItem) {
          // Проверяем релевантность новости о границе
          if (isRelevantToBorder(normalizedItem.title, normalizedItem.summary || '')) {
            results.push(normalizedItem);
          }
        }
      }
    } catch (error) {
      const errorMsg = `Ошибка загрузки ${feed.source}: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(errorMsg);
      errors.push(errorMsg);
    }
  }
  
  // Дедупликация и сортировка
  const uniqueItems = deduplicateItems(results);
  const sortedItems = sortItemsByDate(uniqueItems);
  
  // Сохраняем в хранилище
  await saveItems(sortedItems);
  
  // Возвращаем статистику
  return NextResponse.json({
    ok: true,
    timestamp: new Date().toISOString(),
    sources: {
      total: FEEDS.length,
      successful: FEEDS.length - errors.length,
      failed: errors.length
    },
    items: {
      collected: results.length,
      unique: sortedItems.length
    },
    errors: errors.length > 0 ? errors : undefined
  });
}

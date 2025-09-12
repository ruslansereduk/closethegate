import { z } from "zod";

export const ItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  link: z.string().url(),
  source: z.string(),
  published: z.string(),
  summary: z.string().optional()
});

export type Item = z.infer<typeof ItemSchema>;

// Функция для безопасной нормализации элемента RSS
export function normalizeItem(
  rawItem: any,
  source: string
): Item | null {
  try {
    const item: Item = {
      id: rawItem.guid || rawItem.link || `${source}:${rawItem.title}`,
      title: rawItem.title || "",
      link: rawItem.link || "",
      source: source,
      published: rawItem.isoDate || rawItem.pubDate || new Date().toISOString(),
      summary: rawItem.contentSnippet || rawItem.content || ""
    };
    
    // Валидация через zod
    return ItemSchema.parse(item);
  } catch (error) {
    // Если не удалось нормализовать, возвращаем null
    return null;
  }
}

// Функция для дедупликации новостей
export function deduplicateItems(items: Item[]): Item[] {
  const map = new Map<string, Item>();
  
  for (const item of items) {
    const key = `${item.source}:${item.link}`;
    if (!map.has(key)) {
      map.set(key, item);
    }
  }
  
  return Array.from(map.values());
}

// Функция для сортировки по дате публикации (новые первые)
export function sortItemsByDate(items: Item[]): Item[] {
  return items.sort((a, b) => {
    const dateA = new Date(a.published).getTime();
    const dateB = new Date(b.published).getTime();
    return dateB - dateA;
  });
}

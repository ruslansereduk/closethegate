import { getItems } from "@/lib/store";
import { NextResponse } from "next/server";

export const runtime = 'edge';

export async function GET() {
  try {
    const items = await getItems();
    
    // Возвращаем с кешированием
    return NextResponse.json(
      { items },
      { 
        headers: { 
          "content-type": "application/json",
          "cache-control": "public, max-age=30, stale-while-revalidate=300"
        }
      }
    );
  } catch (error) {
    console.error("Ошибка получения новостей:", error);
    return NextResponse.json(
      { 
        items: [],
        error: "Не удалось загрузить новости"
      },
      { 
        status: 500,
        headers: { 
          "content-type": "application/json"
        }
      }
    );
  }
}
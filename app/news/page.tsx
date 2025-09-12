import dynamic from "next/dynamic";
import type { Metadata } from "next";

// Динамический импорт для отключения SSR
const NewsList = dynamic(() => import("@/components/NewsList"), { 
  ssr: false,
  loading: () => (
    <div className="flex justify-center items-center min-h-[200px]">
      <div className="animate-pulse text-neutral-400">Загружаем модуль новостей...</div>
    </div>
  )
});

export const metadata: Metadata = {
  title: "Закрытие границ Польша-Беларусь — Close the GATE",
  description: "Актуальные новости о закрытии границы между Польшей и Беларусью. Последняя неделя и будущие планы по закрытию КПП.",
  openGraph: {
    title: "Закрытие границ Польша-Беларусь — Close the GATE",
    description: "Новости о закрытии границы между Польшей и Беларусью",
    type: "website",
  },
};

export default function NewsPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-10 space-y-6 min-h-screen">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-neutral-100">Закрытие границ</h1>
        <p className="text-sm text-neutral-500">
          Актуальные новости о закрытии границы Польша-Беларусь.<br />
          Последняя неделя и будущие планы по закрытию КПП.
        </p>
      </div>
      
      <NewsList />
    </main>
  );
}

import Countdown from "@/components/Countdown";
import ChatBox from "@/components/ChatBox";
import DeadlineNotifications from "@/components/DeadlineNotifications";

function TestButton() {
  return (
    <div className="fixed bottom-4 left-4 z-50 px-3 py-2 bg-purple-900/80 border border-purple-700 rounded-lg text-purple-100 text-xs">
      ✨ Уведомления каждые 30 сек
    </div>
  );
}

function Headline() {
  return (
    <div className="text-center space-y-3 animate-fade-in-up">
      <div className="text-lg sm:text-xl md:text-2xl font-bold tracking-wide hover-lift px-2">
        ОТЧЕТ ДО СУДНОГО ДНЯ ЗАКРЫТИЯ ГРАНИЦЫ
      </div>
      <div className="text-xs sm:text-sm opacity-70 animate-slide-in-right px-2" style={{ animationDelay: '0.2s' }}>
        Ироничная хроника очереди перед шлагбаумом
      </div>
    </div>
  );
}

function Bar() {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 text-xs opacity-70 animate-fade-in-up px-2" style={{ animationDelay: '0.6s' }}>
      <span>Статус</span>
      <span className="inline-flex items-center gap-2 rounded-full bg-neutral-900 px-3 py-1 border border-neutral-800 hover-lift">
        <span className="size-2 animate-pulse rounded-full bg-emerald-400" />
        <span className="text-center">Сейчас открыто по слухам</span>
      </span>
    </div>
  );
}

export default function Page() {
  return (
    <>
      <DeadlineNotifications />
      <TestButton />
      <main className="max-w-3xl mx-auto px-4 py-6 sm:py-10 space-y-6 sm:space-y-10">
        <Headline />
        <div className="animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
          <Countdown />
        </div>
        <Bar />
        <section className="space-y-4 animate-fade-in-up" style={{ animationDelay: '0.8s' }}>
          <div className="text-center text-sm opacity-80">
            Сайт шуточный, проверяйте официальные источники перед поездкой
          </div>
          <ChatBox />
        </section>
        <footer className="text-center text-xs opacity-60 animate-fade-in-up" style={{ animationDelay: '1s' }}>
          Секундомер тикает, чемоданы не нервничают
        </footer>
      </main>
    </>
  );
}

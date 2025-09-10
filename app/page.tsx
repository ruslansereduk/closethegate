import Countdown from "@/components/Countdown";
import ChatBox from "@/components/ChatBox";
import DeadlineNotifications from "@/components/DeadlineNotifications";
import ErrorBoundary from "@/components/ErrorBoundary";

function TestButton() {
  return (
    <div className="fixed bottom-4 left-4 z-50 px-3 py-2 bg-secondary/80 border border-border rounded-full text-foreground/90 text-xs shadow-lg">
      ✨ Уведомления каждые 30 сек
    </div>
  );
}

function Headline() {
  return (
    <div className="text-center space-y-3 animate-fade-in-up">
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight px-2">
        Таймер до судного дня закрытия границы
      </h1>
      <p className="text-sm sm:text-base text-muted-foreground animate-slide-in-right px-2" style={{ animationDelay: '0.2s' }}>
        Ироничная хроника очереди перед шлагбаумом
      </p>
    </div>
  );
}

function Bar() {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 text-xs text-muted-foreground animate-fade-in-up px-2" style={{ animationDelay: '0.6s' }}>
      <span className="uppercase tracking-wide">Статус</span>
      <span className="inline-flex items-center gap-2 rounded-md bg-secondary px-3 py-1 border border-border">
        <span className="w-2 h-2 animate-pulse rounded-full bg-primary" />
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
      <main className="container py-6 sm:py-10 space-y-6 sm:space-y-10">
        <Headline />
        <div className="animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
          <Countdown />
        </div>
        <Bar />
        <section id="chat" className="space-y-4 animate-fade-in-up" style={{ animationDelay: '0.8s' }}>
          <p className="text-center text-sm text-muted-foreground">
            Сайт шуточный, сверяйтесь с официальными источниками перед поездкой.
          </p>
          <ErrorBoundary>
            <ChatBox />
          </ErrorBoundary>
        </section>
        <footer className="text-center space-y-2 animate-fade-in-up" style={{ animationDelay: '1s' }}>
          <p className="text-xs text-muted-foreground">
            Секундомер тикает, чемоданы не нервничают
          </p>
          <p className="text-xs">
            <a href="/donate" className="text-muted-foreground hover:text-primary transition-colors duration-200">
              ☕ Поддержать проект
            </a>
          </p>
        </footer>
      </main>
    </>
  );
}

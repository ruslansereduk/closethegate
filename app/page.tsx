import Countdown from "@/components/Countdown";
import ChatBox from "@/components/ChatBox";
import DeadlineNotifications from "@/components/DeadlineNotifications";
import ErrorBoundary from "@/components/ErrorBoundary";


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

function OfficialStatement() {
  return (
    <div className="w-full max-w-2xl mx-auto px-2 sm:px-4 md:px-0 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
      <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 text-sm font-medium text-primary">
            <span>📢</span>
            <span>Официальное заявление</span>
          </div>
          <blockquote className="text-sm leading-relaxed text-foreground italic">
            "Граница Польши и Беларуси будет закрыта на неопределённый срок, заявил глава МВД Польши Марчин Кервинский"
          </blockquote>
          <p className="text-xs text-muted-foreground">
            «Закрытие границы бессрочное. Мы будем постоянно анализировать ситуацию».
          </p>
          <div className="text-xs text-muted-foreground pt-2 border-t border-border">
            Источник: Министерство внутренних дел Польши
          </div>
        </div>
      </div>
    </div>
  );
}

function Bar() {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 text-xs text-muted-foreground animate-fade-in-up px-2 py-2" style={{ animationDelay: '0.7s' }}>
      <span className="uppercase tracking-wide">Статус границы</span>
      <span className="inline-flex items-center gap-2 rounded-md bg-secondary px-3 py-1 border border-border">
        <span className="w-2 h-2 animate-pulse rounded-full bg-primary" />
        <span className="text-center">ЗАКРЫТО</span>
      </span>
    </div>
  );
}

export default function Page() {
  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <DeadlineNotifications />
      <main className="container py-6 sm:py-10 space-y-4 sm:space-y-6 flex-1 overflow-y-auto overflow-x-hidden">
        <Headline />
        <OfficialStatement />
        <div className="animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
          <Countdown />
        </div>
        <Bar />

        {/* Блок консультации */}
        <div className="animate-fade-in-up" style={{ animationDelay: '0.8s' }}>
          <div className="w-full max-w-2xl mx-auto px-2 sm:px-4 md:px-0">
            <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center gap-2 text-sm font-medium">
                <span>🆘</span>
                <span>Нужна консультация?</span>
              </div>
              <p className="text-xs text-muted-foreground">
                За справкой по вопросам пересечения границы
              </p>
              <p className="text-xs text-muted-foreground">
                Помощь от <span className="font-medium text-primary">Bysol</span>
              </p>
              <a 
                href="https://t.me/help_bysol" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors duration-200 hover-lift"
              >
                <span>📱</span>
                <span>Обратиться в Telegram</span>
              </a>
            </div>
            </div>
          </div>
        </div>

        <section id="chat" className="space-y-4 animate-fade-in-up flex-1" style={{ animationDelay: '0.9s' }}>
          <p className="text-center text-sm text-muted-foreground">
            Сайт шуточный, сверяйтесь с официальными источниками перед поездкой.
          </p>
          <ErrorBoundary>
            <ChatBox />
          </ErrorBoundary>
        </section>
      </main>
      <footer className="text-center space-y-2 animate-fade-in-up py-4" style={{ animationDelay: '1.3s' }}>
        <p className="text-xs text-muted-foreground">
          Секундомер тикает, чемоданы не нервничают
        </p>
        <p className="text-xs">
          <a href="/donate" className="text-muted-foreground hover:text-primary transition-colors duration-200">
            ☕ Поддержать проект
          </a>
        </p>
      </footer>
    </div>
  );
}

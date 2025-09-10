'use client';

import { useState } from 'react';
import { Copy, Coffee, Wallet, Check, ExternalLink } from 'lucide-react';

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Не удалось скопировать:', err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-2 px-3 py-2 bg-secondary/80 hover:bg-secondary border border-border rounded-md text-sm transition-all duration-200 hover-lift"
      title={`Скопировать ${label}`}
    >
      {copied ? (
        <>
          <Check className="w-4 h-4 text-primary" />
          <span className="text-primary">Скопировано!</span>
        </>
      ) : (
        <>
          <Copy className="w-4 h-4" />
          <span>Копировать</span>
        </>
      )}
    </button>
  );
}

function BuyMeCoffeeCard() {
  return (
    <div className="bg-card border border-border rounded-lg p-6 space-y-4 animate-fade-in-up hover-lift">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 border border-primary/20 rounded-lg">
          <Coffee className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Buy Me a Coffee</h3>
          <p className="text-sm text-muted-foreground">Простой способ поддержать проект</p>
        </div>
      </div>
      
      <p className="text-sm text-muted-foreground">
        Поддержите разработку CloseTheGate через популярную платформу для донатов
      </p>
      
      <a
        href="https://buymeacoffee.com/ruslansereduk"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 w-full justify-center px-4 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-md font-medium transition-all duration-200 hover-lift"
      >
        <Coffee className="w-5 h-5" />
        <span>Купить кофе</span>
        <ExternalLink className="w-4 h-4" />
      </a>
    </div>
  );
}

function CryptoCard() {
  const walletAddress = 'TEUURkru3BupLveiT8xcCCj8nHewQ4hewv';
  
  return (
    <div className="bg-card border border-border rounded-lg p-6 space-y-4 animate-fade-in-up hover-lift" style={{ animationDelay: '0.2s' }}>
      <div className="flex items-center gap-3">
        <div className="p-2 bg-secondary/50 border border-border rounded-lg">
          <Wallet className="w-6 h-6 text-foreground" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Криптовалюта</h3>
          <p className="text-sm text-muted-foreground">USDT в сети TRON (TRC20)</p>
        </div>
      </div>
      
      <p className="text-sm text-muted-foreground">
        Отправьте USDT на кошелек в сети TRON для поддержки проекта
      </p>
      
      <div className="space-y-3">
        <div className="p-3 bg-muted/50 border border-border rounded-md">
          <p className="text-xs text-muted-foreground mb-1">Адрес кошелька:</p>
          <p className="font-mono text-sm break-all">{walletAddress}</p>
        </div>
        
        <div className="flex gap-2">
          <CopyButton text={walletAddress} label="адрес кошелька" />
        </div>
        
        <div className="p-3 bg-accent/50 border border-accent-foreground/20 rounded-md">
          <p className="text-xs text-muted-foreground">
            ⚠️ <strong>Важно:</strong> Отправляйте только USDT в сети TRON (TRC20). 
            Переводы в других сетях будут потеряны!
          </p>
        </div>
      </div>
    </div>
  );
}

function ThankYouMessage() {
  return (
    <div className="text-center space-y-3 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
      <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full text-primary text-sm">
        <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        <span>Проект развивается благодаря вашей поддержке</span>
      </div>
      
      <p className="text-muted-foreground text-sm max-w-2xl mx-auto">
        CloseTheGate создан для развлечения и информирования сообщества. 
        Ваши донаты помогают поддерживать сервер, улучшать функционал и добавлять новые возможности.
      </p>
    </div>
  );
}

export default function DonatePage() {
  return (
    <main className="container py-6 sm:py-10 space-y-8">
      {/* Заголовок */}
      <div className="text-center space-y-3 animate-fade-in-up">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight">
          Поддержать проект
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Ваши донаты помогают развивать CloseTheGate
        </p>
      </div>

      {/* Карточки с вариантами доната */}
      <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
        <BuyMeCoffeeCard />
        <CryptoCard />
      </div>

      {/* Благодарность */}
      <ThankYouMessage />

      {/* Навигация назад */}
      <div className="text-center animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
        <a
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
        >
          ← Вернуться к таймеру
        </a>
      </div>
    </main>
  );
}

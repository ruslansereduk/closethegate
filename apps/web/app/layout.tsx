import './globals.css'

export const metadata = {
  title: "Отчет до Судного Дня",
  description: "Ироничный счетчик и анонимный чат"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}

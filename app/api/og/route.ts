import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET() {
  const deadlineIso = process.env.NEXT_PUBLIC_DEADLINE_ISO || '2025-01-01T00:00:00+02:00';
  const now = new Date();
  const deadline = new Date(deadlineIso);
  const diff = Math.max(0, deadline.getTime() - now.getTime());
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  const time = `${String(days).padStart(2, '0')}:${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background: '#0B0D0F',
          color: '#E6E6E6',
          fontFamily: 'ui-sans-serif, system-ui, Inter, Arial'
        }}
      >
        <div style={{ fontSize: 42, opacity: 0.8 }}>До закрытия остается</div>
        <div style={{ fontSize: 120, fontWeight: 700, color: '#39FF88' }}>{time}</div>
        <div style={{ fontSize: 24, opacity: 0.7 }}>Дни · Часы · Минуты · Секунды</div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}



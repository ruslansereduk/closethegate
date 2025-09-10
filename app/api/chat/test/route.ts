import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Конфигурация Supabase
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qvwwmtgtzfdojulugngf.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2d3dtdGd0emZkb2p1bHVnbmdmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzUwMTg3NSwiZXhwIjoyMDczMDc3ODc1fQ.kboDI9L44rBFFZzSqCGL7THYuXwehnT1hqC-_7AmUF0';

// Создание Supabase клиента
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export async function GET(request: NextRequest) {
  try {
    console.log('🔧 Тестирование Supabase подключения...');

    // Проверяем подключение
    const { data, error } = await supabase
      .from('messages')
      .select('id')
      .limit(1);

    if (error) {
      console.error('❌ Ошибка Supabase:', error);

      // Если таблица не существует, пытаемся создать её
      if (error.code === 'PGRST116') {
        console.log('⚠️ Таблица messages не существует, создаем...');

        // Пытаемся создать таблицу через SQL
        const { error: createError } = await supabase.rpc('exec_sql', {
          sql: `
            CREATE TABLE IF NOT EXISTS messages (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              text TEXT NOT NULL,
              nick VARCHAR(24) NOT NULL,
              ts BIGINT NOT NULL,
              reactions JSONB DEFAULT '{}'::jsonb,
              user_color VARCHAR(7),
              user_status VARCHAR(50),
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE INDEX IF NOT EXISTS idx_messages_ts ON messages(ts DESC);
            CREATE INDEX IF NOT EXISTS idx_messages_id_ts ON messages(id, ts DESC);
          `
        });

        if (createError) {
          console.log('❌ Не удалось создать таблицу через RPC');
          console.log('📋 SQL для ручного создания:');
          console.log(`
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text TEXT NOT NULL,
  nick VARCHAR(24) NOT NULL,
  ts BIGINT NOT NULL,
  reactions JSONB DEFAULT '{}'::jsonb,
  user_color VARCHAR(7),
  user_status VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_messages_ts ON messages(ts DESC);
CREATE INDEX idx_messages_id_ts ON messages(id, ts DESC);
          `);
          return NextResponse.json({
            error: 'Таблица не создана',
            message: 'Создайте таблицу вручную в Supabase Dashboard',
            sql: 'Смотрите логи сервера',
            details: error.message
          }, { status: 500 });
        }

        return NextResponse.json({
          status: 'Таблица создана успешно',
          message: 'Теперь чат должен работать'
        });
      }

      return NextResponse.json({
        error: 'Ошибка Supabase',
        details: error.message,
        code: error.code
      }, { status: 500 });
    }

    // Проверяем количество сообщений
    const { count, error: countError } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true });

    return NextResponse.json({
      status: 'Supabase работает!',
      supabase_url: SUPABASE_URL,
      table_exists: true,
      messages_count: count || 0,
      key_valid: true
    });

  } catch (error: any) {
    console.error('❌ Ошибка тестирования:', error);
    return NextResponse.json({
      error: 'Ошибка тестирования',
      message: error.message,
      supabase_url: SUPABASE_URL
    }, { status: 500 });
  }
}

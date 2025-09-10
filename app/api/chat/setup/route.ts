import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Конфигурация Supabase
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qvwwmtgtzfdojulugngf.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'sbp_260db946c59e39c25b700f555d0e4b74d85ca333';

// Создание Supabase клиента
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export async function GET(request: NextRequest) {
  try {
    // Проверяем подключение к Supabase
    const { data: testData, error: testError } = await supabase
      .from('messages')
      .select('id')
      .limit(1);

    if (testError && testError.code === 'PGRST116') {
      // Таблица не существует, создаем её
      console.log('Создание таблицы messages...');

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

          ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

          CREATE POLICY "Enable all access for service role" ON messages
          FOR ALL USING (true);
        `
      });

      if (createError) {
        console.log('Не удалось создать таблицу через RPC. SQL для ручного создания:');
        console.log(`
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

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all access for service role" ON messages
FOR ALL USING (true);
        `);
        return NextResponse.json({
          error: 'Таблица не создана',
          message: 'Создайте таблицу вручную в Supabase Dashboard',
          sql: 'Смотрите логи сервера'
        }, { status: 500 });
      }

      return NextResponse.json({
        status: 'Таблица создана успешно',
        message: 'Теперь чат должен работать'
      });
    }

    // Таблица существует
    const { count, error: countError } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      return NextResponse.json({
        error: 'Ошибка подсчета сообщений',
        details: countError.message
      }, { status: 500 });
    }

    return NextResponse.json({
      status: 'База данных готова',
      messages_count: count || 0,
      supabase_url: SUPABASE_URL,
      service_key_valid: true
    });

  } catch (error: any) {
    console.error('Setup error:', error);
    return NextResponse.json({
      error: 'Ошибка настройки',
      message: error.message,
      supabase_url: SUPABASE_URL,
      service_key: SUPABASE_SERVICE_KEY.substring(0, 10) + '...'
    }, { status: 500 });
  }
}

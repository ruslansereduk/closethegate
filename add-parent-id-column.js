const { createClient } = require('@supabase/supabase-js');

// Конфигурация Supabase
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qvwwmtgtzfdojulugngf.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2d3dtdGd0emZkb2p1bHVnbmdmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzUwMTg3NSwiZXhwIjoyMDczMDc3ODc1fQ.kboDI9L44rBFFZzSqCGL7THYuXwehnT1hqC-_7AmUF0';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function addParentIdColumn() {
  try {
    console.log('🔧 Добавляем колонку parent_id в таблицу messages...');
    
    // Добавляем колонку parent_id
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE messages 
        ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES messages(id);
      `
    });

    if (error) {
      console.error('❌ Ошибка добавления колонки:', error);
      return;
    }

    console.log('✅ Колонка parent_id успешно добавлена');

    // Создаем индекс для parent_id
    const { data: indexData, error: indexError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE INDEX IF NOT EXISTS idx_messages_parent_id ON messages(parent_id);
      `
    });

    if (indexError) {
      console.error('❌ Ошибка создания индекса:', indexError);
    } else {
      console.log('✅ Индекс для parent_id создан');
    }

    // Проверяем структуру таблицы
    const { data: schemaData, error: schemaError } = await supabase
      .from('messages')
      .select('*')
      .limit(1);

    if (schemaError) {
      console.error('❌ Ошибка проверки схемы:', schemaError);
    } else {
      console.log('📋 Обновленная структура таблицы:');
      console.log('   - id: uuid');
      console.log('   - text: text');
      console.log('   - nick: varchar');
      console.log('   - ts: bigint');
      console.log('   - reactions: jsonb');
      console.log('   - user_color: varchar');
      console.log('   - user_status: varchar');
      console.log('   - parent_id: uuid (NEW!)');
      console.log('   - created_at: timestamp');
    }

  } catch (error) {
    console.error('❌ Общая ошибка:', error);
  }
}

addParentIdColumn();

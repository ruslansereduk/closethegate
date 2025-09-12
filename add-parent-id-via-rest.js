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

async function addParentIdColumnViaRest() {
  try {
    console.log('🔧 Пытаемся добавить колонку parent_id через REST API...');
    
    // Попробуем выполнить SQL через REST API
    const { data, error } = await supabase
      .from('messages')
      .select('parent_id')
      .limit(1);

    if (error && error.code === 'PGRST116') {
      console.log('❌ Колонка parent_id не существует. Нужно добавить её через Supabase Dashboard.');
      console.log('📋 Выполните следующий SQL в Supabase Dashboard:');
      console.log('');
      console.log('ALTER TABLE messages ADD COLUMN parent_id UUID REFERENCES messages(id);');
      console.log('CREATE INDEX idx_messages_parent_id ON messages(parent_id);');
      console.log('');
      return false;
    } else if (error) {
      console.error('❌ Ошибка проверки колонки:', error);
      return false;
    } else {
      console.log('✅ Колонка parent_id уже существует!');
      return true;
    }

  } catch (error) {
    console.error('❌ Общая ошибка:', error);
    return false;
  }
}

addParentIdColumnViaRest();

-- Создание таблицы messages для чата
-- Выполните этот SQL в Supabase Dashboard → SQL Editor

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

-- Создание индексов для производительности
CREATE INDEX IF NOT EXISTS idx_messages_ts ON messages(ts DESC);
CREATE INDEX IF NOT EXISTS idx_messages_id_ts ON messages(id, ts DESC);

-- Включение Row Level Security (опционально, для безопасности)
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Создание политики для полного доступа (для сервис-ключа)
CREATE POLICY "Enable all access for service role" ON messages
FOR ALL USING (true);

-- Проверка создания таблицы
SELECT 'Таблица messages создана успешно!' as status;

-- Создание таблицы messages для чата в Supabase
-- Выполните этот SQL в Supabase Dashboard → SQL Editor

-- Создание таблицы messages
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

-- Включение Row Level Security (опционально, но рекомендуется)
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Создание политик для доступа
CREATE POLICY "Enable read access for all users" ON messages
FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON messages
FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON messages
FOR UPDATE USING (true);

-- Проверка создания таблицы
SELECT 'Таблица messages создана успешно в Supabase!' as status;

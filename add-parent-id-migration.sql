-- Добавляем колонку parent_id в таблицу messages
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES messages(id);

-- Создаем индекс для parent_id для быстрого поиска ответов
CREATE INDEX IF NOT EXISTS idx_messages_parent_id ON messages(parent_id);

-- Создаем индекс для комбинированного поиска (parent_id + ts)
CREATE INDEX IF NOT EXISTS idx_messages_parent_ts ON messages(parent_id, ts DESC);

-- Проверяем структуру таблицы
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'messages' 
ORDER BY ordinal_position;

-- Добавляем колонку parent_id в таблицу messages
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES messages(id);

-- Создаем индекс для parent_id для быстрого поиска ответов
CREATE INDEX IF NOT EXISTS idx_messages_parent_id ON messages(parent_id);

-- Создаем индекс для комбинированного поиска (parent_id + ts)
CREATE INDEX IF NOT EXISTS idx_messages_parent_ts ON messages(parent_id, ts DESC);

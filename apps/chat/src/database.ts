import { Pool, PoolClient } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

export async function initDatabase() {
  const client = await pool.connect();
  try {
    // Создаем таблицу сообщений
    await client.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        text TEXT NOT NULL,
        nick VARCHAR(24) NOT NULL,
        ts BIGINT NOT NULL,
        reactions JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Создаем индекс для быстрого поиска по времени
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_messages_ts ON messages(ts DESC)
    `);

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  } finally {
    client.release();
  }
}

export async function saveMessage(message: { id: string; text: string; nick: string; ts: number; reactions?: { [emoji: string]: number } }) {
  const client = await pool.connect();
  try {
    await client.query(
      'INSERT INTO messages (id, text, nick, ts, reactions) VALUES ($1, $2, $3, $4, $5)',
      [message.id, message.text, message.nick, message.ts, JSON.stringify(message.reactions || {})]
    );
  } catch (error) {
    console.error('Error saving message:', error);
  } finally {
    client.release();
  }
}

export async function getRecentMessages(limit: number = 30) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      'SELECT id, text, nick, ts, reactions FROM messages ORDER BY ts DESC LIMIT $1',
      [limit]
    );
    
    return result.rows.map(row => ({
      id: row.id,
      text: row.text,
      nick: row.nick,
      ts: parseInt(row.ts),
      reactions: row.reactions || {}
    })).reverse(); // Возвращаем в хронологическом порядке
  } catch (error) {
    console.error('Error getting recent messages:', error);
    return [];
  } finally {
    client.release();
  }
}

export async function updateMessageReactions(messageId: string, reactions: { [emoji: string]: number }) {
  const client = await pool.connect();
  try {
    await client.query(
      'UPDATE messages SET reactions = $1 WHERE id = $2',
      [JSON.stringify(reactions), messageId]
    );
  } catch (error) {
    console.error('Error updating message reactions:', error);
  } finally {
    client.release();
  }
}

export async function cleanupOldMessages() {
  const client = await pool.connect();
  try {
    // Удаляем сообщения старше 7 дней
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    await client.query(
      'DELETE FROM messages WHERE ts < $1',
      [sevenDaysAgo]
    );
    console.log('Old messages cleaned up');
  } catch (error) {
    console.error('Error cleaning up old messages:', error);
  } finally {
    client.release();
  }
}

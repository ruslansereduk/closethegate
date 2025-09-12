const { Pool } = require('pg');

// Продакшн URL из .env.local
const PROD_DATABASE_URL = 'postgresql://postgres.qvwwmtgtzfdojulugngf:EnekValli123!@aws-1-eu-central-1.pooler.supabase.com:6543/postgres';

async function checkTableSchema() {
  console.log('🔍 Проверяем структуру таблицы messages...\n');
  
  const pool = new Pool({
    connectionString: PROD_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    const client = await pool.connect();
    
    // Проверим структуру таблицы messages
    const schemaResult = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'messages' 
      AND table_schema = 'public'
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Структура таблицы messages:');
    schemaResult.rows.forEach(row => {
      console.log(`   - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
    // Проверим, есть ли данные
    const countResult = await client.query('SELECT COUNT(*) as count FROM messages');
    console.log(`\n💬 Количество сообщений: ${countResult.rows[0].count}`);
    
    // Посмотрим на несколько примеров сообщений
    if (countResult.rows[0].count > 0) {
      const sampleResult = await client.query('SELECT * FROM messages LIMIT 3');
      console.log('\n📝 Примеры сообщений:');
      sampleResult.rows.forEach((row, index) => {
        console.log(`   ${index + 1}. ID: ${row.id}, Nick: ${row.nick}, Text: ${row.text?.substring(0, 50)}...`);
      });
    }
    
    client.release();
    await pool.end();
    
  } catch (error) {
    console.log('❌ Ошибка при проверке схемы:');
    console.log(`   ${error.message}`);
    await pool.end();
  }
}

checkTableSchema();

const { Pool } = require('pg');

// Продакшн URL из .env.local
const PROD_DATABASE_URL = 'postgresql://postgres.qvwwmtgtzfdojulugngf:EnekValli123!@aws-1-eu-central-1.pooler.supabase.com:6543/postgres';

async function testProdConnection() {
  console.log('🔍 Тестирование подключения к продакшн БД...\n');
  
  const pool = new Pool({
    connectionString: PROD_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    const client = await pool.connect();
    console.log('✅ Успешное подключение к продакшн БД!');
    
    // Проверим версию PostgreSQL
    const versionResult = await client.query('SELECT version()');
    console.log(`📊 PostgreSQL: ${versionResult.rows[0].version.split(' ')[0]} ${versionResult.rows[0].version.split(' ')[1]}`);
    
    // Проверим доступные таблицы
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log(`📋 Доступные таблицы (${tablesResult.rows.length}):`);
    tablesResult.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });
    
    // Проверим таблицу messages если она есть
    const messagesCheck = await client.query(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_name = 'messages'
    `);
    
    if (messagesCheck.rows[0].count > 0) {
      const messagesCount = await client.query('SELECT COUNT(*) as count FROM messages');
      console.log(`💬 Сообщений в чате: ${messagesCount.rows[0].count}`);
    }
    
    client.release();
    await pool.end();
    
    console.log('\n✅ Продакшн БД готова к использованию!');
    return true;
  } catch (error) {
    console.log('❌ Ошибка подключения к продакшн БД:');
    console.log(`   ${error.message}`);
    await pool.end();
    return false;
  }
}

testProdConnection();

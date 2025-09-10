const { Pool } = require('pg');

// Попробуем разные варианты подключения к Railway DB
const testUrls = [
  'postgresql://postgres:password@tramway.proxy.rlwy.net:49628/railway',
  'postgresql://postgres:@tramway.proxy.rlwy.net:49628/railway',
  'postgresql://railway:@tramway.proxy.rlwy.net:49628/railway',
  'postgresql://postgres:password@tramway.proxy.rlwy.net:49628/postgres',
  'postgresql://postgres:@tramway.proxy.rlwy.net:49628/postgres',
  'postgresql://root:@tramway.proxy.rlwy.net:49628/railway',
  'postgresql://postgres:password@tramway.proxy.rlwy.net:49628/closethegate'
];

async function testConnection(url) {
  const pool = new Pool({
    connectionString: url,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    const client = await pool.connect();
    console.log(`✅ Успешное подключение: ${url.replace(/\/\/[^:]+:[^@]*@/, '//***:***@')}`);
    
    // Проверим версию PostgreSQL
    const result = await client.query('SELECT version()');
    console.log(`   PostgreSQL: ${result.rows[0].version.split(' ')[0]} ${result.rows[0].version.split(' ')[1]}`);
    
    // Проверим доступные базы данных
    const databases = await client.query('SELECT datname FROM pg_database WHERE datistemplate = false');
    console.log(`   Доступные БД: ${databases.rows.map(row => row.datname).join(', ')}`);
    
    client.release();
    await pool.end();
    return true;
  } catch (error) {
    console.log(`❌ Ошибка подключения: ${url.replace(/\/\/[^:]+:[^@]*@/, '//***:***@')}`);
    console.log(`   ${error.message}`);
    await pool.end();
    return false;
  }
}

async function testAllConnections() {
  console.log('🔍 Тестирование подключений к Railway базе данных...\n');
  
  for (const url of testUrls) {
    await testConnection(url);
    console.log('');
  }
}

testAllConnections().catch(console.error);

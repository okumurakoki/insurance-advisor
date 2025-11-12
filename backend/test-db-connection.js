const { Pool } = require('pg');

// 複数の接続文字列をテスト
const connectionStrings = [
    {
        name: 'Direct Connection (port 5432)',
        url: 'postgresql://postgres:Kohki04010081@db.rozunxmzoaaksmehefuj.supabase.co:5432/postgres'
    },
    {
        name: 'Transaction Pooler (port 6543)',
        url: 'postgres://postgres:Kohki04010081@db.rozunxmzoaaksmehefuj.supabase.co:6543/postgres?pgbouncer=true'
    },
    {
        name: 'Session Pooler (AWS endpoint)',
        url: 'postgresql://postgres.rozunxmzoaaksmehefuj:Kohki04010081@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres'
    }
];

async function testConnection(name, connectionString) {
    console.log(`\n🧪 Testing: ${name}`);
    console.log(`Connection: ${connectionString.substring(0, 50)}...`);

    const pool = new Pool({
        connectionString,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 10000,
        query_timeout: 10000,
    });

    try {
        const startTime = Date.now();
        const client = await pool.connect();
        const result = await client.query('SELECT NOW(), version()');
        const endTime = Date.now();

        console.log(`✅ SUCCESS (${endTime - startTime}ms)`);
        console.log(`   Server time: ${result.rows[0].now}`);
        console.log(`   PostgreSQL: ${result.rows[0].version.split(' ')[1]}`);

        client.release();
        await pool.end();
        return true;
    } catch (error) {
        console.log(`❌ FAILED: ${error.message}`);
        await pool.end();
        return false;
    }
}

async function runTests() {
    console.log('🔍 Supabase Database Connection Test\n');
    console.log('=' .repeat(60));

    for (const config of connectionStrings) {
        await testConnection(config.name, config.url);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✨ Test completed\n');
}

runTests();

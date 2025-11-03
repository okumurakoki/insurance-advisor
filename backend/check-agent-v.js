require('dotenv').config();
const { Pool } = require('pg');

async function checkAgentV() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL
    });

    try {
        console.log('=== Checking agent_v registration ===\n');

        // 1. Check if agent_v exists
        const agentResult = await pool.query(
            'SELECT id, user_id, name, email, account_type, parent_id, is_active, created_at FROM users WHERE user_id = $1',
            ['agent_v']
        );

        if (agentResult.rows.length === 0) {
            console.log('❌ agent_v does not exist in database');
            return;
        }

        console.log('✓ agent_v found:');
        console.log(JSON.stringify(agentResult.rows[0], null, 2));
        console.log('');

        const agentV = agentResult.rows[0];

        // 2. Check parent (agency001)
        console.log('=== Checking parent agency ===\n');
        const parentResult = await pool.query(
            'SELECT id, user_id, account_type, is_active FROM users WHERE id = $1',
            [agentV.parent_id]
        );

        if (parentResult.rows.length > 0) {
            console.log('✓ Parent agency found:');
            console.log(JSON.stringify(parentResult.rows[0], null, 2));
        } else {
            console.log('❌ Parent agency not found');
        }
        console.log('');

        // 3. Get all staff under agency001
        console.log('=== All staff under agency001 (parent_id=4) ===\n');
        const allStaffResult = await pool.query(
            'SELECT id, user_id, name, email, account_type, parent_id, is_active, created_at FROM users WHERE parent_id = 4 ORDER BY created_at DESC'
        );

        console.log('Total staff count: ' + allStaffResult.rows.length + '\n');
        allStaffResult.rows.forEach((staff, index) => {
            console.log((index + 1) + '. ' + staff.user_id + ' (id=' + staff.id + ')');
            console.log('   name: ' + (staff.name || 'NULL'));
            console.log('   email: ' + (staff.email || 'NULL'));
            console.log('   account_type: ' + staff.account_type);
            console.log('   is_active: ' + staff.is_active);
            console.log('   created_at: ' + staff.created_at);
            console.log('');
        });

        // 4. Check table structure
        console.log('=== Users table structure ===\n');
        const structureResult = await pool.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'users'
            ORDER BY ordinal_position
        `);

        structureResult.rows.forEach(col => {
            console.log(col.column_name + ': ' + col.data_type + ' (nullable: ' + col.is_nullable + ')');
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await pool.end();
    }
}

checkAgentV();

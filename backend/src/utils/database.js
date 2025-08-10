const mysql = require('mysql2/promise');

class Database {
    constructor() {
        this.pool = null;
    }

    async initialize() {
        if (!this.pool) {
            this.pool = mysql.createPool({
                host: process.env.DB_HOST || 'localhost',
                port: process.env.DB_PORT || 3306,
                user: process.env.DB_USER || 'root',
                password: process.env.DB_PASSWORD || '',
                database: process.env.DB_NAME || 'insurance_advisor_dev',
                waitForConnections: true,
                connectionLimit: 10,
                queueLimit: 0,
                enableKeepAlive: true,
                keepAliveInitialDelay: 0
            });

            try {
                const connection = await this.pool.getConnection();
                await connection.ping();
                connection.release();
                console.log('Database connection established');
            } catch (error) {
                console.error('Database connection failed:', error);
                throw error;
            }
        }
        return this.pool;
    }

    async query(sql, params) {
        try {
            const pool = await this.initialize();
            const [results] = await pool.execute(sql, params);
            return results;
        } catch (error) {
            console.error('Database query error:', error);
            throw error;
        }
    }

    async transaction(callback) {
        const pool = await this.initialize();
        const connection = await pool.getConnection();
        
        try {
            await connection.beginTransaction();
            const result = await callback(connection);
            await connection.commit();
            return result;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    async close() {
        if (this.pool) {
            await this.pool.end();
            this.pool = null;
            console.log('Database connection closed');
        }
    }
}

module.exports = new Database();
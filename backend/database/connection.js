 
// File Path: /backend/database/connection.js
// Database connection module for PostgreSQL
// REF-014: Database connection with testing capability

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

class DatabaseConnection {
    constructor() {
        this.pool = null;
        this.config = {
            user: process.env.DB_USER || 'postgres',
            host: process.env.DB_HOST || 'localhost',
            database: process.env.DB_NAME || 'web_automation',
            password: process.env.DB_PASSWORD || 'postgres',
            port: process.env.DB_PORT || 5432,
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
        };
    }

    async connect() {
        try {
            this.pool = new Pool(this.config);
            
            // Test the connection
            const client = await this.pool.connect();
            console.log('✓ Database connected successfully');
            client.release();
            
            return this.pool;
        } catch (error) {
            console.error('✗ Database connection failed:', error.message);
            throw error;
        }
    }

    async disconnect() {
        if (this.pool) {
            await this.pool.end();
            console.log('✓ Database disconnected');
        }
    }

    async query(text, params) {
        try {
            const result = await this.pool.query(text, params);
            return result;
        } catch (error) {
            console.error('Database query error:', error.message);
            throw error;
        }
    }

    async initializeSchema() {
        try {
            const schemaPath = path.join(__dirname, '../../database/schema.sql');
            const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
            
            await this.query(schemaSQL);
            console.log('✓ Database schema initialized');
        } catch (error) {
            console.error('✗ Schema initialization failed:', error.message);
            throw error;
        }
    }

    async testConnection() {
        try {
            const result = await this.query('SELECT NOW() as current_time, version() as db_version');
            console.log('✓ Database test successful');
            console.log('Current time:', result.rows[0].current_time);
            console.log('Database version:', result.rows[0].db_version);
            return true;
        } catch (error) {
            console.error('✗ Database test failed:', error.message);
            return false;
        }
    }
}

module.exports = DatabaseConnection;
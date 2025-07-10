require('dotenv').config();
const DatabaseConnection = require('./database/connection');

async function testDatabase() {
    const db = new DatabaseConnection();
    
    try {
        await db.connect();
        await db.testConnection();
        await db.initializeSchema();
        console.log('✓ All database tests passed!');
    } catch (error) {
        console.error('✗ Database test failed:', error.message);
    } finally {
        await db.disconnect();
    }
}

testDatabase();
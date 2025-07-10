require('dotenv').config();
const DatabaseConnection = require('./database/connection');

async function createTestUser() {
    const db = new DatabaseConnection();
    
    try {
        await db.connect();
        
        // Insert test user
        const result = await db.query(
            `INSERT INTO users (username, email, password_hash) 
             VALUES ($1, $2, $3) 
             ON CONFLICT (email) DO NOTHING
             RETURNING *`,
            ['testuser', 'test@example.com', 'placeholder_hash']
        );
        
        if (result.rows.length > 0) {
            console.log('✓ Test user created:', result.rows[0]);
        } else {
            console.log('✓ Test user already exists');
        }
        
        await db.disconnect();
        
    } catch (error) {
        console.error('✗ Failed to create test user:', error.message);
        await db.disconnect();
    }
}

createTestUser();
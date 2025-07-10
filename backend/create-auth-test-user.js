require('dotenv').config();
const DatabaseConnection = require('./database/connection');
const bcrypt = require('bcrypt');

async function createTestUser() {
    const db = new DatabaseConnection();
    
    try {
        await db.connect();
        console.log('Creating/updating test user with known password...');
        
        const testEmail = 'testauth@example.com';
        const testPassword = 'testpass123';
        const testUsername = 'testauth';
        
        // Delete existing test user if exists
        await db.query('DELETE FROM users WHERE email = $1', [testEmail]);
        console.log('✓ Deleted any existing test user');
        
        // Hash password
        const passwordHash = await bcrypt.hash(testPassword, 12);
        
        // Create new test user
        const result = await db.query(
            `INSERT INTO users (username, email, password_hash, created_at) 
             VALUES ($1, $2, $3, $4) 
             RETURNING id, username, email`,
            [testUsername, testEmail, passwordHash, new Date()]
        );
        
        console.log('✓ Test user created:');
        console.log(`   Email: ${testEmail}`);
        console.log(`   Password: ${testPassword}`);
        console.log(`   Username: ${testUsername}`);
        console.log(`   ID: ${result.rows[0].id}`);
        
        await db.disconnect();
        
    } catch (error) {
        console.error('✗ Failed to create test user:', error.message);
        await db.disconnect();
    }
}

createTestUser();
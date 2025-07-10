require('dotenv').config();
const DatabaseConnection = require('./database/connection');

async function checkTestUser() {
    const db = new DatabaseConnection();
    
    try {
        await db.connect();
        console.log('Checking existing users...');
        
        const result = await db.query(
            'SELECT id, username, email, created_at FROM users ORDER BY id'
        );
        
        console.log('Existing users:');
        result.rows.forEach(user => {
            console.log(`- ID: ${user.id}, Username: ${user.username}, Email: ${user.email}`);
        });
        
        await db.disconnect();
        
    } catch (error) {
        console.error('✗ Failed to check users:', error.message);
    }
}

checkTestUser();
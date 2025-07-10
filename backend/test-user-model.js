require('dotenv').config();
const User = require('./models/User');
const DatabaseConnection = require('./database/connection');

async function testUserModel() {
    const db = new DatabaseConnection();
    const userModel = new User();
    
    try {
        await db.connect();
        console.log('Testing User Model...');
        
        // Generate unique email for this test
        const timestamp = Date.now();
        const testEmail = `test${timestamp}@example.com`;
        const testUsername = `testuser${timestamp}`;
        
        // Test 1: Create user
        console.log('\n1. Creating test user...');
        const newUser = await userModel.create({
            username: testUsername,
            email: testEmail,
            password: 'password123'
        });
        console.log('✓ User created:', newUser.username);
        
        // Test 2: Find by email
        console.log('\n2. Finding user by email...');
        const foundUser = await userModel.findByEmail(testEmail);
        console.log('✓ User found:', foundUser.email);
        
        // Test 3: Authenticate user
        console.log('\n3. Testing authentication...');
        const authUser = await userModel.authenticate(testEmail, 'password123');
        console.log('✓ Authentication successful:', authUser ? 'Yes' : 'No');
        
        // Test 4: Wrong password
        console.log('\n4. Testing wrong password...');
        const wrongAuth = await userModel.authenticate(testEmail, 'wrongpassword');
        console.log('✓ Wrong password rejected:', wrongAuth ? 'No' : 'Yes');
        
        // Test 5: Update profile
        console.log('\n5. Updating user profile...');
        const updatedUser = await userModel.updateProfile(newUser.id, {
            username: `updated${timestamp}`
        });
        console.log('✓ Profile updated:', updatedUser.username);
        
        // Test 6: Get statistics
        console.log('\n6. Getting user statistics...');
        const stats = await userModel.getStatistics();
        console.log('✓ Statistics:', stats);
        
        // Test 7: Delete user
        console.log('\n7. Deleting test user...');
        await userModel.delete(newUser.id);
        console.log('✓ User deleted');
        
        console.log('\n✓ User Model test completed successfully!');
        
    } catch (error) {
        console.error('✗ User Model test failed:', error.message);
    } finally {
        await db.disconnect();
    }
}

testUserModel();
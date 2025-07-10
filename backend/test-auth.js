const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';

async function testAuth() {
    try {
        console.log('Testing Authentication API...');
        
        // Generate unique email for testing
        const timestamp = Date.now();
        const testEmail = `test${timestamp}@example.com`;
        const testUsername = `testuser${timestamp}`;
        
        // Test 1: Register user
        console.log('\n1. Registering new user...');
        const registerData = {
            username: testUsername,
            email: testEmail,
            password: 'password123'
        };
        
        const registerResponse = await axios.post(`${API_BASE}/auth/register`, registerData);
        console.log('✓ User registered:', registerResponse.data.user.username);
        console.log('✓ Token received:', registerResponse.data.token ? 'Yes' : 'No');
        
        // Test 2: Try to register same user again (should fail)
        console.log('\n2. Trying duplicate registration (should fail)...');
        try {
            await axios.post(`${API_BASE}/auth/register`, registerData);
        } catch (error) {
            console.log('✓ Duplicate registration blocked:', error.response.data.code);
        }
        
        // Test 3: Login with new user
        console.log('\n3. Logging in with new user...');
        const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
            email: testEmail,
            password: 'password123'
        });
        
        console.log('✓ Login successful:', loginResponse.data.user.username);
        const token = loginResponse.data.token;
        
        // Test 4: Try login with wrong password
        console.log('\n4. Testing wrong password (should fail)...');
        try {
            await axios.post(`${API_BASE}/auth/login`, {
                email: testEmail,
                password: 'wrongpassword'
            });
        } catch (error) {
            console.log('✓ Wrong password blocked:', error.response.data.code);
        }
        
        // Test 5: Test logout
        console.log('\n5. Testing logout...');
        const logoutResponse = await axios.post(`${API_BASE}/auth/logout`);
        console.log('✓ Logout successful:', logoutResponse.data.message);
        
        console.log('\n✓ Auth API test completed successfully!');
        
    } catch (error) {
        console.error('✗ Auth test failed:', error.response?.data || error.message);
    }
}

testAuth();
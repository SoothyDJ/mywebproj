require('dotenv').config();
const express = require('express');
const { authenticate, optionalAuth, checkOwnership, rateLimit } = require('./middleware/auth');
const AuthController = require('./controllers/authController');

const app = express();
app.use(express.json());

// Initialize auth controller
const authController = new AuthController();

// Test routes
app.post('/auth/login', authController.login.bind(authController));

// Protected route
app.get('/protected', authenticate(), (req, res) => {
    res.json({
        message: 'Access granted!',
        user: req.user
    });
});

// Optional auth route
app.get('/optional', optionalAuth(), (req, res) => {
    res.json({
        message: 'Route accessed',
        authenticated: !!req.user,
        user: req.user
    });
});

// Rate limited route
app.get('/rate-limited', rateLimit(60000, 5), (req, res) => {
    res.json({ message: 'Rate limited endpoint' });
});

async function testMiddleware() {
    const server = app.listen(3002, () => {
        console.log('Test server running on port 3002');
    });

    const axios = require('axios');
    const BASE_URL = 'http://localhost:3002';

    try {
        console.log('Testing Auth Middleware...');

        // Test 1: Access protected route without token
        console.log('\n1. Testing protected route without token...');
        try {
            await axios.get(`${BASE_URL}/protected`);
        } catch (error) {
            console.log('✓ Access denied (expected):', error.response.status);
        }

        // Test 2: Login to get token
        console.log('\n2. Login to get token...');
        const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
            email: 'testauth@example.com',
            password: 'testpass123'
        });
        const token = loginResponse.data.token;
        console.log('✓ Login successful, token received');

        // Test 3: Access protected route with token
        console.log('\n3. Testing protected route with token...');
        const protectedResponse = await axios.get(`${BASE_URL}/protected`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✓ Protected route accessed:', protectedResponse.data.message);

        // Test 4: Optional auth route
        console.log('\n4. Testing optional auth route...');
        const optionalResponse = await axios.get(`${BASE_URL}/optional`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✓ Optional auth result:', optionalResponse.data.authenticated);

        console.log('\n✓ Auth middleware tests completed!');

    } catch (error) {
        console.error('✗ Test failed:', error.response?.data || error.message);
    } finally {
        server.close();
    }
}

testMiddleware();
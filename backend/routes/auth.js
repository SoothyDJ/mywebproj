// File Path: /backend/routes/auth.js
// Authentication routes with full controller integration
// REF-064: Updated auth routes with AuthController integration

const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');

// Initialize controller
const authController = new AuthController();

// Auth status endpoint
router.get('/status', (req, res) => {
    res.json({ 
        message: 'Auth service ready',
        timestamp: new Date().toISOString(),
        service: 'authentication'
    });
});

// User registration
router.post('/register', async (req, res) => {
    await authController.register(req, res);
});

// User login
router.post('/login', async (req, res) => {
    await authController.login(req, res);
});

// User logout
router.post('/logout', async (req, res) => {
    await authController.logout(req, res);
});

// Get user profile (protected route)
router.get('/profile', async (req, res) => {
    // Note: This will need auth middleware to work properly
    await authController.getProfile(req, res);
});

// Update user profile (protected route)
router.put('/profile', async (req, res) => {
    // Note: This will need auth middleware to work properly
    await authController.updateProfile(req, res);
});

// Change password (protected route)
router.put('/password', async (req, res) => {
    // Note: This will need auth middleware to work properly
    await authController.changePassword(req, res);
});

module.exports = router;
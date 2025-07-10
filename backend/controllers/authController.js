// File Path: /backend/controllers/authController.js
// Authentication controller for user management
// REF-062: Authentication controller with user registration, login, and session management

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const DatabaseConnection = require('../database/connection');

class AuthController {
    constructor() {
        this.db = new DatabaseConnection();
        this.initialized = false;
        this.jwtSecret = process.env.JWT_SECRET || 'default-secret-change-in-production';
        this.jwtExpiry = process.env.JWT_EXPIRY || '24h';
        this.saltRounds = 12;
    }

    async initialize() {
        if (!this.initialized) {
            await this.db.connect();
            this.initialized = true;
        }
    }

    // Register new user
    async register(req, res) {
        try {
            await this.initialize();
            
            const { username, email, password } = req.body;

            // Validation
            const validation = this.validateRegistration({ username, email, password });
            if (!validation.isValid) {
                return res.status(400).json({
                    error: 'Validation failed',
                    details: validation.errors
                });
            }

            // Check if user already exists
            const existingUser = await this.findUserByEmail(email);
            if (existingUser) {
                return res.status(409).json({
                    error: 'User already exists',
                    code: 'USER_EXISTS'
                });
            }

            const existingUsername = await this.findUserByUsername(username);
            if (existingUsername) {
                return res.status(409).json({
                    error: 'Username already taken',
                    code: 'USERNAME_EXISTS'
                });
            }

            // Hash password
            const passwordHash = await bcrypt.hash(password, this.saltRounds);

            // Create user
            const result = await this.db.query(
                `INSERT INTO users (username, email, password_hash, created_at) 
                 VALUES ($1, $2, $3, $4) 
                 RETURNING id, username, email, created_at`,
                [username, email, passwordHash, new Date()]
            );

            const user = result.rows[0];

            // Generate JWT token
            const token = this.generateToken(user);

            res.status(201).json({
                success: true,
                message: 'User registered successfully',
                user: this.formatUser(user),
                token
            });

        } catch (error) {
            console.error('Registration error:', error.message);
            res.status(500).json({
                error: 'Registration failed',
                details: error.message
            });
        }
    }

    // Login user
    async login(req, res) {
        try {
            await this.initialize();
            
            const { email, password } = req.body;

            // Validation
            if (!email || !password) {
                return res.status(400).json({
                    error: 'Email and password are required',
                    code: 'MISSING_CREDENTIALS'
                });
            }

            // Find user
            const user = await this.findUserByEmail(email);
            if (!user) {
                return res.status(401).json({
                    error: 'Invalid credentials',
                    code: 'INVALID_CREDENTIALS'
                });
            }

            // Verify password
            const isPasswordValid = await bcrypt.compare(password, user.password_hash);
            if (!isPasswordValid) {
                return res.status(401).json({
                    error: 'Invalid credentials',
                    code: 'INVALID_CREDENTIALS'
                });
            }

            // Generate JWT token
            const token = this.generateToken(user);

            res.json({
                success: true,
                message: 'Login successful',
                user: this.formatUser(user),
                token
            });

        } catch (error) {
            console.error('Login error:', error.message);
            res.status(500).json({
                error: 'Login failed',
                details: error.message
            });
        }
    }

    // Get current user profile
    async getProfile(req, res) {
        try {
            await this.initialize();
            
            const userId = req.user.id;
            
            const result = await this.db.query(
                'SELECT id, username, email, created_at, updated_at FROM users WHERE id = $1',
                [userId]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    error: 'User not found',
                    code: 'USER_NOT_FOUND'
                });
            }

            res.json({
                success: true,
                user: this.formatUser(result.rows[0])
            });

        } catch (error) {
            console.error('Get profile error:', error.message);
            res.status(500).json({
                error: 'Failed to get profile',
                details: error.message
            });
        }
    }

    // Update user profile
    async updateProfile(req, res) {
        try {
            await this.initialize();
            
            const userId = req.user.id;
            const { username, email } = req.body;

            // Validation
            const validation = this.validateProfileUpdate({ username, email });
            if (!validation.isValid) {
                return res.status(400).json({
                    error: 'Validation failed',
                    details: validation.errors
                });
            }

            // Check if username/email already taken by another user
            if (username) {
                const existingUsername = await this.findUserByUsername(username);
                if (existingUsername && existingUsername.id !== userId) {
                    return res.status(409).json({
                        error: 'Username already taken',
                        code: 'USERNAME_EXISTS'
                    });
                }
            }

            if (email) {
                const existingEmail = await this.findUserByEmail(email);
                if (existingEmail && existingEmail.id !== userId) {
                    return res.status(409).json({
                        error: 'Email already exists',
                        code: 'EMAIL_EXISTS'
                    });
                }
            }

            // Update user
            const result = await this.db.query(
                `UPDATE users 
                 SET username = COALESCE($1, username), 
                     email = COALESCE($2, email), 
                     updated_at = $3 
                 WHERE id = $4 
                 RETURNING id, username, email, created_at, updated_at`,
                [username, email, new Date(), userId]
            );

            res.json({
                success: true,
                message: 'Profile updated successfully',
                user: this.formatUser(result.rows[0])
            });

        } catch (error) {
            console.error('Update profile error:', error.message);
            res.status(500).json({
                error: 'Failed to update profile',
                details: error.message
            });
        }
    }

    // Change password
    async changePassword(req, res) {
        try {
            await this.initialize();
            
            const userId = req.user.id;
            const { currentPassword, newPassword } = req.body;

            // Validation
            if (!currentPassword || !newPassword) {
                return res.status(400).json({
                    error: 'Current password and new password are required',
                    code: 'MISSING_PASSWORDS'
                });
            }

            if (!this.validatePassword(newPassword)) {
                return res.status(400).json({
                    error: 'Password must be at least 8 characters long',
                    code: 'WEAK_PASSWORD'
                });
            }

            // Get current user
            const userResult = await this.db.query(
                'SELECT password_hash FROM users WHERE id = $1',
                [userId]
            );

            if (userResult.rows.length === 0) {
                return res.status(404).json({
                    error: 'User not found',
                    code: 'USER_NOT_FOUND'
                });
            }

            // Verify current password
            const isCurrentPasswordValid = await bcrypt.compare(
                currentPassword, 
                userResult.rows[0].password_hash
            );

            if (!isCurrentPasswordValid) {
                return res.status(401).json({
                    error: 'Current password is incorrect',
                    code: 'INVALID_CURRENT_PASSWORD'
                });
            }

            // Hash new password
            const newPasswordHash = await bcrypt.hash(newPassword, this.saltRounds);

            // Update password
            await this.db.query(
                'UPDATE users SET password_hash = $1, updated_at = $2 WHERE id = $3',
                [newPasswordHash, new Date(), userId]
            );

            res.json({
                success: true,
                message: 'Password changed successfully'
            });

        } catch (error) {
            console.error('Change password error:', error.message);
            res.status(500).json({
                error: 'Failed to change password',
                details: error.message
            });
        }
    }

    // Logout (client-side token invalidation)
    async logout(req, res) {
        try {
            // In a stateless JWT system, logout is handled client-side
            // by removing the token. This endpoint is for consistency.
            
            res.json({
                success: true,
                message: 'Logged out successfully'
            });

        } catch (error) {
            console.error('Logout error:', error.message);
            res.status(500).json({
                error: 'Logout failed',
                details: error.message
            });
        }
    }

    // Helper methods
    async findUserByEmail(email) {
        const result = await this.db.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );
        return result.rows[0] || null;
    }

    async findUserByUsername(username) {
        const result = await this.db.query(
            'SELECT * FROM users WHERE username = $1',
            [username]
        );
        return result.rows[0] || null;
    }

    generateToken(user) {
        const payload = {
            id: user.id,
            username: user.username,
            email: user.email
        };

        return jwt.sign(payload, this.jwtSecret, { expiresIn: this.jwtExpiry });
    }

    formatUser(user) {
        return {
            id: user.id,
            username: user.username,
            email: user.email,
            createdAt: user.created_at,
            updatedAt: user.updated_at
        };
    }

    // Validation methods
    validateRegistration({ username, email, password }) {
        const errors = [];

        if (!username || username.trim().length < 3) {
            errors.push('Username must be at least 3 characters long');
        }

        if (!email || !this.validateEmail(email)) {
            errors.push('Valid email is required');
        }

        if (!password || !this.validatePassword(password)) {
            errors.push('Password must be at least 8 characters long');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    validateProfileUpdate({ username, email }) {
        const errors = [];

        if (username && username.trim().length < 3) {
            errors.push('Username must be at least 3 characters long');
        }

        if (email && !this.validateEmail(email)) {
            errors.push('Valid email is required');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    validatePassword(password) {
        return password && password.length >= 8;
    }
}

module.exports = AuthController; 

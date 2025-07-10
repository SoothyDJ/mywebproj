// File Path: /backend/middleware/auth.js
// Authentication middleware for JWT token verification
// REF-063: Auth middleware integrating with existing AuthController JWT structure

const jwt = require('jsonwebtoken');
const DatabaseConnection = require('../database/connection');

class AuthMiddleware {
    constructor() {
        this.db = new DatabaseConnection();
        this.initialized = false;
        this.jwtSecret = process.env.JWT_SECRET || 'default-secret-change-in-production';
    }

    async initialize() {
        if (!this.initialized) {
            await this.db.connect();
            this.initialized = true;
        }
    }

    // Main authentication middleware
    authenticate() {
        return async (req, res, next) => {
            try {
                await this.initialize();

                // Extract token from Authorization header
                const authHeader = req.headers.authorization;
                if (!authHeader) {
                    return res.status(401).json({
                        error: 'Access denied. No token provided.',
                        code: 'NO_TOKEN'
                    });
                }

                // Check Bearer format
                const parts = authHeader.split(' ');
                if (parts.length !== 2 || parts[0] !== 'Bearer') {
                    return res.status(401).json({
                        error: 'Invalid token format. Use Bearer <token>',
                        code: 'INVALID_TOKEN_FORMAT'
                    });
                }

                const token = parts[1];

                // Verify JWT token
                const decoded = jwt.verify(token, this.jwtSecret);

                // Check if user still exists in database
                const userResult = await this.db.query(
                    'SELECT id, username, email, created_at FROM users WHERE id = $1',
                    [decoded.id]
                );

                if (userResult.rows.length === 0) {
                    return res.status(401).json({
                        error: 'User not found. Token may be invalid.',
                        code: 'USER_NOT_FOUND'
                    });
                }

                // Attach user to request object
                req.user = {
                    id: userResult.rows[0].id,
                    username: userResult.rows[0].username,
                    email: userResult.rows[0].email,
                    createdAt: userResult.rows[0].created_at
                };

                next();

            } catch (error) {
                if (error.name === 'JsonWebTokenError') {
                    return res.status(401).json({
                        error: 'Invalid token',
                        code: 'INVALID_TOKEN'
                    });
                }

                if (error.name === 'TokenExpiredError') {
                    return res.status(401).json({
                        error: 'Token expired',
                        code: 'TOKEN_EXPIRED'
                    });
                }

                console.error('Authentication error:', error.message);
                return res.status(500).json({
                    error: 'Authentication failed',
                    details: error.message
                });
            }
        };
    }

    // Optional authentication (doesn't fail if no token)
    optionalAuth() {
        return async (req, res, next) => {
            try {
                await this.initialize();

                const authHeader = req.headers.authorization;
                if (!authHeader) {
                    req.user = null;
                    return next();
                }

                const parts = authHeader.split(' ');
                if (parts.length !== 2 || parts[0] !== 'Bearer') {
                    req.user = null;
                    return next();
                }

                const token = parts[1];

                try {
                    const decoded = jwt.verify(token, this.jwtSecret);

                    const userResult = await this.db.query(
                        'SELECT id, username, email, created_at FROM users WHERE id = $1',
                        [decoded.id]
                    );

                    if (userResult.rows.length > 0) {
                        req.user = {
                            id: userResult.rows[0].id,
                            username: userResult.rows[0].username,
                            email: userResult.rows[0].email,
                            createdAt: userResult.rows[0].created_at
                        };
                    } else {
                        req.user = null;
                    }
                } catch (tokenError) {
                    req.user = null;
                }

                next();

            } catch (error) {
                console.error('Optional auth error:', error.message);
                req.user = null;
                next();
            }
        };
    }

    // Check if user owns resource
    checkOwnership(resourceIdField = 'id') {
        return async (req, res, next) => {
            try {
                const userId = req.user?.id;
                const resourceId = req.params[resourceIdField];

                if (!userId) {
                    return res.status(401).json({
                        error: 'Authentication required',
                        code: 'AUTH_REQUIRED'
                    });
                }

                if (!resourceId) {
                    return res.status(400).json({
                        error: 'Resource ID not provided',
                        code: 'MISSING_RESOURCE_ID'
                    });
                }

                // Check task ownership
                const taskResult = await this.db.query(
                    'SELECT user_id FROM automation_tasks WHERE id = $1',
                    [resourceId]
                );

                if (taskResult.rows.length === 0) {
                    return res.status(404).json({
                        error: 'Resource not found',
                        code: 'RESOURCE_NOT_FOUND'
                    });
                }

                if (taskResult.rows[0].user_id !== userId) {
                    return res.status(403).json({
                        error: 'Access denied. You do not own this resource.',
                        code: 'ACCESS_DENIED'
                    });
                }

                next();

            } catch (error) {
                console.error('Ownership check error:', error.message);
                res.status(500).json({
                    error: 'Ownership verification failed',
                    details: error.message
                });
            }
        };
    }

    // Rate limiting middleware
    rateLimit(windowMs = 15 * 60 * 1000, maxRequests = 100) {
        const requests = new Map();

        return (req, res, next) => {
            const identifier = req.user?.id || req.ip;
            const now = Date.now();
            const windowStart = now - windowMs;

            // Clean old entries
            for (const [key, timestamps] of requests.entries()) {
                requests.set(key, timestamps.filter(time => time > windowStart));
                if (requests.get(key).length === 0) {
                    requests.delete(key);
                }
            }

            // Get current user's requests
            const userRequests = requests.get(identifier) || [];

            if (userRequests.length >= maxRequests) {
                return res.status(429).json({
                    error: 'Too many requests',
                    code: 'RATE_LIMIT_EXCEEDED',
                    retryAfter: Math.ceil(windowMs / 1000)
                });
            }

            // Add current request
            userRequests.push(now);
            requests.set(identifier, userRequests);

            // Add rate limit headers
            res.setHeader('X-RateLimit-Limit', maxRequests);
            res.setHeader('X-RateLimit-Remaining', maxRequests - userRequests.length);
            res.setHeader('X-RateLimit-Reset', new Date(now + windowMs).toISOString());

            next();
        };
    }

    // Admin check middleware
    checkAdmin() {
        return async (req, res, next) => {
            try {
                const userId = req.user?.id;

                if (!userId) {
                    return res.status(401).json({
                        error: 'Authentication required',
                        code: 'AUTH_REQUIRED'
                    });
                }

                // Check if user is admin (you could add admin field to users table)
                // For now, user ID 1 is considered admin
                if (userId !== 1) {
                    return res.status(403).json({
                        error: 'Admin access required',
                        code: 'ADMIN_REQUIRED'
                    });
                }

                next();

            } catch (error) {
                console.error('Admin check error:', error.message);
                res.status(500).json({
                    error: 'Admin verification failed',
                    details: error.message
                });
            }
        };
    }

    // Validate API key (for external integrations)
    validateApiKey() {
        return (req, res, next) => {
            const apiKey = req.headers['x-api-key'];
            const validApiKey = process.env.API_KEY;

            if (!validApiKey) {
                return res.status(500).json({
                    error: 'API key validation not configured',
                    code: 'API_KEY_NOT_CONFIGURED'
                });
            }

            if (!apiKey || apiKey !== validApiKey) {
                return res.status(401).json({
                    error: 'Invalid API key',
                    code: 'INVALID_API_KEY'
                });
            }

            next();
        };
    }

    // CORS middleware for authentication
    corsAuth() {
        return (req, res, next) => {
            res.header('Access-Control-Allow-Origin', process.env.FRONTEND_URL || 'http://localhost:3000');
            res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS,PATCH');
            res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-api-key');
            res.header('Access-Control-Allow-Credentials', 'true');

            if (req.method === 'OPTIONS') {
                return res.sendStatus(200);
            }

            next();
        };
    }

    // Extract user info from token without requiring authentication
    extractUser() {
        return async (req, res, next) => {
            try {
                const authHeader = req.headers.authorization;
                req.user = null;

                if (authHeader) {
                    const parts = authHeader.split(' ');
                    if (parts.length === 2 && parts[0] === 'Bearer') {
                        try {
                            const decoded = jwt.verify(parts[1], this.jwtSecret);
                            req.user = {
                                id: decoded.id,
                                username: decoded.username,
                                email: decoded.email
                            };
                        } catch (error) {
                            // Token invalid, but don't fail - just set user to null
                        }
                    }
                }

                next();

            } catch (error) {
                console.error('Extract user error:', error.message);
                req.user = null;
                next();
            }
        };
    }
}

// Export singleton instance and individual middleware functions
const authMiddleware = new AuthMiddleware();

module.exports = {
    AuthMiddleware,
    authenticate: authMiddleware.authenticate.bind(authMiddleware),
    optionalAuth: authMiddleware.optionalAuth.bind(authMiddleware),
    checkOwnership: authMiddleware.checkOwnership.bind(authMiddleware),
    rateLimit: authMiddleware.rateLimit.bind(authMiddleware),
    checkAdmin: authMiddleware.checkAdmin.bind(authMiddleware),
    validateApiKey: authMiddleware.validateApiKey.bind(authMiddleware),
    corsAuth: authMiddleware.corsAuth.bind(authMiddleware),
    extractUser: authMiddleware.extractUser.bind(authMiddleware)
}; 

// File Path: /backend/models/User.js
// User database model with authentication and profile management
// REF-062: User model for user management and authentication

const DatabaseConnection = require('../database/connection');
const bcrypt = require('bcrypt');

class User {
    constructor(db = null) {
        this.db = db || new DatabaseConnection();
        this.tableName = 'users';
        this.initialized = false;
        this.saltRounds = 12;
    }

    async initialize() {
        if (!this.initialized && !this.db.pool) {
            await this.db.connect();
            this.initialized = true;
        }
    }

    // Create new user
    async create(userData) {
        try {
            await this.initialize();

            const { username, email, password } = userData;

            if (!username || !email || !password) {
                throw new Error('Username, email, and password are required');
            }

            // Validate email format
            if (!this.isValidEmail(email)) {
                throw new Error('Invalid email format');
            }

            // Validate password strength
            if (!this.isValidPassword(password)) {
                throw new Error('Password must be at least 8 characters long and contain letters and numbers');
            }

            // Check if user already exists
            const existingUser = await this.findByEmail(email);
            if (existingUser) {
                throw new Error('User with this email already exists');
            }

            const existingUsername = await this.findByUsername(username);
            if (existingUsername) {
                throw new Error('Username already taken');
            }

            // Hash password
            const passwordHash = await bcrypt.hash(password, this.saltRounds);

            const result = await this.db.query(
                `INSERT INTO ${this.tableName} (username, email, password_hash, created_at, updated_at) 
                 VALUES ($1, $2, $3, $4, $5) 
                 RETURNING *`,
                [username, email, passwordHash, new Date(), new Date()]
            );

            return this.formatUser(result.rows[0]);

        } catch (error) {
            console.error('User create error:', error.message);
            throw error;
        }
    }

    // Find user by ID
    async findById(id) {
        try {
            await this.initialize();

            const result = await this.db.query(
                `SELECT * FROM ${this.tableName} WHERE id = $1`,
                [id]
            );

            if (result.rows.length === 0) {
                return null;
            }

            return this.formatUser(result.rows[0]);

        } catch (error) {
            console.error('User findById error:', error.message);
            throw error;
        }
    }

    // Find user by email
    async findByEmail(email) {
        try {
            await this.initialize();

            const result = await this.db.query(
                `SELECT * FROM ${this.tableName} WHERE email = $1`,
                [email.toLowerCase()]
            );

            if (result.rows.length === 0) {
                return null;
            }

            return this.formatUser(result.rows[0]);

        } catch (error) {
            console.error('User findByEmail error:', error.message);
            throw error;
        }
    }

    // Find user by username
    async findByUsername(username) {
        try {
            await this.initialize();

            const result = await this.db.query(
                `SELECT * FROM ${this.tableName} WHERE username = $1`,
                [username]
            );

            if (result.rows.length === 0) {
                return null;
            }

            return this.formatUser(result.rows[0]);

        } catch (error) {
            console.error('User findByUsername error:', error.message);
            throw error;
        }
    }

    // Authenticate user
    async authenticate(email, password) {
        try {
            await this.initialize();

            // Get user with password hash directly from database
            const result = await this.db.query(
                `SELECT * FROM ${this.tableName} WHERE email = $1`,
                [email.toLowerCase()]
            );

            if (result.rows.length === 0) {
                return null;
            }

            const user = result.rows[0];

            const isValidPassword = await bcrypt.compare(password, user.password_hash);
            if (!isValidPassword) {
                return null;
            }

            // Update last login
            await this.updateLastLogin(user.id);

            return this.formatUser(user); // Return formatted user without password hash

        } catch (error) {
            console.error('User authenticate error:', error.message);
            throw error;
        }
    }

    // Update user profile
    async updateProfile(id, updateData) {
        try {
            await this.initialize();

            const { username, email } = updateData;
            const updates = [];
            const params = [];
            let paramCount = 1;

            if (username) {
                // Check if username is taken by another user
                const existingUser = await this.findByUsername(username);
                if (existingUser && existingUser.id !== id) {
                    throw new Error('Username already taken');
                }
                updates.push(`username = $${paramCount++}`);
                params.push(username);
            }

            if (email) {
                if (!this.isValidEmail(email)) {
                    throw new Error('Invalid email format');
                }
                // Check if email is taken by another user
                const existingUser = await this.findByEmail(email);
                if (existingUser && existingUser.id !== id) {
                    throw new Error('Email already taken');
                }
                updates.push(`email = $${paramCount++}`);
                params.push(email.toLowerCase());
            }

            if (updates.length === 0) {
                throw new Error('No valid fields to update');
            }

            updates.push(`updated_at = $${paramCount++}`);
            params.push(new Date());
            params.push(id);

            const query = `
                UPDATE ${this.tableName} 
                SET ${updates.join(', ')} 
                WHERE id = $${paramCount} 
                RETURNING *
            `;

            const result = await this.db.query(query, params);

            if (result.rows.length === 0) {
                throw new Error('User not found');
            }

            return this.formatUser(result.rows[0]);

        } catch (error) {
            console.error('User updateProfile error:', error.message);
            throw error;
        }
    }

    // Update password
    async updatePassword(id, currentPassword, newPassword) {
        try {
            await this.initialize();

            // Get user with password hash
            const result = await this.db.query(
                `SELECT * FROM ${this.tableName} WHERE id = $1`,
                [id]
            );

            if (result.rows.length === 0) {
                throw new Error('User not found');
            }

            const user = result.rows[0];

            // Verify current password
            const isValidCurrentPassword = await bcrypt.compare(currentPassword, user.password_hash);
            if (!isValidCurrentPassword) {
                throw new Error('Current password is incorrect');
            }

            // Validate new password
            if (!this.isValidPassword(newPassword)) {
                throw new Error('New password must be at least 8 characters long and contain letters and numbers');
            }

            // Hash new password
            const newPasswordHash = await bcrypt.hash(newPassword, this.saltRounds);

            const updateResult = await this.db.query(
                `UPDATE ${this.tableName} 
                 SET password_hash = $1, updated_at = $2 
                 WHERE id = $3 
                 RETURNING *`,
                [newPasswordHash, new Date(), id]
            );

            return this.formatUser(updateResult.rows[0]);

        } catch (error) {
            console.error('User updatePassword error:', error.message);
            throw error;
        }
    }

    // Update last login timestamp
    async updateLastLogin(id) {
        try {
            await this.initialize();

            await this.db.query(
                `UPDATE ${this.tableName} SET updated_at = $1 WHERE id = $2`,
                [new Date(), id]
            );

        } catch (error) {
            console.error('User updateLastLogin error:', error.message);
            // Don't throw error for login timestamp update failures
        }
    }

    // Delete user
    async delete(id) {
        try {
            await this.initialize();

            const result = await this.db.query(
                `DELETE FROM ${this.tableName} WHERE id = $1 RETURNING *`,
                [id]
            );

            if (result.rows.length === 0) {
                throw new Error('User not found');
            }

            return this.formatUser(result.rows[0]);

        } catch (error) {
            console.error('User delete error:', error.message);
            throw error;
        }
    }

    // Get all users (admin function)
    async findAll(options = {}) {
        try {
            await this.initialize();

            const {
                limit = 50,
                offset = 0,
                orderBy = 'created_at',
                orderDirection = 'DESC'
            } = options;

            const result = await this.db.query(
                `SELECT * FROM ${this.tableName} 
                 ORDER BY ${orderBy} ${orderDirection} 
                 LIMIT $1 OFFSET $2`,
                [limit, offset]
            );

            return result.rows.map(row => this.formatUser(row));

        } catch (error) {
            console.error('User findAll error:', error.message);
            throw error;
        }
    }

    // Get user statistics
    async getStatistics() {
        try {
            await this.initialize();

            const result = await this.db.query(`
                SELECT 
                    COUNT(*) as total_users,
                    COUNT(CASE WHEN DATE(created_at) = CURRENT_DATE THEN 1 END) as users_today,
                    COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as users_this_week,
                    COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as users_this_month
                FROM ${this.tableName}
            `);

            const stats = result.rows[0];

            return {
                totalUsers: parseInt(stats.total_users),
                usersToday: parseInt(stats.users_today),
                usersThisWeek: parseInt(stats.users_this_week),
                usersThisMonth: parseInt(stats.users_this_month)
            };

        } catch (error) {
            console.error('User getStatistics error:', error.message);
            throw error;
        }
    }

    // Format user data for API response
    formatUser(userRow, includePasswordHash = false) {
        if (!userRow) return null;

        const formatted = {
            id: userRow.id,
            username: userRow.username,
            email: userRow.email,
            createdAt: userRow.created_at,
            updatedAt: userRow.updated_at
        };

        if (includePasswordHash) {
            formatted.passwordHash = userRow.password_hash;
        }

        return formatted;
    }

    // Validation methods
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    isValidPassword(password) {
        // At least 8 characters, contains letters and numbers
        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;
        return passwordRegex.test(password);
    }

    // Create default admin user
    async createDefaultAdmin() {
        try {
            const existingAdmin = await this.findByEmail('admin@example.com');
            if (existingAdmin) {
                console.log('✓ Default admin user already exists');
                return existingAdmin;
            }

            const adminUser = await this.create({
                username: 'admin',
                email: 'admin@example.com',
                password: 'admin123!'
            });

            console.log('✓ Default admin user created');
            return adminUser;

        } catch (error) {
            console.error('Create default admin error:', error.message);
            throw error;
        }
    }
}

module.exports = User;
// File Path: /backend/models/Task.js
// Task database model with CRUD operations
// REF-057: Task model for automation task management

const DatabaseConnection = require('../database/connection');

class Task {
    constructor(db = null) {
        this.db = db || new DatabaseConnection();
        this.tableName = 'automation_tasks';
        this.initialized = false;
    }

    async initialize() {
        if (!this.initialized && !this.db.pool) {
            await this.db.connect();
            this.initialized = true;
        }
    }

    // Create new task
    async create(taskData) {
        try {
            await this.initialize();
            
            const {
                userId,
                prompt,
                taskType = 'youtube_scrape',
                parameters = {},
                status = 'pending'
            } = taskData;

            if (!prompt || !userId) {
                throw new Error('Prompt and userId are required');
            }

            const result = await this.db.query(
                `INSERT INTO ${this.tableName} (user_id, prompt, task_type, status, parameters, created_at) 
                 VALUES ($1, $2, $3, $4, $5, $6) 
                 RETURNING *`,
                [userId, prompt, taskType, status, JSON.stringify(parameters), new Date()]
            );

            return this.formatTask(result.rows[0]);

        } catch (error) {
            console.error('Task create error:', error.message);
            throw error;
        }
    }

    // Get task by ID
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

            return this.formatTask(result.rows[0]);

        } catch (error) {
            console.error('Task findById error:', error.message);
            throw error;
        }
    }

    // Update task status
    async updateStatus(id, status, errorMessage = null, summary = null) {
        try {
            await this.initialize();
            
            const completedAt = status === 'completed' ? new Date() : null;
            
            const result = await this.db.query(
                `UPDATE ${this.tableName} 
                 SET status = $1, error_message = $2, results_summary = $3, completed_at = $4 
                 WHERE id = $5 
                 RETURNING *`,
                [status, errorMessage, summary, completedAt, id]
            );

            if (result.rows.length === 0) {
                throw new Error('Task not found');
            }

            return this.formatTask(result.rows[0]);

        } catch (error) {
            console.error('Task updateStatus error:', error.message);
            throw error;
        }
    }

    // Get tasks by user ID
    async findByUserId(userId, options = {}) {
        try {
            await this.initialize();
            
            const {
                status = null,
                limit = 50,
                offset = 0,
                orderBy = 'created_at',
                orderDirection = 'DESC'
            } = options;

            let query = `SELECT * FROM ${this.tableName} WHERE user_id = $1`;
            let params = [userId];

            if (status) {
                query += ` AND status = $${params.length + 1}`;
                params.push(status);
            }

            query += ` ORDER BY ${orderBy} ${orderDirection} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
            params.push(limit, offset);

            const result = await this.db.query(query, params);

            return result.rows.map(row => this.formatTask(row));

        } catch (error) {
            console.error('Task findByUserId error:', error.message);
            throw error;
        }
    }

    // Get all tasks with filters
    async findAll(filters = {}) {
        try {
            await this.initialize();
            
            const {
                status = null,
                taskType = null,
                userId = null,
                limit = 100,
                offset = 0,
                orderBy = 'created_at',
                orderDirection = 'DESC'
            } = filters;

            let query = `SELECT * FROM ${this.tableName}`;
            let params = [];
            let conditions = [];

            if (status) {
                conditions.push(`status = $${params.length + 1}`);
                params.push(status);
            }

            if (taskType) {
                conditions.push(`task_type = $${params.length + 1}`);
                params.push(taskType);
            }

            if (userId) {
                conditions.push(`user_id = $${params.length + 1}`);
                params.push(userId);
            }

            if (conditions.length > 0) {
                query += ` WHERE ${conditions.join(' AND ')}`;
            }

            query += ` ORDER BY ${orderBy} ${orderDirection} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
            params.push(limit, offset);

            const result = await this.db.query(query, params);

            return result.rows.map(row => this.formatTask(row));

        } catch (error) {
            console.error('Task findAll error:', error.message);
            throw error;
        }
    }

    // Delete task
    async delete(id) {
        try {
            await this.initialize();
            
            const result = await this.db.query(
                `DELETE FROM ${this.tableName} WHERE id = $1 RETURNING *`,
                [id]
            );

            if (result.rows.length === 0) {
                throw new Error('Task not found');
            }

            return this.formatTask(result.rows[0]);

        } catch (error) {
            console.error('Task delete error:', error.message);
            throw error;
        }
    }

    // Get task statistics
    async getStatistics(userId = null) {
        try {
            await this.initialize();
            
            let query = `
                SELECT 
                    COUNT(*) as total_tasks,
                    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_tasks,
                    COUNT(CASE WHEN status = 'running' THEN 1 END) as running_tasks,
                    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_tasks,
                    COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_tasks,
                    AVG(EXTRACT(EPOCH FROM (completed_at - created_at))) as avg_completion_time
                FROM ${this.tableName}
            `;

            let params = [];

            if (userId) {
                query += ` WHERE user_id = $1`;
                params.push(userId);
            }

            const result = await this.db.query(query, params);
            const stats = result.rows[0];

            return {
                totalTasks: parseInt(stats.total_tasks),
                completedTasks: parseInt(stats.completed_tasks),
                runningTasks: parseInt(stats.running_tasks),
                pendingTasks: parseInt(stats.pending_tasks),
                failedTasks: parseInt(stats.failed_tasks),
                avgCompletionTime: parseFloat(stats.avg_completion_time) || 0,
                successRate: stats.total_tasks > 0 ? (stats.completed_tasks / stats.total_tasks * 100).toFixed(2) : 0
            };

        } catch (error) {
            console.error('Task getStatistics error:', error.message);
            throw error;
        }
    }

    // Get recent tasks
    async getRecent(userId = null, limit = 10) {
        try {
            let query = `SELECT * FROM ${this.tableName}`;
            let params = [];

            if (userId) {
                query += ` WHERE user_id = $1`;
                params.push(userId);
            }

            query += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`;
            params.push(limit);

            const result = await this.db.query(query, params);

            return result.rows.map(row => this.formatTask(row));

        } catch (error) {
            console.error('Task getRecent error:', error.message);
            throw error;
        }
    }

    // Update task parameters
    async updateParameters(id, parameters) {
        try {
            const result = await this.db.query(
                `UPDATE ${this.tableName} 
                 SET parameters = $1 
                 WHERE id = $2 
                 RETURNING *`,
                [JSON.stringify(parameters), id]
            );

            if (result.rows.length === 0) {
                throw new Error('Task not found');
            }

            return this.formatTask(result.rows[0]);

        } catch (error) {
            console.error('Task updateParameters error:', error.message);
            throw error;
        }
    }

    // Check if task exists and belongs to user
    async isOwner(id, userId) {
        try {
            const result = await this.db.query(
                `SELECT user_id FROM ${this.tableName} WHERE id = $1`,
                [id]
            );

            if (result.rows.length === 0) {
                return false;
            }

            return result.rows[0].user_id === userId;

        } catch (error) {
            console.error('Task isOwner error:', error.message);
            throw error;
        }
    }

    // Format task data for API response
    formatTask(taskRow) {
        if (!taskRow) return null;

        return {
            id: taskRow.id,
            userId: taskRow.user_id,
            prompt: taskRow.prompt,
            taskType: taskRow.task_type,
            status: taskRow.status,
            parameters: typeof taskRow.parameters === 'string' 
                ? JSON.parse(taskRow.parameters) 
                : taskRow.parameters,
            resultsSummary: taskRow.results_summary,
            errorMessage: taskRow.error_message,
            createdAt: taskRow.created_at,
            completedAt: taskRow.completed_at,
            duration: taskRow.completed_at && taskRow.created_at 
                ? Math.round((new Date(taskRow.completed_at) - new Date(taskRow.created_at)) / 1000)
                : null
        };
    }

    // Validation methods
    validateTaskType(taskType) {
        const validTypes = ['youtube_scrape', 'reddit_scrape', 'general_analysis'];
        return validTypes.includes(taskType);
    }

    validateStatus(status) {
        const validStatuses = ['pending', 'running', 'completed', 'failed'];
        return validStatuses.includes(status);
    }

    // Cleanup old completed tasks
    async cleanupOldTasks(daysOld = 30) {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysOld);

            const result = await this.db.query(
                `DELETE FROM ${this.tableName} 
                 WHERE status = 'completed' AND completed_at < $1 
                 RETURNING id`,
                [cutoffDate]
            );

            console.log(`✓ Cleaned up ${result.rows.length} old tasks`);
            return result.rows.length;

        } catch (error) {
            console.error('Task cleanup error:', error.message);
            throw error;
        }
    }
}

module.exports = Task;
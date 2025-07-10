// File Path: /backend/server.js
// Express server setup for Web Automation Platform
// REF-021: Express server with database integration

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const DatabaseConnection = require('./database/connection');

class Server {
    constructor() {
        this.app = express();
        this.port = process.env.PORT || 3001;
        this.db = new DatabaseConnection();
        
        this.initializeMiddleware();
        this.initializeRoutes();
        this.initializeErrorHandling();
    }

    initializeMiddleware() {
        // Security middleware
        this.app.use(helmet());
        
        // CORS configuration
        this.app.use(cors({
            origin: process.env.FRONTEND_URL || 'http://localhost:3000',
            credentials: true
        }));
        
        // Logging
        this.app.use(morgan('combined'));
        
        // Body parsing
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true }));
    }

    initializeRoutes() {
        // Health check endpoint (kept at root level)
        this.app.get('/health', async (req, res) => {
            try {
                const dbTest = await this.db.testConnection();
                res.json({
                    status: 'healthy',
                    timestamp: new Date().toISOString(),
                    database: dbTest ? 'connected' : 'disconnected',
                    version: '1.0.0'
                });
            } catch (error) {
                res.status(500).json({
                    status: 'unhealthy',
                    error: error.message
                });
            }
        });

        // Mount API routes through routes index
        this.app.use('/api', require('./routes/index'));
        
        // Root endpoint
        this.app.get('/', (req, res) => {
            res.json({
                message: 'Web Automation Platform API',
                version: '1.0.0',
                endpoints: {
                    health: '/health',
                    api: '/api',
                    documentation: '/api'
                }
            });
        });
    }

    initializeErrorHandling() {
        // 404 handler
        this.app.use('*', (req, res) => {
            res.status(404).json({
                error: 'Route not found',
                path: req.originalUrl
            });
        });

        // Global error handler
        this.app.use((error, req, res, next) => {
            console.error('Server error:', error);
            
            res.status(error.status || 500).json({
                error: process.env.NODE_ENV === 'production' 
                    ? 'Internal server error' 
                    : error.message,
                timestamp: new Date().toISOString()
            });
        });
    }

    async start() {
        try {
            // Initialize database connection
            await this.db.connect();
            console.log('✓ Database connection established');

            // Start server
            this.app.listen(this.port, () => {
                console.log(`✓ Server running on port ${this.port}`);
                console.log(`✓ Health check: http://localhost:${this.port}/health`);
                console.log(`✓ API endpoint: http://localhost:${this.port}/api`);
            });

        } catch (error) {
            console.error('✗ Server startup failed:', error.message);
            process.exit(1);
        }
    }

    async shutdown() {
        console.log('Shutting down server...');
        await this.db.disconnect();
        process.exit(0);
    }
}

// Create and start server
const server = new Server();

// Graceful shutdown
process.on('SIGTERM', () => server.shutdown());
process.on('SIGINT', () => server.shutdown());

// Start server
server.start();

module.exports = Server;
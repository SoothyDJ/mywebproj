// File Path: /backend/routes/index.js
// Main routes index file for Web Automation Platform
// REF-083: Central route configuration and API documentation

const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth');
const taskRoutes = require('./tasks');

// API Documentation endpoint
router.get('/', (req, res) => {
    res.json({
        name: 'Web Automation Platform API',
        version: '1.0.0',
        description: 'AI-powered video analysis and automation platform',
        documentation: {
            baseUrl: req.protocol + '://' + req.get('host') + req.originalUrl,
            endpoints: {
                health: {
                    path: '/health',
                    method: 'GET',
                    description: 'Service health check',
                    response: 'Health status and database connectivity'
                },
                authentication: {
                    basePath: '/api/auth',
                    endpoints: {
                        status: {
                            path: '/api/auth/status',
                            method: 'GET',
                            description: 'Authentication service status'
                        },
                        login: {
                            path: '/api/auth/login',
                            method: 'POST',
                            description: 'User login',
                            body: {
                                email: 'string',
                                password: 'string'
                            }
                        },
                        register: {
                            path: '/api/auth/register',
                            method: 'POST',
                            description: 'User registration',
                            body: {
                                username: 'string',
                                email: 'string',
                                password: 'string'
                            }
                        },
                        logout: {
                            path: '/api/auth/logout',
                            method: 'POST',
                            description: 'User logout'
                        }
                    }
                },
                tasks: {
                    basePath: '/api/tasks',
                    endpoints: {
                        status: {
                            path: '/api/tasks/status',
                            method: 'GET',
                            description: 'Task service status'
                        },
                        create: {
                            path: '/api/tasks/create',
                            method: 'POST',
                            description: 'Create new automation task',
                            body: {
                                prompt: 'string (required)',
                                taskType: 'string (youtube_scrape|reddit_scrape|general_analysis)',
                                options: {
                                    maxResults: 'number',
                                    timeFilter: 'string (hour|day|week|month|year)',
                                    aiProvider: 'string (openai|claude)'
                                }
                            },
                            response: {
                                success: 'boolean',
                                task: {
                                    id: 'number',
                                    status: 'string',
                                    createdAt: 'string'
                                }
                            }
                        },
                        list: {
                            path: '/api/tasks',
                            method: 'GET',
                            description: 'List user tasks',
                            queryParams: {
                                status: 'string (pending|running|completed|failed)',
                                limit: 'number (default: 50)',
                                offset: 'number (default: 0)'
                            }
                        },
                        getById: {
                            path: '/api/tasks/:id',
                            method: 'GET',
                            description: 'Get task by ID',
                            params: {
                                id: 'number (task ID)'
                            }
                        },
                        getResults: {
                            path: '/api/tasks/:id/results',
                            method: 'GET',
                            description: 'Get task results with video analysis',
                            params: {
                                id: 'number (task ID)'
                            },
                            response: {
                                task: 'object',
                                results: [{
                                    video: 'object',
                                    analysis: 'object', 
                                    storyboard: 'object',
                                    attribution: 'object'
                                }],
                                metadata: 'object'
                            }
                        },
                        delete: {
                            path: '/api/tasks/:id',
                            method: 'DELETE',
                            description: 'Delete task',
                            params: {
                                id: 'number (task ID)'
                            }
                        }
                    }
                }
            }
        },
        features: {
            videoAnalysis: 'AI-powered YouTube video content analysis',
            storyboardGeneration: 'Automatic storyboard creation for video narration',
            multipleAIProviders: 'OpenAI and Claude integration with fallback',
            batchProcessing: 'Analyze multiple videos simultaneously',
            htmlReports: 'Interactive HTML reports with attribution',
            realTimeStatus: 'Real-time task status monitoring'
        },
        supportedPlatforms: [
            'YouTube (video scraping and analysis)',
            'Future: Reddit, Twitter, TikTok'
        ],
        aiProviders: [
            'OpenAI (GPT-4o-mini)',
            'Claude (Claude-3.5-Sonnet)'
        ],
        examples: {
            simpleTask: {
                prompt: 'Find top 10 paranormal videos from the last month',
                expectedResult: 'Video analysis with AI insights and storyboards'
            },
            advancedTask: {
                prompt: 'Analyze trending educational content about AI in the last week and generate detailed storyboards for video narration',
                options: {
                    maxResults: 15,
                    timeFilter: 'week',
                    aiProvider: 'claude'
                }
            }
        },
        rateLimit: {
            default: '100 requests per 15 minutes',
            taskCreation: '10 tasks per hour per user',
            aiAnalysis: 'Managed automatically with queuing'
        },
        responseFormats: {
            success: {
                success: true,
                data: 'object|array',
                message: 'string (optional)'
            },
            error: {
                success: false,
                error: 'string',
                code: 'string (optional)',
                details: 'string (optional)'
            }
        }
    });
});

// Health check endpoint (duplicate from server.js for consistency)
router.get('/health', async (req, res) => {
    try {
        // This could be enhanced to check all services
        res.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            services: {
                api: 'operational',
                database: 'operational', // Could add actual DB check
                aiServices: 'operational' // Could add actual AI service check
            },
            version: '1.0.0',
            uptime: process.uptime()
        });
    } catch (error) {
        res.status(500).json({
            status: 'unhealthy',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// API status endpoint
router.get('/status', (req, res) => {
    res.json({
        api: 'Web Automation Platform',
        status: 'operational',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        endpoints: {
            total: 12,
            operational: 12,
            deprecated: 0
        },
        lastDeployment: new Date().toISOString(), // Could be set from environment
        environment: process.env.NODE_ENV || 'development'
    });
});

// API metrics endpoint (basic)
router.get('/metrics', (req, res) => {
    res.json({
        requests: {
            total: 'Not implemented yet',
            perMinute: 'Not implemented yet'
        },
        tasks: {
            created: 'Query database for count',
            completed: 'Query database for count',
            failed: 'Query database for count'
        },
        performance: {
            averageResponseTime: 'Not implemented yet',
            averageTaskDuration: 'Not implemented yet'
        },
        note: 'Metrics collection not yet implemented - placeholder endpoint'
    });
});

// Mount route modules
router.use('/auth', authRoutes);
router.use('/tasks', taskRoutes);

// 404 handler for API routes
router.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'API endpoint not found',
        path: req.originalUrl,
        method: req.method,
        availableEndpoints: [
            'GET /',
            'GET /health',
            'GET /status', 
            'GET /metrics',
            'GET /auth/status',
            'POST /auth/login',
            'POST /auth/register',
            'POST /auth/logout',
            'GET /tasks/status',
            'POST /tasks/create',
            'GET /tasks',
            'GET /tasks/:id',
            'GET /tasks/:id/results',
            'DELETE /tasks/:id'
        ],
        documentation: req.protocol + '://' + req.get('host') + '/api'
    });
});

// Error handler for API routes
router.use((error, req, res, next) => {
    console.error('API Error:', error);
    
    res.status(error.status || 500).json({
        success: false,
        error: process.env.NODE_ENV === 'production' 
            ? 'Internal server error' 
            : error.message,
        timestamp: new Date().toISOString(),
        path: req.originalUrl,
        method: req.method
    });
});

module.exports = router;

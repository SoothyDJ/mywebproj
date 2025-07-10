// File Path: /shared/constants/config.js
// Shared configuration constants for Web Automation Platform
// REF-088: Centralized constants for consistent configuration

// Task Types
const TASK_TYPES = {
    YOUTUBE_SCRAPE: 'youtube_scrape',
    REDDIT_SCRAPE: 'reddit_scrape',
    GENERAL_ANALYSIS: 'general_analysis'
};

// Task Status Values
const TASK_STATUS = {
    PENDING: 'pending',
    RUNNING: 'running',
    COMPLETED: 'completed',
    FAILED: 'failed'
};

// Time Filters for Content Scraping
const TIME_FILTERS = {
    HOUR: 'hour',
    DAY: 'day',
    WEEK: 'week',
    MONTH: 'month',
    YEAR: 'year'
};

// Content Types
const CONTENT_TYPES = {
    EDUCATIONAL: 'educational',
    ENTERTAINMENT: 'entertainment',
    DOCUMENTARY: 'documentary',
    HORROR: 'horror',
    COMEDY: 'comedy',
    MUSIC: 'music',
    GAMING: 'gaming',
    NEWS: 'news',
    TUTORIAL: 'tutorial',
    REVIEW: 'review',
    UNKNOWN: 'unknown'
};

// Sentiment Types
const SENTIMENT_TYPES = {
    POSITIVE: 'positive',
    NEGATIVE: 'negative',
    NEUTRAL: 'neutral'
};

// AI Providers
const AI_PROVIDERS = {
    OPENAI: 'openai',
    CLAUDE: 'claude'
};

// Error Codes
const ERROR_CODES = {
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    DATABASE_ERROR: 'DATABASE_ERROR',
    SCRAPER_ERROR: 'SCRAPER_ERROR',
    AI_SERVICE_ERROR: 'AI_SERVICE_ERROR',
    AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
    AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
    RATE_LIMIT_ERROR: 'RATE_LIMIT_ERROR',
    NETWORK_ERROR: 'NETWORK_ERROR',
    TASK_NOT_FOUND: 'TASK_NOT_FOUND',
    USER_NOT_FOUND: 'USER_NOT_FOUND',
    INVALID_INPUT: 'INVALID_INPUT',
    SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
    TIMEOUT_ERROR: 'TIMEOUT_ERROR',
    UNKNOWN_ERROR: 'UNKNOWN_ERROR'
};

// HTTP Status Codes
const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    ACCEPTED: 202,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    METHOD_NOT_ALLOWED: 405,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER_ERROR: 500,
    BAD_GATEWAY: 502,
    SERVICE_UNAVAILABLE: 503,
    GATEWAY_TIMEOUT: 504
};

// Default Configuration Values
const DEFAULTS = {
    // Pagination
    PAGE_SIZE: 20,
    MAX_PAGE_SIZE: 100,
    
    // Scraping
    MAX_SCRAPE_RESULTS: 50,
    DEFAULT_SCRAPE_RESULTS: 10,
    SCRAPER_TIMEOUT: 30000,
    SCRAPER_RETRIES: 3,
    
    // AI Processing
    AI_TIMEOUT: 60000,
    AI_MAX_TOKENS: 2000,
    AI_TEMPERATURE: 0.3,
    BATCH_SIZE: 3,
    DELAY_BETWEEN_BATCHES: 1000,
    
    // File Upload
    MAX_FILE_SIZE: 10485760, // 10MB
    ALLOWED_FILE_TYPES: ['json', 'csv', 'txt', 'html'],
    
    // Sessions
    SESSION_TIMEOUT: 86400000, // 24 hours
    
    // Rate Limiting
    RATE_LIMIT_WINDOW: 900000, // 15 minutes
    RATE_LIMIT_MAX_REQUESTS: 100,
    
    // Database
    DB_POOL_MIN: 5,
    DB_POOL_MAX: 20,
    DB_TIMEOUT: 30000,
    
    // Cache
    CACHE_TTL: 3600, // 1 hour
    
    // Cleanup
    CLEANUP_INTERVAL: 86400000, // 24 hours
    OLD_TASK_RETENTION_DAYS: 30
};

// Validation Rules
const VALIDATION_RULES = {
    // User validation
    USERNAME_MIN_LENGTH: 3,
    USERNAME_MAX_LENGTH: 50,
    PASSWORD_MIN_LENGTH: 8,
    EMAIL_MAX_LENGTH: 100,
    
    // Task validation
    PROMPT_MIN_LENGTH: 5,
    PROMPT_MAX_LENGTH: 1000,
    
    // Search validation
    SEARCH_QUERY_MIN_LENGTH: 2,
    SEARCH_QUERY_MAX_LENGTH: 200,
    
    // Content validation
    TITLE_MAX_LENGTH: 500,
    DESCRIPTION_MAX_LENGTH: 5000,
    CHANNEL_NAME_MAX_LENGTH: 100
};

// YouTube Specific Constants
const YOUTUBE_CONSTANTS = {
    BASE_URL: 'https://www.youtube.com',
    SEARCH_URL: 'https://www.youtube.com/results',
    VIDEO_URL_PATTERN: /watch\?v=([^&]+)/,
    CHANNEL_URL_PATTERN: /channel\/([^\/]+)/,
    
    // Selectors (might change - YouTube updates frequently)
    SELECTORS: {
        VIDEO_RENDERER: 'ytd-video-renderer',
        VIDEO_TITLE: 'a#video-title',
        CHANNEL_LINK: 'a.yt-simple-endpoint.style-scope.yt-formatted-string',
        METADATA_LINE: '#metadata-line span',
        DURATION: 'span.style-scope.ytd-thumbnail-overlay-time-status-renderer',
        DESCRIPTION: '#description-text',
        THUMBNAIL: 'img'
    },
    
    // Search filters
    SEARCH_FILTERS: {
        HOUR: 'EgIIAQ%253D%253D',
        DAY: 'EgIIAg%253D%253D',
        WEEK: 'EgIIAw%253D%253D',
        MONTH: 'EgIIBA%253D%253D',
        YEAR: 'EgIIBQ%253D%253D'
    },
    
    // Rate limiting
    REQUEST_DELAY: 2000,
    MAX_REQUESTS_PER_MINUTE: 30
};

// Reddit Specific Constants (for future implementation)
const REDDIT_CONSTANTS = {
    BASE_URL: 'https://www.reddit.com',
    API_BASE: 'https://www.reddit.com/api/v1',
    
    // Sorting options
    SORT_OPTIONS: {
        HOT: 'hot',
        NEW: 'new',
        TOP: 'top',
        RISING: 'rising'
    },
    
    // Time periods
    TIME_PERIODS: {
        HOUR: 'hour',
        DAY: 'day',
        WEEK: 'week',
        MONTH: 'month',
        YEAR: 'year',
        ALL: 'all'
    }
};

// Environment-specific configurations
const ENVIRONMENT_CONFIGS = {
    development: {
        LOG_LEVEL: 'debug',
        ENABLE_CORS: true,
        ENABLE_RATE_LIMITING: false,
        AI_TIMEOUT: 30000,
        SCRAPER_HEADLESS: false
    },
    test: {
        LOG_LEVEL: 'error',
        ENABLE_CORS: true,
        ENABLE_RATE_LIMITING: false,
        AI_TIMEOUT: 10000,
        SCRAPER_HEADLESS: true,
        MOCK_AI_RESPONSES: true
    },
    production: {
        LOG_LEVEL: 'warn',
        ENABLE_CORS: true,
        ENABLE_RATE_LIMITING: true,
        AI_TIMEOUT: 60000,
        SCRAPER_HEADLESS: true,
        ENABLE_SSL: true
    }
};

// Feature Flags
const FEATURES = {
    AUTHENTICATION: 'authentication',
    USER_MANAGEMENT: 'userManagement',
    FILE_UPLOADS: 'fileUploads',
    HTML_REPORTS: 'htmlReports',
    STORYBOARD_GENERATION: 'storyboardGeneration',
    BATCH_PROCESSING: 'batchProcessing',
    REAL_TIME_UPDATES: 'realTimeUpdates',
    EMAIL_NOTIFICATIONS: 'emailNotifications',
    WEBHOOKS: 'webhooks',
    REDDIT_SCRAPING: 'redditScraping',
    TWITTER_SCRAPING: 'twitterScraping',
    PDF_REPORTS: 'pdfReports',
    ANALYTICS: 'analytics',
    CACHING: 'caching'
};

// API Response Messages
const MESSAGES = {
    // Success messages
    TASK_CREATED: 'Task created successfully',
    TASK_UPDATED: 'Task updated successfully',
    TASK_DELETED: 'Task deleted successfully',
    ANALYSIS_COMPLETED: 'Analysis completed successfully',
    USER_CREATED: 'User created successfully',
    LOGIN_SUCCESS: 'Login successful',
    LOGOUT_SUCCESS: 'Logout successful',
    
    // Error messages
    INVALID_CREDENTIALS: 'Invalid email or password',
    USER_NOT_FOUND: 'User not found',
    TASK_NOT_FOUND: 'Task not found',
    UNAUTHORIZED: 'Unauthorized access',
    FORBIDDEN: 'Access forbidden',
    VALIDATION_FAILED: 'Validation failed',
    INTERNAL_ERROR: 'Internal server error',
    SERVICE_UNAVAILABLE: 'Service temporarily unavailable',
    RATE_LIMITED: 'Rate limit exceeded. Please try again later.',
    
    // Info messages
    PROCESSING: 'Task is being processed',
    QUEUED: 'Task queued for processing',
    NO_RESULTS: 'No results found',
    PARTIAL_RESULTS: 'Partial results available'
};

// Regular Expressions
const REGEX_PATTERNS = {
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    USERNAME: /^[a-zA-Z0-9_]{3,30}$/,
    PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
    URL: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
    YOUTUBE_VIDEO_ID: /^[a-zA-Z0-9_-]{11}$/,
    YOUTUBE_URL: /^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/
};

// Export all constants
module.exports = {
    TASK_TYPES,
    TASK_STATUS,
    TIME_FILTERS,
    CONTENT_TYPES,
    SENTIMENT_TYPES,
    AI_PROVIDERS,
    ERROR_CODES,
    HTTP_STATUS,
    DEFAULTS,
    VALIDATION_RULES,
    YOUTUBE_CONSTANTS,
    REDDIT_CONSTANTS,
    ENVIRONMENT_CONFIGS,
    FEATURES,
    MESSAGES,
    REGEX_PATTERNS,
    
    // Helper functions
    isValidTaskType: (type) => Object.values(TASK_TYPES).includes(type),
    isValidTaskStatus: (status) => Object.values(TASK_STATUS).includes(status),
    isValidTimeFilter: (filter) => Object.values(TIME_FILTERS).includes(filter),
    isValidContentType: (type) => Object.values(CONTENT_TYPES).includes(type),
    isValidAIProvider: (provider) => Object.values(AI_PROVIDERS).includes(provider),
    isValidEmail: (email) => REGEX_PATTERNS.EMAIL.test(email),
    isValidUsername: (username) => REGEX_PATTERNS.USERNAME.test(username),
    isValidPassword: (password) => REGEX_PATTERNS.PASSWORD.test(password),
    isValidYouTubeUrl: (url) => REGEX_PATTERNS.YOUTUBE_URL.test(url),
    
    // Environment helpers
    getEnvironmentConfig: (env = 'development') => ENVIRONMENT_CONFIGS[env] || ENVIRONMENT_CONFIGS.development,
    isDevelopment: () => process.env.NODE_ENV === 'development',
    isProduction: () => process.env.NODE_ENV === 'production',
    isTest: () => process.env.NODE_ENV === 'test'
}; 

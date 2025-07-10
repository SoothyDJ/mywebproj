// File Path: /backend/utils/logger.js
// Enhanced logging and error handling utilities
// REF-067: Centralized logging system with error categorization and monitoring

const fs = require('fs').promises;
const path = require('path');

class Logger {
    constructor() {
        this.logLevel = process.env.LOG_LEVEL || 'info';
        this.logDir = path.join(__dirname, '../logs');
        this.maxLogSize = 10 * 1024 * 1024; // 10MB
        this.maxLogFiles = 5;
        
        this.levels = {
            error: 0,
            warn: 1,
            info: 2,
            debug: 3,
            trace: 4
        };
        
        this.colors = {
            error: '\x1b[31m',
            warn: '\x1b[33m',
            info: '\x1b[36m',
            debug: '\x1b[35m',
            trace: '\x1b[37m',
            reset: '\x1b[0m'
        };
        
        this.initializeLogDirectory();
    }

    async initializeLogDirectory() {
        try {
            await fs.mkdir(this.logDir, { recursive: true });
        } catch (error) {
            console.error('Failed to create log directory:', error.message);
        }
    }

    formatMessage(level, message, context = {}) {
        const timestamp = new Date().toISOString();
        const contextStr = Object.keys(context).length > 0 ? JSON.stringify(context) : '';
        
        return {
            timestamp,
            level: level.toUpperCase(),
            message,
            context,
            pid: process.pid,
            formatted: `[${timestamp}] [${level.toUpperCase()}] [PID:${process.pid}] ${message} ${contextStr}`
        };
    }

    shouldLog(level) {
        return this.levels[level] <= this.levels[this.logLevel];
    }

    async writeToFile(logData, filename = 'app.log') {
        try {
            const logFile = path.join(this.logDir, filename);
            
            // Check file size and rotate if needed
            await this.rotateLogIfNeeded(logFile);
            
            await fs.appendFile(logFile, logData.formatted + '\n');
        } catch (error) {
            console.error('Failed to write to log file:', error.message);
        }
    }

    async rotateLogIfNeeded(logFile) {
        try {
            const stats = await fs.stat(logFile);
            
            if (stats.size > this.maxLogSize) {
                // Rotate existing logs
                for (let i = this.maxLogFiles - 1; i > 0; i--) {
                    const oldFile = `${logFile}.${i}`;
                    const newFile = `${logFile}.${i + 1}`;
                    
                    try {
                        await fs.rename(oldFile, newFile);
                    } catch (error) {
                        // File doesn't exist, continue
                    }
                }
                
                // Move current log to .1
                await fs.rename(logFile, `${logFile}.1`);
            }
        } catch (error) {
            // File doesn't exist yet, that's fine
        }
    }

    log(level, message, context = {}) {
        if (!this.shouldLog(level)) return;
        
        const logData = this.formatMessage(level, message, context);
        
        // Console output with colors
        const color = this.colors[level] || this.colors.reset;
        console.log(`${color}${logData.formatted}${this.colors.reset}`);
        
        // File output
        this.writeToFile(logData);
        
        return logData;
    }

    error(message, context = {}) {
        return this.log('error', message, context);
    }

    warn(message, context = {}) {
        return this.log('warn', message, context);
    }

    info(message, context = {}) {
        return this.log('info', message, context);
    }

    debug(message, context = {}) {
        return this.log('debug', message, context);
    }

    trace(message, context = {}) {
        return this.log('trace', message, context);
    }

    // Specialized logging methods
    taskLog(taskId, level, message, context = {}) {
        const enhancedContext = { taskId, ...context };
        return this.log(level, `[TASK:${taskId}] ${message}`, enhancedContext);
    }

    apiLog(req, res, level, message, context = {}) {
        const enhancedContext = {
            method: req.method,
            url: req.url,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            statusCode: res.statusCode,
            ...context
        };
        return this.log(level, `[API] ${message}`, enhancedContext);
    }

    dbLog(operation, level, message, context = {}) {
        const enhancedContext = { operation, ...context };
        return this.log(level, `[DB] ${message}`, enhancedContext);
    }

    aiLog(service, level, message, context = {}) {
        const enhancedContext = { aiService: service, ...context };
        return this.log(level, `[AI:${service}] ${message}`, enhancedContext);
    }

    scraperLog(level, message, context = {}) {
        return this.log(level, `[SCRAPER] ${message}`, context);
    }
}

// Error categorization and handling
class ErrorHandler {
    constructor(logger) {
        this.logger = logger;
        this.errorCounts = new Map();
        this.lastErrors = [];
        this.maxLastErrors = 100;
    }

    categorizeError(error) {
        const errorType = error.constructor.name;
        const message = error.message.toLowerCase();
        
        // Database errors
        if (message.includes('database') || message.includes('connection') || message.includes('query')) {
            return {
                category: 'DATABASE',
                severity: 'high',
                retryable: true
            };
        }
        
        // Network/API errors
        if (message.includes('network') || message.includes('timeout') || message.includes('econnrefused')) {
            return {
                category: 'NETWORK',
                severity: 'medium',
                retryable: true
            };
        }
        
        // AI service errors
        if (message.includes('openai') || message.includes('claude') || message.includes('rate limit')) {
            return {
                category: 'AI_SERVICE',
                severity: 'medium',
                retryable: true
            };
        }
        
        // Scraping errors
        if (message.includes('scraping') || message.includes('puppeteer') || message.includes('youtube')) {
            return {
                category: 'SCRAPING',
                severity: 'medium',
                retryable: true
            };
        }
        
        // Validation errors
        if (message.includes('validation') || message.includes('required') || message.includes('invalid')) {
            return {
                category: 'VALIDATION',
                severity: 'low',
                retryable: false
            };
        }
        
        // Authentication errors
        if (message.includes('authentication') || message.includes('authorization') || message.includes('token')) {
            return {
                category: 'AUTH',
                severity: 'medium',
                retryable: false
            };
        }
        
        // Default category
        return {
            category: 'UNKNOWN',
            severity: 'medium',
            retryable: false
        };
    }

    handleError(error, context = {}) {
        const errorInfo = this.categorizeError(error);
        const errorId = this.generateErrorId();
        
        // Track error frequency
        const errorKey = `${errorInfo.category}:${error.message}`;
        this.errorCounts.set(errorKey, (this.errorCounts.get(errorKey) || 0) + 1);
        
        // Store error details
        const errorDetails = {
            id: errorId,
            timestamp: new Date().toISOString(),
            message: error.message,
            stack: error.stack,
            category: errorInfo.category,
            severity: errorInfo.severity,
            retryable: errorInfo.retryable,
            context,
            count: this.errorCounts.get(errorKey)
        };
        
        // Add to recent errors
        this.lastErrors.unshift(errorDetails);
        if (this.lastErrors.length > this.maxLastErrors) {
            this.lastErrors.pop();
        }
        
        // Log the error
        this.logger.error(`[${errorInfo.category}] ${error.message}`, {
            errorId,
            category: errorInfo.category,
            severity: errorInfo.severity,
            retryable: errorInfo.retryable,
            stack: error.stack,
            ...context
        });
        
        return errorDetails;
    }

    generateErrorId() {
        return `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    }

    getErrorStats() {
        const stats = {
            totalErrors: this.lastErrors.length,
            errorsByCategory: {},
            errorsBySeverity: {},
            topErrors: [],
            recentErrors: this.lastErrors.slice(0, 10)
        };
        
        // Count by category and severity
        this.lastErrors.forEach(error => {
            stats.errorsByCategory[error.category] = (stats.errorsByCategory[error.category] || 0) + 1;
            stats.errorsBySeverity[error.severity] = (stats.errorsBySeverity[error.severity] || 0) + 1;
        });
        
        // Get top errors by frequency
        stats.topErrors = Array.from(this.errorCounts.entries())
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10)
            .map(([key, count]) => ({ error: key, count }));
        
        return stats;
    }

    shouldRetry(error, attemptCount = 1, maxRetries = 3) {
        const errorInfo = this.categorizeError(error);
        
        if (!errorInfo.retryable || attemptCount >= maxRetries) {
            return false;
        }
        
        // Different retry strategies based on error category
        switch (errorInfo.category) {
            case 'NETWORK':
            case 'AI_SERVICE':
                return attemptCount < 3;
            case 'DATABASE':
                return attemptCount < 2;
            case 'SCRAPING':
                return attemptCount < 2;
            default:
                return false;
        }
    }

    getRetryDelay(attemptCount, baseDelay = 1000) {
        // Exponential backoff with jitter
        const delay = baseDelay * Math.pow(2, attemptCount - 1);
        const jitter = Math.random() * 0.1 * delay;
        return Math.min(delay + jitter, 30000); // Max 30 seconds
    }
}

// Performance monitoring
class PerformanceMonitor {
    constructor(logger) {
        this.logger = logger;
        this.metrics = new Map();
        this.activeOperations = new Map();
    }

    startOperation(operationName, context = {}) {
        const operationId = `${operationName}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        
        this.activeOperations.set(operationId, {
            name: operationName,
            startTime: Date.now(),
            context
        });
        
        this.logger.debug(`Started operation: ${operationName}`, { operationId, ...context });
        
        return operationId;
    }

    endOperation(operationId, success = true, additionalContext = {}) {
        const operation = this.activeOperations.get(operationId);
        
        if (!operation) {
            this.logger.warn(`Operation not found: ${operationId}`);
            return null;
        }
        
        const duration = Date.now() - operation.startTime;
        const result = {
            operationId,
            name: operation.name,
            duration,
            success,
            context: { ...operation.context, ...additionalContext }
        };
        
        // Store metrics
        const metricKey = operation.name;
        if (!this.metrics.has(metricKey)) {
            this.metrics.set(metricKey, {
                count: 0,
                totalDuration: 0,
                successCount: 0,
                failureCount: 0,
                minDuration: Infinity,
                maxDuration: 0
            });
        }
        
        const metric = this.metrics.get(metricKey);
        metric.count++;
        metric.totalDuration += duration;
        metric.minDuration = Math.min(metric.minDuration, duration);
        metric.maxDuration = Math.max(metric.maxDuration, duration);
        
        if (success) {
            metric.successCount++;
        } else {
            metric.failureCount++;
        }
        
        this.activeOperations.delete(operationId);
        
        // Log completion
        const level = success ? 'info' : 'warn';
        this.logger[level](`Completed operation: ${operation.name}`, {
            operationId,
            duration: `${duration}ms`,
            success,
            ...result.context
        });
        
        return result;
    }

    getMetrics() {
        const metrics = {};
        
        for (const [name, data] of this.metrics.entries()) {
            metrics[name] = {
                ...data,
                avgDuration: data.count > 0 ? Math.round(data.totalDuration / data.count) : 0,
                successRate: data.count > 0 ? Math.round((data.successCount / data.count) * 100) : 0
            };
        }
        
        return {
            operations: metrics,
            activeOperations: this.activeOperations.size,
            totalOperations: Array.from(this.metrics.values()).reduce((sum, m) => sum + m.count, 0)
        };
    }
}

// Create singleton instances
const logger = new Logger();
const errorHandler = new ErrorHandler(logger);
const performanceMonitor = new PerformanceMonitor(logger);

module.exports = {
    Logger,
    ErrorHandler,
    PerformanceMonitor,
    logger,
    errorHandler,
    performanceMonitor
};
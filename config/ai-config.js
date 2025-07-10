// File Path: /config/ai-config.js
// AI service configuration management for switching between OpenAI and Claude
// REF-067: Configuration manager for AI service selection and management

const OpenAIService = require('../ai-services/openai-service');
const ClaudeService = require('../ai-services/claude-service');

class AIConfigManager {
    constructor() {
        this.availableServices = {
            openai: OpenAIService,
            claude: ClaudeService
        };
        
        this.config = {
            primary: process.env.AI_PRIMARY_SERVICE || 'openai',
            fallback: process.env.AI_FALLBACK_SERVICE || 'claude',
            retryAttempts: parseInt(process.env.AI_RETRY_ATTEMPTS) || 3,
            timeout: parseInt(process.env.AI_TIMEOUT_MS) || 30000,
            rateLimitDelay: parseInt(process.env.AI_RATE_LIMIT_DELAY) || 1000,
            batchSize: parseInt(process.env.AI_BATCH_SIZE) || 3,
            enableFallback: process.env.AI_ENABLE_FALLBACK !== 'false'
        };
        
        this.serviceInstances = {};
        this.serviceStats = {
            openai: { requests: 0, successes: 0, failures: 0, avgResponseTime: 0 },
            claude: { requests: 0, successes: 0, failures: 0, avgResponseTime: 0 }
        };
    }

    // Get AI service instance with automatic fallback
    getAIService(preferredService = null) {
        const serviceName = preferredService || this.config.primary;
        
        if (!this.availableServices[serviceName]) {
            console.warn(`Unknown AI service: ${serviceName}, falling back to primary: ${this.config.primary}`);
            return this.getServiceInstance(this.config.primary);
        }
        
        return this.getServiceInstance(serviceName);
    }

    // Get service instance (singleton pattern)
    getServiceInstance(serviceName) {
        if (!this.serviceInstances[serviceName]) {
            const ServiceClass = this.availableServices[serviceName];
            this.serviceInstances[serviceName] = new ServiceClass();
        }
        
        return this.serviceInstances[serviceName];
    }

    // Execute AI operation with automatic fallback and retry logic
    async executeWithFallback(operation, ...args) {
        const primaryService = this.config.primary;
        const fallbackService = this.config.fallback;
        
        // Try primary service first
        const primaryResult = await this.tryServiceOperation(primaryService, operation, ...args);
        if (primaryResult.success) {
            return primaryResult.data;
        }
        
        console.warn(`Primary service (${primaryService}) failed: ${primaryResult.error}`);
        
        // Try fallback service if enabled
        if (this.config.enableFallback && fallbackService && fallbackService !== primaryService) {
            console.log(`Attempting fallback to ${fallbackService}...`);
            const fallbackResult = await this.tryServiceOperation(fallbackService, operation, ...args);
            
            if (fallbackResult.success) {
                console.log(`✓ Fallback to ${fallbackService} successful`);
                return fallbackResult.data;
            }
            
            console.error(`Fallback service (${fallbackService}) also failed: ${fallbackResult.error}`);
        }
        
        // If both services fail, throw the primary error
        throw new Error(`All AI services failed. Primary: ${primaryResult.error}`);
    }

    // Try service operation with retry logic
    async tryServiceOperation(serviceName, operation, ...args) {
        const service = this.getServiceInstance(serviceName);
        
        for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
            try {
                const startTime = Date.now();
                this.serviceStats[serviceName].requests++;
                
                // Execute operation with timeout
                const result = await Promise.race([
                    service[operation](...args),
                    this.createTimeoutPromise(this.config.timeout)
                ]);
                
                const responseTime = Date.now() - startTime;
                this.updateServiceStats(serviceName, true, responseTime);
                
                return { success: true, data: result };
                
            } catch (error) {
                console.error(`${serviceName} attempt ${attempt}/${this.config.retryAttempts} failed:`, error.message);
                
                this.updateServiceStats(serviceName, false, 0);
                
                // If this is the last attempt, return the error
                if (attempt === this.config.retryAttempts) {
                    return { success: false, error: error.message };
                }
                
                // Wait before retry
                await this.delay(this.config.rateLimitDelay * attempt);
            }
        }
    }

    // Create timeout promise
    createTimeoutPromise(timeout) {
        return new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Operation timeout')), timeout);
        });
    }

    // Update service statistics
    updateServiceStats(serviceName, success, responseTime) {
        const stats = this.serviceStats[serviceName];
        
        if (success) {
            stats.successes++;
            stats.avgResponseTime = (stats.avgResponseTime * (stats.successes - 1) + responseTime) / stats.successes;
        } else {
            stats.failures++;
        }
    }

    // Get service statistics
    getServiceStats() {
        const stats = {};
        
        Object.keys(this.serviceStats).forEach(serviceName => {
            const serviceStats = this.serviceStats[serviceName];
            stats[serviceName] = {
                ...serviceStats,
                successRate: serviceStats.requests > 0 
                    ? ((serviceStats.successes / serviceStats.requests) * 100).toFixed(2) + '%'
                    : '0%'
            };
        });
        
        return stats;
    }

    // Test both services availability
    async testServices() {
        const results = {};
        
        for (const serviceName of Object.keys(this.availableServices)) {
            try {
                console.log(`Testing ${serviceName} service...`);
                const service = this.getServiceInstance(serviceName);
                
                const startTime = Date.now();
                await service.testConnection();
                const responseTime = Date.now() - startTime;
                
                results[serviceName] = {
                    available: true,
                    responseTime: responseTime,
                    error: null
                };
                
                console.log(`✓ ${serviceName} service available (${responseTime}ms)`);
                
            } catch (error) {
                results[serviceName] = {
                    available: false,
                    responseTime: null,
                    error: error.message
                };
                
                console.error(`✗ ${serviceName} service unavailable:`, error.message);
            }
        }
        
        return results;
    }

    // Analyze video content with fallback
    async analyzeVideoContent(videoData, preferredService = null) {
        return await this.executeWithFallback('analyzeVideoContent', videoData);
    }

    // Generate storyboard with fallback
    async generateStoryboard(videoData, analysisData, preferredService = null) {
        return await this.executeWithFallback('generateStoryboard', videoData, analysisData);
    }

    // Generate summary report with fallback
    async generateSummaryReport(videos, analyses, preferredService = null) {
        return await this.executeWithFallback('generateSummaryReport', videos, analyses);
    }

    // Update configuration
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        console.log('AI configuration updated:', this.config);
    }

    // Set primary service
    setPrimaryService(serviceName) {
        if (!this.availableServices[serviceName]) {
            throw new Error(`Unknown service: ${serviceName}`);
        }
        
        this.config.primary = serviceName;
        console.log(`Primary AI service set to: ${serviceName}`);
    }

    // Set fallback service
    setFallbackService(serviceName) {
        if (!this.availableServices[serviceName]) {
            throw new Error(`Unknown service: ${serviceName}`);
        }
        
        this.config.fallback = serviceName;
        console.log(`Fallback AI service set to: ${serviceName}`);
    }

    // Get current configuration
    getConfig() {
        return {
            ...this.config,
            availableServices: Object.keys(this.availableServices),
            serviceStats: this.getServiceStats()
        };
    }

    // Reset statistics
    resetStats() {
        Object.keys(this.serviceStats).forEach(serviceName => {
            this.serviceStats[serviceName] = {
                requests: 0,
                successes: 0,
                failures: 0,
                avgResponseTime: 0
            };
        });
        
        console.log('Service statistics reset');
    }

    // Get service health status
    getServiceHealth() {
        const stats = this.getServiceStats();
        const health = {};
        
        Object.keys(stats).forEach(serviceName => {
            const serviceStats = stats[serviceName];
            let status = 'unknown';
            
            if (serviceStats.requests === 0) {
                status = 'untested';
            } else if (parseFloat(serviceStats.successRate) >= 90) {
                status = 'healthy';
            } else if (parseFloat(serviceStats.successRate) >= 50) {
                status = 'degraded';
            } else {
                status = 'unhealthy';
            }
            
            health[serviceName] = {
                status,
                successRate: serviceStats.successRate,
                avgResponseTime: Math.round(serviceStats.avgResponseTime),
                totalRequests: serviceStats.requests
            };
        });
        
        return health;
    }

    // Auto-configure based on service availability
    async autoConfigureServices() {
        console.log('Auto-configuring AI services...');
        
        const testResults = await this.testServices();
        const availableServices = Object.keys(testResults).filter(
            service => testResults[service].available
        );
        
        if (availableServices.length === 0) {
            throw new Error('No AI services available');
        }
        
        // Sort by response time
        availableServices.sort((a, b) => 
            testResults[a].responseTime - testResults[b].responseTime
        );
        
        this.config.primary = availableServices[0];
        if (availableServices.length > 1) {
            this.config.fallback = availableServices[1];
        }
        
        console.log(`✓ Auto-configured: Primary=${this.config.primary}, Fallback=${this.config.fallback}`);
        return this.config;
    }

    // Utility method for delays
    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = AIConfigManager;
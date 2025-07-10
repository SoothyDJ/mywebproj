// File Path: /backend/services/aiService.js
// AI service wrapper to switch between OpenAI and Claude
// REF-072: Unified AI service interface for multiple providers

const OpenAIService = require('../../ai-services/openai-service');
const ClaudeService = require('../../ai-services/claude-service');

class AIService {
    constructor() {
        this.providers = {
            openai: new OpenAIService(),
            claude: new ClaudeService()
        };
        this.defaultProvider = process.env.DEFAULT_AI_PROVIDER || 'openai';
        this.fallbackProvider = this.defaultProvider === 'openai' ? 'claude' : 'openai';
    }

    // Get AI provider instance
    getProvider(providerName = null) {
        const provider = providerName || this.defaultProvider;
        
        if (!this.providers[provider]) {
            throw new Error(`AI provider '${provider}' not supported. Available: ${Object.keys(this.providers).join(', ')}`);
        }
        
        return this.providers[provider];
    }

    // Analyze video content with fallback
    async analyzeVideoContent(videoData, options = {}) {
        const { provider = this.defaultProvider, useFallback = true } = options;
        
        try {
            console.log(`Analyzing video with ${provider} service...`);
            const aiProvider = this.getProvider(provider);
            return await aiProvider.analyzeVideoContent(videoData);
            
        } catch (error) {
            console.error(`${provider} analysis failed:`, error.message);
            
            if (useFallback && provider !== this.fallbackProvider) {
                console.log(`Attempting fallback to ${this.fallbackProvider}...`);
                try {
                    const fallbackProvider = this.getProvider(this.fallbackProvider);
                    return await fallbackProvider.analyzeVideoContent(videoData);
                } catch (fallbackError) {
                    console.error(`Fallback ${this.fallbackProvider} also failed:`, fallbackError.message);
                    throw new Error(`Both AI services failed: ${error.message} | ${fallbackError.message}`);
                }
            }
            
            throw error;
        }
    }

    // Generate storyboard with fallback
    async generateStoryboard(videoData, analysisData, options = {}) {
        const { provider = this.defaultProvider, useFallback = true } = options;
        
        try {
            console.log(`Generating storyboard with ${provider} service...`);
            const aiProvider = this.getProvider(provider);
            return await aiProvider.generateStoryboard(videoData, analysisData);
            
        } catch (error) {
            console.error(`${provider} storyboard generation failed:`, error.message);
            
            if (useFallback && provider !== this.fallbackProvider) {
                console.log(`Attempting fallback to ${this.fallbackProvider}...`);
                try {
                    const fallbackProvider = this.getProvider(this.fallbackProvider);
                    return await fallbackProvider.generateStoryboard(videoData, analysisData);
                } catch (fallbackError) {
                    console.error(`Fallback ${this.fallbackProvider} also failed:`, fallbackError.message);
                    throw new Error(`Both AI services failed: ${error.message} | ${fallbackError.message}`);
                }
            }
            
            throw error;
        }
    }

    // Generate summary report with fallback
    async generateSummaryReport(videos, analyses, options = {}) {
        const { provider = this.defaultProvider, useFallback = true } = options;
        
        try {
            console.log(`Generating summary with ${provider} service...`);
            const aiProvider = this.getProvider(provider);
            return await aiProvider.generateSummaryReport(videos, analyses);
            
        } catch (error) {
            console.error(`${provider} summary generation failed:`, error.message);
            
            if (useFallback && provider !== this.fallbackProvider) {
                console.log(`Attempting fallback to ${this.fallbackProvider}...`);
                try {
                    const fallbackProvider = this.getProvider(this.fallbackProvider);
                    return await fallbackProvider.generateSummaryReport(videos, analyses);
                } catch (fallbackError) {
                    console.error(`Fallback ${this.fallbackProvider} also failed:`, fallbackError.message);
                    throw new Error(`Both AI services failed: ${error.message} | ${fallbackError.message}`);
                }
            }
            
            throw error;
        }
    }

    // Batch analyze multiple videos
    async batchAnalyzeVideos(videos, options = {}) {
        const { 
            provider = this.defaultProvider, 
            batchSize = 3, 
            delayBetweenBatches = 1000,
            useFallback = true 
        } = options;

        const results = [];
        
        for (let i = 0; i < videos.length; i += batchSize) {
            const batch = videos.slice(i, i + batchSize);
            
            const batchPromises = batch.map(async (video, index) => {
                try {
                    console.log(`Analyzing video ${i + index + 1}/${videos.length}: ${video.title}`);
                    return await this.analyzeVideoContent(video, { provider, useFallback });
                } catch (error) {
                    console.error(`Error analyzing video ${video.title}:`, error.message);
                    return this.getDefaultAnalysis();
                }
            });
            
            const batchResults = await Promise.all(batchPromises);
            results.push(...batchResults);
            
            // Delay between batches to respect rate limits
            if (i + batchSize < videos.length) {
                await this.delay(delayBetweenBatches);
            }
        }
        
        return results;
    }

    // Batch generate storyboards
    async batchGenerateStoryboards(videos, analyses, options = {}) {
        const { 
            provider = this.defaultProvider, 
            delayBetweenRequests = 500,
            useFallback = true 
        } = options;

        const storyboards = [];
        
        for (let i = 0; i < videos.length; i++) {
            try {
                console.log(`Generating storyboard ${i + 1}/${videos.length}: ${videos[i].title}`);
                const storyboard = await this.generateStoryboard(videos[i], analyses[i], { provider, useFallback });
                storyboards.push(storyboard);
                
                // Small delay to respect rate limits
                if (i < videos.length - 1) {
                    await this.delay(delayBetweenRequests);
                }
                
            } catch (error) {
                console.error(`Error generating storyboard for ${videos[i].title}:`, error.message);
                storyboards.push(this.getDefaultStoryboard());
            }
        }
        
        return storyboards;
    }

    // Test all AI connections
    async testAllConnections() {
        const results = {};
        
        for (const [providerName, provider] of Object.entries(this.providers)) {
            try {
                console.log(`Testing ${providerName} connection...`);
                const result = await provider.testConnection();
                results[providerName] = {
                    status: 'success',
                    message: result,
                    timestamp: new Date().toISOString()
                };
                console.log(`✓ ${providerName} connection successful`);
            } catch (error) {
                results[providerName] = {
                    status: 'failed',
                    message: error.message,
                    timestamp: new Date().toISOString()
                };
                console.log(`✗ ${providerName} connection failed:`, error.message);
            }
        }
        
        return results;
    }

    // Get service health status
    async getHealthStatus() {
        const connections = await this.testAllConnections();
        const healthyProviders = Object.entries(connections).filter(([, result]) => result.status === 'success');
        
        return {
            status: healthyProviders.length > 0 ? 'healthy' : 'unhealthy',
            availableProviders: healthyProviders.map(([name]) => name),
            defaultProvider: this.defaultProvider,
            fallbackProvider: this.fallbackProvider,
            connections: connections,
            timestamp: new Date().toISOString()
        };
    }

    // Switch default provider
    setDefaultProvider(providerName) {
        if (!this.providers[providerName]) {
            throw new Error(`Provider '${providerName}' not available. Available: ${Object.keys(this.providers).join(', ')}`);
        }
        
        const oldProvider = this.defaultProvider;
        this.defaultProvider = providerName;
        this.fallbackProvider = providerName === 'openai' ? 'claude' : 'openai';
        
        console.log(`✓ Default AI provider changed from ${oldProvider} to ${providerName}`);
        return {
            previous: oldProvider,
            current: this.defaultProvider,
            fallback: this.fallbackProvider
        };
    }

    // Get provider usage statistics
    getProviderStats() {
        return {
            availableProviders: Object.keys(this.providers),
            defaultProvider: this.defaultProvider,
            fallbackProvider: this.fallbackProvider,
            supportedMethods: [
                'analyzeVideoContent',
                'generateStoryboard',
                'generateSummaryReport',
                'testConnection'
            ]
        };
    }

    // Helper methods
    getDefaultAnalysis() {
        return {
            summary: 'Analysis could not be completed',
            themes: [],
            sentiment: 'neutral',
            sentimentScore: 0.0,
            keyTopics: [],
            contentType: 'unknown',
            targetAudience: 'general',
            credibilityScore: 0.5,
            engagementFactors: [],
            notableElements: [],
            recommendations: 'Unable to generate recommendations'
        };
    }

    getDefaultStoryboard() {
        return {
            title: 'Default Storyboard',
            totalScenes: 1,
            estimatedDuration: '2 minutes',
            scenes: [{
                sequenceNumber: 1,
                sceneTitle: 'Introduction',
                duration: '2 minutes',
                narrationText: 'Content analysis was not available for detailed storyboard generation.',
                visualElements: ['Simple presentation slide'],
                audioCues: ['Background music'],
                transitionNotes: 'Fade out'
            }],
            productionNotes: 'Storyboard generation failed - using default template'
        };
    }

    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Provider-specific method routing
    async callProviderMethod(method, args, options = {}) {
        const { provider = this.defaultProvider, useFallback = true } = options;
        
        try {
            const aiProvider = this.getProvider(provider);
            
            if (typeof aiProvider[method] !== 'function') {
                throw new Error(`Method '${method}' not available on ${provider} provider`);
            }
            
            return await aiProvider[method](...args);
            
        } catch (error) {
            if (useFallback && provider !== this.fallbackProvider) {
                console.log(`Attempting fallback to ${this.fallbackProvider} for method ${method}...`);
                try {
                    const fallbackProvider = this.getProvider(this.fallbackProvider);
                    return await fallbackProvider[method](...args);
                } catch (fallbackError) {
                    throw new Error(`Both AI services failed: ${error.message} | ${fallbackError.message}`);
                }
            }
            
            throw error;
        }
    }
}

module.exports = AIService; 

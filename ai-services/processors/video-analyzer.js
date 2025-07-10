// File Path: /ai-services/processors/video-analyzer.js
// Video analysis processor with batch processing and error handling
// REF-075: Video analyzer processor extracted from content analyzer

const OpenAIService = require('../openai-service');
const ClaudeService = require('../claude-service');

class VideoAnalyzer {
    constructor(options = {}) {
        this.options = {
            aiProvider: options.aiProvider || 'openai', // 'openai' or 'claude'
            batchSize: options.batchSize || 3,
            maxRetries: options.maxRetries || 2,
            retryDelay: options.retryDelay || 1000,
            rateLimit: options.rateLimit || 1000, // ms between batches
            ...options
        };
        
        this.aiService = this.initializeAIService();
        this.analysisCache = new Map();
        this.statistics = {
            totalAnalyzed: 0,
            successful: 0,
            failed: 0,
            cached: 0,
            averageTime: 0
        };
    }

    // Initialize AI service based on provider
    initializeAIService() {
        switch (this.options.aiProvider.toLowerCase()) {
            case 'claude':
                return new ClaudeService();
            case 'openai':
            default:
                return new OpenAIService();
        }
    }

    // Analyze multiple videos in batches
    async analyzeVideos(videos, options = {}) {
        try {
            console.log(`Starting video analysis of ${videos.length} videos using ${this.options.aiProvider}`);
            
            const startTime = Date.now();
            const analyses = [];
            const batchSize = options.batchSize || this.options.batchSize;
            
            // Reset statistics for this run
            this.resetStatistics();
            
            // Process videos in batches
            for (let i = 0; i < videos.length; i += batchSize) {
                const batch = videos.slice(i, i + batchSize);
                console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(videos.length / batchSize)}`);
                
                const batchResults = await this.processBatch(batch, i);
                analyses.push(...batchResults);
                
                // Rate limiting between batches
                if (i + batchSize < videos.length) {
                    await this.delay(this.options.rateLimit);
                }
            }
            
            // Calculate final statistics
            const totalTime = Date.now() - startTime;
            this.statistics.averageTime = Math.round(totalTime / videos.length);
            
            console.log('✓ Video analysis completed');
            this.logStatistics();
            
            return analyses;
            
        } catch (error) {
            console.error('✗ Video analysis failed:', error.message);
            throw error;
        }
    }

    // Process a batch of videos concurrently
    async processBatch(videos, startIndex) {
        const batchPromises = videos.map(async (video, batchIndex) => {
            const globalIndex = startIndex + batchIndex;
            return await this.analyzeVideo(video, globalIndex + 1);
        });
        
        try {
            const results = await Promise.all(batchPromises);
            return results;
        } catch (error) {
            console.error('Batch processing error:', error.message);
            
            // Fallback: process videos sequentially if batch fails
            console.log('Falling back to sequential processing...');
            const results = [];
            for (let i = 0; i < videos.length; i++) {
                const result = await this.analyzeVideo(videos[i], startIndex + i + 1);
                results.push(result);
            }
            return results;
        }
    }

    // Analyze a single video with retry logic and caching
    async analyzeVideo(video, index) {
        try {
            console.log(`Analyzing video ${index}: ${video.title}`);
            
            // Check cache first
            const cacheKey = this.getCacheKey(video);
            if (this.analysisCache.has(cacheKey)) {
                console.log(`Using cached analysis for: ${video.title}`);
                this.statistics.cached++;
                return this.analysisCache.get(cacheKey);
            }
            
            // Validate video data
            if (!this.validateVideoData(video)) {
                console.warn(`Skipping invalid video data: ${video.title}`);
                this.statistics.failed++;
                return this.getDefaultAnalysis();
            }
            
            // Attempt analysis with retries
            let lastError;
            for (let attempt = 1; attempt <= this.options.maxRetries; attempt++) {
                try {
                    const analysis = await this.performAnalysis(video);
                    
                    // Cache successful result
                    this.analysisCache.set(cacheKey, analysis);
                    this.statistics.successful++;
                    this.statistics.totalAnalyzed++;
                    
                    return analysis;
                    
                } catch (error) {
                    lastError = error;
                    console.warn(`Analysis attempt ${attempt}/${this.options.maxRetries} failed for ${video.title}: ${error.message}`);
                    
                    if (attempt < this.options.maxRetries) {
                        await this.delay(this.options.retryDelay * attempt);
                    }
                }
            }
            
            // All retries failed
            console.error(`Analysis failed for ${video.title} after ${this.options.maxRetries} attempts`);
            this.statistics.failed++;
            this.statistics.totalAnalyzed++;
            
            return this.getDefaultAnalysis(lastError.message);
            
        } catch (error) {
            console.error(`Error analyzing video ${video.title}:`, error.message);
            this.statistics.failed++;
            this.statistics.totalAnalyzed++;
            return this.getDefaultAnalysis(error.message);
        }
    }

    // Perform the actual AI analysis
    async performAnalysis(video) {
        try {
            // Enhance video data with additional context
            const enhancedVideo = this.enhanceVideoData(video);
            
            // Call AI service
            const analysis = await this.aiService.analyzeVideoContent(enhancedVideo);
            
            // Post-process and validate analysis
            const processedAnalysis = this.postProcessAnalysis(analysis, video);
            
            return processedAnalysis;
            
        } catch (error) {
            console.error('AI analysis error:', error.message);
            throw error;
        }
    }

    // Enhance video data with additional context
    enhanceVideoData(video) {
        return {
            ...video,
            // Add computed fields
            estimatedDuration: this.parseDuration(video.duration),
            viewsNumeric: this.parseViewCount(video.viewCount),
            uploadDateParsed: this.parseUploadDate(video.uploadDate),
            
            // Add content hints based on title/description
            contentHints: this.extractContentHints(video),
            
            // Add metadata
            analysisTimestamp: new Date().toISOString(),
            aiProvider: this.options.aiProvider
        };
    }

    // Extract content hints from title and description
    extractContentHints(video) {
        const hints = [];
        const text = `${video.title} ${video.description}`.toLowerCase();
        
        // Content type hints
        const typePatterns = {
            tutorial: /tutorial|how to|guide|learn|step by step/,
            review: /review|opinion|thoughts on|rating/,
            gaming: /gameplay|gaming|game|playing|stream/,
            music: /music|song|audio|sound|beat/,
            news: /news|breaking|update|report|announcement/,
            comedy: /funny|comedy|humor|laugh|joke/,
            educational: /education|explain|science|history|documentary/,
            entertainment: /entertainment|fun|amazing|incredible/
        };
        
        Object.entries(typePatterns).forEach(([type, pattern]) => {
            if (pattern.test(text)) {
                hints.push(type);
            }
        });
        
        // Topic hints
        const topicPatterns = {
            technology: /tech|computer|software|AI|programming/,
            sports: /sport|football|basketball|soccer|tennis/,
            cooking: /cook|recipe|food|kitchen|chef/,
            travel: /travel|trip|vacation|journey|destination/,
            health: /health|fitness|workout|exercise|diet/,
            business: /business|entrepreneur|startup|finance/
        };
        
        Object.entries(topicPatterns).forEach(([topic, pattern]) => {
            if (pattern.test(text)) {
                hints.push(topic);
            }
        });
        
        return hints;
    }

    // Post-process analysis results
    postProcessAnalysis(analysis, originalVideo) {
        try {
            // Ensure all required fields exist
            const processedAnalysis = {
                summary: analysis.summary || 'No summary available',
                themes: Array.isArray(analysis.themes) ? analysis.themes : [],
                sentiment: analysis.sentiment || 'neutral',
                sentimentScore: this.normalizeSentimentScore(analysis.sentimentScore),
                keyTopics: Array.isArray(analysis.keyTopics) ? analysis.keyTopics : [],
                contentType: analysis.contentType || 'unknown',
                targetAudience: analysis.targetAudience || 'general',
                credibilityScore: this.normalizeScore(analysis.credibilityScore),
                engagementFactors: Array.isArray(analysis.engagementFactors) ? analysis.engagementFactors : [],
                notableElements: Array.isArray(analysis.notableElements) ? analysis.notableElements : [],
                recommendations: analysis.recommendations || 'No recommendations available',
                
                // Add metadata
                analyzedAt: new Date().toISOString(),
                aiProvider: this.options.aiProvider,
                videoId: originalVideo.videoId,
                analysisVersion: '1.0'
            };
            
            // Validate sentiment
            if (!['positive', 'negative', 'neutral'].includes(processedAnalysis.sentiment)) {
                processedAnalysis.sentiment = 'neutral';
            }
            
            // Limit array sizes
            processedAnalysis.themes = processedAnalysis.themes.slice(0, 10);
            processedAnalysis.keyTopics = processedAnalysis.keyTopics.slice(0, 10);
            processedAnalysis.engagementFactors = processedAnalysis.engagementFactors.slice(0, 5);
            processedAnalysis.notableElements = processedAnalysis.notableElements.slice(0, 5);
            
            return processedAnalysis;
            
        } catch (error) {
            console.error('Post-processing error:', error.message);
            return this.getDefaultAnalysis('Post-processing failed');
        }
    }

    // Utility methods
    normalizeSentimentScore(score) {
        if (typeof score !== 'number' || isNaN(score)) return 0.0;
        return Math.max(-1.0, Math.min(1.0, score));
    }

    normalizeScore(score) {
        if (typeof score !== 'number' || isNaN(score)) return 0.5;
        return Math.max(0.0, Math.min(1.0, score));
    }

    getCacheKey(video) {
        return `${video.videoId}_${video.title.substring(0, 50)}`;
    }

    validateVideoData(video) {
        return video && 
               video.videoId && 
               video.title && 
               video.channelName &&
               video.videoId.length >= 10;
    }

    parseViewCount(viewStr) {
        if (!viewStr) return 0;
        
        const cleanStr = viewStr.replace(/[^0-9.KMB]/gi, '');
        const number = parseFloat(cleanStr);
        
        if (cleanStr.includes('M')) return Math.round(number * 1000000);
        if (cleanStr.includes('K')) return Math.round(number * 1000);
        if (cleanStr.includes('B')) return Math.round(number * 1000000000);
        
        return Math.round(number) || 0;
    }

    parseDuration(durationStr) {
        if (!durationStr) return 0;
        
        const parts = durationStr.split(':').map(p => parseInt(p));
        if (parts.length === 2) {
            return parts[0] * 60 + parts[1];
        } else if (parts.length === 3) {
            return parts[0] * 3600 + parts[1] * 60 + parts[2];
        }
        
        return 0;
    }

    parseUploadDate(dateStr) {
        if (!dateStr) return null;
        
        try {
            // Handle relative dates
            const now = new Date();
            
            if (dateStr.includes('hour')) {
                const hours = parseInt(dateStr.match(/(\d+)/)?.[1] || '1');
                return new Date(now.getTime() - hours * 60 * 60 * 1000);
            }
            
            if (dateStr.includes('day')) {
                const days = parseInt(dateStr.match(/(\d+)/)?.[1] || '1');
                return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
            }
            
            if (dateStr.includes('week')) {
                const weeks = parseInt(dateStr.match(/(\d+)/)?.[1] || '1');
                return new Date(now.getTime() - weeks * 7 * 24 * 60 * 60 * 1000);
            }
            
            if (dateStr.includes('month')) {
                const months = parseInt(dateStr.match(/(\d+)/)?.[1] || '1');
                return new Date(now.getFullYear(), now.getMonth() - months, now.getDate());
            }
            
            return new Date(dateStr);
        } catch (error) {
            return null;
        }
    }

    getDefaultAnalysis(errorMessage = 'Analysis not available') {
        return {
            summary: errorMessage,
            themes: [],
            sentiment: 'neutral',
            sentimentScore: 0.0,
            keyTopics: [],
            contentType: 'unknown',
            targetAudience: 'general',
            credibilityScore: 0.5,
            engagementFactors: [],
            notableElements: [],
            recommendations: 'Unable to generate recommendations',
            analyzedAt: new Date().toISOString(),
            aiProvider: this.options.aiProvider,
            analysisVersion: '1.0',
            error: true
        };
    }

    // Statistics and reporting
    resetStatistics() {
        this.statistics = {
            totalAnalyzed: 0,
            successful: 0,
            failed: 0,
            cached: 0,
            averageTime: 0
        };
    }

    logStatistics() {
        console.log('\n📊 Analysis Statistics:');
        console.log(`Total Processed: ${this.statistics.totalAnalyzed}`);
        console.log(`Successful: ${this.statistics.successful}`);
        console.log(`Failed: ${this.statistics.failed}`);
        console.log(`From Cache: ${this.statistics.cached}`);
        console.log(`Average Time: ${this.statistics.averageTime}ms per video`);
        console.log(`Success Rate: ${((this.statistics.successful / this.statistics.totalAnalyzed) * 100).toFixed(1)}%`);
    }

    getStatistics() {
        return { ...this.statistics };
    }

    // Cache management
    clearCache() {
        this.analysisCache.clear();
        console.log('✓ Analysis cache cleared');
    }

    getCacheSize() {
        return this.analysisCache.size;
    }

    // Utility delay function
    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Test method
    async test() {
        try {
            console.log('Testing Video Analyzer...');
            
            // Test with sample video data
            const sampleVideos = [
                {
                    videoId: 'dQw4w9WgXcQ',
                    title: 'Rick Astley - Never Gonna Give You Up',
                    channelName: 'RickAstleyVEVO',
                    description: 'Official music video',
                    viewCount: '1.4B views',
                    duration: '3:33',
                    uploadDate: '12 years ago'
                },
                {
                    videoId: 'test123456',
                    title: 'Test Video for Analysis',
                    channelName: 'Test Channel',
                    description: 'This is a test video for analysis',
                    viewCount: '1K views',
                    duration: '5:00',
                    uploadDate: '1 week ago'
                }
            ];
            
            const results = await this.analyzeVideos(sampleVideos, { batchSize: 2 });
            
            console.log('\n✓ Test Results:');
            results.forEach((result, index) => {
                console.log(`${index + 1}. ${result.contentType} - ${result.sentiment} sentiment`);
            });
            
            return results;
            
        } catch (error) {
            console.error('✗ Video Analyzer test failed:', error.message);
            throw error;
        }
    }
}

module.exports = VideoAnalyzer;
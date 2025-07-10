// File Path: /ai-services/performance-optimizer.js
// Performance optimization module for content analysis workflow
// REF-067: Performance optimizations for scraping, AI analysis, and processing

class PerformanceOptimizer {
    constructor() {
        this.cache = new Map();
        this.metrics = {
            startTime: null,
            scrapingTime: 0,
            analysisTime: 0,
            storyboardTime: 0,
            totalRequests: 0,
            cacheHits: 0,
            errors: 0
        };
        this.rateLimiter = new RateLimiter();
        this.parallelProcessor = new ParallelProcessor();
    }

    // Initialize performance tracking
    startTracking() {
        this.metrics.startTime = Date.now();
        this.metrics = {
            ...this.metrics,
            scrapingTime: 0,
            analysisTime: 0,
            storyboardTime: 0,
            totalRequests: 0,
            cacheHits: 0,
            errors: 0
        };
    }

    // Optimized video analysis with caching and parallel processing
    async optimizeVideoAnalysis(videos, aiManager) {
        const startTime = Date.now();
        
        try {
            console.log(`🚀 Starting optimized analysis of ${videos.length} videos`);
            
            // Split videos into cached and uncached
            const { cached, uncached } = this.separateCachedVideos(videos);
            
            console.log(`📋 Cache status: ${cached.length} cached, ${uncached.length} need analysis`);
            this.metrics.cacheHits += cached.length;
            
            // Process uncached videos in optimized batches
            const uncachedAnalyses = await this.parallelProcessor.processInBatches(
                uncached,
                async (video) => {
                    const cacheKey = this.generateCacheKey(video, 'analysis');
                    
                    try {
                        const analysis = await this.rateLimiter.execute(
                            () => aiManager.analyzeVideoContent(video)
                        );
                        
                        // Cache successful results
                        this.cache.set(cacheKey, {
                            data: analysis,
                            timestamp: Date.now(),
                            ttl: 24 * 60 * 60 * 1000 // 24 hours
                        });
                        
                        this.metrics.totalRequests++;
                        return analysis;
                        
                    } catch (error) {
                        this.metrics.errors++;
                        console.error(`⚠️ Analysis failed for ${video.title}:`, error.message);
                        return aiManager.getAIService().getDefaultAnalysis();
                    }
                },
                { 
                    batchSize: this.calculateOptimalBatchSize(uncached.length),
                    delayBetweenBatches: 800,
                    concurrency: 3
                }
            );
            
            // Combine cached and new results
            const allAnalyses = this.combineResults(videos, cached, uncached, uncachedAnalyses);
            
            this.metrics.analysisTime = Date.now() - startTime;
            console.log(`✅ Analysis completed in ${this.metrics.analysisTime}ms`);
            
            return allAnalyses;
            
        } catch (error) {
            console.error('🔥 Optimized analysis failed:', error.message);
            throw error;
        }
    }

    // Optimized storyboard generation
    async optimizeStoryboardGeneration(videos, analyses, aiManager) {
        const startTime = Date.now();
        
        try {
            console.log(`🎬 Starting optimized storyboard generation for ${videos.length} videos`);
            
            const storyboards = await this.parallelProcessor.processInBatches(
                videos.map((video, index) => ({ video, analysis: analyses[index], index })),
                async ({ video, analysis, index }) => {
                    const cacheKey = this.generateCacheKey(video, 'storyboard');
                    const cached = this.getCachedData(cacheKey);
                    
                    if (cached) {
                        this.metrics.cacheHits++;
                        return cached;
                    }
                    
                    try {
                        const storyboard = await this.rateLimiter.execute(
                            () => aiManager.generateStoryboard(video, analysis)
                        );
                        
                        // Cache result
                        this.cache.set(cacheKey, {
                            data: storyboard,
                            timestamp: Date.now(),
                            ttl: 12 * 60 * 60 * 1000 // 12 hours
                        });
                        
                        this.metrics.totalRequests++;
                        return storyboard;
                        
                    } catch (error) {
                        this.metrics.errors++;
                        console.error(`⚠️ Storyboard failed for ${video.title}:`, error.message);
                        return aiManager.getAIService().getDefaultStoryboard();
                    }
                },
                {
                    batchSize: this.calculateOptimalBatchSize(videos.length, 'storyboard'),
                    delayBetweenBatches: 600,
                    concurrency: 2
                }
            );
            
            this.metrics.storyboardTime = Date.now() - startTime;
            console.log(`✅ Storyboard generation completed in ${this.metrics.storyboardTime}ms`);
            
            return storyboards;
            
        } catch (error) {
            console.error('🔥 Optimized storyboard generation failed:', error.message);
            throw error;
        }
    }

    // Memory optimization for large datasets
    optimizeMemoryUsage(videos, analyses, storyboards) {
        console.log('🧹 Optimizing memory usage...');
        
        // Clean up large description fields if not needed
        const optimizedVideos = videos.map(video => ({
            ...video,
            description: video.description ? video.description.substring(0, 500) : ''
        }));
        
        // Compress analysis data
        const optimizedAnalyses = analyses.map(analysis => {
            if (!analysis) return analysis;
            
            return {
                ...analysis,
                summary: analysis.summary ? analysis.summary.substring(0, 300) : '',
                recommendations: analysis.recommendations ? analysis.recommendations.substring(0, 200) : ''
            };
        });
        
        // Clean old cache entries
        this.cleanCache();
        
        console.log('✅ Memory optimization completed');
        
        return {
            videos: optimizedVideos,
            analyses: optimizedAnalyses,
            storyboards: storyboards
        };
    }

    // Calculate optimal batch size based on workload
    calculateOptimalBatchSize(totalItems, taskType = 'analysis') {
        const baseBatchSize = taskType === 'storyboard' ? 2 : 3;
        
        if (totalItems <= 5) return 1;
        if (totalItems <= 10) return baseBatchSize;
        if (totalItems <= 25) return baseBatchSize + 1;
        return baseBatchSize + 2;
    }

    // Cache management
    separateCachedVideos(videos) {
        const cached = [];
        const uncached = [];
        
        videos.forEach(video => {
            const cacheKey = this.generateCacheKey(video, 'analysis');
            const cachedData = this.getCachedData(cacheKey);
            
            if (cachedData) {
                cached.push({ video, analysis: cachedData });
            } else {
                uncached.push(video);
            }
        });
        
        return { cached, uncached };
    }

    generateCacheKey(video, type) {
        // Create cache key based on video content and type
        const contentHash = this.simpleHash(video.title + video.channelName + video.viewCount);
        return `${type}_${video.videoId || contentHash}`;
    }

    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash).toString(36);
    }

    getCachedData(key) {
        const cached = this.cache.get(key);
        if (!cached) return null;
        
        // Check if cache entry has expired
        if (Date.now() - cached.timestamp > cached.ttl) {
            this.cache.delete(key);
            return null;
        }
        
        return cached.data;
    }

    combineResults(allVideos, cachedResults, uncachedVideos, uncachedAnalyses) {
        const results = [];
        let cachedIndex = 0;
        let uncachedIndex = 0;
        
        allVideos.forEach(video => {
            // Check if this video was cached
            const cachedMatch = cachedResults.find(c => c.video.videoId === video.videoId);
            
            if (cachedMatch) {
                results.push(cachedMatch.analysis);
            } else {
                results.push(uncachedAnalyses[uncachedIndex]);
                uncachedIndex++;
            }
        });
        
        return results;
    }

    cleanCache() {
        const now = Date.now();
        let cleanedCount = 0;
        
        for (const [key, value] of this.cache.entries()) {
            if (now - value.timestamp > value.ttl) {
                this.cache.delete(key);
                cleanedCount++;
            }
        }
        
        console.log(`🧹 Cleaned ${cleanedCount} expired cache entries`);
    }

    // Performance metrics
    getMetrics() {
        const totalTime = this.metrics.startTime ? Date.now() - this.metrics.startTime : 0;
        const cacheHitRate = this.metrics.totalRequests > 0 
            ? (this.metrics.cacheHits / (this.metrics.totalRequests + this.metrics.cacheHits) * 100).toFixed(2)
            : 0;
        
        return {
            totalExecutionTime: totalTime,
            scrapingTime: this.metrics.scrapingTime,
            analysisTime: this.metrics.analysisTime,
            storyboardTime: this.metrics.storyboardTime,
            totalRequests: this.metrics.totalRequests,
            cacheHits: this.metrics.cacheHits,
            cacheHitRate: `${cacheHitRate}%`,
            errors: this.metrics.errors,
            cacheSize: this.cache.size,
            averageRequestTime: this.metrics.totalRequests > 0 
                ? Math.round((this.metrics.analysisTime + this.metrics.storyboardTime) / this.metrics.totalRequests)
                : 0
        };
    }

    // Resource monitoring
    getResourceUsage() {
        const memUsage = process.memoryUsage();
        
        return {
            memoryUsage: {
                rss: Math.round(memUsage.rss / 1024 / 1024) + ' MB',
                heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + ' MB',
                heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + ' MB',
                external: Math.round(memUsage.external / 1024 / 1024) + ' MB'
            },
            cacheSize: this.cache.size,
            uptime: Math.round(process.uptime()) + ' seconds'
        };
    }

    // Clear all caches
    clearCache() {
        this.cache.clear();
        console.log('🧹 All caches cleared');
    }
}

// Rate limiter class
class RateLimiter {
    constructor(requestsPerSecond = 2) {
        this.requestsPerSecond = requestsPerSecond;
        this.requests = [];
    }

    async execute(fn) {
        await this.waitForAvailableSlot();
        this.requests.push(Date.now());
        return await fn();
    }

    async waitForAvailableSlot() {
        const now = Date.now();
        const oneSecondAgo = now - 1000;
        
        // Remove requests older than 1 second
        this.requests = this.requests.filter(time => time > oneSecondAgo);
        
        // If we've hit the limit, wait
        if (this.requests.length >= this.requestsPerSecond) {
            const oldestRequest = Math.min(...this.requests);
            const waitTime = 1000 - (now - oldestRequest) + 100; // Add 100ms buffer
            
            if (waitTime > 0) {
                await new Promise(resolve => setTimeout(resolve, waitTime));
            }
        }
    }
}

// Parallel processor class
class ParallelProcessor {
    async processInBatches(items, processor, options = {}) {
        const {
            batchSize = 3,
            delayBetweenBatches = 1000,
            concurrency = 2
        } = options;
        
        const results = [];
        
        for (let i = 0; i < items.length; i += batchSize) {
            const batch = items.slice(i, i + batchSize);
            
            console.log(`📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(items.length / batchSize)} (${batch.length} items)`);
            
            // Process batch with controlled concurrency
            const batchPromises = batch.map(item => processor(item));
            const batchResults = await Promise.all(batchPromises);
            
            results.push(...batchResults);
            
            // Delay between batches (except for the last batch)
            if (i + batchSize < items.length) {
                await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
            }
        }
        
        return results;
    }
}

module.exports = PerformanceOptimizer;
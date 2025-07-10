require('dotenv').config({ path: '../backend/.env' });
const PerformanceOptimizer = require('./performance-optimizer');
const OpenAIService = require('./openai-service');

async function testPerformanceOptimizer() {
    const optimizer = new PerformanceOptimizer();
    const aiService = new OpenAIService();
    
    try {
        console.log('Testing Performance Optimizer...');
        
        // Start performance tracking
        optimizer.startTracking();
        
        // Sample video data for testing
        const testVideos = [
            {
                videoId: 'test1',
                title: 'Test Video 1 - Performance Test',
                channelName: 'Test Channel',
                viewCount: '1M views',
                duration: '10:30'
            },
            {
                videoId: 'test2', 
                title: 'Test Video 2 - Performance Test',
                channelName: 'Test Channel 2',
                viewCount: '500K views',
                duration: '8:15'
            },
            {
                videoId: 'test3',
                title: 'Test Video 3 - Performance Test', 
                channelName: 'Test Channel 3',
                viewCount: '2M views',
                duration: '12:45'
            }
        ];
        
        // Create mock AI manager
        const mockAIManager = {
            analyzeVideoContent: async (video) => {
                // Simulate AI processing time
                await new Promise(resolve => setTimeout(resolve, 500));
                return {
                    summary: `AI analysis for ${video.title}`,
                    themes: ['test', 'performance'],
                    sentiment: 'positive',
                    sentimentScore: 0.8,
                    contentType: 'test'
                };
            },
            generateStoryboard: async (video, analysis) => {
                // Simulate storyboard generation time
                await new Promise(resolve => setTimeout(resolve, 300));
                return {
                    title: `Storyboard for ${video.title}`,
                    totalScenes: 3,
                    scenes: [{
                        sequenceNumber: 1,
                        sceneTitle: 'Test Scene',
                        narrationText: 'Test narration'
                    }]
                };
            },
            getAIService: () => aiService
        };
        
        console.log('\n1. Testing optimized video analysis...');
        const analyses = await optimizer.optimizeVideoAnalysis(testVideos, mockAIManager);
        console.log(`✓ Analyses completed: ${analyses.length}`);
        
        console.log('\n2. Testing optimized storyboard generation...');
        const storyboards = await optimizer.optimizeStoryboardGeneration(testVideos, analyses, mockAIManager);
        console.log(`✓ Storyboards completed: ${storyboards.length}`);
        
        console.log('\n3. Testing memory optimization...');
        const optimized = optimizer.optimizeMemoryUsage(testVideos, analyses, storyboards);
        console.log(`✓ Memory optimization completed`);
        
        console.log('\n4. Testing cache (re-run same videos)...');
        const cachedAnalyses = await optimizer.optimizeVideoAnalysis(testVideos, mockAIManager);
        console.log(`✓ Cached analyses: ${cachedAnalyses.length}`);
        
        // Get performance metrics
        console.log('\n📊 Performance Metrics:');
        const metrics = optimizer.getMetrics();
        console.log(JSON.stringify(metrics, null, 2));
        
        console.log('\n💾 Resource Usage:');
        const resources = optimizer.getResourceUsage();
        console.log(JSON.stringify(resources, null, 2));
        
        console.log('\n✅ Performance Optimizer test completed!');
        
    } catch (error) {
        console.error('❌ Performance test failed:', error.message);
    }
}

testPerformanceOptimizer();
require('dotenv').config();
const AIService = require('./services/aiService');

async function testAIService() {
    const aiService = new AIService();
    
    try {
        console.log('Testing AI Service Wrapper...');
        console.log('==========================================\n');
        
        // Test 1: Get provider stats
        console.log('1. Testing provider statistics...');
        const stats = aiService.getProviderStats();
        console.log('Provider stats:', stats);
        console.log('✓ Provider stats retrieved\n');
        
        // Test 2: Test all connections
        console.log('2. Testing all AI connections...');
        const healthStatus = await aiService.getHealthStatus();
        console.log('Health status:', healthStatus);
        console.log('✓ Health check completed\n');
        
        // Test 3: Test video analysis with default provider
        console.log('3. Testing video analysis with default provider...');
        const sampleVideo = {
            title: "Sample Paranormal Video",
            channelName: "Test Channel",
            duration: "10:30",
            viewCount: "1M views",
            uploadDate: "1 week ago",
            description: "Test paranormal content"
        };
        
        const analysis = await aiService.analyzeVideoContent(sampleVideo);
        console.log('Analysis result keys:', Object.keys(analysis));
        console.log('Content type:', analysis.contentType);
        console.log('Sentiment:', analysis.sentiment);
        console.log('✓ Video analysis completed\n');
        
        // Test 4: Test provider switching
        console.log('4. Testing provider switching...');
        const currentProvider = aiService.defaultProvider;
        const otherProvider = currentProvider === 'openai' ? 'claude' : 'openai';
        
        console.log(`Current default: ${currentProvider}`);
        
        try {
            const switchResult = aiService.setDefaultProvider(otherProvider);
            console.log('Switch result:', switchResult);
            console.log('✓ Provider switching successful\n');
            
            // Switch back
            aiService.setDefaultProvider(currentProvider);
            console.log(`✓ Switched back to ${currentProvider}\n`);
        } catch (switchError) {
            console.log('Provider switching test - some providers may not be configured:', switchError.message);
        }
        
        // Test 5: Test storyboard generation
        console.log('5. Testing storyboard generation...');
        const storyboard = await aiService.generateStoryboard(sampleVideo, analysis);
        console.log('Storyboard title:', storyboard.title);
        console.log('Total scenes:', storyboard.totalScenes);
        console.log('✓ Storyboard generation completed\n');
        
        // Test 6: Test batch operations
        console.log('6. Testing batch analysis...');
        const multipleVideos = [sampleVideo, {
            ...sampleVideo,
            title: "Another Test Video",
            description: "Another test description"
        }];
        
        const batchResults = await aiService.batchAnalyzeVideos(multipleVideos, { batchSize: 2 });
        console.log(`✓ Batch analysis completed for ${batchResults.length} videos\n`);
        
        console.log('==========================================');
        console.log('✓ All AI Service tests completed successfully!');
        console.log('Available providers:', healthStatus.availableProviders);
        console.log('Service is', healthStatus.status);
        
    } catch (error) {
        console.error('✗ AI Service test failed:', error.message);
        console.error('Stack:', error.stack);
    }
}

testAIService();
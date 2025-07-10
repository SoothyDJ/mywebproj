require('dotenv').config({ path: '../backend/.env' });
const AIConfigManager = require('./ai-config');

async function testAIConfig() {
    const aiManager = new AIConfigManager();
    
    try {
        console.log('Testing AI Configuration Manager...');
        
        // Test 1: Service availability
        console.log('\n1. Testing service availability...');
        const serviceTests = await aiManager.testServices();
        console.log('Service test results:', serviceTests);
        
        // Test 2: Auto-configuration
        console.log('\n2. Auto-configuring services...');
        const config = await aiManager.autoConfigureServices();
        console.log('Auto-config result:', config);
        
        // Test 3: Video analysis with fallback
        console.log('\n3. Testing video analysis with fallback...');
        const sampleVideo = {
            title: "Test Paranormal Video",
            channelName: "Test Channel",
            duration: "10:00",
            viewCount: "1M views",
            description: "Test description"
        };
        
        const analysis = await aiManager.analyzeVideoContent(sampleVideo);
        console.log('✓ Analysis completed with service:', aiManager.getConfig().primary);
        
        // Test 4: Get service statistics
        console.log('\n4. Service statistics:');
        const stats = aiManager.getServiceStats();
        console.log(stats);
        
        // Test 5: Service health
        console.log('\n5. Service health:');
        const health = aiManager.getServiceHealth();
        console.log(health);
        
        console.log('\n✓ AI Configuration Manager test completed!');
        
    } catch (error) {
        console.error('✗ AI Config test failed:', error.message);
    }
}

testAIConfig();
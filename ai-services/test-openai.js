require('dotenv').config({ path: '../backend/.env' });
const OpenAIService = require('./openai-service');

async function testOpenAI() {
    const aiService = new OpenAIService();
    
    try {
        console.log('Testing OpenAI connection...');
        
        // Test basic connection
        const connectionTest = await aiService.testConnection();
        console.log('Connection result:', connectionTest);
        
        // Test video analysis with sample data
        const sampleVideo = {
            title: "Top 10 Real Ghost Encounters Caught on Camera",
            channelName: "Paranormal Investigator",
            duration: "15:30",
            viewCount: "2.3M views",
            uploadDate: "2 weeks ago",
            description: "Real paranormal activity captured on video"
        };
        
        console.log('\nTesting video analysis...');
        const analysis = await aiService.analyzeVideoContent(sampleVideo);
        console.log('Analysis result:', JSON.stringify(analysis, null, 2));
        
        console.log('\n✓ OpenAI service test completed!');
        
    } catch (error) {
        console.error('✗ OpenAI test failed:', error.message);
    }
}

testOpenAI();
require('dotenv').config({ path: '../backend/.env' });
const ClaudeService = require('./claude-service');

async function testClaude() {
    const claudeService = new ClaudeService();
    
    try {
        console.log('Testing Claude connection...');
        
        // Test basic connection
        const connectionTest = await claudeService.testConnection();
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
        const analysis = await claudeService.analyzeVideoContent(sampleVideo);
        console.log('Analysis result:', JSON.stringify(analysis, null, 2));
        
        console.log('\n✓ Claude service test completed!');
        
    } catch (error) {
        console.error('✗ Claude test failed:', error.message);
    }
}

testClaude();
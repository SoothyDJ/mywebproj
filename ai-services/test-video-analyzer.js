require('dotenv').config({ path: '../backend/.env' });
const VideoAnalyzer = require('./processors/video-analyzer');

async function testVideoAnalyzer() {
    try {
        console.log('Testing Video Analyzer with OpenAI...');
        
        // Test with OpenAI
        const openaiAnalyzer = new VideoAnalyzer({
            aiProvider: 'openai',
            batchSize: 2,
            maxRetries: 1
        });
        
        await openaiAnalyzer.test();
        
        console.log('\n' + '='.repeat(50));
        console.log('Testing Video Analyzer with Claude...');
        
        // Test with Claude
        const claudeAnalyzer = new VideoAnalyzer({
            aiProvider: 'claude',
            batchSize: 1,
            maxRetries: 1
        });
        
        await claudeAnalyzer.test();
        
        console.log('\n✓ Video Analyzer test completed successfully!');
        
    } catch (error) {
        console.error('✗ Video Analyzer test failed:', error.message);
    }
}

testVideoAnalyzer();
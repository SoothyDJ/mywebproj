const RedditParser = require('./parsers/reddit-parser');

async function testRedditParser() {
    const parser = new RedditParser();
    
    try {
        console.log('Testing Reddit Parser...');
        
        // Test with sample data
        await parser.test();
        
        console.log('\n✓ Reddit Parser test completed successfully!');
        
    } catch (error) {
        console.error('✗ Reddit Parser test failed:', error.message);
    }
}

testRedditParser();
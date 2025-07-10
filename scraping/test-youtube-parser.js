const YouTubeParser = require('./parsers/youtube-parser');

async function testYouTubeParser() {
    const parser = new YouTubeParser();
    
    try {
        console.log('Testing YouTube Parser utilities...');
        
        // Test the parser
        parser.test();
        
        // Test additional functionality
        console.log('\nTesting additional methods:');
        
        // Test URL generation
        const videoUrl = parser.getVideoUrl('dQw4w9WgXcQ');
        console.log('✓ Video URL generation:', videoUrl);
        
        const channelUrl = parser.getChannelUrl('UC_x5XG1OV2P6uZZ5FSM9Ttw');
        console.log('✓ Channel URL generation:', channelUrl);
        
        // Test data cleaning
        const rawData = {
            title: '  Test Video Title  ',
            viewCount: '2.3M views',
            duration: '15:30',
            uploadDate: '2 weeks ago'
        };
        
        const cleanedData = parser.cleanVideoData(rawData);
        console.log('✓ Data cleaning:', cleanedData);
        
        console.log('\n✓ YouTube Parser test completed successfully!');
        
    } catch (error) {
        console.error('✗ YouTube Parser test failed:', error.message);
    }
}

testYouTubeParser();
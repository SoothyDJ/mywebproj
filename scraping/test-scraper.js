const YouTubeScraper = require('./youtube-scraper');

async function testScraper() {
    const scraper = new YouTubeScraper();
    
    try {
        console.log('Testing YouTube scraper with "paranormal encounters"...');
        
        await scraper.initialize();
        const videos = await scraper.searchVideos('paranormal encounters', 'month', 10);
        
        console.log(`\n✓ Found ${videos.length} videos:`);
        videos.forEach((video, index) => {
            console.log(`\n${index + 1}. ${video.title}`);
            console.log(`   Channel: ${video.channelName}`);
            console.log(`   Views: ${video.viewCount}`);
            console.log(`   Duration: ${video.duration}`);
            console.log(`   URL: ${video.videoUrl}`);
        });
        
        await scraper.close();
        console.log('\n✓ Test completed successfully!');
        
    } catch (error) {
        console.error('✗ Test failed:', error.message);
        await scraper.close();
    }
}

testScraper();
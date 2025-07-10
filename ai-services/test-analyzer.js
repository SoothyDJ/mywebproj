require('dotenv').config({ path: '../backend/.env' });
const ContentAnalyzer = require('./content-analyzer');

async function testAnalyzer() {
    const analyzer = new ContentAnalyzer();
    
    try {
        console.log('Testing Content Analyzer with full workflow...');
        
        // Test the main analysis workflow
        const prompt = "Find top paranormal encounters videos from the last 30 days and create storyboards";
        
        const results = await analyzer.analyzeContent(prompt);
        
        // Generate interactive report
        const report = analyzer.generateInteractiveReport();
        
        console.log('\n📊 ANALYSIS COMPLETE!');
        console.log('======================');
        console.log(`Total Videos: ${report.summary.totalVideos}`);
        console.log(`Average Views: ${report.summary.averageViews.toLocaleString()}`);
        console.log(`Top Themes: ${report.summary.topThemes.map(t => t.theme).join(', ')}`);
        console.log(`Sentiment: Positive(${report.summary.sentimentDistribution.positive}) Negative(${report.summary.sentimentDistribution.negative}) Neutral(${report.summary.sentimentDistribution.neutral})`);
        
        console.log('\n📹 SAMPLE VIDEO ANALYSIS:');
        if (report.videos.length > 0) {
            const firstVideo = report.videos[0];
            console.log(`Title: ${firstVideo.title}`);
            console.log(`Channel: ${firstVideo.channelName}`);
            console.log(`Views: ${firstVideo.viewCount}`);
            if (firstVideo.analysis) {
                console.log(`AI Summary: ${firstVideo.analysis.summary.substring(0, 100)}...`);
                console.log(`Content Type: ${firstVideo.analysis.contentType}`);
            }
            if (firstVideo.storyboard) {
                console.log(`Storyboard Scenes: ${firstVideo.storyboard.totalScenes}`);
            }
        }
        
        console.log('\n✓ Content Analyzer test completed successfully!');
        
        // Save results to file for inspection
        const fs = require('fs');
        fs.writeFileSync('analysis-results.json', JSON.stringify(report, null, 2));
        console.log('✓ Results saved to analysis-results.json');
        
    } catch (error) {
        console.error('✗ Content Analyzer test failed:', error.message);
    }
}

testAnalyzer();
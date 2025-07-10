// Test TypeScript types compilation
import { 
    VideoData, 
    VideoAnalysis, 
    AutomationTask, 
    TaskStatus,
    ContentAnalysisResults,
    WebAutomationTypes 
} from './types/common';

// Test type usage
function testTypes() {
    // Test VideoData type
    const sampleVideo: VideoData = {
        videoId: "test123",
        title: "Test Video",
        channelName: "Test Channel",
        description: "Test description",
        viewCount: "1M views",
        duration: "10:30",
        uploadDate: "2024-01-01",
        videoUrl: "https://youtube.com/watch?v=test123",
        scrapedAt: new Date().toISOString()
    };

    // Test Analysis type
    const sampleAnalysis: VideoAnalysis = {
        summary: "Test analysis",
        themes: ["test", "example"],
        sentiment: "positive",
        sentimentScore: 0.8,
        keyTopics: ["topic1"],
        contentType: "educational",
        targetAudience: "general",
        credibilityScore: 0.9,
        engagementFactors: ["interesting"],
        notableElements: ["good quality"],
        recommendations: "Great content"
    };

    // Test Task type
    const sampleTask: AutomationTask = {
        id: 1,
        userId: 1,
        prompt: "Test prompt",
        taskType: "youtube_scrape",
        status: "completed",
        parameters: {
            maxResults: 10,
            timeFilter: "week"
        },
        createdAt: new Date()
    };

    console.log('✓ All types compiled successfully!');
    console.log('Sample video:', sampleVideo.title);
    console.log('Sample analysis sentiment:', sampleAnalysis.sentiment);
    console.log('Sample task status:', sampleTask.status);
}

testTypes();
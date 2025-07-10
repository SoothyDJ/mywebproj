const ReportGenerator = require('./generators/report-generator');
const fs = require('fs');

async function testReportGenerator() {
    const generator = new ReportGenerator();
    
    try {
        console.log('Testing HTML Report Generator...');
        
        // Sample data structure matching what comes from content analyzer
        const sampleReportData = {
            videos: [
                {
                    title: "Top 10 Real Ghost Encounters Caught on Camera",
                    channelName: "Paranormal Investigator",
                    viewCount: "2.3M views",
                    duration: "15:30",
                    videoUrl: "https://youtube.com/watch?v=sample1",
                    scrapedAt: new Date().toISOString()
                },
                {
                    title: "Haunted House Investigation - REAL Evidence",
                    channelName: "Ghost Hunters Pro",
                    viewCount: "850K views", 
                    duration: "12:45",
                    videoUrl: "https://youtube.com/watch?v=sample2",
                    scrapedAt: new Date().toISOString()
                }
            ],
            analyses: [
                {
                    summary: "Compelling paranormal evidence presented with good production value",
                    themes: ["paranormal", "evidence", "investigation"],
                    sentiment: "positive",
                    sentimentScore: 0.7,
                    contentType: "documentary"
                },
                {
                    summary: "Professional ghost hunting with scientific approach", 
                    themes: ["paranormal", "scientific", "investigation"],
                    sentiment: "neutral",
                    sentimentScore: 0.1,
                    contentType: "documentary"
                }
            ],
            storyboards: [
                {
                    title: "Storyboard for Ghost Video",
                    totalScenes: 3,
                    scenes: [
                        {
                            sequenceNumber: 1,
                            sceneTitle: "Introduction",
                            duration: "30 seconds",
                            narrationText: "Welcome to our paranormal investigation...",
                            visualElements: ["Title card", "Location shot"],
                            audioCues: ["Mysterious music"]
                        }
                    ]
                },
                {
                    title: "Storyboard for Investigation",
                    totalScenes: 2,
                    scenes: [
                        {
                            sequenceNumber: 1,
                            sceneTitle: "Setup",
                            duration: "45 seconds", 
                            narrationText: "Setting up our investigation equipment...",
                            visualElements: ["Equipment shots"],
                            audioCues: ["Ambient sound"]
                        }
                    ]
                }
            ],
            summary: "Analysis of popular paranormal content shows strong viewer engagement with documentary-style investigations.",
            metadata: {
                totalVideos: 2,
                generatedAt: new Date().toISOString()
            },
            prompt: "Find top paranormal encounter videos from the last week"
        };
        
        // Generate HTML report
        const htmlReport = await generator.generateHTMLReport(sampleReportData);
        
        // Save to file
        fs.writeFileSync('./test-report.html', htmlReport);
        
        console.log('✓ HTML report generated successfully!');
        console.log('✓ Saved to: test-report.html');
        console.log('✓ Open the file in a browser to view the interactive report');
        
        return htmlReport;
        
    } catch (error) {
        console.error('✗ Report generator test failed:', error.message);
    }
}

testReportGenerator();
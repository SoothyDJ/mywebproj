// File Path: /ai-services/content-analyzer.js
// Content analysis orchestrator combining scraping and AI analysis
// REF-068: Updated content analyzer with AI configuration management

const AIConfigManager = require('../config/ai-config');
const YouTubeScraper = require('../scraping/youtube-scraper');

class ContentAnalyzer {
    constructor() {
        this.aiManager = new AIConfigManager();
        this.scraper = new YouTubeScraper();
        this.results = {
            videos: [],
            analyses: [],
            storyboards: [],
            summary: null,
            metadata: {}
        };
    }

    async analyzeContent(prompt, options = {}) {
        try {
            console.log(`Starting content analysis for: "${prompt}"`);
            
            // Parse the user prompt to extract search parameters
            const searchParams = this.parsePrompt(prompt);
            
            // Initialize scraper
            await this.scraper.initialize();
            
            // Step 1: Scrape videos
            console.log('Step 1: Scraping videos...');
            const videos = await this.scraper.searchVideos(
                searchParams.query,
                searchParams.timeFilter,
                searchParams.maxResults
            );
            
            this.results.videos = videos;
            this.results.metadata.scrapedAt = new Date().toISOString();
            this.results.metadata.totalVideos = videos.length;
            
            // Step 2: Analyze each video with AI
            console.log('Step 2: Analyzing video content...');
            const analyses = await this.analyzeVideos(videos);
            this.results.analyses = analyses;
            
            // Step 3: Generate storyboards
            console.log('Step 3: Generating storyboards...');
            const storyboards = await this.generateStoryboards(videos, analyses);
            this.results.storyboards = storyboards;
            
            // Step 4: Create summary report
            console.log('Step 4: Creating summary report...');
            const summary = await this.aiManager.generateSummaryReport(videos, analyses);
            this.results.summary = summary;
            
            // Clean up
            await this.scraper.close();
            
            console.log('✓ Content analysis completed successfully');
            return this.results;
            
        } catch (error) {
            console.error('✗ Content analysis failed:', error.message);
            await this.scraper.close();
            throw error;
        }
    }

    parsePrompt(prompt) {
        const defaultParams = {
            query: 'trending videos',
            timeFilter: 'month',
            maxResults: 10
        };

        // Extract search query
        const queryMatches = prompt.match(/(?:search for|find|about|on)\s+([^.!?]+)/i);
        if (queryMatches) {
            defaultParams.query = queryMatches[1].trim();
        }

        // Extract time filter
        const timeMatches = prompt.match(/(last|past)\s+(\d+)?\s*(hour|day|week|month|year)s?/i);
        if (timeMatches) {
            const timeUnit = timeMatches[3].toLowerCase();
            const timeNumber = timeMatches[2] ? parseInt(timeMatches[2]) : 1;
            
            if (timeNumber === 1) {
                defaultParams.timeFilter = timeUnit;
            } else {
                // For multiple units, default to the unit type
                defaultParams.timeFilter = timeUnit;
            }
        }

        // Extract number of results
        const numberMatches = prompt.match(/(\d+)\s*(videos?|results?)/i);
        if (numberMatches) {
            defaultParams.maxResults = Math.min(parseInt(numberMatches[1]), 50); // Cap at 50
        }

        // Specific topic extraction for better search
        const topicPatterns = [
            /paranormal encounters?/i,
            /ghost stories?/i,
            /horror stories?/i,
            /true crime/i,
            /conspiracy theories?/i,
            /mysteries?/i,
            /unexplained phenomena/i
        ];

        topicPatterns.forEach(pattern => {
            if (pattern.test(prompt)) {
                const match = prompt.match(pattern);
                if (match) {
                    defaultParams.query = match[0];
                }
            }
        });

        console.log('Parsed search parameters:', defaultParams);
        return defaultParams;
    }

    async analyzeVideos(videos) {
        const analyses = [];
        const batchSize = 3; // Process 3 videos at a time to avoid rate limits
        
        for (let i = 0; i < videos.length; i += batchSize) {
            const batch = videos.slice(i, i + batchSize);
            const batchPromises = batch.map(async (video, index) => {
                try {
                    console.log(`Analyzing video ${i + index + 1}/${videos.length}: ${video.title}`);
                    return await this.aiManager.analyzeVideoContent(video);
                } catch (error) {
                    console.error(`Error analyzing video ${video.title}:`, error.message);
                    return this.aiManager.getAIService().getDefaultAnalysis();
                }
            });
            
            const batchResults = await Promise.all(batchPromises);
            analyses.push(...batchResults);
            
            // Small delay between batches to respect rate limits
            if (i + batchSize < videos.length) {
                await this.delay(1000);
            }
        }
        
        return analyses;
    }

    async generateStoryboards(videos, analyses) {
        const storyboards = [];
        
        for (let i = 0; i < videos.length; i++) {
            try {
                console.log(`Generating storyboard ${i + 1}/${videos.length}: ${videos[i].title}`);
                const storyboard = await this.aiManager.generateStoryboard(videos[i], analyses[i]);
                storyboards.push(storyboard);
                
                // Small delay to respect rate limits
                await this.delay(500);
                
            } catch (error) {
                console.error(`Error generating storyboard for ${videos[i].title}:`, error.message);
                storyboards.push(this.aiManager.getAIService().getDefaultStoryboard());
            }
        }
        
        return storyboards;
    }

    generateInteractiveReport() {
        const report = {
            title: 'Content Analysis Report',
            generatedAt: new Date().toISOString(),
            metadata: this.results.metadata,
            summary: {
                totalVideos: this.results.videos.length,
                analysisComplete: this.results.analyses.length,
                storyboardsGenerated: this.results.storyboards.length,
                averageViews: this.calculateAverageViews(),
                topThemes: this.extractTopThemes(),
                sentimentDistribution: this.calculateSentimentDistribution()
            },
            videos: this.results.videos.map((video, index) => ({
                ...video,
                analysis: this.results.analyses[index] || null,
                storyboard: this.results.storyboards[index] || null,
                attribution: {
                    originalUrl: video.videoUrl,
                    channel: video.channelName,
                    scrapedAt: video.scrapedAt
                }
            })),
            overallSummary: this.results.summary,
            recommendations: this.generateRecommendations()
        };

        return report;
    }

    calculateAverageViews() {
        const totalViews = this.results.videos.reduce((sum, video) => {
            const views = this.parseViewCount(video.viewCount);
            return sum + views;
        }, 0);
        
        return Math.round(totalViews / this.results.videos.length);
    }

    parseViewCount(viewStr) {
        if (!viewStr) return 0;
        
        const cleanStr = viewStr.replace(/[^0-9.KMB]/gi, '');
        const number = parseFloat(cleanStr);
        
        if (cleanStr.includes('M')) return number * 1000000;
        if (cleanStr.includes('K')) return number * 1000;
        if (cleanStr.includes('B')) return number * 1000000000;
        
        return number || 0;
    }

    extractTopThemes() {
        const themeCount = {};
        
        this.results.analyses.forEach(analysis => {
            if (analysis && analysis.themes) {
                analysis.themes.forEach(theme => {
                    themeCount[theme] = (themeCount[theme] || 0) + 1;
                });
            }
        });
        
        return Object.entries(themeCount)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([theme, count]) => ({ theme, count }));
    }

    calculateSentimentDistribution() {
        const distribution = { positive: 0, negative: 0, neutral: 0 };
        
        this.results.analyses.forEach(analysis => {
            if (analysis && analysis.sentiment) {
                distribution[analysis.sentiment]++;
            }
        });
        
        return distribution;
    }

    generateRecommendations() {
        const recommendations = [];
        
        // Content recommendations based on analysis
        const topThemes = this.extractTopThemes();
        if (topThemes.length > 0) {
            recommendations.push({
                type: 'content',
                title: 'Popular Themes',
                description: `Focus on these trending themes: ${topThemes.map(t => t.theme).join(', ')}`
            });
        }
        
        // Engagement recommendations
        const avgViews = this.calculateAverageViews();
        if (avgViews > 100000) {
            recommendations.push({
                type: 'engagement',
                title: 'High Engagement Topic',
                description: 'This topic shows strong audience engagement with average views over 100K'
            });
        }
        
        return recommendations;
    }

    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Test method
    async test() {
        try {
            console.log('Testing Content Analyzer...');
            
            const testPrompt = "Find videos about paranormal encounters from the last month";
            const results = await this.analyzeContent(testPrompt);
            
            console.log('\n✓ Test Results Summary:');
            console.log(`- Videos found: ${results.videos.length}`);
            console.log(`- Analyses completed: ${results.analyses.length}`);
            console.log(`- Storyboards generated: ${results.storyboards.length}`);
            console.log(`- Summary generated: ${results.summary ? 'Yes' : 'No'}`);
            
            const report = this.generateInteractiveReport();
            console.log(`- Interactive report: ${report.videos.length} videos with full data`);
            
            return results;
            
        } catch (error) {
            console.error('✗ Content Analyzer test failed:', error.message);
            throw error;
        }
    }
}

module.exports = ContentAnalyzer;
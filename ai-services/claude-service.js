// File Path: /ai-services/claude-service.js
// Claude AI integration service for content analysis and generation
// REF-053: Claude service matching OpenAI service interface and capabilities

const Anthropic = require('@anthropic-ai/sdk');

class ClaudeService {
    constructor() {
        this.client = new Anthropic({
            apiKey: process.env.CLAUDE_API_KEY
        });
        this.model = process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022';
        this.maxTokens = 2000;
    }

    async analyzeVideoContent(videoData) {
        try {
            const prompt = this.createAnalysisPrompt(videoData);
            
            const response = await this.client.messages.create({
                model: this.model,
                max_tokens: this.maxTokens,
                temperature: 0.3,
                system: 'You are an expert content analyzer specializing in video content analysis. Provide detailed, structured analysis of video content including themes, sentiment, and key insights.',
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ]
            });

            const analysis = this.parseAnalysisResponse(response.content[0].text);
            
            console.log(`✓ Analyzed video: ${videoData.title}`);
            return analysis;

        } catch (error) {
            console.error('✗ Video analysis failed:', error.message);
            throw error;
        }
    }

    createAnalysisPrompt(videoData) {
        return `
Analyze the following YouTube video content and provide a structured analysis:

Title: ${videoData.title}
Channel: ${videoData.channelName}
Duration: ${videoData.duration}
Views: ${videoData.viewCount}
Upload Date: ${videoData.uploadDate}
Description: ${videoData.description || 'No description available'}

Please provide analysis in the following JSON format:
{
    "summary": "Brief summary of the video content",
    "themes": ["theme1", "theme2", "theme3"],
    "sentiment": "positive/negative/neutral",
    "sentimentScore": 0.0,
    "keyTopics": ["topic1", "topic2", "topic3"],
    "contentType": "educational/entertainment/documentary/horror/etc",
    "targetAudience": "description of target audience",
    "credibilityScore": 0.0,
    "engagementFactors": ["factor1", "factor2"],
    "notableElements": ["element1", "element2"],
    "recommendations": "recommendations for similar content"
}

Provide only valid JSON response.`;
    }

    parseAnalysisResponse(response) {
        try {
            // Clean the response to extract JSON
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            
            // Fallback parsing if JSON is not properly formatted
            return {
                summary: response.substring(0, 500),
                themes: [],
                sentiment: 'neutral',
                sentimentScore: 0.0,
                keyTopics: [],
                contentType: 'unknown',
                targetAudience: 'general',
                credibilityScore: 0.5,
                engagementFactors: [],
                notableElements: [],
                recommendations: 'Unable to generate recommendations'
            };
        } catch (error) {
            console.error('Error parsing analysis response:', error.message);
            return this.getDefaultAnalysis();
        }
    }

    async generateStoryboard(videoData, analysisData) {
        try {
            const prompt = this.createStoryboardPrompt(videoData, analysisData);
            
            const response = await this.client.messages.create({
                model: this.model,
                max_tokens: this.maxTokens,
                temperature: 0.4,
                system: 'You are a professional video storyboard creator. Generate detailed storyboard sequences for video narration based on the content analysis provided.',
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ]
            });

            const storyboard = this.parseStoryboardResponse(response.content[0].text);
            
            console.log(`✓ Generated storyboard for: ${videoData.title}`);
            return storyboard;

        } catch (error) {
            console.error('✗ Storyboard generation failed:', error.message);
            throw error;
        }
    }

    createStoryboardPrompt(videoData, analysisData) {
        // Safely handle potentially undefined arrays
        const keyTopics = Array.isArray(analysisData?.keyTopics) ? analysisData.keyTopics.join(', ') : 'No key topics available';
        const notableElements = Array.isArray(analysisData?.notableElements) ? analysisData.notableElements.join(', ') : 'No notable elements available';
        
        return `
Create a detailed storyboard for video narration based on the following video and analysis:

Video Data:
- Title: ${videoData.title}
- Channel: ${videoData.channelName}
- Duration: ${videoData.duration}
- Description: ${videoData.description || 'No description'}

Analysis Data:
- Summary: ${analysisData?.summary || 'No summary available'}
- Content Type: ${analysisData?.contentType || 'unknown'}
- Key Topics: ${keyTopics}
- Notable Elements: ${notableElements}

Create a storyboard with 5-8 scenes in the following JSON format:
{
    "title": "Storyboard for [Video Title]",
    "totalScenes": 0,
    "estimatedDuration": "X minutes",
    "scenes": [
        {
            "sequenceNumber": 1,
            "sceneTitle": "Scene title",
            "duration": "30 seconds",
            "narrationText": "Detailed narration script for this scene",
            "visualElements": ["visual1", "visual2", "visual3"],
            "audioCues": ["audio1", "audio2"],
            "transitionNotes": "How to transition to next scene"
        }
    ],
    "productionNotes": "Overall production guidance"
}

Focus on creating engaging narration that would work well for the ${analysisData?.contentType || 'general'} content type.
Provide only valid JSON response.`;
    }

    parseStoryboardResponse(response) {
        try {
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            
            return this.getDefaultStoryboard();
        } catch (error) {
            console.error('Error parsing storyboard response:', error.message);
            return this.getDefaultStoryboard();
        }
    }

    async generateSummaryReport(videos, analyses) {
        try {
            const prompt = this.createReportPrompt(videos, analyses);
            
            const response = await this.client.messages.create({
                model: this.model,
                max_tokens: this.maxTokens,
                temperature: 0.2,
                system: 'You are a professional content analyst creating comprehensive reports from video analysis data.',
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ]
            });

            console.log('✓ Generated summary report');
            return response.content[0].text;

        } catch (error) {
            console.error('✗ Report generation failed:', error.message);
            throw error;
        }
    }

    createReportPrompt(videos, analyses) {
        const videoSummaries = videos.map((video, index) => {
            const analysis = analyses[index] || {};
            return `
Video ${index + 1}: ${video.title}
- Channel: ${video.channelName}
- Views: ${video.viewCount}
- Themes: ${analysis.themes?.join(', ') || 'N/A'}
- Sentiment: ${analysis.sentiment || 'N/A'}
- Content Type: ${analysis.contentType || 'N/A'}`;
        }).join('\n\n');

        return `
Create a comprehensive analysis report based on the following video data:

${videoSummaries}

Generate a detailed report covering:
1. Overall trends and patterns
2. Content themes analysis
3. Audience engagement insights
4. Sentiment analysis summary
5. Recommendations for content creators
6. Market insights and opportunities

Make the report professional, detailed, and actionable.`;
    }

    getDefaultAnalysis() {
        return {
            summary: 'Analysis could not be completed',
            themes: [],
            sentiment: 'neutral',
            sentimentScore: 0.0,
            keyTopics: [],
            contentType: 'unknown',
            targetAudience: 'general',
            credibilityScore: 0.5,
            engagementFactors: [],
            notableElements: [],
            recommendations: 'Unable to generate recommendations'
        };
    }

    getDefaultStoryboard() {
        return {
            title: 'Default Storyboard',
            totalScenes: 1,
            estimatedDuration: '2 minutes',
            scenes: [{
                sequenceNumber: 1,
                sceneTitle: 'Introduction',
                duration: '2 minutes',
                narrationText: 'Content analysis was not available for detailed storyboard generation.',
                visualElements: ['Simple presentation slide'],
                audioCues: ['Background music'],
                transitionNotes: 'Fade out'
            }],
            productionNotes: 'Storyboard generation failed - using default template'
        };
    }

    async testConnection() {
        try {
            const response = await this.client.messages.create({
                model: this.model,
                max_tokens: 50,
                messages: [
                    {
                        role: 'user',
                        content: 'Respond with: Claude connection test successful'
                    }
                ]
            });

            console.log('✓ Claude connection test passed');
            return response.content[0].text;

        } catch (error) {
            console.error('✗ Claude connection test failed:', error.message);
            throw error;
        }
    }
}

module.exports = ClaudeService;
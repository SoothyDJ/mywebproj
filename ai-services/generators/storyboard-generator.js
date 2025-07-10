// File Path: /ai-services/generators/storyboard-generator.js
// Specialized storyboard generator with templates and customization options
// REF-077: Storyboard generator with multiple templates and AI integration

const OpenAIService = require('../openai-service');
const ClaudeService = require('../claude-service');

class StoryboardGenerator {
    constructor(options = {}) {
        this.options = {
            aiProvider: options.aiProvider || 'openai',
            templateStyle: options.templateStyle || 'professional',
            defaultScenes: options.defaultScenes || 6,
            maxScenes: options.maxScenes || 12,
            includeTimestamps: options.includeTimestamps !== false,
            includeTransitions: options.includeTransitions !== false,
            ...options
        };
        
        this.aiService = this.initializeAIService();
        this.templates = this.getStoryboardTemplates();
        this.statistics = {
            generated: 0,
            successful: 0,
            failed: 0,
            averageScenes: 0,
            totalTime: 0
        };
    }

    // Initialize AI service
    initializeAIService() {
        switch (this.options.aiProvider.toLowerCase()) {
            case 'claude':
                return new ClaudeService();
            case 'openai':
            default:
                return new OpenAIService();
        }
    }

    // Get storyboard templates for different content types
    getStoryboardTemplates() {
        return {
            // Professional documentary style
            professional: {
                structure: ['introduction', 'setup', 'development', 'climax', 'resolution', 'conclusion'],
                sceneLength: '45-90 seconds',
                style: 'Documentary-style narration with clear structure and professional transitions',
                elements: ['Title cards', 'B-roll footage', 'Expert interviews', 'Data visualizations']
            },
            
            // Entertainment/YouTube style
            entertainment: {
                structure: ['hook', 'introduction', 'main_content', 'engagement', 'climax', 'outro'],
                sceneLength: '30-60 seconds',
                style: 'Engaging and dynamic with quick cuts and audience interaction',
                elements: ['Jump cuts', 'Graphics overlays', 'Sound effects', 'Call-to-action']
            },
            
            // Educational content style
            educational: {
                structure: ['learning_objectives', 'introduction', 'explanation', 'examples', 'practice', 'summary'],
                sceneLength: '60-120 seconds',
                style: 'Clear explanations with visual aids and step-by-step progression',
                elements: ['Diagrams', 'Step-by-step visuals', 'Examples', 'Knowledge checks']
            },
            
            // Horror/paranormal style
            horror: {
                structure: ['atmosphere', 'introduction', 'buildup', 'investigation', 'revelation', 'conclusion'],
                sceneLength: '45-75 seconds',
                style: 'Atmospheric building with suspense and dramatic reveals',
                elements: ['Dark lighting', 'Suspenseful music', 'Close-ups', 'Environmental shots']
            },
            
            // News/reporting style
            news: {
                structure: ['headline', 'background', 'investigation', 'evidence', 'implications', 'summary'],
                sceneLength: '30-45 seconds',
                style: 'Factual reporting with clear information delivery',
                elements: ['News graphics', 'Location shots', 'Interview clips', 'Data presentations']
            },
            
            // Tutorial/how-to style
            tutorial: {
                structure: ['introduction', 'overview', 'preparation', 'step_by_step', 'tips', 'conclusion'],
                sceneLength: '60-90 seconds',
                style: 'Clear instruction with hands-on demonstration',
                elements: ['Close-up shots', 'Step demonstrations', 'Tools/materials', 'Result showcases']
            }
        };
    }

    // Generate storyboard for single video
    async generateStoryboard(videoData, analysisData, options = {}) {
        try {
            const startTime = Date.now();
            console.log(`Generating storyboard for: ${videoData.title}`);
            
            // Determine content type and template
            const contentType = this.determineContentType(videoData, analysisData);
            const template = this.templates[contentType] || this.templates.professional;
            
            // Create enhanced prompt
            const prompt = this.createStoryboardPrompt(videoData, analysisData, template, options);
            
            // Generate with AI
            const rawStoryboard = await this.aiService.generateStoryboard(videoData, analysisData);
            
            // Process and enhance the storyboard
            const processedStoryboard = this.processStoryboard(rawStoryboard, videoData, template, options);
            
            // Update statistics
            const generationTime = Date.now() - startTime;
            this.updateStatistics(processedStoryboard, generationTime);
            
            console.log(`✓ Generated ${processedStoryboard.totalScenes} scenes for: ${videoData.title}`);
            return processedStoryboard;
            
        } catch (error) {
            console.error(`✗ Storyboard generation failed for ${videoData.title}:`, error.message);
            this.statistics.failed++;
            return this.getDefaultStoryboard(videoData, error.message);
        }
    }

    // Generate storyboards for multiple videos
    async generateStoryboards(videos, analyses, options = {}) {
        try {
            console.log(`Generating storyboards for ${videos.length} videos`);
            
            const storyboards = [];
            const batchSize = options.batchSize || 1; // Sequential by default for better quality
            
            for (let i = 0; i < videos.length; i += batchSize) {
                const batch = videos.slice(i, i + batchSize);
                const batchAnalyses = analyses.slice(i, i + batchSize);
                
                const batchPromises = batch.map(async (video, batchIndex) => {
                    const analysis = batchAnalyses[batchIndex];
                    return await this.generateStoryboard(video, analysis, options);
                });
                
                const batchResults = await Promise.all(batchPromises);
                storyboards.push(...batchResults);
                
                // Small delay between batches
                if (i + batchSize < videos.length) {
                    await this.delay(options.delayBetweenBatches || 500);
                }
            }
            
            this.logStatistics();
            return storyboards;
            
        } catch (error) {
            console.error('Batch storyboard generation failed:', error.message);
            throw error;
        }
    }

    // Determine content type from video and analysis data
    determineContentType(videoData, analysisData) {
        // Priority: analysis content type > video hints > title analysis
        
        if (analysisData && analysisData.contentType) {
            const contentType = analysisData.contentType.toLowerCase();
            
            if (this.templates[contentType]) {
                return contentType;
            }
            
            // Map common content types to templates
            const mappings = {
                'documentary': 'professional',
                'tutorial': 'tutorial',
                'how-to': 'tutorial',
                'educational': 'educational',
                'entertainment': 'entertainment',
                'horror': 'horror',
                'paranormal': 'horror',
                'news': 'news',
                'review': 'professional'
            };
            
            if (mappings[contentType]) {
                return mappings[contentType];
            }
        }
        
        // Analyze title for content type hints
        const title = videoData.title?.toLowerCase() || '';
        
        if (/how to|tutorial|guide|learn/.test(title)) return 'tutorial';
        if (/horror|scary|paranormal|ghost/.test(title)) return 'horror';
        if (/news|breaking|report|update/.test(title)) return 'news';
        if (/education|explain|science/.test(title)) return 'educational';
        if (/entertainment|funny|amazing/.test(title)) return 'entertainment';
        
        return 'professional'; // Default
    }

    // Create enhanced storyboard prompt
    createStoryboardPrompt(videoData, analysisData, template, options) {
        const sceneCount = options.sceneCount || this.options.defaultScenes;
        const duration = this.parseDuration(videoData.duration) || 300; // Default 5 minutes
        const sceneLength = Math.round(duration / sceneCount);
        
        // Safely handle analysisData properties
        const safeAnalysisData = {
            summary: analysisData?.summary || 'No summary available',
            contentType: analysisData?.contentType || 'unknown',
            keyTopics: Array.isArray(analysisData?.keyTopics) ? analysisData.keyTopics : [],
            themes: Array.isArray(analysisData?.themes) ? analysisData.themes : [],
            notableElements: Array.isArray(analysisData?.notableElements) ? analysisData.notableElements : [],
            ...analysisData
        };
        
        return {
            videoData: {
                ...videoData,
                estimatedDuration: duration,
                averageSceneLength: sceneLength
            },
            analysisData: safeAnalysisData,
            template: {
                ...template,
                targetScenes: sceneCount,
                suggestedSceneLength: `${sceneLength} seconds`
            },
            requirements: {
                includeTimestamps: this.options.includeTimestamps,
                includeTransitions: this.options.includeTransitions,
                style: this.options.templateStyle,
                maxScenes: this.options.maxScenes
            }
        };
    }

    // Process and enhance AI-generated storyboard
    processStoryboard(rawStoryboard, videoData, template, options) {
        try {
            const processed = {
                title: rawStoryboard.title || `Storyboard for "${videoData.title}"`,
                videoId: videoData.videoId,
                totalScenes: 0,
                estimatedDuration: this.parseDuration(videoData.duration) || 300,
                contentType: template.name || 'professional',
                template: template.structure.join(' → '),
                scenes: [],
                productionNotes: rawStoryboard.productionNotes || template.style,
                generatedAt: new Date().toISOString(),
                aiProvider: this.options.aiProvider
            };
            
            // Process scenes
            if (rawStoryboard.scenes && Array.isArray(rawStoryboard.scenes)) {
                processed.scenes = rawStoryboard.scenes.map((scene, index) => 
                    this.processScene(scene, index, processed.estimatedDuration, template)
                );
            } else {
                // Generate default scenes based on template
                processed.scenes = this.generateDefaultScenes(videoData, template, processed.estimatedDuration);
            }
            
            processed.totalScenes = processed.scenes.length;
            
            // Add timestamps if enabled
            if (this.options.includeTimestamps) {
                this.addTimestamps(processed);
            }
            
            // Add transitions if enabled
            if (this.options.includeTransitions) {
                this.addTransitions(processed, template);
            }
            
            // Validate and clean
            this.validateStoryboard(processed);
            
            return processed;
            
        } catch (error) {
            console.error('Storyboard processing error:', error.message);
            return this.getDefaultStoryboard(videoData, 'Processing failed');
        }
    }

    // Process individual scene
    processScene(scene, index, totalDuration, template) {
        const sceneLength = Math.round(totalDuration / (template.structure.length || 6));
        
        return {
            sequenceNumber: scene.sequenceNumber || (index + 1),
            sceneTitle: scene.sceneTitle || scene.title || `Scene ${index + 1}`,
            sceneType: template.structure[index] || 'content',
            duration: scene.duration || `${sceneLength} seconds`,
            narrationText: scene.narrationText || scene.description || 'Narration content here',
            visualElements: Array.isArray(scene.visualElements) ? scene.visualElements : 
                            template.elements.slice(0, 3),
            audioCues: Array.isArray(scene.audioCues) ? scene.audioCues : 
                       ['Background music', 'Ambient sound'],
            transitionNotes: scene.transitionNotes || 'Standard transition',
            timestamp: { start: 0, end: sceneLength }, // Will be calculated later
            productionNotes: scene.productionNotes || ''
        };
    }

    // Generate default scenes when AI generation fails
    generateDefaultScenes(videoData, template, duration) {
        const sceneCount = template.structure.length;
        const sceneLength = Math.round(duration / sceneCount);
        
        return template.structure.map((sceneType, index) => ({
            sequenceNumber: index + 1,
            sceneTitle: this.getDefaultSceneTitle(sceneType, videoData),
            sceneType,
            duration: `${sceneLength} seconds`,
            narrationText: this.getDefaultNarration(sceneType, videoData),
            visualElements: template.elements.slice(0, 2),
            audioCues: ['Background music'],
            transitionNotes: index < sceneCount - 1 ? 'Fade to next scene' : 'Fade out',
            timestamp: { start: index * sceneLength, end: (index + 1) * sceneLength },
            productionNotes: `Default ${sceneType} scene`
        }));
    }

    // Get default scene titles
    getDefaultSceneTitle(sceneType, videoData) {
        const titles = {
            introduction: 'Introduction',
            hook: 'Opening Hook',
            setup: 'Setup and Context',
            development: 'Main Development',
            climax: 'Key Moment',
            resolution: 'Resolution',
            conclusion: 'Conclusion',
            outro: 'Outro and Call-to-Action'
        };
        
        return titles[sceneType] || `${sceneType.charAt(0).toUpperCase()}${sceneType.slice(1)}`;
    }

    // Get default narration
    getDefaultNarration(sceneType, videoData) {
        const narrations = {
            introduction: `Welcome to this analysis of "${videoData.title}" by ${videoData.channelName}.`,
            hook: 'This video presents an intriguing case that deserves closer examination.',
            setup: 'Let\'s establish the context and background for this content.',
            development: 'The main points and evidence are presented here.',
            climax: 'This is the most significant moment of the analysis.',
            resolution: 'We can draw these conclusions from the evidence presented.',
            conclusion: 'In summary, this content provides valuable insights.',
            outro: 'Thank you for watching this analysis. Don\'t forget to subscribe for more content.'
        };
        
        return narrations[sceneType] || `This scene covers the ${sceneType} portion of the content.`;
    }

    // Add timestamps to scenes
    addTimestamps(storyboard) {
        let currentTime = 0;
        
        storyboard.scenes.forEach(scene => {
            const duration = this.parseDuration(scene.duration) || 30;
            scene.timestamp = {
                start: currentTime,
                end: currentTime + duration,
                startFormatted: this.formatTime(currentTime),
                endFormatted: this.formatTime(currentTime + duration)
            };
            currentTime += duration;
        });
    }

    // Add transition effects
    addTransitions(storyboard, template) {
        const transitions = ['Fade', 'Cut', 'Dissolve', 'Slide', 'Zoom'];
        
        storyboard.scenes.forEach((scene, index) => {
            if (index < storyboard.scenes.length - 1) {
                const transition = transitions[index % transitions.length];
                scene.transitionOut = `${transition} to next scene`;
            } else {
                scene.transitionOut = 'Fade to black';
            }
        });
    }

    // Validate storyboard structure
    validateStoryboard(storyboard) {
        // Ensure required fields
        if (!storyboard.title) storyboard.title = 'Untitled Storyboard';
        if (!storyboard.scenes || !Array.isArray(storyboard.scenes)) {
            storyboard.scenes = [];
        }
        
        // Limit scene count
        if (storyboard.scenes.length > this.options.maxScenes) {
            storyboard.scenes = storyboard.scenes.slice(0, this.options.maxScenes);
            storyboard.totalScenes = this.options.maxScenes;
        }
        
        // Ensure all scenes have required fields
        storyboard.scenes.forEach((scene, index) => {
            if (!scene.sequenceNumber) scene.sequenceNumber = index + 1;
            if (!scene.sceneTitle) scene.sceneTitle = `Scene ${index + 1}`;
            if (!scene.narrationText) scene.narrationText = 'Narration content needed';
            if (!Array.isArray(scene.visualElements)) scene.visualElements = [];
            if (!Array.isArray(scene.audioCues)) scene.audioCues = [];
        });
    }

    // Utility methods
    parseDuration(durationStr) {
        if (!durationStr) return 0;
        
        const parts = durationStr.split(':').map(p => parseInt(p));
        if (parts.length === 2) {
            return parts[0] * 60 + parts[1];
        } else if (parts.length === 3) {
            return parts[0] * 3600 + parts[1] * 60 + parts[2];
        }
        
        return 0;
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    updateStatistics(storyboard, generationTime) {
        this.statistics.generated++;
        this.statistics.successful++;
        this.statistics.averageScenes = 
            (this.statistics.averageScenes * (this.statistics.successful - 1) + storyboard.totalScenes) / 
            this.statistics.successful;
        this.statistics.totalTime += generationTime;
    }

    logStatistics() {
        console.log('\n📋 Storyboard Generation Statistics:');
        console.log(`Total Generated: ${this.statistics.generated}`);
        console.log(`Successful: ${this.statistics.successful}`);
        console.log(`Failed: ${this.statistics.failed}`);
        console.log(`Average Scenes: ${this.statistics.averageScenes.toFixed(1)}`);
        console.log(`Average Time: ${Math.round(this.statistics.totalTime / this.statistics.generated)}ms`);
    }

    getDefaultStoryboard(videoData, errorMessage = 'Generation failed') {
        return {
            title: `Storyboard for "${videoData.title}"`,
            videoId: videoData.videoId,
            totalScenes: 1,
            estimatedDuration: 120,
            contentType: 'default',
            template: 'error',
            scenes: [{
                sequenceNumber: 1,
                sceneTitle: 'Default Scene',
                sceneType: 'error',
                duration: '120 seconds',
                narrationText: `Unable to generate detailed storyboard: ${errorMessage}`,
                visualElements: ['Simple presentation'],
                audioCues: ['Background music'],
                transitionNotes: 'None',
                timestamp: { start: 0, end: 120 }
            }],
            productionNotes: `Storyboard generation failed: ${errorMessage}`,
            generatedAt: new Date().toISOString(),
            aiProvider: this.options.aiProvider,
            error: true
        };
    }

    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Test method
    async test() {
        try {
            console.log('Testing Storyboard Generator...');
            
            const sampleVideo = {
                videoId: 'test123',
                title: 'How to Create Amazing Content',
                channelName: 'Content Creator',
                duration: '8:30',
                description: 'A tutorial on content creation'
            };
            
            const sampleAnalysis = {
                contentType: 'tutorial',
                themes: ['education', 'creativity', 'tutorial'],
                sentiment: 'positive',
                keyTopics: ['content creation', 'video editing', 'storytelling']
            };
            
            const storyboard = await this.generateStoryboard(sampleVideo, sampleAnalysis);
            
            console.log('\n✓ Test Storyboard Generated:');
            console.log(`Title: ${storyboard.title}`);
            console.log(`Scenes: ${storyboard.totalScenes}`);
            console.log(`Content Type: ${storyboard.contentType}`);
            console.log(`Template: ${storyboard.template}`);
            
            storyboard.scenes.slice(0, 2).forEach((scene, index) => {
                console.log(`\nScene ${index + 1}: ${scene.sceneTitle}`);
                console.log(`Duration: ${scene.duration}`);
                console.log(`Narration: ${scene.narrationText.substring(0, 80)}...`);
            });
            
            return storyboard;
            
        } catch (error) {
            console.error('✗ Storyboard Generator test failed:', error.message);
            throw error;
        }
    }
}

module.exports = StoryboardGenerator;
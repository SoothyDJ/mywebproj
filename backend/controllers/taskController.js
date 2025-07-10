// File Path: /backend/controllers/taskController.js
// Task management controller for automation requests
// REF-043: API controller integrating content analyzer with web interface

const ContentAnalyzer = require('../../ai-services/content-analyzer');
const DatabaseConnection = require('../database/connection');

class TaskController {
    constructor() {
        this.db = new DatabaseConnection();
        this.activeTasks = new Map(); // Track running tasks
        this.initialized = false;
    }

    async initialize() {
        if (!this.initialized) {
            await this.db.connect();
            this.initialized = true;
        }
    }

    // Create new automation task
    async createTask(req, res) {
        try {
            await this.initialize();
            
            const { prompt, taskType = 'youtube_scrape', options = {} } = req.body;
            
            if (!prompt || prompt.trim().length === 0) {
                return res.status(400).json({
                    error: 'Prompt is required',
                    code: 'MISSING_PROMPT'
                });
            }

            // Insert task into database
            const taskResult = await this.db.query(
                `INSERT INTO automation_tasks (user_id, prompt, task_type, status, parameters, created_at) 
                 VALUES ($1, $2, $3, $4, $5, $6) 
                 RETURNING *`,
                [1, prompt, taskType, 'pending', JSON.stringify(options), new Date()]
            );

            const task = taskResult.rows[0];
            
            // Start task processing asynchronously
            this.processTask(task.id, prompt, options)
                .catch(error => {
                    console.error(`Task ${task.id} failed:`, error.message);
                    this.updateTaskStatus(task.id, 'failed', error.message);
                });

            res.status(201).json({
                success: true,
                task: {
                    id: task.id,
                    prompt: task.prompt,
                    status: task.status,
                    taskType: task.task_type,
                    createdAt: task.created_at
                },
                message: 'Task created and processing started'
            });

        } catch (error) {
            console.error('Create task error:', error.message);
            res.status(500).json({
                error: 'Failed to create task',
                details: error.message
            });
        }
    }

    // Get task status and results
    async getTask(req, res) {
        try {
            await this.initialize();
            
            const { id } = req.params;
            
            const taskResult = await this.db.query(
                'SELECT * FROM automation_tasks WHERE id = $1',
                [id]
            );

            if (taskResult.rows.length === 0) {
                return res.status(404).json({
                    error: 'Task not found',
                    code: 'TASK_NOT_FOUND'
                });
            }

            const task = taskResult.rows[0];
            
            // Get associated videos if task is completed
            let videos = [];
            if (task.status === 'completed') {
                const videoResult = await this.db.query(
                    'SELECT * FROM scraped_videos WHERE task_id = $1 ORDER BY view_count DESC',
                    [id]
                );
                videos = videoResult.rows;
            }

            res.json({
                success: true,
                task: {
                    id: task.id,
                    prompt: task.prompt,
                    taskType: task.task_type,
                    status: task.status,
                    parameters: task.parameters,
                    resultsSummary: task.results_summary,
                    createdAt: task.created_at,
                    completedAt: task.completed_at,
                    errorMessage: task.error_message,
                    videos: videos
                }
            });

        } catch (error) {
            console.error('Get task error:', error.message);
            res.status(500).json({
                error: 'Failed to get task',
                details: error.message
            });
        }
    }

    // List all tasks
    async listTasks(req, res) {
        try {
            await this.initialize();
            
            const { status, limit = 50, offset = 0 } = req.query;
            
            let query = 'SELECT * FROM automation_tasks';
            let params = [];
            
            if (status) {
                query += ' WHERE status = $1';
                params.push(status);
            }
            
            query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
            params.push(limit, offset);

            const result = await this.db.query(query, params);

            res.json({
                success: true,
                tasks: result.rows.map(task => ({
                    id: task.id,
                    prompt: task.prompt,
                    taskType: task.task_type,
                    status: task.status,
                    createdAt: task.created_at,
                    completedAt: task.completed_at
                })),
                total: result.rows.length
            });

        } catch (error) {
            console.error('List tasks error:', error.message);
            res.status(500).json({
                error: 'Failed to list tasks',
                details: error.message
            });
        }
    }

    // Delete task
    async deleteTask(req, res) {
        try {
            await this.initialize();
            
            const { id } = req.params;
            
            // Check if task is running
            if (this.activeTasks.has(parseInt(id))) {
                return res.status(400).json({
                    error: 'Cannot delete running task',
                    code: 'TASK_RUNNING'
                });
            }

            const result = await this.db.query(
                'DELETE FROM automation_tasks WHERE id = $1 RETURNING *',
                [id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    error: 'Task not found',
                    code: 'TASK_NOT_FOUND'
                });
            }

            res.json({
                success: true,
                message: 'Task deleted successfully'
            });

        } catch (error) {
            console.error('Delete task error:', error.message);
            res.status(500).json({
                error: 'Failed to delete task',
                details: error.message
            });
        }
    }

    // Get task results in interactive format
    async getTaskResults(req, res) {
        try {
            await this.initialize();
            
            const { id } = req.params;
            
            const task = await this.getTaskById(id);
            if (!task) {
                return res.status(404).json({
                    error: 'Task not found',
                    code: 'TASK_NOT_FOUND'
                });
            }

            if (task.status !== 'completed') {
                return res.status(400).json({
                    error: 'Task not completed yet',
                    code: 'TASK_NOT_COMPLETED',
                    status: task.status
                });
            }

            // Get videos with storyboards
            const videosResult = await this.db.query(
                'SELECT * FROM scraped_videos WHERE task_id = $1 ORDER BY view_count DESC',
                [id]
            );

            const videos = videosResult.rows;
            const interactiveResults = [];

            for (const video of videos) {
                // Get storyboard for this video
                const storyboardResult = await this.db.query(
                    'SELECT * FROM storyboard_items WHERE video_id = $1 ORDER BY sequence_number',
                    [video.id]
                );

                interactiveResults.push({
                    video: {
                        id: video.video_id,
                        title: video.title,
                        channel: video.channel_name,
                        views: video.view_count,
                        duration: video.duration_seconds,
                        uploadDate: video.upload_date,
                        url: video.video_url,
                        thumbnail: video.thumbnail_url
                    },
                    analysis: {
                        summary: video.ai_analysis,
                        sentiment: video.sentiment_score,
                        tags: video.tags || []
                    },
                    storyboard: storyboardResult.rows.map(item => ({
                        sequence: item.sequence_number,
                        description: item.scene_description,
                        narration: item.narration_text,
                        timeStart: item.timestamp_start,
                        timeEnd: item.timestamp_end,
                        visualElements: item.visual_elements || [],
                        audioCues: item.audio_cues || []
                    })),
                    attribution: {
                        originalUrl: video.video_url,
                        channel: video.channel_name,
                        scrapedAt: video.scraped_at
                    }
                });
            }

            res.json({
                success: true,
                task: {
                    id: task.id,
                    prompt: task.prompt,
                    completedAt: task.completed_at,
                    summary: task.results_summary
                },
                results: interactiveResults,
                metadata: {
                    totalVideos: videos.length,
                    generatedAt: new Date().toISOString()
                }
            });

        } catch (error) {
            console.error('Get task results error:', error.message);
            res.status(500).json({
                error: 'Failed to get task results',
                details: error.message
            });
        }
    }

    // Process task asynchronously
    async processTask(taskId, prompt, options) {
        try {
            console.log(`Processing task ${taskId}: ${prompt}`);
            
            // Mark task as running
            this.activeTasks.set(taskId, true);
            await this.updateTaskStatus(taskId, 'running');

            // Initialize content analyzer
            const analyzer = new ContentAnalyzer();
            
            // Run analysis
            const results = await analyzer.analyzeContent(prompt, options);
            
            // Save results to database
            await this.saveTaskResults(taskId, results);
            
            // Generate summary
            const summary = `Analyzed ${results.videos.length} videos with ${results.analyses.length} AI analyses and ${results.storyboards.length} storyboards generated.`;
            
            // Mark task as completed
            await this.updateTaskStatus(taskId, 'completed', null, summary);
            
            // Remove from active tasks
            this.activeTasks.delete(taskId);
            
            console.log(`✓ Task ${taskId} completed successfully`);

        } catch (error) {
            console.error(`✗ Task ${taskId} failed:`, error.message);
            await this.updateTaskStatus(taskId, 'failed', error.message);
            this.activeTasks.delete(taskId);
        }
    }

    // Save analysis results to database
    async saveTaskResults(taskId, results) {
        try {
            for (let i = 0; i < results.videos.length; i++) {
                const video = results.videos[i];
                const analysis = results.analyses[i];
                const storyboard = results.storyboards[i];

                // Insert video
                const videoResult = await this.db.query(
                    `INSERT INTO scraped_videos (
                        task_id, video_id, title, channel_name, channel_id, description,
                        view_count, duration_seconds, upload_date, thumbnail_url, video_url,
                        tags, ai_analysis, sentiment_score, scraped_at
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
                    RETURNING id`,
                    [
                        taskId, video.videoId, video.title, video.channelName, video.channelId,
                        video.description, this.parseViewCount(video.viewCount), 
                        this.parseDuration(video.duration), new Date(), video.thumbnailUrl,
                        video.videoUrl, video.tags || [], JSON.stringify(analysis),
                        analysis.sentimentScore || 0, new Date(video.scrapedAt)
                    ]
                );

                const videoDbId = videoResult.rows[0].id;

                // Insert storyboard items
                if (storyboard && storyboard.scenes) {
                    for (const scene of storyboard.scenes) {
                        await this.db.query(
                            `INSERT INTO storyboard_items (
                                video_id, sequence_number, scene_description, narration_text,
                                timestamp_start, timestamp_end, visual_elements, audio_cues
                            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                            [
                                videoDbId, scene.sequenceNumber, scene.sceneTitle || '',
                                scene.narrationText, scene.timestamp_start || 0,
                                scene.timestamp_end || 0, scene.visualElements || [],
                                scene.audioCues || []
                            ]
                        );
                    }
                }
            }

            console.log(`✓ Saved ${results.videos.length} videos to database`);

        } catch (error) {
            console.error('Save task results error:', error.message);
            throw error;
        }
    }

    // Helper methods
    async updateTaskStatus(taskId, status, errorMessage = null, summary = null) {
        const completedAt = status === 'completed' ? new Date() : null;
        
        await this.db.query(
            'UPDATE automation_tasks SET status = $1, error_message = $2, results_summary = $3, completed_at = $4 WHERE id = $5',
            [status, errorMessage, summary, completedAt, taskId]
        );
    }

    async getTaskById(id) {
        const result = await this.db.query(
            'SELECT * FROM automation_tasks WHERE id = $1',
            [id]
        );
        return result.rows[0] || null;
    }

    parseViewCount(viewStr) {
        if (!viewStr) return 0;
        
        const cleanStr = viewStr.replace(/[^0-9.KMB]/gi, '');
        const number = parseFloat(cleanStr);
        
        if (cleanStr.includes('M')) return Math.round(number * 1000000);
        if (cleanStr.includes('K')) return Math.round(number * 1000);
        if (cleanStr.includes('B')) return Math.round(number * 1000000000);
        
        return Math.round(number) || 0;
    }

    parseDuration(durationStr) {
        if (!durationStr) return 0;
        
        const parts = durationStr.split(':').map(p => parseInt(p));
        if (parts.length === 2) {
            return parts[0] * 60 + parts[1]; // minutes:seconds
        } else if (parts.length === 3) {
            return parts[0] * 3600 + parts[1] * 60 + parts[2]; // hours:minutes:seconds
        }
        
        return 0;
    }

    formatDuration(seconds) {
        if (!seconds || seconds === 0) return '0:00';
        
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        } else {
            return `${minutes}:${secs.toString().padStart(2, '0')}`;
        }
    }
}

module.exports = TaskController;
// File Path: /backend/routes/tasks.js
// Task management routes with full controller integration and HTML report serving
// REF-067: Updated task routes with HTML report endpoint

const express = require('express');
const router = express.Router();
const TaskController = require('../controllers/taskController');
const ReportGenerator = require('../../ai-services/generators/report-generator');

// Initialize controller and report generator
const taskController = new TaskController();
const reportGenerator = new ReportGenerator();

// Task status endpoint
router.get('/status', (req, res) => {
    res.json({ 
        message: 'Task service ready',
        timestamp: new Date().toISOString(),
        service: 'task-automation'
    });
});

// Create new task
router.post('/create', async (req, res) => {
    await taskController.createTask(req, res);
});

// Get task by ID
router.get('/:id', async (req, res) => {
    await taskController.getTask(req, res);
});

// Get task results in interactive format
router.get('/:id/results', async (req, res) => {
    await taskController.getTaskResults(req, res);
});

// Get task results as HTML report
router.get('/:id/report', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Get task data
        const task = await taskController.getTaskById(id);
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

        // Initialize database connection
        await taskController.initialize();

        // Get videos with storyboards directly from database
        const videosResult = await taskController.db.query(
            'SELECT * FROM scraped_videos WHERE task_id = $1 ORDER BY view_count DESC',
            [id]
        );

        const videos = videosResult.rows;
        const reportData = {
            videos: [],
            analyses: [],
            storyboards: [],
            summary: task.results_summary || 'Analysis completed successfully',
            metadata: {
                totalVideos: videos.length,
                generatedAt: new Date().toISOString(),
                taskId: task.id,
                completedAt: task.completed_at
            },
            prompt: task.prompt
        };

        // Process each video
        for (const video of videos) {
            // Get storyboard for this video
            const storyboardResult = await taskController.db.query(
                'SELECT * FROM storyboard_items WHERE video_id = $1 ORDER BY sequence_number',
                [video.id]
            );

            // Format video data
            reportData.videos.push({
                title: video.title,
                channelName: video.channel_name,
                viewCount: video.view_count ? video.view_count.toLocaleString() + ' views' : '0 views',
                duration: taskController.formatDuration(video.duration_seconds),
                videoUrl: video.video_url,
                thumbnailUrl: video.thumbnail_url,
                scrapedAt: video.scraped_at
            });

            // Format analysis data
            let analysisData = {};
            try {
                analysisData = typeof video.ai_analysis === 'string' 
                    ? JSON.parse(video.ai_analysis)
                    : video.ai_analysis || {};
            } catch {
                analysisData = {
                    summary: video.ai_analysis || 'Analysis not available',
                    sentiment: video.sentiment_score > 0 ? 'positive' : 
                             video.sentiment_score < 0 ? 'negative' : 'neutral',
                    sentimentScore: video.sentiment_score || 0,
                    themes: video.tags || [],
                    contentType: 'unknown'
                };
            }
            reportData.analyses.push(analysisData);

            // Format storyboard data
            reportData.storyboards.push({
                title: `Storyboard for ${video.title}`,
                totalScenes: storyboardResult.rows.length,
                estimatedDuration: `${storyboardResult.rows.length * 2} minutes`,
                scenes: storyboardResult.rows.map(scene => ({
                    sequenceNumber: scene.sequence_number,
                    sceneTitle: scene.scene_description,
                    duration: `${(scene.timestamp_end || 60) - (scene.timestamp_start || 0)} seconds`,
                    narrationText: scene.narration_text,
                    visualElements: scene.visual_elements || [],
                    audioCues: scene.audio_cues || [],
                    transitionNotes: 'Smooth transition to next scene'
                }))
            });
        }

        // Generate HTML report
        const htmlReport = await reportGenerator.generateHTMLReport(reportData);

        // Set proper headers for HTML response
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Content-Disposition', `inline; filename="task-${id}-report.html"`);
        
        res.send(htmlReport);

    } catch (error) {
        console.error('HTML report generation error:', error.message);
        res.status(500).json({
            error: 'Failed to generate HTML report',
            details: error.message
        });
    }
});

// List all tasks
router.get('/', async (req, res) => {
    await taskController.listTasks(req, res);
});

// Delete task
router.delete('/:id', async (req, res) => {
    await taskController.deleteTask(req, res);
});

module.exports = router;
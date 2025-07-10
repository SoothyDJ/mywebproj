// File Path: /backend/models/Video.js
// Video database model with CRUD operations and storyboard management
// REF-062: Video model for scraped video data and storyboards

const DatabaseConnection = require('../database/connection');

class Video {
    constructor(db = null) {
        this.db = db || new DatabaseConnection();
        this.tableName = 'scraped_videos';
        this.storyboardTable = 'storyboard_items';
        this.initialized = false;
    }

    async initialize() {
        if (!this.initialized && !this.db.pool) {
            await this.db.connect();
            this.initialized = true;
        }
    }

    // Create new video record
    async create(videoData) {
        try {
            await this.initialize();

            const {
                taskId,
                videoId,
                title,
                channelName,
                channelId,
                description,
                viewCount,
                likeCount,
                commentCount,
                durationSeconds,
                uploadDate,
                thumbnailUrl,
                videoUrl,
                tags = [],
                category,
                aiAnalysis,
                sentimentScore = 0
            } = videoData;

            if (!taskId || !videoId || !title) {
                throw new Error('TaskId, videoId, and title are required');
            }

            const result = await this.db.query(
                `INSERT INTO ${this.tableName} (
                    task_id, video_id, title, channel_name, channel_id, description,
                    view_count, like_count, comment_count, duration_seconds, upload_date,
                    thumbnail_url, video_url, tags, category, ai_analysis, sentiment_score, scraped_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
                RETURNING *`,
                [
                    taskId, videoId, title, channelName, channelId, description,
                    viewCount, likeCount, commentCount, durationSeconds, uploadDate,
                    thumbnailUrl, videoUrl, tags, category,
                    typeof aiAnalysis === 'object' ? JSON.stringify(aiAnalysis) : aiAnalysis,
                    sentimentScore, new Date()
                ]
            );

            return this.formatVideo(result.rows[0]);

        } catch (error) {
            console.error('Video create error:', error.message);
            throw error;
        }
    }

    // Get video by ID
    async findById(id) {
        try {
            await this.initialize();

            const result = await this.db.query(
                `SELECT * FROM ${this.tableName} WHERE id = $1`,
                [id]
            );

            if (result.rows.length === 0) {
                return null;
            }

            return this.formatVideo(result.rows[0]);

        } catch (error) {
            console.error('Video findById error:', error.message);
            throw error;
        }
    }

    // Get video by YouTube video ID
    async findByVideoId(videoId) {
        try {
            await this.initialize();

            const result = await this.db.query(
                `SELECT * FROM ${this.tableName} WHERE video_id = $1`,
                [videoId]
            );

            if (result.rows.length === 0) {
                return null;
            }

            return this.formatVideo(result.rows[0]);

        } catch (error) {
            console.error('Video findByVideoId error:', error.message);
            throw error;
        }
    }

    // Get videos by task ID
    async findByTaskId(taskId, options = {}) {
        try {
            await this.initialize();

            const {
                limit = 50,
                offset = 0,
                orderBy = 'view_count',
                orderDirection = 'DESC'
            } = options;

            const result = await this.db.query(
                `SELECT * FROM ${this.tableName} 
                 WHERE task_id = $1 
                 ORDER BY ${orderBy} ${orderDirection} 
                 LIMIT $2 OFFSET $3`,
                [taskId, limit, offset]
            );

            return result.rows.map(row => this.formatVideo(row));

        } catch (error) {
            console.error('Video findByTaskId error:', error.message);
            throw error;
        }
    }

    // Get videos with filters
    async findAll(filters = {}) {
        try {
            await this.initialize();

            const {
                taskId = null,
                channelName = null,
                category = null,
                minViews = null,
                maxViews = null,
                sentimentFilter = null,
                limit = 100,
                offset = 0,
                orderBy = 'scraped_at',
                orderDirection = 'DESC'
            } = filters;

            let query = `SELECT * FROM ${this.tableName}`;
            let params = [];
            let conditions = [];

            if (taskId) {
                conditions.push(`task_id = $${params.length + 1}`);
                params.push(taskId);
            }

            if (channelName) {
                conditions.push(`channel_name ILIKE $${params.length + 1}`);
                params.push(`%${channelName}%`);
            }

            if (category) {
                conditions.push(`category = $${params.length + 1}`);
                params.push(category);
            }

            if (minViews !== null) {
                conditions.push(`view_count >= $${params.length + 1}`);
                params.push(minViews);
            }

            if (maxViews !== null) {
                conditions.push(`view_count <= $${params.length + 1}`);
                params.push(maxViews);
            }

            if (sentimentFilter) {
                if (sentimentFilter === 'positive') {
                    conditions.push(`sentiment_score > 0.1`);
                } else if (sentimentFilter === 'negative') {
                    conditions.push(`sentiment_score < -0.1`);
                } else if (sentimentFilter === 'neutral') {
                    conditions.push(`sentiment_score >= -0.1 AND sentiment_score <= 0.1`);
                }
            }

            if (conditions.length > 0) {
                query += ` WHERE ${conditions.join(' AND ')}`;
            }

            query += ` ORDER BY ${orderBy} ${orderDirection} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
            params.push(limit, offset);

            const result = await this.db.query(query, params);

            return result.rows.map(row => this.formatVideo(row));

        } catch (error) {
            console.error('Video findAll error:', error.message);
            throw error;
        }
    }

    // Update video analysis
    async updateAnalysis(id, aiAnalysis, sentimentScore = null) {
        try {
            await this.initialize();

            const result = await this.db.query(
                `UPDATE ${this.tableName} 
                 SET ai_analysis = $1, sentiment_score = $2 
                 WHERE id = $3 
                 RETURNING *`,
                [
                    typeof aiAnalysis === 'object' ? JSON.stringify(aiAnalysis) : aiAnalysis,
                    sentimentScore,
                    id
                ]
            );

            if (result.rows.length === 0) {
                throw new Error('Video not found');
            }

            return this.formatVideo(result.rows[0]);

        } catch (error) {
            console.error('Video updateAnalysis error:', error.message);
            throw error;
        }
    }

    // Delete video
    async delete(id) {
        try {
            await this.initialize();

            const result = await this.db.query(
                `DELETE FROM ${this.tableName} WHERE id = $1 RETURNING *`,
                [id]
            );

            if (result.rows.length === 0) {
                throw new Error('Video not found');
            }

            return this.formatVideo(result.rows[0]);

        } catch (error) {
            console.error('Video delete error:', error.message);
            throw error;
        }
    }

    // Create storyboard item
    async createStoryboardItem(storyboardData) {
        try {
            await this.initialize();

            const {
                videoId,
                sequenceNumber,
                sceneDescription,
                narrationText,
                timestampStart = null,
                timestampEnd = null,
                visualElements = [],
                audioCues = []
            } = storyboardData;

            if (!videoId || !sequenceNumber || !sceneDescription || !narrationText) {
                throw new Error('VideoId, sequenceNumber, sceneDescription, and narrationText are required');
            }

            const result = await this.db.query(
                `INSERT INTO ${this.storyboardTable} (
                    video_id, sequence_number, scene_description, narration_text,
                    timestamp_start, timestamp_end, visual_elements, audio_cues, created_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                RETURNING *`,
                [
                    videoId, sequenceNumber, sceneDescription, narrationText,
                    timestampStart, timestampEnd, visualElements,
                    audioCues, new Date()
                ]
            );

            return this.formatStoryboardItem(result.rows[0]);

        } catch (error) {
            console.error('Storyboard create error:', error.message);
            throw error;
        }
    }

    // Get storyboard items for video
    async getStoryboard(videoId) {
        try {
            await this.initialize();

            const result = await this.db.query(
                `SELECT * FROM ${this.storyboardTable} 
                 WHERE video_id = $1 
                 ORDER BY sequence_number`,
                [videoId]
            );

            return result.rows.map(row => this.formatStoryboardItem(row));

        } catch (error) {
            console.error('Get storyboard error:', error.message);
            throw error;
        }
    }

    // Get video statistics
    async getStatistics(taskId = null) {
        try {
            await this.initialize();

            let query = `
                SELECT 
                    COUNT(*) as total_videos,
                    AVG(view_count) as avg_views,
                    SUM(view_count) as total_views,
                    AVG(sentiment_score) as avg_sentiment,
                    COUNT(CASE WHEN sentiment_score > 0.1 THEN 1 END) as positive_videos,
                    COUNT(CASE WHEN sentiment_score < -0.1 THEN 1 END) as negative_videos,
                    COUNT(CASE WHEN sentiment_score >= -0.1 AND sentiment_score <= 0.1 THEN 1 END) as neutral_videos,
                    AVG(duration_seconds) as avg_duration
                FROM ${this.tableName}
            `;

            let params = [];

            if (taskId) {
                query += ` WHERE task_id = $1`;
                params.push(taskId);
            }

            const result = await this.db.query(query, params);
            const stats = result.rows[0];

            return {
                totalVideos: parseInt(stats.total_videos),
                avgViews: parseFloat(stats.avg_views) || 0,
                totalViews: parseInt(stats.total_views) || 0,
                avgSentiment: parseFloat(stats.avg_sentiment) || 0,
                positiveVideos: parseInt(stats.positive_videos),
                negativeVideos: parseInt(stats.negative_videos),
                neutralVideos: parseInt(stats.neutral_videos),
                avgDuration: parseFloat(stats.avg_duration) || 0
            };

        } catch (error) {
            console.error('Video getStatistics error:', error.message);
            throw error;
        }
    }

    // Get top performing videos
    async getTopPerforming(limit = 10, taskId = null) {
        try {
            await this.initialize();

            let query = `SELECT * FROM ${this.tableName}`;
            let params = [];

            if (taskId) {
                query += ` WHERE task_id = $1`;
                params.push(taskId);
            }

            query += ` ORDER BY view_count DESC LIMIT $${params.length + 1}`;
            params.push(limit);

            const result = await this.db.query(query, params);

            return result.rows.map(row => this.formatVideo(row));

        } catch (error) {
            console.error('Video getTopPerforming error:', error.message);
            throw error;
        }
    }

    // Search videos by title or description
    async search(searchTerm, options = {}) {
        try {
            await this.initialize();

            const {
                taskId = null,
                limit = 50,
                offset = 0
            } = options;

            let query = `
                SELECT * FROM ${this.tableName} 
                WHERE (title ILIKE $1 OR description ILIKE $1)
            `;
            let params = [`%${searchTerm}%`];

            if (taskId) {
                query += ` AND task_id = $${params.length + 1}`;
                params.push(taskId);
            }

            query += ` ORDER BY view_count DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
            params.push(limit, offset);

            const result = await this.db.query(query, params);

            return result.rows.map(row => this.formatVideo(row));

        } catch (error) {
            console.error('Video search error:', error.message);
            throw error;
        }
    }

    // Format video data for API response
    formatVideo(videoRow) {
        if (!videoRow) return null;

        return {
            id: videoRow.id,
            taskId: videoRow.task_id,
            videoId: videoRow.video_id,
            title: videoRow.title,
            channelName: videoRow.channel_name,
            channelId: videoRow.channel_id,
            description: videoRow.description,
            viewCount: videoRow.view_count,
            likeCount: videoRow.like_count,
            commentCount: videoRow.comment_count,
            durationSeconds: videoRow.duration_seconds,
            uploadDate: videoRow.upload_date,
            thumbnailUrl: videoRow.thumbnail_url,
            videoUrl: videoRow.video_url,
            tags: Array.isArray(videoRow.tags) ? videoRow.tags : (videoRow.tags || []),
            category: videoRow.category,
            aiAnalysis: typeof videoRow.ai_analysis === 'string' 
                ? JSON.parse(videoRow.ai_analysis) 
                : videoRow.ai_analysis,
            sentimentScore: parseFloat(videoRow.sentiment_score) || 0,
            scrapedAt: videoRow.scraped_at
        };
    }

    // Format storyboard item data
    formatStoryboardItem(itemRow) {
        if (!itemRow) return null;

        return {
            id: itemRow.id,
            videoId: itemRow.video_id,
            sequenceNumber: itemRow.sequence_number,
            sceneDescription: itemRow.scene_description,
            narrationText: itemRow.narration_text,
            timestampStart: itemRow.timestamp_start,
            timestampEnd: itemRow.timestamp_end,
            visualElements: Array.isArray(itemRow.visual_elements) 
                ? itemRow.visual_elements 
                : (itemRow.visual_elements || []),
            audioCues: Array.isArray(itemRow.audio_cues) 
                ? itemRow.audio_cues 
                : (itemRow.audio_cues || []),
            createdAt: itemRow.created_at
        };
    }

    // Cleanup old videos
    async cleanupOldVideos(daysOld = 90) {
        try {
            await this.initialize();

            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysOld);

            const result = await this.db.query(
                `DELETE FROM ${this.tableName} 
                 WHERE scraped_at < $1 
                 RETURNING id`,
                [cutoffDate]
            );

            console.log(`✓ Cleaned up ${result.rows.length} old videos`);
            return result.rows.length;

        } catch (error) {
            console.error('Video cleanup error:', error.message);
            throw error;
        }
    }
}

module.exports = Video;
 -- File Path: /database/schema.sql
-- Web Automation Platform Database Schema
-- REF-012: Database schema creation

-- Drop existing tables if they exist
DROP TABLE IF EXISTS storyboard_items CASCADE;
DROP TABLE IF EXISTS scraped_videos CASCADE;
DROP TABLE IF EXISTS automation_tasks CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users table for basic authentication
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Automation tasks table to track user requests
CREATE TABLE automation_tasks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    prompt TEXT NOT NULL,
    task_type VARCHAR(50) NOT NULL, -- 'youtube_scrape', 'reddit_scrape', etc.
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed'
    parameters JSONB, -- Store search parameters, date ranges, etc.
    results_summary TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    error_message TEXT
);

-- Scraped videos table to store video data
CREATE TABLE scraped_videos (
    id SERIAL PRIMARY KEY,
    task_id INTEGER REFERENCES automation_tasks(id) ON DELETE CASCADE,
    video_id VARCHAR(20) UNIQUE NOT NULL, -- YouTube video ID
    title TEXT NOT NULL,
    channel_name VARCHAR(100),
    channel_id VARCHAR(50),
    description TEXT,
    view_count BIGINT,
    like_count INTEGER,
    comment_count INTEGER,
    duration_seconds INTEGER,
    upload_date DATE,
    thumbnail_url TEXT,
    video_url TEXT NOT NULL,
    tags TEXT[], -- Array of tags
    category VARCHAR(50),
    ai_analysis TEXT, -- AI-generated analysis of content
    sentiment_score DECIMAL(3,2), -- -1 to 1 sentiment score
    scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Storyboard items for video narration
CREATE TABLE storyboard_items (
    id SERIAL PRIMARY KEY,
    video_id INTEGER REFERENCES scraped_videos(id) ON DELETE CASCADE,
    sequence_number INTEGER NOT NULL,
    scene_description TEXT NOT NULL,
    narration_text TEXT NOT NULL,
    timestamp_start INTEGER, -- seconds from video start
    timestamp_end INTEGER, -- seconds from video start
    visual_elements TEXT[], -- Array of visual elements to include
    audio_cues TEXT[], -- Array of audio cues
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX idx_automation_tasks_user_id ON automation_tasks(user_id);
CREATE INDEX idx_automation_tasks_status ON automation_tasks(status);
CREATE INDEX idx_scraped_videos_task_id ON scraped_videos(task_id);
CREATE INDEX idx_scraped_videos_upload_date ON scraped_videos(upload_date);
CREATE INDEX idx_storyboard_items_video_id ON storyboard_items(video_id);
CREATE INDEX idx_storyboard_items_sequence ON storyboard_items(sequence_number);

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update trigger to users table
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
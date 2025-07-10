# Web Automation Platform - User Guide

**File Path**: `/docs/user-guide.md`  
**REF-093**: Comprehensive user guide for the Web Automation Platform

---

## Table of Contents
1. [Overview](#overview)
2. [Getting Started](#getting-started)
3. [Features](#features)
4. [Creating Tasks](#creating-tasks)
5. [Understanding Results](#understanding-results)
6. [API Usage](#api-usage)
7. [Troubleshooting](#troubleshooting)
8. [Advanced Usage](#advanced-usage)

---

## Overview

The Web Automation Platform is an AI-powered system that automates web scraping, content analysis, and report generation. It can analyze YouTube videos, Reddit posts, and generate interactive reports with AI-powered insights and storyboards.

### Key Capabilities
- **YouTube Video Analysis**: Scrape and analyze video content, metadata, and trends
- **Reddit Post Analysis**: Extract and analyze Reddit posts with sentiment analysis
- **AI Content Analysis**: Generate detailed insights using OpenAI or Claude AI
- **Storyboard Generation**: Create video narration storyboards automatically
- **Interactive Reports**: Generate professional HTML reports with attribution
- **Real-time Processing**: Track task progress and view results as they complete

---

## Getting Started

### Prerequisites
- Node.js 16+ installed
- PostgreSQL database
- Docker (optional, for database)
- API keys for AI services (OpenAI or Claude)
- Reddit API credentials (optional, for Reddit analysis)

### Quick Start

1. **Clone and Setup**
   ```bash
   git clone <repository>
   cd web-automation-platform
   ```

2. **Start Database** (using Docker)
   ```bash
   docker-compose up -d
   ```

3. **Configure Environment**
   Create `/backend/.env` with your API keys:
   ```env
   # Database
   DB_USER=postgres
   DB_HOST=localhost
   DB_NAME=web_automation
   DB_PASSWORD=password123
   DB_PORT=5432

   # AI Services
   OPENAI_API_KEY=your_openai_key_here
   OPENAI_MODEL=gpt-4o-mini

   # Optional: Claude AI
   CLAUDE_API_KEY=your_claude_key_here
   CLAUDE_MODEL=claude-3-5-sonnet-20241022

   # Optional: Reddit API
   REDDIT_CLIENT_ID=your_reddit_client_id
   REDDIT_CLIENT_SECRET=your_reddit_secret
   REDDIT_USER_AGENT=YourApp:v1.0 (by u/yourusername)
   ```

4. **Install Dependencies**
   ```bash
   cd backend && npm install
   cd ../ai-services && npm install
   cd ../scraping && npm install
   ```

5. **Start the Server**
   ```bash
   cd backend
   npm run dev
   ```

6. **Verify Installation**
   Visit: http://localhost:3001/health

---

## Features

### 1. YouTube Video Analysis
- **Search Parameters**: Query, date filters, result limits
- **Data Extraction**: Titles, channels, views, descriptions, metadata
- **AI Analysis**: Content themes, sentiment, engagement factors
- **Storyboard Generation**: Scene-by-scene narration scripts

### 2. Reddit Post Analysis
- **Content Sources**: Specific subreddits or global search
- **Post Types**: Text, image, video, and link posts
- **Metadata**: Scores, comments, awards, timestamps
- **Sentiment Analysis**: Positive, negative, neutral classification

### 3. AI-Powered Insights
- **Content Summarization**: Key themes and topics extraction
- **Sentiment Analysis**: Emotional tone assessment
- **Engagement Prediction**: Factors driving audience interaction
- **Trend Analysis**: Pattern recognition across content

### 4. Report Generation
- **Interactive HTML Reports**: Professional, responsive design
- **Data Visualizations**: Charts, statistics, and metrics
- **Attribution Links**: Proper source crediting
- **Export Options**: HTML, JSON data formats

---

## Creating Tasks

### Basic Task Creation

1. **Via API** (Recommended)
   ```bash
   curl -X POST http://localhost:3001/api/tasks/create \
     -H "Content-Type: application/json" \
     -d '{
       "prompt": "Find top 10 paranormal encounter videos from the last month",
       "taskType": "youtube_scrape",
       "options": {
         "maxResults": 10,
         "timeFilter": "month"
       }
     }'
   ```

2. **Response**
   ```json
   {
     "success": true,
     "task": {
       "id": 123,
       "prompt": "Find top 10 paranormal encounter videos...",
       "status": "pending",
       "createdAt": "2025-07-10T16:00:00Z"
     }
   }
   ```

### Task Types

#### YouTube Analysis
```json
{
  "prompt": "Analyze trending horror movie reviews from the past week",
  "taskType": "youtube_scrape",
  "options": {
    "maxResults": 20,
    "timeFilter": "week",
    "sortBy": "relevance"
  }
}
```

#### Reddit Analysis
```json
{
  "prompt": "Find popular posts about artificial intelligence",
  "taskType": "reddit_scrape", 
  "options": {
    "subreddit": "MachineLearning",
    "maxResults": 15,
    "timeFilter": "month"
  }
}
```

### Prompt Examples

**Effective Prompts:**
- ✅ "Find top 15 cooking tutorial videos from the last 2 weeks"
- ✅ "Analyze Reddit posts about electric cars in r/technology from this month"
- ✅ "Search for paranormal encounter stories with high engagement"

**Avoid:**
- ❌ Vague prompts: "Find some videos"
- ❌ Overly broad: "Analyze everything about cars"
- ❌ Missing timeframe: "Find popular posts"

---

## Understanding Results

### Task Status Tracking

Monitor task progress via API:
```bash
curl http://localhost:3001/api/tasks/123
```

**Status Values:**
- `pending` - Task queued for processing
- `running` - Currently scraping and analyzing
- `completed` - Analysis finished, results available
- `failed` - Error occurred during processing

### Result Structure

```json
{
  "task": {
    "id": 123,
    "status": "completed",
    "prompt": "Original request",
    "completedAt": "2025-07-10T16:15:00Z"
  },
  "results": [
    {
      "video": {
        "title": "Video Title",
        "channel": "Channel Name", 
        "views": 1500000,
        "url": "https://youtube.com/watch?v=..."
      },
      "analysis": {
        "summary": "AI-generated summary",
        "sentiment": "positive",
        "themes": ["theme1", "theme2"]
      },
      "storyboard": {
        "scenes": [
          {
            "sequence": 1,
            "narration": "Scene description...",
            "visualElements": ["element1", "element2"]
          }
        ]
      }
    }
  ]
}
```

### Interactive Reports

Access formatted reports:
```bash
curl http://localhost:3001/api/tasks/123/results
```

**Report Sections:**
- **Executive Summary**: Key metrics and insights
- **Video/Post Analysis**: Individual content breakdowns
- **Storyboard Details**: Scene-by-scene narration
- **Attribution**: Source links and credits
- **Recommendations**: Actionable insights

---

## API Usage

### Authentication
Currently uses basic API access. Future versions will include API key authentication.

### Endpoints

#### Task Management
```bash
# Create task
POST /api/tasks/create

# Get task status  
GET /api/tasks/:id

# Get task results
GET /api/tasks/:id/results

# List all tasks
GET /api/tasks

# Delete task
DELETE /api/tasks/:id
```

#### System Health
```bash
# Health check
GET /health

# API status
GET /api/auth/status
GET /api/tasks/status
```

### Rate Limits
- **YouTube**: ~100 requests/hour (Puppeteer-based)
- **Reddit**: 60 requests/minute (API-based)
- **AI Services**: Depends on your API plan
  - OpenAI: Varies by tier
  - Claude: Varies by tier

### Error Handling

```json
{
  "error": "Task creation failed",
  "details": "Missing required field: prompt",
  "code": "VALIDATION_ERROR",
  "timestamp": "2025-07-10T16:00:00Z"
}
```

**Common Error Codes:**
- `VALIDATION_ERROR` - Invalid request data
- `API_LIMIT_EXCEEDED` - Rate limit reached
- `TASK_NOT_FOUND` - Invalid task ID
- `PROCESSING_ERROR` - Analysis failed

---

## Troubleshooting

### Common Issues

#### 1. Database Connection Failed
```
✗ Database connection failed: connect ECONNREFUSED
```
**Solution:**
- Ensure PostgreSQL is running
- Check connection credentials in `.env`
- Verify database exists: `createdb web_automation`

#### 2. API Key Errors
```
✗ OpenAI connection test failed: Unauthorized
```
**Solution:**
- Verify API key in `.env` file
- Check API key has sufficient credits/quota
- Ensure correct model name

#### 3. Scraping Failures
```
✗ YouTube search failed: Timeout
```
**Solution:**
- Check internet connection
- Verify target sites are accessible
- Increase timeout values if needed

#### 4. Empty Results
```
✓ Found 0 videos
```
**Solution:**
- Adjust search query (too specific)
- Change time filter (extend date range)
- Try different keywords

### Debug Mode

Enable detailed logging:
```bash
DEBUG=true npm run dev
```

### Log Files
- Application logs: Console output
- Database logs: PostgreSQL logs
- API request logs: HTTP access logs

---

## Advanced Usage

### Custom Content Analysis

Extend the AI analysis by modifying prompts in:
- `/ai-services/openai-service.js`
- `/ai-services/claude-service.js`

### Report Customization

Modify report templates in:
- `/ai-services/generators/report-generator.js`

### Adding New Scrapers

1. Create scraper in `/scraping/`
2. Add parser in `/scraping/parsers/`
3. Update content analyzer to use new scraper
4. Add task type to controller

### Database Queries

Direct database access:
```sql
-- View all tasks
SELECT * FROM automation_tasks ORDER BY created_at DESC;

-- Get task results
SELECT v.title, v.ai_analysis 
FROM scraped_videos v 
JOIN automation_tasks t ON v.task_id = t.id 
WHERE t.id = 123;

-- Performance stats
SELECT 
  status, 
  COUNT(*) as count,
  AVG(EXTRACT(EPOCH FROM (completed_at - created_at))) as avg_duration
FROM automation_tasks 
GROUP BY status;
```

### Performance Optimization

1. **Concurrent Processing**: Modify batch sizes in content analyzer
2. **Database Indexing**: Add indexes for frequently queried fields
3. **Caching**: Implement Redis for API response caching
4. **Rate Limiting**: Adjust delays between requests

### Deployment

See `/docs/deployment.md` for production deployment instructions.

---

## Support

### Getting Help
- Check logs for error details
- Review this user guide
- Consult API documentation: `/docs/API.md`
- Check GitHub issues (if applicable)

### Reporting Issues
Include in bug reports:
- Task ID and prompt used
- Error messages and logs
- Environment details (OS, Node.js version)
- Steps to reproduce

### Contributing
See contribution guidelines in project repository.

---

*Last updated: July 2025*  
*Platform Version: 1.0.0*
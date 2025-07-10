# Web Automation Platform - API Documentation

**File Path**: `/docs/API.md`  
**REF-096**: Complete API reference for the Web Automation Platform

---

## Table of Contents
1. [Overview](#overview)
2. [Base URL & Authentication](#base-url--authentication)
3. [Response Format](#response-format)
4. [Error Handling](#error-handling)
5. [Task Management](#task-management)
6. [System Health](#system-health)
7. [Rate Limits](#rate-limits)
8. [Examples](#examples)
9. [SDKs & Libraries](#sdks--libraries)

---

## Overview

The Web Automation Platform provides a RESTful API for creating and managing automation tasks, retrieving analysis results, and monitoring system health. The API supports JSON requests and responses with comprehensive error handling.

### API Version
- **Current Version**: v1
- **Protocol**: HTTP/HTTPS
- **Format**: JSON
- **Authentication**: API Key (future implementation)

### Supported Operations
- Create and manage automation tasks
- Monitor task progress and status
- Retrieve analysis results and reports
- Access system health metrics
- Export data in various formats

---

## Base URL & Authentication

### Base URL
```
Production:  https://your-domain.com/api
Development: http://localhost:3001/api
```

### Authentication
Currently, the API uses open access for development. Future versions will require API key authentication.

**Future Authentication Format:**
```http
Authorization: Bearer YOUR_API_KEY
```

### Content Type
All requests must include:
```http
Content-Type: application/json
```

---

## Response Format

### Success Response
```json
{
  "success": true,
  "data": {
    // Response data here
  },
  "timestamp": "2025-07-10T16:00:00.000Z"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": "Additional error details"
  },
  "timestamp": "2025-07-10T16:00:00.000Z"
}
```

---

## Error Handling

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `429` - Rate Limit Exceeded
- `500` - Internal Server Error

### Error Codes
| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Request validation failed |
| `TASK_NOT_FOUND` | Task ID does not exist |
| `TASK_RUNNING` | Cannot modify running task |
| `API_LIMIT_EXCEEDED` | Rate limit exceeded |
| `MISSING_PROMPT` | Required prompt field missing |
| `INVALID_TASK_TYPE` | Unsupported task type |
| `PROCESSING_ERROR` | Task processing failed |
| `DATABASE_ERROR` | Database operation failed |

---

## Task Management

### Create Task

Create a new automation task for content analysis.

**Endpoint:** `POST /api/tasks/create`

**Request Body:**
```json
{
  "prompt": "Find top 10 paranormal encounter videos from the last month",
  "taskType": "youtube_scrape",
  "options": {
    "maxResults": 10,
    "timeFilter": "month",
    "sortBy": "relevance"
  }
}
```

**Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `prompt` | string | Yes | Natural language description of the task |
| `taskType` | string | No | Task type: `youtube_scrape`, `reddit_scrape` (default: `youtube_scrape`) |
| `options` | object | No | Additional task configuration |

**Options Object:**
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `maxResults` | integer | 10 | Maximum number of items to analyze (1-50) |
| `timeFilter` | string | "month" | Time range: `hour`, `day`, `week`, `month`, `year` |
| `sortBy` | string | "relevance" | Sort order: `relevance`, `date`, `viewCount`, `rating` |
| `subreddit` | string | null | Specific subreddit for Reddit tasks |

**Response:**
```json
{
  "success": true,
  "task": {
    "id": 123,
    "prompt": "Find top 10 paranormal encounter videos from the last month",
    "taskType": "youtube_scrape",
    "status": "pending",
    "createdAt": "2025-07-10T16:00:00.000Z"
  },
  "message": "Task created and processing started"
}
```

**Example cURL:**
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

---

### Get Task Status

Retrieve current status and basic information about a task.

**Endpoint:** `GET /api/tasks/{id}`

**Parameters:**
| Field | Type | Location | Description |
|-------|------|----------|-------------|
| `id` | integer | path | Task ID |

**Response:**
```json
{
  "success": true,
  "task": {
    "id": 123,
    "prompt": "Find top 10 paranormal encounter videos from the last month",
    "taskType": "youtube_scrape",
    "status": "completed",
    "parameters": {
      "maxResults": 10,
      "timeFilter": "month"
    },
    "resultsSummary": "Analyzed 8 videos with 8 AI analyses and 8 storyboards generated.",
    "createdAt": "2025-07-10T16:00:00.000Z",
    "completedAt": "2025-07-10T16:05:30.000Z",
    "errorMessage": null,
    "videos": [
      {
        "video_id": "abc123",
        "title": "Real Ghost Encounter",
        "channel_name": "Paranormal Channel",
        "view_count": 150000,
        "duration_seconds": 900
      }
    ]
  }
}
```

**Status Values:**
- `pending` - Task queued for processing
- `running` - Currently being processed
- `completed` - Successfully completed
- `failed` - Processing failed

**Example cURL:**
```bash
curl http://localhost:3001/api/tasks/123
```

---

### Get Task Results

Retrieve detailed analysis results in interactive format.

**Endpoint:** `GET /api/tasks/{id}/results`

**Parameters:**
| Field | Type | Location | Description |
|-------|------|----------|-------------|
| `id` | integer | path | Task ID |

**Response:**
```json
{
  "success": true,
  "task": {
    "id": 123,
    "prompt": "Find top 10 paranormal encounter videos from the last month",
    "completedAt": "2025-07-10T16:05:30.000Z",
    "summary": "Analysis of popular paranormal content shows strong viewer engagement..."
  },
  "results": [
    {
      "video": {
        "id": "abc123",
        "title": "Real Ghost Encounter Caught on Camera",
        "channel": "Paranormal Investigator",
        "views": 2300000,
        "duration": 930,
        "uploadDate": "2025-06-15",
        "url": "https://youtube.com/watch?v=abc123",
        "thumbnail": "https://img.youtube.com/vi/abc123/maxresdefault.jpg"
      },
      "analysis": {
        "summary": "Compelling paranormal evidence presented with good production value",
        "sentiment": 0.7,
        "tags": ["paranormal", "investigation", "evidence"]
      },
      "storyboard": [
        {
          "sequence": 1,
          "description": "Introduction scene",
          "narration": "Welcome to our paranormal investigation of the haunted mansion...",
          "timeStart": 0,
          "timeEnd": 30,
          "visualElements": ["Title card", "Location establishing shot"],
          "audioCues": ["Mysterious background music", "Wind sounds"]
        }
      ],
      "attribution": {
        "originalUrl": "https://youtube.com/watch?v=abc123",
        "channel": "Paranormal Investigator",
        "scrapedAt": "2025-07-10T16:02:15.000Z"
      }
    }
  ],
  "metadata": {
    "totalVideos": 8,
    "generatedAt": "2025-07-10T16:05:30.000Z"
  }
}
```

**Example cURL:**
```bash
curl http://localhost:3001/api/tasks/123/results
```

---

### List Tasks

Retrieve a list of tasks with optional filtering.

**Endpoint:** `GET /api/tasks`

**Query Parameters:**
| Field | Type | Description |
|-------|------|-------------|
| `status` | string | Filter by status: `pending`, `running`, `completed`, `failed` |
| `limit` | integer | Maximum number of tasks to return (default: 50, max: 100) |
| `offset` | integer | Number of tasks to skip (default: 0) |

**Response:**
```json
{
  "success": true,
  "tasks": [
    {
      "id": 123,
      "prompt": "Find top 10 paranormal encounter videos...",
      "taskType": "youtube_scrape",
      "status": "completed",
      "createdAt": "2025-07-10T16:00:00.000Z",
      "completedAt": "2025-07-10T16:05:30.000Z"
    }
  ],
  "total": 1,
  "pagination": {
    "limit": 50,
    "offset": 0,
    "hasMore": false
  }
}
```

**Example cURL:**
```bash
# Get all completed tasks
curl "http://localhost:3001/api/tasks?status=completed&limit=20"

# Get recent tasks
curl "http://localhost:3001/api/tasks?limit=10&offset=0"
```

---

### Delete Task

Delete a task and all associated data.

**Endpoint:** `DELETE /api/tasks/{id}`

**Parameters:**
| Field | Type | Location | Description |
|-------|------|----------|-------------|
| `id` | integer | path | Task ID |

**Response:**
```json
{
  "success": true,
  "message": "Task deleted successfully"
}
```

**Error Response (Running Task):**
```json
{
  "success": false,
  "error": {
    "code": "TASK_RUNNING",
    "message": "Cannot delete running task"
  }
}
```

**Example cURL:**
```bash
curl -X DELETE http://localhost:3001/api/tasks/123
```

---

## System Health

### Health Check

Check overall system health and dependencies.

**Endpoint:** `GET /health`

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-07-10T16:00:00.000Z",
  "database": "connected",
  "version": "1.0.0",
  "uptime": 3600,
  "services": {
    "youtube_scraper": "operational",
    "reddit_api": "operational", 
    "openai_service": "operational",
    "claude_service": "operational"
  }
}
```

**Example cURL:**
```bash
curl http://localhost:3001/health
```

### Service Status

Check individual service status.

**Endpoints:**
- `GET /api/auth/status` - Authentication service
- `GET /api/tasks/status` - Task service

**Response:**
```json
{
  "message": "Task service ready",
  "timestamp": "2025-07-10T16:00:00.000Z",
  "service": "task-automation"
}
```

---

## Rate Limits

### Current Limits
- **Task Creation**: 10 requests per minute
- **Task Retrieval**: 100 requests per minute
- **List Operations**: 50 requests per minute

### Rate Limit Headers
```http
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 8
X-RateLimit-Reset: 1625097600
```

### Rate Limit Response
```json
{
  "success": false,
  "error": {
    "code": "API_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Try again in 60 seconds."
  }
}
```

---

## Examples

### Complete YouTube Analysis Workflow

1. **Create Task**
```bash
curl -X POST http://localhost:3001/api/tasks/create \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Analyze top horror movie reviews from this week",
    "taskType": "youtube_scrape",
    "options": {
      "maxResults": 15,
      "timeFilter": "week"
    }
  }'
```

2. **Monitor Progress**
```bash
# Check every 30 seconds
curl http://localhost:3001/api/tasks/124
```

3. **Get Results**
```bash
curl http://localhost:3001/api/tasks/124/results
```

### Reddit Analysis Example

```bash
curl -X POST http://localhost:3001/api/tasks/create \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Find popular AI discussion posts",
    "taskType": "reddit_scrape",
    "options": {
      "subreddit": "MachineLearning",
      "maxResults": 20,
      "timeFilter": "week"
    }
  }'
```

### Batch Operations

```bash
# Create multiple tasks
for query in "cooking tutorials" "fitness videos" "tech reviews"; do
  curl -X POST http://localhost:3001/api/tasks/create \
    -H "Content-Type: application/json" \
    -d "{\"prompt\": \"Find ${query} from last month\"}"
  sleep 1
done

# Check all task statuses
curl "http://localhost:3001/api/tasks?status=running"
```

---

## SDKs & Libraries

### JavaScript/Node.js SDK

```javascript
const AutomationAPI = require('./automation-api-client');

const client = new AutomationAPI({
  baseURL: 'http://localhost:3001/api',
  apiKey: 'your-api-key' // Future implementation
});

// Create task
const task = await client.tasks.create({
  prompt: 'Find top paranormal videos',
  taskType: 'youtube_scrape',
  options: { maxResults: 10 }
});

// Monitor progress
const status = await client.tasks.get(task.id);

// Get results
if (status.status === 'completed') {
  const results = await client.tasks.getResults(task.id);
}
```

### Python SDK

```python
from automation_api import AutomationClient

client = AutomationClient(
    base_url='http://localhost:3001/api',
    api_key='your-api-key'  # Future implementation
)

# Create task
task = client.tasks.create(
    prompt='Find top paranormal videos',
    task_type='youtube_scrape',
    options={'max_results': 10}
)

# Get results
results = client.tasks.get_results(task['id'])
```

### cURL Wrapper Script

```bash
#!/bin/bash
# automation-api.sh

API_BASE="http://localhost:3001/api"

create_task() {
    curl -X POST "$API_BASE/tasks/create" \
        -H "Content-Type: application/json" \
        -d "$1"
}

get_task() {
    curl "$API_BASE/tasks/$1"
}

get_results() {
    curl "$API_BASE/tasks/$1/results"
}

# Usage:
# ./automation-api.sh create_task '{"prompt":"test","taskType":"youtube_scrape"}'
# ./automation-api.sh get_task 123
# ./automation-api.sh get_results 123
```

---

## Webhooks (Future Implementation)

### Webhook Configuration
```json
{
  "url": "https://your-app.com/webhook",
  "events": ["task.completed", "task.failed"],
  "secret": "webhook-secret"
}
```

### Webhook Payload
```json
{
  "event": "task.completed",
  "task_id": 123,
  "timestamp": "2025-07-10T16:05:30.000Z",
  "data": {
    "status": "completed",
    "results_count": 8
  }
}
```

---

## Version History

### v1.0.0 (Current)
- Task creation and management
- YouTube and Reddit scraping
- AI content analysis
- Interactive report generation
- Basic error handling

### Future Versions
- v1.1.0: API key authentication
- v1.2.0: Webhook support
- v1.3.0: Batch operations
- v1.4.0: Real-time streaming results

---

## Support

### API Issues
- Check system health: `GET /health`
- Review error codes and messages
- Verify request format and required fields
- Check rate limits

### Contact
- Documentation: `/docs/user-guide.md`
- GitHub Issues: (if applicable)
- Email: support@yourplatform.com

---

*Last updated: July 2025*  
*API Version: 1.0.0*
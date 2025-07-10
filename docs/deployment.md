# Web Automation Platform - Deployment Guide

**File Path**: `/docs/deployment.md`  
**REF-099**: Complete deployment and production setup guide

---

## Table of Contents
1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Environment Setup](#environment-setup)
4. [Production Database](#production-database)
5. [Application Deployment](#application-deployment)
6. [Docker Deployment](#docker-deployment)
7. [Cloud Deployment](#cloud-deployment)
8. [Security Configuration](#security-configuration)
9. [Monitoring & Logging](#monitoring--logging)
10. [Backup & Recovery](#backup--recovery)
11. [Performance Optimization](#performance-optimization)
12. [Troubleshooting](#troubleshooting)

---

## Overview

This guide covers deploying the Web Automation Platform to production environments. The platform can be deployed using various methods including traditional server hosting, Docker containers, or cloud platforms.

### Architecture Overview
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Load Balancer │────│  Application     │────│   Database      │
│   (Nginx/ALB)   │    │  (Node.js)       │    │  (PostgreSQL)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                       ┌────────┴────────┐
                       │   External APIs │
                       │  (OpenAI/Claude)│
                       └─────────────────┘
```

### Deployment Options
- **Single Server**: All services on one machine (suitable for small scale)
- **Multi-Server**: Separate database, application, and web servers
- **Docker**: Containerized deployment with orchestration
- **Cloud**: AWS, Azure, GCP, or other cloud providers
- **Kubernetes**: Container orchestration for high availability

---

## Prerequisites

### System Requirements

**Minimum Requirements:**
- **CPU**: 2 cores
- **RAM**: 4GB
- **Storage**: 20GB SSD
- **OS**: Ubuntu 20.04+, CentOS 8+, or Amazon Linux 2

**Recommended for Production:**
- **CPU**: 4+ cores
- **RAM**: 8GB+
- **Storage**: 50GB+ SSD
- **OS**: Ubuntu 22.04 LTS

### Software Dependencies
- **Node.js**: 18.x or 20.x LTS
- **PostgreSQL**: 13+ or 14+
- **Nginx**: 1.18+ (for reverse proxy)
- **PM2**: Process manager for Node.js
- **Git**: For code deployment
- **SSL Certificate**: For HTTPS

### Network Requirements
- **Inbound**: Port 80 (HTTP), 443 (HTTPS), 22 (SSH)
- **Outbound**: 
  - Port 443 for API calls (OpenAI, Claude, Reddit)
  - Port 5432 for database (if external)
  - Port 53 for DNS

---

## Environment Setup

### 1. Server Preparation

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install essential packages
sudo apt install -y curl wget git nginx postgresql postgresql-contrib

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Create application user
sudo useradd -m -s /bin/bash webapp
sudo usermod -aG sudo webapp
```

### 2. Application Setup

```bash
# Switch to webapp user
sudo su - webapp

# Clone repository
git clone https://github.com/your-org/web-automation-platform.git
cd web-automation-platform

# Install dependencies
cd backend && npm install --production
cd ../ai-services && npm install --production
cd ../scraping && npm install --production

# Create logs directory
mkdir -p logs
```

### 3. Environment Configuration

**Create production environment file:**
```bash
# /home/webapp/web-automation-platform/backend/.env.production
NODE_ENV=production
PORT=3001

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=web_automation_prod
DB_USER=webapp_user
DB_PASSWORD=your_secure_password

# API Keys (use strong secrets)
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4o-mini

CLAUDE_API_KEY=your_claude_api_key
CLAUDE_MODEL=claude-3-5-sonnet-20241022

REDDIT_CLIENT_ID=your_reddit_client_id
REDDIT_CLIENT_SECRET=your_reddit_client_secret
REDDIT_USER_AGENT=YourApp/1.0 (production)

# Security
JWT_SECRET=your_jwt_secret_here
SESSION_SECRET=your_session_secret_here

# External URLs
FRONTEND_URL=https://yourdomain.com
API_BASE_URL=https://api.yourdomain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 4. File Permissions

```bash
# Set proper permissions
sudo chown -R webapp:webapp /home/webapp/web-automation-platform
chmod 600 /home/webapp/web-automation-platform/backend/.env.production
chmod +x /home/webapp/web-automation-platform/backend/server.js
```

---

## Production Database

### 1. PostgreSQL Installation & Configuration

```bash
# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Start and enable PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database user
sudo -u postgres createuser --interactive
# Enter name: webapp_user
# Superuser: n
# Create databases: y
# Create roles: n

# Set password
sudo -u postgres psql -c "ALTER USER webapp_user PASSWORD 'your_secure_password';"

# Create production database
sudo -u postgres createdb -O webapp_user web_automation_prod
```

### 2. Database Security

```bash
# Edit PostgreSQL configuration
sudo nano /etc/postgresql/14/main/postgresql.conf

# Update settings:
listen_addresses = 'localhost'
max_connections = 100
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
```

```bash
# Configure authentication
sudo nano /etc/postgresql/14/main/pg_hba.conf

# Add line for webapp user:
local   web_automation_prod    webapp_user                     md5
```

```bash
# Restart PostgreSQL
sudo systemctl restart postgresql
```

### 3. Initialize Database Schema

```bash
# Run database initialization
cd /home/webapp/web-automation-platform/backend
NODE_ENV=production node -e "
const db = require('./database/connection');
const fs = require('fs');

async function init() {
    const dbConn = new db();
    await dbConn.connect();
    
    const schema = fs.readFileSync('../database/schema.sql', 'utf8');
    await dbConn.query(schema);
    
    console.log('Database initialized successfully');
    await dbConn.disconnect();
}

init().catch(console.error);
"
```

---

## Application Deployment

### 1. PM2 Configuration

**Create PM2 ecosystem file:**
```javascript
// /home/webapp/web-automation-platform/ecosystem.config.js
module.exports = {
  apps: [{
    name: 'web-automation-api',
    script: './backend/server.js',
    cwd: '/home/webapp/web-automation-platform',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    restart_delay: 1000,
    max_restarts: 5,
    min_uptime: '10s'
  }]
};
```

### 2. Start Application

```bash
# Start with PM2
cd /home/webapp/web-automation-platform
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Setup PM2 startup
pm2 startup
# Run the command it outputs with sudo

# Monitor application
pm2 monit
```

### 3. Application Health Check

```bash
# Test application
curl http://localhost:3001/health

# Check logs
pm2 logs web-automation-api
```

---

## Docker Deployment

### 1. Dockerfile

**Create `/Dockerfile`:**
```dockerfile
FROM node:20-alpine

# Install system dependencies
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Set Puppeteer to use installed Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Create app directory
WORKDIR /app

# Copy package files
COPY backend/package*.json ./backend/
COPY ai-services/package*.json ./ai-services/
COPY scraping/package*.json ./scraping/

# Install dependencies
RUN cd backend && npm ci --only=production && \
    cd ../ai-services && npm ci --only=production && \
    cd ../scraping && npm ci --only=production

# Copy application code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S webapp -u 1001

# Change ownership
RUN chown -R webapp:nodejs /app
USER webapp

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Start application
CMD ["node", "backend/server.js"]
```

### 2. Docker Compose

**Create `/docker-compose.prod.yml`:**
```yaml
version: '3.8'

services:
  app:
    build: .
    restart: unless-stopped
    ports:
      - "3001:3001"
    environment:
      NODE_ENV: production
      DB_HOST: db
      DB_PORT: 5432
      DB_NAME: web_automation_prod
      DB_USER: webapp_user
      DB_PASSWORD: ${DB_PASSWORD}
    env_file:
      - .env.production
    depends_on:
      - db
    volumes:
      - ./logs:/app/logs
    networks:
      - app-network

  db:
    image: postgres:14-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: web_automation_prod
      POSTGRES_USER: webapp_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/schema.sql:/docker-entrypoint-initdb.d/schema.sql
    networks:
      - app-network

  nginx:
    image: nginx:alpine
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    networks:
      - app-network

volumes:
  postgres_data:

networks:
  app-network:
    driver: bridge
```

### 3. Deploy with Docker

```bash
# Build and start services
docker-compose -f docker-compose.prod.yml up -d

# Check status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f app
```

---

## Cloud Deployment

### AWS Deployment

#### 1. EC2 Instance Setup

```bash
# Launch EC2 instance (Amazon Linux 2)
# Instance type: t3.medium or larger
# Security groups: SSH (22), HTTP (80), HTTPS (443)

# Connect to instance
ssh -i your-key.pem ec2-user@your-instance-ip

# Install dependencies
sudo yum update -y
sudo yum install -y git docker
sudo service docker start
sudo usermod -a -G docker ec2-user

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/1.29.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

#### 2. RDS Database Setup

```bash
# Create RDS PostgreSQL instance
# Instance class: db.t3.micro or larger
# Storage: 20GB+ SSD
# Multi-AZ: Enabled for production

# Update environment variables with RDS endpoint
DB_HOST=your-rds-endpoint.amazonaws.com
DB_PORT=5432
```

#### 3. Application Load Balancer

```yaml
# ALB Configuration (AWS Console or CloudFormation)
Target Group:
  - Protocol: HTTP
  - Port: 3001
  - Health Check: /health

Listener Rules:
  - Port 80: Redirect to HTTPS
  - Port 443: Forward to target group
```

### Azure Deployment

#### 1. Azure Container Instances

```bash
# Create resource group
az group create --name webapp-rg --location eastus

# Create container registry
az acr create --resource-group webapp-rg --name webappregistry --sku Basic

# Build and push image
az acr build --registry webappregistry --image web-automation:latest .

# Deploy container instance
az container create \
  --resource-group webapp-rg \
  --name web-automation \
  --image webappregistry.azurecr.io/web-automation:latest \
  --cpu 2 --memory 4 \
  --restart-policy Always \
  --ports 3001
```

#### 2. Azure Database for PostgreSQL

```bash
# Create PostgreSQL server
az postgres server create \
  --resource-group webapp-rg \
  --name webapp-db-server \
  --location eastus \
  --admin-user webapp_admin \
  --admin-password your_secure_password \
  --sku-name GP_Gen5_2

# Create database
az postgres db create \
  --resource-group webapp-rg \
  --server-name webapp-db-server \
  --name web_automation_prod
```

### GCP Deployment

#### 1. Cloud Run Deployment

```bash
# Build and deploy to Cloud Run
gcloud builds submit --tag gcr.io/your-project/web-automation

gcloud run deploy web-automation \
  --image gcr.io/your-project/web-automation \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 2
```

#### 2. Cloud SQL PostgreSQL

```bash
# Create Cloud SQL instance
gcloud sql instances create webapp-db \
  --database-version POSTGRES_14 \
  --tier db-f1-micro \
  --region us-central1

# Create database
gcloud sql databases create web_automation_prod --instance webapp-db
```

---

## Security Configuration

### 1. SSL/TLS Certificate

#### Let's Encrypt (Free)
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d yourdomain.com -d api.yourdomain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

#### Commercial Certificate
```bash
# Install certificate files
sudo mkdir -p /etc/nginx/ssl
sudo cp yourdomain.com.crt /etc/nginx/ssl/
sudo cp yourdomain.com.key /etc/nginx/ssl/
sudo chmod 600 /etc/nginx/ssl/*
```

### 2. Nginx Configuration

**Create `/etc/nginx/sites-available/webapp`:**
```nginx
# Rate limiting
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/m;

server {
    listen 80;
    server_name yourdomain.com api.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com api.yourdomain.com;

    # SSL Configuration
    ssl_certificate /etc/nginx/ssl/yourdomain.com.crt;
    ssl_certificate_key /etc/nginx/ssl/yourdomain.com.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Security Headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";

    # API Routes
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 300s;
    }

    # Health check
    location /health {
        proxy_pass http://localhost:3001;
        access_log off;
    }

    # Static files (if serving frontend)
    location / {
        root /var/www/webapp;
        try_files $uri $uri/ =404;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/webapp /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 3. Firewall Configuration

```bash
# UFW Firewall
sudo ufw enable
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw deny 3001/tcp  # Block direct API access
sudo ufw status
```

### 4. Environment Security

```bash
# Secure environment files
chmod 600 /home/webapp/web-automation-platform/backend/.env.production

# Create backup user
sudo useradd -m -s /bin/bash backup
sudo mkdir -p /home/backup/.ssh
sudo chown backup:backup /home/backup/.ssh
sudo chmod 700 /home/backup/.ssh
```

---

## Monitoring & Logging

### 1. Application Monitoring

#### PM2 Monitoring
```bash
# Install PM2 monitoring
pm2 install pm2-server-monit

# Web monitoring interface
pm2 web
```

#### Custom Health Checks
```bash
# Create health check script
cat > /home/webapp/health-check.sh << 'EOF'
#!/bin/bash
HEALTH=$(curl -s http://localhost:3001/health | jq -r '.status')
if [ "$HEALTH" != "healthy" ]; then
    echo "Application unhealthy: $HEALTH"
    # Send alert (email, Slack, etc.)
    pm2 restart web-automation-api
fi
EOF

chmod +x /home/webapp/health-check.sh

# Add to crontab
crontab -e
# Add: */5 * * * * /home/webapp/health-check.sh
```

### 2. Log Management

#### Centralized Logging
```bash
# Install and configure rsyslog
sudo apt install rsyslog

# Configure log rotation
sudo nano /etc/logrotate.d/webapp
```

```
/home/webapp/web-automation-platform/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 0644 webapp webapp
    postrotate
        pm2 reloadLogs
    endscript
}
```

#### ELK Stack (Optional)
```yaml
# docker-compose.elk.yml
version: '3.8'
services:
  elasticsearch:
    image: elasticsearch:7.17.0
    environment:
      discovery.type: single-node
    ports:
      - "9200:9200"
    volumes:
      - elasticsearch_data:/usr/share/elasticsearch/data

  logstash:
    image: logstash:7.17.0
    volumes:
      - ./logstash.conf:/usr/share/logstash/pipeline/logstash.conf
    ports:
      - "5044:5044"

  kibana:
    image: kibana:7.17.0
    ports:
      - "5601:5601"
    environment:
      ELASTICSEARCH_HOSTS: http://elasticsearch:9200

volumes:
  elasticsearch_data:
```

### 3. Performance Monitoring

#### Server Metrics
```bash
# Install htop, iotop, nethogs
sudo apt install htop iotop nethogs

# Monitor resources
htop           # CPU and memory
iotop          # Disk I/O
nethogs        # Network usage
```

#### Application Metrics
```javascript
// Add to backend/server.js
const promClient = require('prom-client');

// Create metrics
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status']
});

// Middleware to collect metrics
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    httpRequestDuration
      .labels(req.method, req.route?.path || req.path, res.statusCode)
      .observe(duration);
  });
  next();
});

// Metrics endpoint
app.get('/metrics', (req, res) => {
  res.set('Content-Type', promClient.register.contentType);
  res.end(promClient.register.metrics());
});
```

---

## Backup & Recovery

### 1. Database Backup

#### Automated Backup Script
```bash
# Create backup script
cat > /home/webapp/backup-db.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/home/webapp/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="web_automation_prod"

mkdir -p $BACKUP_DIR

# Create database backup
pg_dump -h localhost -U webapp_user -d $DB_NAME > $BACKUP_DIR/db_backup_$DATE.sql

# Compress backup
gzip $BACKUP_DIR/db_backup_$DATE.sql

# Remove backups older than 30 days
find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +30 -delete

echo "Database backup completed: db_backup_$DATE.sql.gz"
EOF

chmod +x /home/webapp/backup-db.sh

# Schedule daily backups
crontab -e
# Add: 0 2 * * * /home/webapp/backup-db.sh
```

#### Cloud Backup
```bash
# Install AWS CLI
pip3 install awscli

# Configure AWS credentials
aws configure

# Sync backups to S3
aws s3 sync /home/webapp/backups s3://your-backup-bucket/database/
```

### 2. Application Backup

```bash
# Create application backup script
cat > /home/webapp/backup-app.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/home/webapp/backups"
DATE=$(date +%Y%m%d_%H%M%S)
APP_DIR="/home/webapp/web-automation-platform"

mkdir -p $BACKUP_DIR

# Backup application code and configs
tar -czf $BACKUP_DIR/app_backup_$DATE.tar.gz \
  --exclude="node_modules" \
  --exclude="logs" \
  --exclude=".git" \
  $APP_DIR

# Upload to cloud storage
aws s3 cp $BACKUP_DIR/app_backup_$DATE.tar.gz s3://your-backup-bucket/application/

echo "Application backup completed: app_backup_$DATE.tar.gz"
EOF

chmod +x /home/webapp/backup-app.sh
```

### 3. Recovery Procedures

#### Database Recovery
```bash
# Stop application
pm2 stop web-automation-api

# Restore database
gunzip -c /home/webapp/backups/db_backup_20250710_020000.sql.gz | psql -h localhost -U webapp_user -d web_automation_prod

# Restart application
pm2 start web-automation-api
```

#### Application Recovery
```bash
# Stop application
pm2 stop web-automation-api

# Backup current installation
mv /home/webapp/web-automation-platform /home/webapp/web-automation-platform.backup

# Extract backup
tar -xzf /home/webapp/backups/app_backup_20250710_020000.tar.gz -C /home/webapp/

# Reinstall dependencies
cd /home/webapp/web-automation-platform/backend && npm install --production

# Restart application
pm2 start web-automation-api
```

---

## Performance Optimization

### 1. Application Optimization

#### PM2 Cluster Mode
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'web-automation-api',
    script: './backend/server.js',
    instances: 'max', // Use all CPU cores
    exec_mode: 'cluster',
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=2048'
  }]
};
```

#### Database Connection Pooling
```javascript
// backend/database/connection.js
const config = {
  max: 20,                    // Maximum connections
  min: 5,                     // Minimum connections
  idleTimeoutMillis: 30000,   // Close idle connections
  connectionTimeoutMillis: 2000,
  acquireTimeoutMillis: 30000
};
```

### 2. Database Optimization

#### PostgreSQL Tuning
```sql
-- /etc/postgresql/14/main/postgresql.conf
shared_buffers = 256MB              # 25% of RAM
effective_cache_size = 1GB          # 75% of RAM
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.7
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
```

#### Database Indexing
```sql
-- Add performance indexes
CREATE INDEX CONCURRENTLY idx_tasks_status_created ON automation_tasks(status, created_at);
CREATE INDEX CONCURRENTLY idx_videos_task_views ON scraped_videos(task_id, view_count);
CREATE INDEX CONCURRENTLY idx_storyboard_video_seq ON storyboard_items(video_id, sequence_number);
```

### 3. Caching Strategy

#### Redis Setup
```bash
# Install Redis
sudo apt install redis-server

# Configure Redis
sudo nano /etc/redis/redis.conf
# Set: maxmemory 512mb
# Set: maxmemory-policy allkeys-lru

sudo systemctl restart redis-server
```

#### Application Caching
```javascript
// Add to backend/server.js
const redis = require('redis');
const client = redis.createClient();

// Cache middleware
const cache = (duration) => {
  return async (req, res, next) => {
    const key = req.originalUrl;
    const cached = await client.get(key);
    
    if (cached) {
      return res.json(JSON.parse(cached));
    }
    
    res.sendResponse = res.json;
    res.json = (body) => {
      client.setex(key, duration, JSON.stringify(body));
      res.sendResponse(body);
    };
    
    next();
  };
};

// Cache task results for 1 hour
app.get('/api/tasks/:id/results', cache(3600), taskController.getTaskResults);
```

---

## Troubleshooting

### Common Issues

#### 1. Application Won't Start
```bash
# Check PM2 status
pm2 status

# Check logs
pm2 logs web-automation-api --lines 50

# Check environment variables
pm2 env 0

# Restart application
pm2 restart web-automation-api

# Clean old logs
pm2 flush

# Check disk space
df -h

# Clean old backups
find /home/webapp/backups -name "*.gz" -mtime +30 -delete
```

#### Monthly Tasks
```bash
# Update Node.js dependencies
cd /home/webapp/web-automation-platform/backend
npm audit fix

# Vacuum database
sudo -u postgres psql -d web_automation_prod -c "VACUUM ANALYZE;"

# Review and rotate logs
sudo logrotate -f /etc/logrotate.d/webapp

# Review security updates
sudo unattended-upgrades --dry-run
```

#### Quarterly Tasks
```bash
# Full system backup
/home/webapp/backup-app.sh
/home/webapp/backup-db.sh

# Security audit
sudo apt install lynis
sudo lynis audit system

# Performance review
pm2 monit
htop
iotop
```

### Update Procedures

#### Application Updates
```bash
# Create deployment script
cat > /home/webapp/deploy.sh << 'EOF'
#!/bin/bash
set -e

echo "Starting deployment..."

# Backup current version
cp -r /home/webapp/web-automation-platform /home/webapp/web-automation-platform.backup

# Pull latest code
cd /home/webapp/web-automation-platform
git pull origin main

# Install dependencies
cd backend && npm install --production
cd ../ai-services && npm install --production
cd ../scraping && npm install --production

# Run database migrations (if any)
NODE_ENV=production node migrations/migrate.js

# Restart application with zero-downtime
pm2 reload web-automation-api

echo "Deployment completed successfully"
EOF

chmod +x /home/webapp/deploy.sh
```

#### Database Migrations
```javascript
// migrations/migrate.js
const DatabaseConnection = require('../backend/database/connection');
const fs = require('fs');
const path = require('path');

async function runMigrations() {
    const db = new DatabaseConnection();
    await db.connect();
    
    try {
        // Create migrations table if not exists
        await db.query(`
            CREATE TABLE IF NOT EXISTS migrations (
                id SERIAL PRIMARY KEY,
                filename VARCHAR(255) NOT NULL,
                executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Get executed migrations
        const executedResult = await db.query('SELECT filename FROM migrations');
        const executed = executedResult.rows.map(row => row.filename);
        
        // Read migration files
        const migrationsDir = path.join(__dirname, 'sql');
        const files = fs.readdirSync(migrationsDir)
            .filter(file => file.endsWith('.sql'))
            .sort();
        
        // Execute pending migrations
        for (const file of files) {
            if (!executed.includes(file)) {
                console.log(`Executing migration: ${file}`);
                const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
                await db.query(sql);
                await db.query('INSERT INTO migrations (filename) VALUES ($1)', [file]);
                console.log(`Migration completed: ${file}`);
            }
        }
        
        console.log('All migrations executed successfully');
    } finally {
        await db.disconnect();
    }
}

runMigrations().catch(console.error);
```

---

## Security Hardening

### System Security

#### SSH Hardening
```bash
# Edit SSH configuration
sudo nano /etc/ssh/sshd_config

# Recommended settings:
Port 2222                          # Change default port
PermitRootLogin no                 # Disable root login
PasswordAuthentication no          # Use key-based auth only
PermitEmptyPasswords no           # Disable empty passwords
MaxAuthTries 3                    # Limit auth attempts
ClientAliveInterval 300           # Session timeout
ClientAliveCountMax 2             # Max alive checks

# Restart SSH
sudo systemctl restart sshd
```

#### Fail2Ban Setup
```bash
# Install Fail2Ban
sudo apt install fail2ban

# Configure for SSH
sudo nano /etc/fail2ban/jail.local
```

```ini
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3

[sshd]
enabled = true
port = 2222
filter = sshd
logpath = /var/log/auth.log

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
logpath = /var/log/nginx/error.log

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
logpath = /var/log/nginx/error.log
```

```bash
# Start Fail2Ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

#### AppArmor/SELinux
```bash
# Install AppArmor (Ubuntu)
sudo apt install apparmor apparmor-utils

# Create profile for Node.js
sudo aa-genprof node

# Enable profile
sudo aa-enforce /etc/apparmor.d/usr.bin.node
```

### Application Security

#### Security Headers
```javascript
// Add to backend/server.js
const helmet = require('helmet');

app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
        },
    },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    }
}));
```

#### Input Validation
```javascript
// Add validation middleware
const { body, validationResult } = require('express-validator');

app.post('/api/tasks/create', [
    body('prompt')
        .isLength({ min: 10, max: 1000 })
        .trim()
        .escape(),
    body('taskType')
        .isIn(['youtube_scrape', 'reddit_scrape'])
        .optional(),
    body('options.maxResults')
        .isInt({ min: 1, max: 50 })
        .optional()
], (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Invalid request data',
                details: errors.array()
            }
        });
    }
    next();
}, taskController.createTask);
```

#### Rate Limiting
```javascript
// Enhanced rate limiting
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const redis = require('redis');

const redisClient = redis.createClient();

const createTaskLimiter = rateLimit({
    store: new RedisStore({
        client: redisClient,
        prefix: 'rl:create_task:'
    }),
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit to 10 requests per window
    message: {
        success: false,
        error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many task creation requests. Try again later.'
        }
    },
    standardHeaders: true,
    legacyHeaders: false
});

app.use('/api/tasks/create', createTaskLimiter);
```

---

## Scaling Strategies

### Horizontal Scaling

#### Load Balancer Configuration
```nginx
# /etc/nginx/conf.d/upstream.conf
upstream api_backend {
    least_conn;
    server 10.0.1.10:3001 weight=1 max_fails=3 fail_timeout=30s;
    server 10.0.1.11:3001 weight=1 max_fails=3 fail_timeout=30s;
    server 10.0.1.12:3001 weight=1 max_fails=3 fail_timeout=30s;
    
    # Health check
    keepalive 32;
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;
    
    location /api/ {
        proxy_pass http://api_backend;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Load balancing with session affinity
        ip_hash;
    }
}
```

#### Docker Swarm Setup
```bash
# Initialize swarm
docker swarm init

# Create overlay network
docker network create --driver overlay --attachable webapp-network

# Deploy stack
docker stack deploy -c docker-compose.swarm.yml webapp
```

```yaml
# docker-compose.swarm.yml
version: '3.8'

services:
  app:
    image: webapp:latest
    deploy:
      replicas: 3
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
      placement:
        constraints:
          - node.role == worker
    networks:
      - webapp-network
    environment:
      NODE_ENV: production
    secrets:
      - webapp_env

  nginx:
    image: nginx:alpine
    deploy:
      replicas: 2
      placement:
        constraints:
          - node.role == manager
    ports:
      - "80:80"
      - "443:443"
    networks:
      - webapp-network
    configs:
      - source: nginx_config
        target: /etc/nginx/nginx.conf

networks:
  webapp-network:
    external: true

secrets:
  webapp_env:
    external: true

configs:
  nginx_config:
    external: true
```

### Kubernetes Deployment

#### Deployment Manifest
```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: webapp-api
  labels:
    app: webapp-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: webapp-api
  template:
    metadata:
      labels:
        app: webapp-api
    spec:
      containers:
      - name: webapp-api
        image: webapp:latest
        ports:
        - containerPort: 3001
        env:
        - name: NODE_ENV
          value: "production"
        - name: DB_HOST
          value: "postgres-service"
        envFrom:
        - secretRef:
            name: webapp-secrets
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: webapp-api-service
spec:
  selector:
    app: webapp-api
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3001
  type: ClusterIP
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: webapp-ingress
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  tls:
  - hosts:
    - api.yourdomain.com
    secretName: webapp-tls
  rules:
  - host: api.yourdomain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: webapp-api-service
            port:
              number: 80
```

#### HPA Configuration
```yaml
# k8s/hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: webapp-api-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: webapp-api
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

### Database Scaling

#### Read Replicas
```bash
# Create read replica
sudo -u postgres pg_basebackup -h primary-db -D /var/lib/postgresql/14/replica -U replication -v -P -W

# Configure replica
echo "standby_mode = 'on'" >> /var/lib/postgresql/14/replica/recovery.conf
echo "primary_conninfo = 'host=primary-db port=5432 user=replication'" >> /var/lib/postgresql/14/replica/recovery.conf
```

#### Connection Pooling with PgBouncer
```ini
# /etc/pgbouncer/pgbouncer.ini
[databases]
web_automation_prod = host=localhost port=5432 dbname=web_automation_prod

[pgbouncer]
listen_port = 6432
listen_addr = 127.0.0.1
auth_type = md5
auth_file = /etc/pgbouncer/userlist.txt
pool_mode = transaction
max_client_conn = 100
default_pool_size = 25
```

---

## Disaster Recovery

### Backup Strategy

#### Multi-Tier Backup
```bash
# Create comprehensive backup script
cat > /home/webapp/disaster-backup.sh << 'EOF'
#!/bin/bash
set -e

BACKUP_DIR="/home/webapp/disaster-backups"
DATE=$(date +%Y%m%d_%H%M%S)
S3_BUCKET="your-disaster-recovery-bucket"

mkdir -p $BACKUP_DIR

echo "Starting disaster recovery backup..."

# 1. Database backup
pg_dump -h localhost -U webapp_user -d web_automation_prod | gzip > $BACKUP_DIR/db_disaster_$DATE.sql.gz

# 2. Application code backup
tar -czf $BACKUP_DIR/app_disaster_$DATE.tar.gz \
  --exclude="node_modules" \
  --exclude="logs" \
  --exclude=".git" \
  /home/webapp/web-automation-platform

# 3. Configuration backup
tar -czf $BACKUP_DIR/config_disaster_$DATE.tar.gz \
  /etc/nginx \
  /etc/ssl \
  /home/webapp/.pm2 \
  /home/webapp/web-automation-platform/backend/.env.production

# 4. Upload to multiple locations
aws s3 cp $BACKUP_DIR/ s3://$S3_BUCKET/backups/ --recursive
rsync -avz $BACKUP_DIR/ backup-server:/backups/webapp/

echo "Disaster recovery backup completed: $DATE"
EOF

chmod +x /home/webapp/disaster-backup.sh

# Schedule weekly disaster backups
crontab -e
# Add: 0 1 * * 0 /home/webapp/disaster-backup.sh
```

### Recovery Procedures

#### Complete System Recovery
```bash
# Create recovery script
cat > /home/webapp/disaster-recovery.sh << 'EOF'
#!/bin/bash
set -e

BACKUP_DATE=$1
S3_BUCKET="your-disaster-recovery-bucket"

if [ -z "$BACKUP_DATE" ]; then
    echo "Usage: $0 <backup_date> (format: YYYYMMDD_HHMMSS)"
    exit 1
fi

echo "Starting disaster recovery for backup: $BACKUP_DATE"

# 1. Download backups
aws s3 cp s3://$S3_BUCKET/backups/db_disaster_$BACKUP_DATE.sql.gz ./
aws s3 cp s3://$S3_BUCKET/backups/app_disaster_$BACKUP_DATE.tar.gz ./
aws s3 cp s3://$S3_BUCKET/backups/config_disaster_$BACKUP_DATE.tar.gz ./

# 2. Restore database
sudo systemctl stop postgresql
sudo -u postgres dropdb web_automation_prod
sudo -u postgres createdb web_automation_prod
gunzip -c db_disaster_$BACKUP_DATE.sql.gz | sudo -u postgres psql web_automation_prod
sudo systemctl start postgresql

# 3. Restore application
pm2 stop all
rm -rf /home/webapp/web-automation-platform
tar -xzf app_disaster_$BACKUP_DATE.tar.gz -C /

# 4. Restore configuration
sudo tar -xzf config_disaster_$BACKUP_DATE.tar.gz -C /

# 5. Reinstall dependencies
cd /home/webapp/web-automation-platform/backend && npm install --production

# 6. Restart services
sudo systemctl restart nginx
pm2 start ecosystem.config.js --env production

echo "Disaster recovery completed successfully"
EOF

chmod +x /home/webapp/disaster-recovery.sh
```

#### RTO/RPO Targets
- **Recovery Time Objective (RTO)**: 4 hours
- **Recovery Point Objective (RPO)**: 24 hours
- **Maximum Tolerable Downtime**: 8 hours

---

## Compliance & Auditing

### Security Compliance

#### SOC 2 Compliance Checklist
- [ ] Access controls implemented
- [ ] Encryption at rest and in transit
- [ ] Regular security assessments
- [ ] Incident response procedures
- [ ] Change management processes
- [ ] Vendor risk assessments
- [ ] Data backup and recovery
- [ ] Monitoring and alerting

#### GDPR Compliance
```javascript
// Add data protection middleware
const dataProtection = {
    anonymizeUser: async (userId) => {
        await db.query('UPDATE users SET email = $1, username = $2 WHERE id = $3', 
            [`anonymous_${userId}@deleted.local`, `deleted_user_${userId}`, userId]);
    },
    
    exportUserData: async (userId) => {
        const userData = await db.query(`
            SELECT u.*, t.prompt, t.created_at as task_created
            FROM users u 
            LEFT JOIN automation_tasks t ON u.id = t.user_id 
            WHERE u.id = $1
        `, [userId]);
        return userData.rows;
    },
    
    deleteUserData: async (userId) => {
        await db.query('DELETE FROM users WHERE id = $1', [userId]);
        // Cascade delete will handle related data
    }
};
```

### Audit Logging

#### Comprehensive Audit Trail
```javascript
// Add audit logging middleware
const auditLogger = (action) => {
    return (req, res, next) => {
        const audit = {
            timestamp: new Date().toISOString(),
            action: action,
            user_id: req.user?.id || 'anonymous',
            ip_address: req.ip,
            user_agent: req.get('User-Agent'),
            request_id: req.id,
            resource: req.originalUrl,
            method: req.method,
            params: req.params,
            body: action.includes('sensitive') ? '[REDACTED]' : req.body
        };
        
        // Log to file and database
        console.log('AUDIT:', JSON.stringify(audit));
        db.query('INSERT INTO audit_logs (data) VALUES ($1)', [JSON.stringify(audit)]);
        
        next();
    };
};

// Apply to sensitive routes
app.use('/api/tasks/create', auditLogger('task_create'));
app.use('/api/tasks/:id', auditLogger('task_access'));
```

---

## Contact & Support

### Emergency Contacts
- **Primary Admin**: admin@yourdomain.com
- **Secondary Admin**: backup-admin@yourdomain.com
- **Emergency Phone**: +1-XXX-XXX-XXXX

### Escalation Procedures
1. **Level 1**: Application restart, basic troubleshooting
2. **Level 2**: Database issues, performance problems
3. **Level 3**: Security incidents, data corruption
4. **Level 4**: Complete system failure, disaster recovery

### Documentation Updates
This deployment guide should be reviewed and updated:
- Monthly for minor updates
- Quarterly for major revisions
- After each significant deployment
- Following any security incidents

---

*Last updated: July 2025*  
*Deployment Guide Version: 1.0.0*  
*Platform Version: 1.0.0*
```

#### 2. Database Connection Issues
```bash
# Test database connection
psql -h localhost -U webapp_user -d web_automation_prod

# Check PostgreSQL status
sudo systemctl status postgresql

# Check connection limits
sudo -u postgres psql -c "SELECT count(*) FROM pg_stat_activity;"
```

#### 3. High Memory Usage
```bash
# Check memory usage
free -h
ps aux --sort=-%mem | head

# Check Node.js heap usage
pm2 monit

# Restart if needed
pm2 restart web-automation-api
```

#### 4. SSL Certificate Issues
```bash
# Check certificate validity
openssl x509 -in /etc/nginx/ssl/yourdomain.com.crt -text -noout

# Test SSL configuration
nginx -t

# Renew Let's Encrypt certificate
sudo certbot renew --dry-run
```

### Emergency Procedures

#### Service Recovery
```bash
#!/bin/bash
# emergency-restart.sh

echo "Starting emergency recovery..."

# Stop all services
pm2 stop all
sudo systemctl stop nginx

# Clear caches
pm2 flush
redis-cli FLUSHALL

# Restart database
sudo systemctl restart postgresql

# Start services
sudo systemctl start nginx
pm2 start ecosystem.config.js --env production

echo "Emergency recovery completed"
```

#### Database Recovery Mode
```bash
# Start PostgreSQL in single-user mode
sudo -u postgres postgres --single -D /var/lib/postgresql/14/main web_automation_prod

# Check for corruption
REINDEX DATABASE web_automation_prod;
VACUUM FULL;
```

### Performance Debugging

#### Node.js Profiling
```bash
# Start application with profiling
node --prof backend/server.js

# Generate profile report
node --prof-process isolate-*.log > profile.txt
```

#### Database Query Analysis
```sql
-- Enable query logging
ALTER SYSTEM SET log_statement = 'all';
ALTER SYSTEM SET log_min_duration_statement = 1000;
SELECT pg_reload_conf();

-- Analyze slow queries
SELECT query, calls, total_time, mean_time 
FROM pg_stat_statements 
ORDER BY total_time DESC 
LIMIT 10;
```

---

## Maintenance

### Regular Maintenance Tasks

#### Weekly Tasks
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Restart application
pm2 restart web-automation-api
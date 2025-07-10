// File Path: /scraping/youtube-scraper.js
// YouTube video scraping module using Puppeteer
// REF-032: YouTube scraper with compatibility fixes

const puppeteer = require('puppeteer');

class YouTubeScraper {
    constructor() {
        this.browser = null;
        this.page = null;
    }

    async initialize() {
        try {
            this.browser = await puppeteer.launch({
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--disable-gpu'
                ]
            });
            
            this.page = await this.browser.newPage();
            
            // Set user agent to avoid detection
            await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
            
            console.log('✓ YouTube scraper initialized');
            return true;
        } catch (error) {
            console.error('✗ YouTube scraper initialization failed:', error.message);
            return false;
        }
    }

    async searchVideos(query, dateFilter = 'month', maxResults = 20) {
        try {
            if (!this.page) {
                throw new Error('Scraper not initialized');
            }

            // Build search URL with filters
            const searchUrl = this.buildSearchUrl(query, dateFilter);
            console.log(`Searching YouTube for: "${query}"`);
            
            await this.page.goto(searchUrl, { waitUntil: 'networkidle0' });
            
            // Wait for search results to load
            await this.page.waitForSelector('#contents', { timeout: 10000 });
            
            // Scroll to load more videos
            await this.scrollToLoadVideos(maxResults);
            
            // Extract video data
            const videos = await this.extractVideoData(maxResults);
            
            console.log(`✓ Found ${videos.length} videos`);
            return videos;
            
        } catch (error) {
            console.error('✗ YouTube search failed:', error.message);
            throw error;
        }
    }

    buildSearchUrl(query, dateFilter) {
        const baseUrl = 'https://www.youtube.com/results';
        const encodedQuery = encodeURIComponent(query);
        
        // Date filter mapping
        const filters = {
            'hour': 'EgIIAQ%253D%253D',
            'day': 'EgIIAg%253D%253D', 
            'week': 'EgIIAw%253D%253D',
            'month': 'EgIIBA%253D%253D',
            'year': 'EgIIBQ%253D%253D'
        };
        
        const filterParam = filters[dateFilter] || filters['month'];
        
        return `${baseUrl}?search_query=${encodedQuery}&sp=${filterParam}`;
    }

    async scrollToLoadVideos(targetCount) {
        let loadedCount = 0;
        let scrollAttempts = 0;
        const maxScrolls = 10;
        
        while (loadedCount < targetCount && scrollAttempts < maxScrolls) {
            await this.page.evaluate(() => {
                window.scrollTo(0, document.body.scrollHeight);
            });
            
            // Use delay instead of waitForTimeout for compatibility
            await this.delay(2000);
            
            const currentCount = await this.page.$$eval('ytd-video-renderer', els => els.length);
            
            if (currentCount === loadedCount) {
                scrollAttempts++;
            } else {
                loadedCount = currentCount;
                scrollAttempts = 0;
            }
        }
    }

    // Compatibility method for older Puppeteer versions
    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async extractVideoData(maxResults) {
        return await this.page.evaluate((maxResults) => {
            const videoElements = document.querySelectorAll('ytd-video-renderer');
            const videos = [];
            
            for (let i = 0; i < Math.min(videoElements.length, maxResults); i++) {
                const element = videoElements[i];
                
                try {
                    // Extract video ID from URL
                    const linkElement = element.querySelector('a#video-title');
                    const videoUrl = linkElement?.href || '';
                    const videoId = videoUrl.match(/watch\?v=([^&]+)/)?.[1] || '';
                    
                    // Extract basic info
                    const title = linkElement?.textContent?.trim() || '';
                    const thumbnail = element.querySelector('img')?.src || '';
                    
                    // Extract channel info
                    const channelElement = element.querySelector('a.yt-simple-endpoint.style-scope.yt-formatted-string');
                    const channelName = channelElement?.textContent?.trim() || '';
                    const channelUrl = channelElement?.href || '';
                    const channelId = channelUrl.match(/channel\/([^\/]+)/)?.[1] || '';
                    
                    // Extract metadata
                    const metadataElements = element.querySelectorAll('#metadata-line span');
                    const viewCount = metadataElements[0]?.textContent?.trim() || '';
                    const uploadDate = metadataElements[1]?.textContent?.trim() || '';
                    
                    // Extract duration
                    const durationElement = element.querySelector('span.style-scope.ytd-thumbnail-overlay-time-status-renderer');
                    const duration = durationElement?.textContent?.trim() || '';
                    
                    // Extract description snippet
                    const descriptionElement = element.querySelector('#description-text');
                    const description = descriptionElement?.textContent?.trim() || '';
                    
                    if (videoId && title) {
                        videos.push({
                            videoId,
                            title,
                            channelName,
                            channelId,
                            description,
                            viewCount,
                            uploadDate,
                            duration,
                            thumbnailUrl: thumbnail,
                            videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
                            scrapedAt: new Date().toISOString()
                        });
                    }
                } catch (error) {
                    console.error('Error extracting video data:', error);
                }
            }
            
            return videos;
        }, maxResults);
    }

    async getVideoDetails(videoId) {
        try {
            const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
            await this.page.goto(videoUrl, { waitUntil: 'networkidle0' });
            
            // Extract detailed video information
            const details = await this.page.evaluate(() => {
                const title = document.querySelector('h1.ytd-video-primary-info-renderer')?.textContent?.trim() || '';
                const description = document.querySelector('#description .content')?.textContent?.trim() || '';
                const views = document.querySelector('#count .view-count')?.textContent?.trim() || '';
                const likes = document.querySelector('#top-level-buttons-computed #button[title*="like"]')?.textContent?.trim() || '';
                
                return {
                    title,
                    description,
                    viewCount: views,
                    likeCount: likes
                };
            });
            
            return details;
        } catch (error) {
            console.error(`Error getting video details for ${videoId}:`, error.message);
            return null;
        }
    }

    async close() {
        if (this.browser) {
            await this.browser.close();
            console.log('✓ YouTube scraper closed');
        }
    }

    // Test method
    async test() {
        try {
            console.log('Testing YouTube scraper...');
            
            await this.initialize();
            const results = await this.searchVideos('test video', 'week', 5);
            
            console.log('✓ Test results:');
            results.forEach((video, index) => {
                console.log(`${index + 1}. ${video.title} - ${video.channelName}`);
            });
            
            await this.close();
            return results;
            
        } catch (error) {
            console.error('✗ YouTube scraper test failed:', error.message);
            await this.close();
            throw error;
        }
    }
}

module.exports = YouTubeScraper;
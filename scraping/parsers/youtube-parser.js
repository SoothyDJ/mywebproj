// File Path: /scraping/parsers/youtube-parser.js
// YouTube-specific parsing utilities and data extraction functions
// REF-072: YouTube parser extracted from scraper for modular design

class YouTubeParser {
    constructor() {
        this.selectors = this.getSelectors();
        this.filters = this.getDateFilters();
    }

    // Get YouTube-specific CSS selectors
    getSelectors() {
        return {
            // Search results page
            searchResults: {
                container: '#contents',
                videoRenderer: 'ytd-video-renderer',
                videoTitle: 'a#video-title',
                thumbnail: 'img',
                channel: 'a.yt-simple-endpoint.style-scope.yt-formatted-string',
                metadataLine: '#metadata-line span',
                duration: 'span.style-scope.ytd-thumbnail-overlay-time-status-renderer',
                description: '#description-text'
            },
            
            // Video details page
            videoDetails: {
                title: 'h1.ytd-video-primary-info-renderer',
                description: '#description .content',
                viewCount: '#count .view-count',
                likeCount: '#top-level-buttons-computed #button[title*="like"]',
                publishDate: '#info-strings yt-formatted-string',
                channelName: '#upload-info #channel-name a',
                subscriberCount: '#owner-sub-count'
            },
            
            // Channel page
            channelDetails: {
                channelName: '#channel-name',
                subscriberCount: '#subscriber-count',
                videoCount: '#videos-count',
                channelDescription: '#description'
            }
        };
    }

    // Get YouTube date filter parameters
    getDateFilters() {
        return {
            'hour': 'EgIIAQ%253D%253D',
            'day': 'EgIIAg%253D%253D',
            'week': 'EgIIAw%253D%253D',
            'month': 'EgIIBA%253D%253D',
            'year': 'EgIIBQ%253D%253D'
        };
    }

    // Build YouTube search URL with filters
    buildSearchUrl(query, dateFilter = 'month', additionalFilters = {}) {
        const baseUrl = 'https://www.youtube.com/results';
        const encodedQuery = encodeURIComponent(query);
        
        let url = `${baseUrl}?search_query=${encodedQuery}`;
        
        // Add date filter
        const filterParam = this.filters[dateFilter] || this.filters['month'];
        url += `&sp=${filterParam}`;
        
        // Add additional filters (duration, type, etc.)
        if (additionalFilters.duration) {
            url += `&duration=${additionalFilters.duration}`;
        }
        
        if (additionalFilters.type) {
            url += `&type=${additionalFilters.type}`;
        }
        
        if (additionalFilters.sortBy) {
            url += `&sort=${additionalFilters.sortBy}`;
        }
        
        return url;
    }

    // Parse video data from search results page
    parseSearchResults(maxResults = 20) {
        // This function runs in browser context
        return (maxResults) => {
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
                    
                    // Extract additional metadata
                    const verified = element.querySelector('.badge-style-type-verified') !== null;
                    const live = element.querySelector('.badge-style-type-live-now') !== null;
                    const shorts = element.querySelector('.badge-style-type-shorts') !== null;
                    
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
                            channelUrl: channelUrl,
                            isVerified: verified,
                            isLive: live,
                            isShorts: shorts,
                            scrapedAt: new Date().toISOString()
                        });
                    }
                } catch (error) {
                    console.error('Error extracting video data:', error);
                }
            }
            
            return videos;
        };
    }

    // Parse detailed video information from video page
    parseVideoDetails() {
        // This function runs in browser context
        return () => {
            try {
                const title = document.querySelector('h1.ytd-video-primary-info-renderer')?.textContent?.trim() || '';
                const description = document.querySelector('#description .content')?.textContent?.trim() || '';
                const viewCount = document.querySelector('#count .view-count')?.textContent?.trim() || '';
                const likeCount = document.querySelector('#top-level-buttons-computed #button[title*="like"]')?.textContent?.trim() || '';
                
                // Extract publish date
                const publishElement = document.querySelector('#info-strings yt-formatted-string');
                const publishDate = publishElement?.textContent?.trim() || '';
                
                // Extract channel information
                const channelNameElement = document.querySelector('#upload-info #channel-name a');
                const channelName = channelNameElement?.textContent?.trim() || '';
                const channelUrl = channelNameElement?.href || '';
                const channelId = channelUrl.match(/channel\/([^\/]+)/)?.[1] || '';
                
                // Extract subscriber count
                const subscriberElement = document.querySelector('#owner-sub-count');
                const subscriberCount = subscriberElement?.textContent?.trim() || '';
                
                // Extract tags from meta tags
                const tagElements = document.querySelectorAll('meta[property="og:video:tag"]');
                const tags = Array.from(tagElements).map(tag => tag.getAttribute('content'));
                
                // Extract category
                const categoryElement = document.querySelector('meta[itemprop="genre"]');
                const category = categoryElement?.getAttribute('content') || '';
                
                // Extract duration
                const durationElement = document.querySelector('meta[itemprop="duration"]');
                const duration = durationElement?.getAttribute('content') || '';
                
                return {
                    title,
                    description,
                    viewCount,
                    likeCount,
                    publishDate,
                    channelName,
                    channelId,
                    channelUrl,
                    subscriberCount,
                    tags,
                    category,
                    duration,
                    extractedAt: new Date().toISOString()
                };
            } catch (error) {
                console.error('Error extracting video details:', error);
                return null;
            }
        };
    }

    // Parse channel information
    parseChannelDetails() {
        // This function runs in browser context
        return () => {
            try {
                const channelName = document.querySelector('#channel-name')?.textContent?.trim() || '';
                const subscriberCount = document.querySelector('#subscriber-count')?.textContent?.trim() || '';
                const videoCount = document.querySelector('#videos-count')?.textContent?.trim() || '';
                const description = document.querySelector('#description')?.textContent?.trim() || '';
                
                // Extract channel avatar
                const avatarElement = document.querySelector('#avatar img');
                const avatarUrl = avatarElement?.src || '';
                
                // Extract verification status
                const verified = document.querySelector('.badge-style-type-verified') !== null;
                
                // Extract social links
                const socialLinks = Array.from(document.querySelectorAll('.ytd-channel-header-renderer a'))
                    .map(link => ({
                        url: link.href,
                        text: link.textContent?.trim()
                    }))
                    .filter(link => link.url && link.url !== '#');
                
                return {
                    channelName,
                    subscriberCount,
                    videoCount,
                    description,
                    avatarUrl,
                    isVerified: verified,
                    socialLinks,
                    extractedAt: new Date().toISOString()
                };
            } catch (error) {
                console.error('Error extracting channel details:', error);
                return null;
            }
        };
    }

    // Parse video comments (limited to visible comments)
    parseVideoComments(maxComments = 20) {
        // This function runs in browser context
        return (maxComments) => {
            try {
                const commentElements = document.querySelectorAll('ytd-comment-thread-renderer');
                const comments = [];
                
                for (let i = 0; i < Math.min(commentElements.length, maxComments); i++) {
                    const element = commentElements[i];
                    
                    try {
                        const authorElement = element.querySelector('#author-text');
                        const author = authorElement?.textContent?.trim() || '';
                        
                        const contentElement = element.querySelector('#content-text');
                        const content = contentElement?.textContent?.trim() || '';
                        
                        const timeElement = element.querySelector('.published-time-text');
                        const publishedTime = timeElement?.textContent?.trim() || '';
                        
                        const likeElement = element.querySelector('#vote-count-middle');
                        const likeCount = likeElement?.textContent?.trim() || '0';
                        
                        const heartedElement = element.querySelector('.creator-heart');
                        const isHearted = heartedElement !== null;
                        
                        const pinnedElement = element.querySelector('.pinned-comment-badge');
                        const isPinned = pinnedElement !== null;
                        
                        if (author && content) {
                            comments.push({
                                author,
                                content,
                                publishedTime,
                                likeCount,
                                isHearted,
                                isPinned
                            });
                        }
                    } catch (error) {
                        console.error('Error extracting comment:', error);
                    }
                }
                
                return comments;
            } catch (error) {
                console.error('Error extracting comments:', error);
                return [];
            }
        };
    }

    // Utility functions for data processing
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
        
        // Handle ISO 8601 duration format (PT15M33S)
        if (durationStr.startsWith('PT')) {
            const match = durationStr.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
            if (match) {
                const hours = parseInt(match[1]) || 0;
                const minutes = parseInt(match[2]) || 0;
                const seconds = parseInt(match[3]) || 0;
                return hours * 3600 + minutes * 60 + seconds;
            }
        }
        
        // Handle standard format (15:33 or 1:15:33)
        const parts = durationStr.split(':').map(p => parseInt(p));
        if (parts.length === 2) {
            return parts[0] * 60 + parts[1]; // minutes:seconds
        } else if (parts.length === 3) {
            return parts[0] * 3600 + parts[1] * 60 + parts[2]; // hours:minutes:seconds
        }
        
        return 0;
    }

    parseUploadDate(dateStr) {
        if (!dateStr) return null;
        
        // Handle relative dates (e.g., "2 weeks ago", "1 month ago")
        const now = new Date();
        
        if (dateStr.includes('hour')) {
            const hours = parseInt(dateStr.match(/(\d+)/)?.[1] || '1');
            return new Date(now.getTime() - hours * 60 * 60 * 1000);
        }
        
        if (dateStr.includes('day')) {
            const days = parseInt(dateStr.match(/(\d+)/)?.[1] || '1');
            return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
        }
        
        if (dateStr.includes('week')) {
            const weeks = parseInt(dateStr.match(/(\d+)/)?.[1] || '1');
            return new Date(now.getTime() - weeks * 7 * 24 * 60 * 60 * 1000);
        }
        
        if (dateStr.includes('month')) {
            const months = parseInt(dateStr.match(/(\d+)/)?.[1] || '1');
            return new Date(now.getFullYear(), now.getMonth() - months, now.getDate());
        }
        
        if (dateStr.includes('year')) {
            const years = parseInt(dateStr.match(/(\d+)/)?.[1] || '1');
            return new Date(now.getFullYear() - years, now.getMonth(), now.getDate());
        }
        
        // Try to parse as regular date
        try {
            return new Date(dateStr);
        } catch (error) {
            return null;
        }
    }

    // Clean and normalize extracted data
    cleanVideoData(rawData) {
        return {
            ...rawData,
            viewCount: this.parseViewCount(rawData.viewCount),
            duration: this.parseDuration(rawData.duration),
            uploadDate: this.parseUploadDate(rawData.uploadDate),
            title: rawData.title?.replace(/^\s+|\s+$/g, ''),
            description: rawData.description?.replace(/^\s+|\s+$/g, ''),
            channelName: rawData.channelName?.replace(/^\s+|\s+$/g, '')
        };
    }

    // Validate extracted video data
    validateVideoData(videoData) {
        const required = ['videoId', 'title', 'channelName'];
        const missing = required.filter(field => !videoData[field]);
        
        if (missing.length > 0) {
            console.warn(`Missing required fields: ${missing.join(', ')}`);
            return false;
        }
        
        if (!videoData.videoId.match(/^[a-zA-Z0-9_-]{11}$/)) {
            console.warn(`Invalid video ID format: ${videoData.videoId}`);
            return false;
        }
        
        return true;
    }

    // Get video URL from video ID
    getVideoUrl(videoId) {
        return `https://www.youtube.com/watch?v=${videoId}`;
    }

    // Get channel URL from channel ID or name
    getChannelUrl(channelIdentifier) {
        if (channelIdentifier.startsWith('UC') && channelIdentifier.length === 24) {
            return `https://www.youtube.com/channel/${channelIdentifier}`;
        } else {
            return `https://www.youtube.com/@${channelIdentifier}`;
        }
    }

    // Test parser functions
    test() {
        console.log('Testing YouTube Parser...');
        
        // Test URL building
        const searchUrl = this.buildSearchUrl('test query', 'week');
        console.log('✓ Search URL:', searchUrl);
        
        // Test utility functions
        console.log('✓ View count parsing:', this.parseViewCount('2.3M views'));
        console.log('✓ Duration parsing:', this.parseDuration('15:30'));
        console.log('✓ Upload date parsing:', this.parseUploadDate('2 weeks ago'));
        
        // Test validation
        const validData = { videoId: 'dQw4w9WgXcQ', title: 'Test Video', channelName: 'Test Channel' };
        console.log('✓ Data validation:', this.validateVideoData(validData));
        
        console.log('✓ YouTube Parser test completed');
        return true;
    }
}

module.exports = YouTubeParser;
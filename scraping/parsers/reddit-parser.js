// File Path: /scraping/parsers/reddit-parser.js
// Reddit data parser and formatter for analysis pipeline
// REF-089: Reddit parser for standardizing Reddit API data

class RedditParser {
    constructor() {
        this.supportedContentTypes = ['text', 'image', 'video', 'link'];
    }

    // Parse Reddit posts into standardized format for AI analysis
    parsePostsForAnalysis(redditPosts) {
        try {
            const parsedPosts = redditPosts.map(post => this.parsePostForAnalysis(post));
            
            console.log(`✓ Parsed ${parsedPosts.length} Reddit posts for analysis`);
            return parsedPosts;

        } catch (error) {
            console.error('✗ Reddit posts parsing failed:', error.message);
            throw error;
        }
    }

    parsePostForAnalysis(post) {
        return {
            // Standardized fields for AI analysis (matching video format)
            videoId: post.postId, // Using postId as videoId for consistency
            title: this.cleanTitle(post.title),
            channelName: `r/${post.subreddit}`, // Subreddit as "channel"
            channelId: post.subreddit,
            description: this.formatDescription(post),
            viewCount: this.formatScore(post.score),
            uploadDate: this.formatDate(post.timestamp),
            duration: this.estimateReadingTime(post.content),
            thumbnailUrl: this.extractThumbnail(post),
            videoUrl: post.postUrl, // Reddit post URL
            tags: this.extractTags(post),
            category: this.categorizePost(post),
            scrapedAt: post.scrapedAt,
            
            // Reddit-specific metadata
            redditData: {
                postId: post.postId,
                author: post.author,
                subreddit: post.subreddit,
                score: post.score,
                commentCount: post.commentCount,
                postType: post.postType,
                upvoteRatio: post.upvoteRatio,
                awardsCount: post.awardsCount,
                isStickied: post.isStickied,
                isNsfw: post.isNsfw,
                flair: post.flair,
                externalUrl: post.externalUrl,
                hasImage: post.hasImage,
                hasVideo: post.hasVideo
            }
        };
    }

    // Clean and normalize post titles
    cleanTitle(title) {
        if (!title) return 'Untitled Post';
        
        return title
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#x27;/g, "'")
            .trim();
    }

    // Format description combining content and metadata
    formatDescription(post) {
        let description = '';
        
        if (post.content && post.content.trim()) {
            description += post.content.substring(0, 500);
            if (post.content.length > 500) {
                description += '...';
            }
        }
        
        // Add metadata
        const metadata = [];
        if (post.flair) metadata.push(`Flair: ${post.flair}`);
        if (post.postType !== 'text') metadata.push(`Type: ${post.postType}`);
        if (post.isNsfw) metadata.push('NSFW');
        if (post.isStickied) metadata.push('Stickied');
        
        if (metadata.length > 0) {
            description += `\n\n[${metadata.join(', ')}]`;
        }
        
        return description || 'No description available';
    }

    // Format score as view count equivalent
    formatScore(score) {
        if (!score || score === 0) return '0 points';
        if (score >= 1000000) return `${(score / 1000000).toFixed(1)}M points`;
        if (score >= 1000) return `${(score / 1000).toFixed(1)}K points`;
        return `${score} points`;
    }

    // Format timestamp for consistency
    formatDate(timestamp) {
        try {
            const date = new Date(timestamp);
            const now = new Date();
            const diffMs = now - date;
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
            const diffMinutes = Math.floor(diffMs / (1000 * 60));
            
            if (diffDays > 7) {
                return date.toLocaleDateString();
            } else if (diffDays > 0) {
                return `${diffDays} days ago`;
            } else if (diffHours > 0) {
                return `${diffHours} hours ago`;
            } else if (diffMinutes > 0) {
                return `${diffMinutes} minutes ago`;
            } else {
                return 'just now';
            }
        } catch (error) {
            return 'unknown date';
        }
    }

    // Estimate reading time based on content length
    estimateReadingTime(content) {
        if (!content) return '1:00';
        
        const wordsPerMinute = 200;
        const wordCount = content.split(/\s+/).length;
        const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / wordsPerMinute));
        
        if (readingTimeMinutes >= 60) {
            const hours = Math.floor(readingTimeMinutes / 60);
            const minutes = readingTimeMinutes % 60;
            return `${hours}:${minutes.toString().padStart(2, '0')}:00`;
        } else {
            return `${readingTimeMinutes}:00`;
        }
    }

    // Extract thumbnail URL if available
    extractThumbnail(post) {
        if (post.hasImage && post.externalUrl) {
            return post.externalUrl;
        }
        
        // Default Reddit thumbnail
        return `https://www.redditstatic.com/subreddit-icon/${post.subreddit}.png`;
    }

    // Extract tags from post data
    extractTags(post) {
        const tags = [];
        
        // Add subreddit as tag
        tags.push(post.subreddit);
        
        // Add post type as tag
        tags.push(post.postType);
        
        // Add flair as tag if available
        if (post.flair) {
            tags.push(post.flair.toLowerCase().replace(/\s+/g, '_'));
        }
        
        // Add content-based tags
        if (post.isNsfw) tags.push('nsfw');
        if (post.isStickied) tags.push('stickied');
        if (post.awardsCount > 0) tags.push('awarded');
        if (post.score > 1000) tags.push('popular');
        if (post.commentCount > 50) tags.push('highly_discussed');
        
        return tags;
    }

    // Categorize post based on subreddit and content
    categorizePost(post) {
        const subreddit = post.subreddit.toLowerCase();
        
        // Content categories based on subreddit patterns
        if (subreddit.includes('paranormal') || subreddit.includes('ghost') || subreddit.includes('horror')) {
            return 'paranormal';
        }
        if (subreddit.includes('story') || subreddit.includes('tales')) {
            return 'storytelling';
        }
        if (subreddit.includes('news') || subreddit.includes('world')) {
            return 'news';
        }
        if (subreddit.includes('funny') || subreddit.includes('meme')) {
            return 'entertainment';
        }
        if (subreddit.includes('ask') || subreddit.includes('question')) {
            return 'discussion';
        }
        if (subreddit.includes('science') || subreddit.includes('tech')) {
            return 'educational';
        }
        
        // Default based on post type
        switch (post.postType) {
            case 'image': return 'visual';
            case 'video': return 'video';
            case 'link': return 'external';
            default: return 'discussion';
        }
    }

    // Parse Reddit comments for additional context
    parseComments(comments) {
        try {
            return comments.map(comment => ({
                author: comment.author,
                content: comment.text,
                score: comment.score,
                timeAgo: comment.timeAgo,
                sentiment: this.analyzeCommentSentiment(comment.text),
                wordCount: comment.text.split(/\s+/).length
            }));
        } catch (error) {
            console.error('Comment parsing failed:', error.message);
            return [];
        }
    }

    // Basic sentiment analysis for comments
    analyzeCommentSentiment(text) {
        const positiveWords = ['good', 'great', 'amazing', 'awesome', 'love', 'like', 'excellent', 'fantastic'];
        const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'dislike', 'horrible', 'worst', 'stupid'];
        
        const words = text.toLowerCase().split(/\s+/);
        let positiveCount = 0;
        let negativeCount = 0;
        
        words.forEach(word => {
            if (positiveWords.includes(word)) positiveCount++;
            if (negativeWords.includes(word)) negativeCount++;
        });
        
        if (positiveCount > negativeCount) return 'positive';
        if (negativeCount > positiveCount) return 'negative';
        return 'neutral';
    }

    // Generate summary statistics from parsed posts
    generateSummaryStats(parsedPosts) {
        try {
            const totalPosts = parsedPosts.length;
            const totalScore = parsedPosts.reduce((sum, post) => sum + post.redditData.score, 0);
            const totalComments = parsedPosts.reduce((sum, post) => sum + post.redditData.commentCount, 0);
            
            const subreddits = [...new Set(parsedPosts.map(post => post.redditData.subreddit))];
            const contentTypes = [...new Set(parsedPosts.map(post => post.redditData.postType))];
            const categories = [...new Set(parsedPosts.map(post => post.category))];
            
            const avgScore = totalPosts > 0 ? Math.round(totalScore / totalPosts) : 0;
            const avgComments = totalPosts > 0 ? Math.round(totalComments / totalPosts) : 0;
            
            return {
                totalPosts,
                totalScore,
                totalComments,
                avgScore,
                avgComments,
                uniqueSubreddits: subreddits.length,
                subredditList: subreddits,
                contentTypes,
                categories,
                processingTime: new Date().toISOString()
            };
        } catch (error) {
            console.error('Summary stats generation failed:', error.message);
            return {};
        }
    }

    // Filter posts by criteria
    filterPosts(parsedPosts, filters = {}) {
        let filtered = [...parsedPosts];
        
        if (filters.minScore) {
            filtered = filtered.filter(post => post.redditData.score >= filters.minScore);
        }
        
        if (filters.maxAge) {
            const cutoffDate = new Date(Date.now() - filters.maxAge * 24 * 60 * 60 * 1000);
            filtered = filtered.filter(post => new Date(post.uploadDate) >= cutoffDate);
        }
        
        if (filters.subreddits && filters.subreddits.length > 0) {
            filtered = filtered.filter(post => filters.subreddits.includes(post.redditData.subreddit));
        }
        
        if (filters.contentType) {
            filtered = filtered.filter(post => post.redditData.postType === filters.contentType);
        }
        
        if (filters.excludeNsfw) {
            filtered = filtered.filter(post => !post.redditData.isNsfw);
        }
        
        console.log(`✓ Filtered ${parsedPosts.length} posts to ${filtered.length} posts`);
        return filtered;
    }

    // Validate parsed post data
    validateParsedPost(post) {
        const required = ['videoId', 'title', 'channelName', 'description'];
        const missing = required.filter(field => !post[field]);
        
        if (missing.length > 0) {
            throw new Error(`Missing required fields: ${missing.join(', ')}`);
        }
        
        return true;
    }

    // Test method
    async test() {
        try {
            console.log('Testing Reddit parser...');
            
            // Sample Reddit post data
            const samplePosts = [
                {
                    postId: 'test123',
                    title: 'Test Paranormal Encounter',
                    subreddit: 'paranormal',
                    author: 'testuser',
                    score: 150,
                    commentCount: 25,
                    content: 'This is a test paranormal story with some content to analyze.',
                    postType: 'text',
                    hasImage: false,
                    hasVideo: false,
                    awardsCount: 2,
                    timestamp: new Date().toISOString(),
                    postUrl: 'https://reddit.com/test',
                    upvoteRatio: 0.85,
                    isStickied: false,
                    isNsfw: false,
                    flair: 'True Story',
                    scrapedAt: new Date().toISOString()
                }
            ];
            
            const parsed = this.parsePostsForAnalysis(samplePosts);
            const stats = this.generateSummaryStats(parsed);
            
            console.log('✓ Parser test results:');
            console.log(`  - Parsed posts: ${parsed.length}`);
            console.log(`  - Average score: ${stats.avgScore}`);
            console.log(`  - Content types: ${stats.contentTypes.join(', ')}`);
            
            return parsed;
            
        } catch (error) {
            console.error('✗ Reddit parser test failed:', error.message);
            throw error;
        }
    }
}

module.exports = RedditParser;
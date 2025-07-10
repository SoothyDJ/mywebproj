// File Path: /scraping/reddit-scraper.js
// Reddit API integration for post data extraction
// REF-079: Reddit API scraper using official Reddit OAuth API

const axios = require('axios');

class RedditScraper {
    constructor() {
        this.clientId = process.env.REDDIT_CLIENT_ID;
        this.clientSecret = process.env.REDDIT_CLIENT_SECRET;
        this.userAgent = process.env.REDDIT_USER_AGENT || 'WebAutomationPlatform/1.0';
        this.accessToken = null;
        this.tokenExpires = null;
        this.apiBase = 'https://oauth.reddit.com';
    }

    async initialize() {
        try {
            if (!this.clientId || !this.clientSecret) {
                throw new Error('Reddit API credentials not found. Please set REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET in .env');
            }

            await this.getAccessToken();
            console.log('✓ Reddit API initialized');
            return true;
        } catch (error) {
            console.error('✗ Reddit API initialization failed:', error.message);
            return false;
        }
    }

    async getAccessToken() {
        try {
            // Reddit OAuth2 client credentials flow
            const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
            
            const response = await axios.post('https://www.reddit.com/api/v1/access_token', 
                'grant_type=client_credentials',
                {
                    headers: {
                        'Authorization': `Basic ${auth}`,
                        'User-Agent': this.userAgent,
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                }
            );

            this.accessToken = response.data.access_token;
            this.tokenExpires = Date.now() + (response.data.expires_in * 1000);
            
            console.log('✓ Reddit API access token obtained');

        } catch (error) {
            console.error('✗ Failed to get Reddit access token:', error.response?.data || error.message);
            throw error;
        }
    }

    async ensureValidToken() {
        if (!this.accessToken || Date.now() >= this.tokenExpires - 60000) {
            await this.getAccessToken();
        }
    }

    async makeApiRequest(endpoint, params = {}) {
        await this.ensureValidToken();

        try {
            const response = await axios.get(`${this.apiBase}${endpoint}`, {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'User-Agent': this.userAgent
                },
                params
            });

            return response.data;
        } catch (error) {
            console.error('Reddit API request failed:', error.response?.data || error.message);
            throw error;
        }
    }

    async searchPosts(query, subreddit = null, sortBy = 'hot', timeFilter = 'week', maxResults = 20) {
        try {
            console.log(`Searching Reddit API for: "${query}"`);

            let endpoint, params;

            if (subreddit) {
                // Search within specific subreddit
                endpoint = `/r/${subreddit}/search`;
                params = {
                    q: query,
                    restrict_sr: true,
                    sort: sortBy,
                    t: timeFilter,
                    limit: Math.min(maxResults, 100)
                };
            } else {
                // Global search
                endpoint = '/search';
                params = {
                    q: query,
                    sort: sortBy,
                    t: timeFilter,
                    limit: Math.min(maxResults, 100),
                    type: 'link'
                };
            }

            const data = await this.makeApiRequest(endpoint, params);
            const posts = this.parsePostsFromResponse(data);

            console.log(`✓ Found ${posts.length} Reddit posts via API`);
            return posts;

        } catch (error) {
            console.error('✗ Reddit API search failed:', error.message);
            throw error;
        }
    }

    async getSubredditPosts(subreddit, sortBy = 'hot', timeFilter = 'week', maxResults = 20) {
        try {
            console.log(`Getting posts from r/${subreddit}`);

            const endpoint = `/r/${subreddit}/${sortBy}`;
            const params = {
                t: timeFilter,
                limit: Math.min(maxResults, 100)
            };

            const data = await this.makeApiRequest(endpoint, params);
            const posts = this.parsePostsFromResponse(data);

            console.log(`✓ Found ${posts.length} posts from r/${subreddit}`);
            return posts;

        } catch (error) {
            console.error(`✗ Failed to get posts from r/${subreddit}:`, error.message);
            throw error;
        }
    }

    parsePostsFromResponse(data) {
        const posts = [];

        if (data && data.data && data.data.children) {
            data.data.children.forEach(child => {
                const post = child.data;
                
                if (post && post.title) {
                    posts.push({
                        postId: post.id,
                        title: post.title,
                        subreddit: post.subreddit,
                        author: post.author,
                        score: post.score || 0,
                        commentCount: post.num_comments || 0,
                        content: post.selftext || '',
                        postType: this.determinePostType(post),
                        hasImage: post.post_hint === 'image' || post.url?.includes('i.redd.it'),
                        hasVideo: post.post_hint === 'hosted:video' || post.is_video,
                        awardsCount: post.total_awards_received || 0,
                        timestamp: new Date(post.created_utc * 1000).toISOString(),
                        timeText: this.formatTimeAgo(post.created_utc),
                        postUrl: `https://www.reddit.com${post.permalink}`,
                        externalUrl: post.url !== post.postUrl ? post.url : null,
                        upvoteRatio: post.upvote_ratio || 0,
                        isStickied: post.stickied || false,
                        isNsfw: post.over_18 || false,
                        flair: post.link_flair_text || null,
                        scrapedAt: new Date().toISOString()
                    });
                }
            });
        }

        return posts;
    }

    determinePostType(post) {
        if (post.is_self) return 'text';
        if (post.is_video || post.post_hint === 'hosted:video') return 'video';
        if (post.post_hint === 'image' || post.url?.includes('i.redd.it')) return 'image';
        if (post.url && post.url !== `https://www.reddit.com${post.permalink}`) return 'link';
        return 'text';
    }

    formatTimeAgo(createdUtc) {
        const now = Date.now() / 1000;
        const diffSeconds = now - createdUtc;
        const diffMinutes = Math.floor(diffSeconds / 60);
        const diffHours = Math.floor(diffMinutes / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffDays > 0) return `${diffDays} days ago`;
        if (diffHours > 0) return `${diffHours} hours ago`;
        if (diffMinutes > 0) return `${diffMinutes} minutes ago`;
        return 'just now';
    }

    async getPostDetails(postId) {
        try {
            // Get post details including comments
            const endpoint = `/comments/${postId}`;
            const data = await this.makeApiRequest(endpoint, { limit: 10 });

            const postData = data[0]?.data?.children?.[0]?.data;
            const commentsData = data[1]?.data?.children || [];

            if (!postData) {
                throw new Error('Post not found');
            }

            const topComments = commentsData
                .filter(comment => comment.data && comment.data.body)
                .slice(0, 5)
                .map(comment => ({
                    author: comment.data.author,
                    text: comment.data.body,
                    score: comment.data.score || 0,
                    timeAgo: this.formatTimeAgo(comment.data.created_utc)
                }));

            return {
                title: postData.title,
                content: postData.selftext || '',
                score: postData.score || 0,
                commentCount: postData.num_comments || 0,
                topComments
            };

        } catch (error) {
            console.error(`Error getting post details for ${postId}:`, error.message);
            return null;
        }
    }

    async searchSubreddits(query, maxResults = 10) {
        try {
            console.log(`Searching for subreddits: "${query}"`);

            const params = {
                q: query,
                type: 'sr',
                limit: Math.min(maxResults, 25)
            };

            const data = await this.makeApiRequest('/search', params);
            const subreddits = [];

            if (data && data.data && data.data.children) {
                data.data.children.forEach(child => {
                    const sub = child.data;
                    if (sub && sub.display_name) {
                        subreddits.push({
                            name: sub.display_name,
                            description: sub.public_description || sub.description || '',
                            members: sub.subscribers || 0,
                            url: `https://www.reddit.com/r/${sub.display_name}`,
                            isNsfw: sub.over18 || false,
                            createdUtc: sub.created_utc
                        });
                    }
                });
            }

            console.log(`✓ Found ${subreddits.length} subreddits`);
            return subreddits;

        } catch (error) {
            console.error('Subreddit search failed:', error.message);
            return [];
        }
    }

    async close() {
        // No browser to close with API
        console.log('✓ Reddit API client closed');
    }

    // Test method
    async test() {
        try {
            console.log('Testing Reddit API client...');
            
            await this.initialize();
            const results = await this.searchPosts('paranormal stories', null, 'hot', 'week', 5);
            
            console.log('✓ API Test results:');
            results.forEach((post, index) => {
                console.log(`${index + 1}. ${post.title} - r/${post.subreddit} (${post.score} upvotes)`);
            });
            
            await this.close();
            return results;
            
        } catch (error) {
            console.error('✗ Reddit API test failed:', error.message);
            await this.close();
            throw error;
        }
    }
}

module.exports = RedditScraper;
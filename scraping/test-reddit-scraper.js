// File Path: /scraping/test-reddit-scraper.js
// Test script for Reddit scraper functionality
// REF-085: Reddit scraper test script with correct .env path

require('dotenv').config({ path: '../backend/.env' });
const RedditScraper = require('./reddit-scraper');

async function testRedditScraper() {
    const scraper = new RedditScraper();
    
    try {
        console.log('Testing Reddit scraper with "paranormal encounters"...');
        
        await scraper.initialize();
        
        // Test 1: Search for posts
        console.log('\n1. Testing post search...');
        const posts = await scraper.searchPosts('paranormal encounters', null, 'hot', 'week', 5);
        
        console.log(`\n✓ Found ${posts.length} posts:`);
        posts.forEach((post, index) => {
            console.log(`\n${index + 1}. ${post.title}`);
            console.log(`   Subreddit: r/${post.subreddit}`);
            console.log(`   Author: u/${post.author}`);
            console.log(`   Score: ${post.score} upvotes`);
            console.log(`   Comments: ${post.commentCount}`);
            console.log(`   Type: ${post.postType}`);
            console.log(`   Time: ${post.timeText}`);
            console.log(`   URL: ${post.postUrl}`);
        });
        
        // Test 2: Get detailed post info (if we found posts)
        if (posts.length > 0) {
            console.log('\n2. Testing post details...');
            const firstPost = posts[0];
            console.log(`Getting details for: ${firstPost.title}`);
            
            const details = await scraper.getPostDetails(firstPost.postId);
            if (details) {
                console.log('✓ Post details retrieved:');
                console.log(`   Content length: ${details.content.length} characters`);
                console.log(`   Top comments: ${details.topComments.length}`);
            }
        }
        
        // Test 3: Search subreddits
        console.log('\n3. Testing subreddit search...');
        const subreddits = await scraper.searchSubreddits('paranormal', 3);
        
        console.log(`✓ Found ${subreddits.length} subreddits:`);
        subreddits.forEach((sub, index) => {
            console.log(`${index + 1}. r/${sub.name} - ${sub.members} members`);
            console.log(`   Description: ${sub.description.substring(0, 100)}...`);
        });
        
        await scraper.close();
        console.log('\n✓ Reddit scraper test completed successfully!');
        
    } catch (error) {
        console.error('✗ Reddit scraper test failed:', error.message);
        await scraper.close();
    }
}

testRedditScraper();
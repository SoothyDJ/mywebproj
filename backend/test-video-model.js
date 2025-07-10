require('dotenv').config();
const Video = require('./models/Video');
const Task = require('./models/Task');
const DatabaseConnection = require('./database/connection');

async function testVideoModel() {
    const db = new DatabaseConnection();
    const videoModel = new Video();
    const taskModel = new Task();
    
    try {
        await db.connect();
        console.log('Testing Video Model...');
        
        // First, get or create a valid task
        console.log('\n0. Getting existing tasks...');
        const tasks = await taskModel.findAll({ limit: 1 });
        let taskId;
        
        if (tasks.length > 0) {
            taskId = tasks[0].id;
            console.log('✓ Using existing task:', taskId);
        } else {
            // Create a test task
            const newTask = await taskModel.create({
                userId: 1,
                prompt: 'Test task for video model',
                taskType: 'youtube_scrape'
            });
            taskId = newTask.id;
            console.log('✓ Created new task:', taskId);
        }
        
        // Test 1: Create video
        console.log('\n1. Creating test video...');
        const newVideo = await videoModel.create({
            taskId: taskId,
            videoId: 'test123',
            title: 'Test Paranormal Video',
            channelName: 'Test Channel',
            channelId: 'UC123456',
            description: 'A test video about paranormal activity',
            viewCount: 150000,
            likeCount: 5000,
            durationSeconds: 900,
            videoUrl: 'https://youtube.com/watch?v=test123',
            tags: ['paranormal', 'ghost', 'scary'],
            aiAnalysis: { summary: 'Test analysis', sentiment: 'neutral' },
            sentimentScore: 0.2
        });
        console.log('✓ Video created:', newVideo.id);
        
        // Test 2: Find by ID
        console.log('\n2. Finding video by ID...');
        const foundVideo = await videoModel.findById(newVideo.id);
        console.log('✓ Video found:', foundVideo.title);
        
        // Test 3: Create storyboard
        console.log('\n3. Creating storyboard item...');
        const storyboardItem = await videoModel.createStoryboardItem({
            videoId: newVideo.id,
            sequenceNumber: 1,
            sceneDescription: 'Opening scene',
            narrationText: 'Welcome to this paranormal investigation...',
            visualElements: ['title screen', 'dramatic music'],
            audioCues: ['scary sound effect']
        });
        console.log('✓ Storyboard item created:', storyboardItem.id);
        
        // Test 4: Get storyboard
        console.log('\n4. Getting video storyboard...');
        const storyboard = await videoModel.getStoryboard(newVideo.id);
        console.log('✓ Storyboard items found:', storyboard.length);
        
        // Test 5: Get statistics
        console.log('\n5. Getting video statistics...');
        const stats = await videoModel.getStatistics();
        console.log('✓ Statistics:', stats);
        
        // Test 6: Search videos
        console.log('\n6. Searching videos...');
        const searchResults = await videoModel.search('paranormal');
        console.log('✓ Search results found:', searchResults.length);
        
        // Test 7: Delete video
        console.log('\n7. Deleting test video...');
        await videoModel.delete(newVideo.id);
        console.log('✓ Video deleted');
        
        console.log('\n✓ Video Model test completed successfully!');
        
    } catch (error) {
        console.error('✗ Video Model test failed:', error.message);
    } finally {
        await db.disconnect();
    }
}

testVideoModel();
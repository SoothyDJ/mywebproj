require('dotenv').config();
const Task = require('./models/Task');
const DatabaseConnection = require('./database/connection');

async function testTaskModel() {
    const db = new DatabaseConnection();
    const taskModel = new Task();
    
    try {
        await db.connect();
        console.log('Testing Task Model...');
        
        // Test 1: Create task
        console.log('\n1. Creating test task...');
        const newTask = await taskModel.create({
            userId: 1,
            prompt: 'Test automation task',
            taskType: 'youtube_scrape',
            parameters: { maxResults: 5 }
        });
        console.log('✓ Task created:', newTask.id);
        
        // Test 2: Find by ID
        console.log('\n2. Finding task by ID...');
        const foundTask = await taskModel.findById(newTask.id);
        console.log('✓ Task found:', foundTask.prompt);
        
        // Test 3: Update status
        console.log('\n3. Updating task status...');
        const updatedTask = await taskModel.updateStatus(newTask.id, 'running');
        console.log('✓ Status updated:', updatedTask.status);
        
        // Test 4: Get statistics
        console.log('\n4. Getting task statistics...');
        const stats = await taskModel.getStatistics();
        console.log('✓ Statistics:', stats);
        
        // Test 5: Find by user
        console.log('\n5. Finding tasks by user...');
        const userTasks = await taskModel.findByUserId(1);
        console.log('✓ User tasks found:', userTasks.length);
        
        // Test 6: Delete task
        console.log('\n6. Deleting test task...');
        await taskModel.delete(newTask.id);
        console.log('✓ Task deleted');
        
        console.log('\n✓ Task Model test completed successfully!');
        
    } catch (error) {
        console.error('✗ Task Model test failed:', error.message);
    } finally {
        await db.disconnect();
    }
}

testTaskModel();
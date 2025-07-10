const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';

async function testTaskAPI() {
    try {
        console.log('Testing Task API...');
        
        // Test 1: Create task
        console.log('\n1. Creating task...');
        const createResponse = await axios.post(`${API_BASE}/tasks/create`, {
            prompt: "Find top 5 paranormal encounter videos from the last week",
            taskType: "youtube_scrape",
            options: { maxResults: 5 }
        });
        
        console.log('✓ Task created:', createResponse.data.task.id);
        const taskId = createResponse.data.task.id;
        
        // Test 2: Get task status
        console.log('\n2. Checking task status...');
        const statusResponse = await axios.get(`${API_BASE}/tasks/${taskId}`);
        console.log('✓ Task status:', statusResponse.data.task.status);
        
        // Test 3: List tasks
        console.log('\n3. Listing tasks...');
        const listResponse = await axios.get(`${API_BASE}/tasks`);
        console.log('✓ Total tasks:', listResponse.data.tasks.length);
        
        // Test 4: Wait for completion and get results
        console.log('\n4. Waiting for task completion...');
        let completed = false;
        let attempts = 0;
        
        while (!completed && attempts < 20) {
            await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
            
            const checkResponse = await axios.get(`${API_BASE}/tasks/${taskId}`);
            const status = checkResponse.data.task.status;
            
            console.log(`   Status check ${attempts + 1}: ${status}`);
            
            if (status === 'completed') {
                completed = true;
                
                // Get results
                const resultsResponse = await axios.get(`${API_BASE}/tasks/${taskId}/results`);
                console.log('✓ Task completed with results:');
                console.log(`   Videos analyzed: ${resultsResponse.data.results.length}`);
                console.log(`   First video: ${resultsResponse.data.results[0]?.video.title}`);
                
            } else if (status === 'failed') {
                console.log('✗ Task failed');
                break;
            }
            
            attempts++;
        }
        
        console.log('\n✓ Task API test completed!');
        
    } catch (error) {
        console.error('✗ API test failed:', error.response?.data || error.message);
    }
}

testTaskAPI();
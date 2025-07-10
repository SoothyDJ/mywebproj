const axios = require('axios');
const fs = require('fs');

async function testHTMLReportAPI() {
    try {
        console.log('Testing HTML Report API Endpoint...');
        
        // First, get list of completed tasks
        console.log('\n1. Getting list of completed tasks...');
        const tasksResponse = await axios.get('http://localhost:3001/api/tasks');
        const completedTasks = tasksResponse.data.tasks.filter(task => task.status === 'completed');
        
        if (completedTasks.length === 0) {
            console.log('❌ No completed tasks found. Create and complete a task first.');
            return;
        }
        
        const taskId = completedTasks[0].id;
        console.log(`✓ Found completed task: ${taskId}`);
        
        // Test HTML report endpoint
        console.log('\n2. Requesting HTML report...');
        const reportResponse = await axios.get(`http://localhost:3001/api/tasks/${taskId}/report`);
        
        console.log('✓ HTML report received');
        console.log(`Content-Type: ${reportResponse.headers['content-type']}`);
        console.log(`Content-Length: ${reportResponse.data.length} characters`);
        
        // Save HTML report to file
        fs.writeFileSync(`./task-${taskId}-report.html`, reportResponse.data);
        console.log(`✓ HTML report saved to: task-${taskId}-report.html`);
        
        // Test with non-existent task
        console.log('\n3. Testing with non-existent task...');
        try {
            await axios.get('http://localhost:3001/api/tasks/99999/report');
        } catch (error) {
            if (error.response && error.response.status === 404) {
                console.log('✓ Correctly returned 404 for non-existent task');
            } else {
                console.log('❌ Unexpected error for non-existent task');
            }
        }
        
        console.log('\n✓ HTML Report API test completed successfully!');
        console.log('✓ Open the generated HTML file in your browser to view the report');
        
    } catch (error) {
        console.error('✗ HTML Report API test failed:', error.response?.data || error.message);
    }
}

testHTMLReportAPI();
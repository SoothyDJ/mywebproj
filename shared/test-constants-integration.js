// Test constants integration with existing modules
const config = require('./constants/config');

function testIntegrationWithExistingModules() {
    console.log('Testing Constants Integration...');
    console.log('================================\n');
    
    try {
        // Test 1: Simulate task creation with constants
        console.log('1. Testing task creation validation...');
        const taskData = {
            prompt: 'Test prompt for video analysis',
            taskType: config.TASK_TYPES.YOUTUBE_SCRAPE,
            timeFilter: config.TIME_FILTERS.WEEK
        };
        
        const isValidPrompt = taskData.prompt.length >= config.VALIDATION_RULES.PROMPT_MIN_LENGTH &&
                             taskData.prompt.length <= config.VALIDATION_RULES.PROMPT_MAX_LENGTH;
        const isValidTaskType = config.isValidTaskType(taskData.taskType);
        const isValidTimeFilter = config.isValidTimeFilter(taskData.timeFilter);
        
        console.log(`  ✓ Prompt validation: ${isValidPrompt}`);
        console.log(`  ✓ Task type validation: ${isValidTaskType}`);
        console.log(`  ✓ Time filter validation: ${isValidTimeFilter}`);
        console.log('');
        
        // Test 2: Test error handling with constants
        console.log('2. Testing error handling with constants...');
        function simulateError(errorType) {
            return {
                code: errorType,
                message: config.MESSAGES.VALIDATION_FAILED,
                status: config.HTTP_STATUS.BAD_REQUEST
            };
        }
        
        const validationError = simulateError(config.ERROR_CODES.VALIDATION_ERROR);
        console.log(`  ✓ Error code: ${validationError.code}`);
        console.log(`  ✓ Error message: ${validationError.message}`);
        console.log(`  ✓ HTTP status: ${validationError.status}`);
        console.log('');
        
        // Test 3: Test YouTube URL processing
        console.log('3. Testing YouTube URL processing...');
        const testUrls = [
            'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            'https://youtu.be/dQw4w9WgXcQ',
            'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=30s',
            'https://invalid-url.com'
        ];
        
        testUrls.forEach((url, index) => {
            const isValid = config.isValidYouTubeUrl(url);
            console.log(`  URL ${index + 1}: ${isValid ? '✓' : '✗'} ${url.substring(0, 50)}...`);
        });
        console.log('');
        
        console.log('✓ Constants integration test completed!');
        
    } catch (error) {
        console.error('✗ Integration test failed:', error.message);
        throw error;
    }
}

testIntegrationWithExistingModules();
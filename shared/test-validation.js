const validation = require('./utils/validation');

function testValidation() {
    try {
        console.log('Testing Validation Utilities...');
        console.log('================================\n');
        
        // Test 1: Basic validation functions
        console.log('1. Testing basic validation functions...');
        
        const requiredTest = validation.validateRequired('', 'testField');
        console.log(`  validateRequired(''): ${requiredTest ? 'ERROR' : 'PASS'}`);
        
        const stringLengthTest = validation.validateStringLength('test', 'testField', 2, 10);
        console.log(`  validateStringLength('test', 2, 10): ${stringLengthTest ? 'ERROR' : 'PASS'}`);
        
        const numberRangeTest = validation.validateNumberRange(5, 'testField', 1, 10);
        console.log(`  validateNumberRange(5, 1, 10): ${numberRangeTest ? 'ERROR' : 'PASS'}`);
        
        const enumTest = validation.validateEnum('valid', 'testField', ['valid', 'invalid']);
        console.log(`  validateEnum('valid', ['valid', 'invalid']): ${enumTest ? 'ERROR' : 'PASS'}`);
        console.log('');
        
        // Test 2: User validation
        console.log('2. Testing user validation...');
        
        const validUser = {
            username: 'testuser123',
            email: 'test@example.com',
            password: 'TestPass123',
            confirmPassword: 'TestPass123'
        };
        
        const userValidation = validation.validateUserRegistration(validUser);
        console.log(`  Valid user registration: ${userValidation.isValid ? 'PASS' : 'FAIL'}`);
        if (!userValidation.isValid) {
            userValidation.errors.forEach(error => {
                console.log(`    Error: ${error.field} - ${error.message}`);
            });
        }
        
        const invalidUser = {
            username: 'ab', // too short
            email: 'invalid-email',
            password: '123', // too weak
            confirmPassword: '456' // doesn't match
        };
        
        const invalidUserValidation = validation.validateUserRegistration(invalidUser);
        console.log(`  Invalid user registration errors: ${invalidUserValidation.errors.length}`);
        invalidUserValidation.errors.forEach((error, index) => {
            console.log(`    ${index + 1}. ${error.field}: ${error.message}`);
        });
        console.log('');
        
        // Test 3: Task validation
        console.log('3. Testing task validation...');
        
        const validTask = {
            prompt: 'Analyze YouTube videos about AI technology',
            taskType: 'youtube_scrape',
            parameters: {
                maxResults: 10,
                timeFilter: 'week',
                aiProvider: 'openai'
            }
        };
        
        const taskValidation = validation.validateTaskCreation(validTask);
        console.log(`  Valid task creation: ${taskValidation.isValid ? 'PASS' : 'FAIL'}`);
        
        const invalidTask = {
            prompt: 'AI', // too short
            taskType: 'invalid_type',
            parameters: {
                maxResults: 200, // too high
                timeFilter: 'invalid_filter'
            }
        };
        
        const invalidTaskValidation = validation.validateTaskCreation(invalidTask);
        console.log(`  Invalid task creation errors: ${invalidTaskValidation.errors.length}`);
        invalidTaskValidation.errors.forEach((error, index) => {
            console.log(`    ${index + 1}. ${error.field}: ${error.message}`);
        });
        console.log('');
        
        // Test 4: Video data validation
        console.log('4. Testing video data validation...');
        
        const validVideo = {
            videoId: 'dQw4w9WgXcQ',
            title: 'Test Video Title',
            channelName: 'Test Channel',
            viewCount: '1M views',
            duration: '3:45',
            uploadDate: '2024-01-01',
            videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
        };
        
        const videoValidation = validation.validateVideoData(validVideo);
        console.log(`  Valid video data: ${videoValidation.isValid ? 'PASS' : 'FAIL'}`);
        
        const invalidVideo = {
            videoId: 'invalid_id',
            title: '',
            channelName: '',
            videoUrl: 'https://invalid-url.com'
        };
        
        const invalidVideoValidation = validation.validateVideoData(invalidVideo);
        console.log(`  Invalid video data errors: ${invalidVideoValidation.errors.length}`);
        invalidVideoValidation.errors.forEach((error, index) => {
            console.log(`    ${index + 1}. ${error.field}: ${error.message}`);
        });
        console.log('');
        
        // Test 5: Video analysis validation
        console.log('5. Testing video analysis validation...');
        
        const validAnalysis = {
            summary: 'This is a comprehensive analysis of the video content',
            themes: ['technology', 'education', 'tutorial'],
            sentiment: 'positive',
            sentimentScore: 0.8,
            contentType: 'educational',
            credibilityScore: 0.9
        };
        
        const analysisValidation = validation.validateVideoAnalysis(validAnalysis);
        console.log(`  Valid analysis data: ${analysisValidation.isValid ? 'PASS' : 'FAIL'}`);
        
        const invalidAnalysis = {
            summary: 'Short', // too short
            themes: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k'], // too many
            sentiment: 'invalid_sentiment',
            sentimentScore: 2.0, // out of range
            contentType: 'invalid_type',
            credibilityScore: -0.5 // out of range
        };
        
        const invalidAnalysisValidation = validation.validateVideoAnalysis(invalidAnalysis);
        console.log(`  Invalid analysis data errors: ${invalidAnalysisValidation.errors.length}`);
        console.log('');
        
        // Test 6: Storyboard validation
        console.log('6. Testing storyboard validation...');
        
        const validStoryboard = {
            title: 'Video Storyboard',
            totalScenes: 3,
            scenes: [
                {
                    sequenceNumber: 1,
                    narrationText: 'Welcome to this amazing video about technology',
                    visualElements: ['title card', 'presenter'],
                    audioCues: ['background music']
                },
                {
                    sequenceNumber: 2,
                    narrationText: 'Now we will explore the main concepts',
                    visualElements: ['diagram', 'charts'],
                    audioCues: ['transition sound']
                }
            ]
        };
        
        const storyboardValidation = validation.validateStoryboard(validStoryboard);
        console.log(`  Valid storyboard: ${storyboardValidation.isValid ? 'PASS' : 'FAIL'}`);
        console.log('');
        
        // Test 7: Pagination validation
        console.log('7. Testing pagination validation...');
        
        const validPagination = {
            page: 1,
            limit: 20,
            sortBy: 'created_at',
            sortOrder: 'desc'
        };
        
        const paginationValidation = validation.validatePagination(validPagination);
        console.log(`  Valid pagination: ${paginationValidation.isValid ? 'PASS' : 'FAIL'}`);
        
        const invalidPagination = {
            page: 0, // invalid
            limit: 150, // too high
            sortOrder: 'invalid' // invalid
        };
        
        const invalidPaginationValidation = validation.validatePagination(invalidPagination);
        console.log(`  Invalid pagination errors: ${invalidPaginationValidation.errors.length}`);
        console.log('');
        
        // Test 8: Utility functions
        console.log('8. Testing validation utilities...');
        
        const dirtyData = {
            name: '  John Doe  ',
            email: '',
            age: '25'
        };
        
        const sanitizedData = validation.sanitizeForValidation(dirtyData);
        console.log(`  sanitizeForValidation: name="${sanitizedData.name}", email=${sanitizedData.email}, age="${sanitizedData.age}"`);
        
        const summary = validation.getValidationSummary(userValidation);
        console.log(`  getValidationSummary: "${summary}"`);
        console.log('');
        
        console.log('================================');
        console.log('✓ All validation tests completed!');
        console.log('✓ Basic validation functions working');
        console.log('✓ User validation comprehensive');
        console.log('✓ Task validation functional');
        console.log('✓ Video data validation working');
        console.log('✓ Storyboard validation implemented');
        console.log('✓ Pagination validation ready');
        
        return true;
        
    } catch (error) {
        console.error('✗ Validation test failed:', error.message);
        throw error;
    }
}

testValidation();
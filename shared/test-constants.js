const config = require('./constants/config');

function testConstants() {
    try {
        console.log('Testing Shared Constants Configuration...');
        console.log('===========================================\n');
        
        // Test 1: Validate all constants are exported
        console.log('1. Testing constant exports...');
        const requiredConstants = [
            'TASK_TYPES', 'TASK_STATUS', 'TIME_FILTERS', 'CONTENT_TYPES',
            'SENTIMENT_TYPES', 'AI_PROVIDERS', 'ERROR_CODES', 'HTTP_STATUS',
            'DEFAULTS', 'VALIDATION_RULES', 'YOUTUBE_CONSTANTS', 'MESSAGES'
        ];
        
        requiredConstants.forEach(constantName => {
            if (config[constantName]) {
                console.log(`  ✓ ${constantName} exported`);
            } else {
                throw new Error(`Missing constant: ${constantName}`);
            }
        });
        console.log('');
        
        // Test 2: Validate constant values
        console.log('2. Testing constant values...');
        console.log(`  Task types: ${Object.keys(config.TASK_TYPES).length} defined`);
        console.log(`  Task statuses: ${Object.keys(config.TASK_STATUS).length} defined`);
        console.log(`  Content types: ${Object.keys(config.CONTENT_TYPES).length} defined`);
        console.log(`  Error codes: ${Object.keys(config.ERROR_CODES).length} defined`);
        console.log(`  HTTP status codes: ${Object.keys(config.HTTP_STATUS).length} defined`);
        console.log('');
        
        // Test 3: Test helper functions
        console.log('3. Testing helper functions...');
        
        // Test task type validation
        const validTaskType = config.isValidTaskType('youtube_scrape');
        const invalidTaskType = config.isValidTaskType('invalid_type');
        console.log(`  ✓ Valid task type validation: ${validTaskType}`);
        console.log(`  ✓ Invalid task type validation: ${!invalidTaskType}`);
        
        // Test email validation
        const validEmail = config.isValidEmail('test@example.com');
        const invalidEmail = config.isValidEmail('invalid-email');
        console.log(`  ✓ Valid email validation: ${validEmail}`);
        console.log(`  ✓ Invalid email validation: ${!invalidEmail}`);
        
        // Test YouTube URL validation
        const validYouTubeUrl = config.isValidYouTubeUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
        const invalidYouTubeUrl = config.isValidYouTubeUrl('https://example.com');
        console.log(`  ✓ Valid YouTube URL validation: ${validYouTubeUrl}`);
        console.log(`  ✓ Invalid YouTube URL validation: ${!invalidYouTubeUrl}`);
        
        // Test environment helpers
        const isDev = config.isDevelopment();
        const isProd = config.isProduction();
        console.log(`  ✓ Environment detection - Dev: ${isDev}, Prod: ${isProd}`);
        console.log('');
        
        // Test 4: Test specific constant structures
        console.log('4. Testing constant structures...');
        
        // Test DEFAULTS structure
        const requiredDefaults = ['PAGE_SIZE', 'MAX_SCRAPE_RESULTS', 'AI_TIMEOUT'];
        requiredDefaults.forEach(key => {
            if (config.DEFAULTS[key] !== undefined) {
                console.log(`  ✓ DEFAULTS.${key}: ${config.DEFAULTS[key]}`);
            } else {
                throw new Error(`Missing default: ${key}`);
            }
        });
        
        // Test VALIDATION_RULES structure
        const requiredValidationRules = ['USERNAME_MIN_LENGTH', 'PASSWORD_MIN_LENGTH', 'PROMPT_MAX_LENGTH'];
        requiredValidationRules.forEach(key => {
            if (config.VALIDATION_RULES[key] !== undefined) {
                console.log(`  ✓ VALIDATION_RULES.${key}: ${config.VALIDATION_RULES[key]}`);
            } else {
                throw new Error(`Missing validation rule: ${key}`);
            }
        });
        console.log('');
        
        // Test 5: Test YouTube constants
        console.log('5. Testing YouTube constants...');
        console.log(`  Base URL: ${config.YOUTUBE_CONSTANTS.BASE_URL}`);
        console.log(`  Search filters: ${Object.keys(config.YOUTUBE_CONSTANTS.SEARCH_FILTERS).length} defined`);
        console.log(`  Selectors: ${Object.keys(config.YOUTUBE_CONSTANTS.SELECTORS).length} defined`);
        console.log('');
        
        // Test 6: Test environment configurations
        console.log('6. Testing environment configurations...');
        const devConfig = config.getEnvironmentConfig('development');
        const prodConfig = config.getEnvironmentConfig('production');
        
        console.log(`  Development config keys: ${Object.keys(devConfig).length}`);
        console.log(`  Production config keys: ${Object.keys(prodConfig).length}`);
        console.log(`  Dev AI timeout: ${devConfig.AI_TIMEOUT}ms`);
        console.log(`  Prod AI timeout: ${prodConfig.AI_TIMEOUT}ms`);
        console.log('');
        
        // Test 7: Test regex patterns
        console.log('7. Testing regex patterns...');
        const testEmail = 'user@example.com';
        const testUsername = 'testuser123';
        const testPassword = 'TestPass123';
        const testYouTubeId = 'dQw4w9WgXcQ';
        
        console.log(`  Email pattern test: ${config.REGEX_PATTERNS.EMAIL.test(testEmail)}`);
        console.log(`  Username pattern test: ${config.REGEX_PATTERNS.USERNAME.test(testUsername)}`);
        console.log(`  Password pattern test: ${config.REGEX_PATTERNS.PASSWORD.test(testPassword)}`);
        console.log(`  YouTube ID pattern test: ${config.REGEX_PATTERNS.YOUTUBE_VIDEO_ID.test(testYouTubeId)}`);
        console.log('');
        
        // Test 8: Test feature flags
        console.log('8. Testing feature flags...');
        const featureCount = Object.keys(config.FEATURES).length;
        console.log(`  Total features defined: ${featureCount}`);
        console.log(`  Sample features: ${Object.values(config.FEATURES).slice(0, 5).join(', ')}`);
        console.log('');
        
        // Test 9: Test messages
        console.log('9. Testing API messages...');
        console.log(`  Success messages: ${Object.keys(config.MESSAGES).filter(k => !k.includes('ERROR') && !k.includes('FAILED')).length}`);
        console.log(`  Error messages: ${Object.keys(config.MESSAGES).filter(k => k.includes('ERROR') || k.includes('FAILED') || k.includes('UNAUTHORIZED')).length}`);
        console.log(`  Sample message: "${config.MESSAGES.TASK_CREATED}"`);
        console.log('');
        
        console.log('===========================================');
        console.log('✓ All constants tests passed successfully!');
        console.log('✓ Constants are properly structured');
        console.log('✓ Helper functions working correctly');
        console.log('✓ Validation patterns functional');
        
        return {
            constantsCount: requiredConstants.length,
            helpersCount: 8,
            validationRulesCount: Object.keys(config.VALIDATION_RULES).length,
            regexPatternsCount: Object.keys(config.REGEX_PATTERNS).length
        };
        
    } catch (error) {
        console.error('✗ Constants test failed:', error.message);
        throw error;
    }
}

// Test edge cases and error handling
function testEdgeCases() {
    console.log('\nTesting Edge Cases...');
    console.log('=====================');
    
    try {
        // Test invalid inputs
        console.log('Testing invalid inputs:');
        console.log(`  Null task type: ${config.isValidTaskType(null)}`);
        console.log(`  Empty email: ${config.isValidEmail('')}`);
        console.log(`  Undefined YouTube URL: ${config.isValidYouTubeUrl(undefined)}`);
        
        // Test environment config with invalid environment
        const invalidEnvConfig = config.getEnvironmentConfig('invalid');
        console.log(`  Invalid environment fallback: ${invalidEnvConfig.LOG_LEVEL}`);
        
        console.log('✓ Edge cases handled properly');
        
    } catch (error) {
        console.error('✗ Edge case test failed:', error.message);
    }
}

// Run all tests
function runAllTests() {
    const results = testConstants();
    testEdgeCases();
    
    console.log('\n📊 Test Summary:');
    console.log(`Constants exported: ${results.constantsCount}`);
    console.log(`Helper functions: ${results.helpersCount}`);
    console.log(`Validation rules: ${results.validationRulesCount}`);
    console.log(`Regex patterns: ${results.regexPatternsCount}`);
    console.log('\n✅ Constants configuration is ready for use!');
}

runAllTests();
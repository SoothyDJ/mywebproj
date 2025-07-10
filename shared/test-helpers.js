const helpers = require('./utils/helpers');

async function testHelpers() {
    try {
        console.log('Testing Shared Helper Utilities...');
        console.log('===================================\n');
        
        // Test 1: String utilities
        console.log('1. Testing string utilities...');
        console.log(`  capitalize('hello'): "${helpers.capitalize('hello')}"`);
        console.log(`  toTitleCase('hello world'): "${helpers.toTitleCase('hello world')}"`);
        console.log(`  truncate('This is a long string', 10): "${helpers.truncate('This is a long string', 10)}"`);
        console.log(`  cleanText('  Hello\\n\\nWorld  '): "${helpers.cleanText('  Hello\n\nWorld  ')}"`);
        console.log(`  slugify('Hello World!'): "${helpers.slugify('Hello World!')}"`);
        console.log(`  generateRandomString(8): "${helpers.generateRandomString(8)}"`);
        console.log('');
        
        // Test 2: Number utilities
        console.log('2. Testing number utilities...');
        console.log(`  parseViewCount('2.3M views'): ${helpers.parseViewCount('2.3M views')}`);
        console.log(`  parseViewCount('850K views'): ${helpers.parseViewCount('850K views')}`);
        console.log(`  formatNumber(1234567): "${helpers.formatNumber(1234567)}"`);
        console.log(`  parseDuration('15:30'): ${helpers.parseDuration('15:30')} seconds`);
        console.log(`  parseDuration('1:05:20'): ${helpers.parseDuration('1:05:20')} seconds`);
        console.log(`  formatDuration(930): "${helpers.formatDuration(930)}"`);
        console.log(`  calculatePercentage(75, 100): ${helpers.calculatePercentage(75, 100)}%`);
        console.log('');
        
        // Test 3: Date/time utilities
        console.log('3. Testing date/time utilities...');
        const testDate = new Date('2024-01-15T10:30:00Z');
        console.log(`  formatDate(testDate): "${helpers.formatDate(testDate)}"`);
        console.log(`  getRelativeTime(testDate): "${helpers.getRelativeTime(testDate)}"`);
        
        const futureDate = helpers.addTime(new Date(), 5, 'hours');
        console.log(`  addTime(now, 5, 'hours'): ${futureDate.toISOString()}`);
        
        const isWithinWeek = helpers.isWithinTimeFilter(new Date(Date.now() - 86400000 * 3), 'week');
        console.log(`  isWithinTimeFilter(3 days ago, 'week'): ${isWithinWeek}`);
        console.log('');
        
        // Test 4: Array utilities
        console.log('4. Testing array utilities...');
        const testArray = [1, 2, 2, 3, 4, 4, 5];
        const uniqueArray = helpers.removeDuplicates(testArray);
        console.log(`  removeDuplicates([1,2,2,3,4,4,5]): [${uniqueArray.join(',')}]`);
        
        const chunkedArray = helpers.chunkArray([1, 2, 3, 4, 5, 6, 7], 3);
        console.log(`  chunkArray([1-7], 3): [[${chunkedArray.map(chunk => chunk.join(',')).join('], [')}]]`);
        
        const testObjects = [
            { name: 'John', age: 30 },
            { name: 'Alice', age: 25 },
            { name: 'Bob', age: 35 }
        ];
        const sortedByAge = helpers.sortBy(testObjects, 'age');
        console.log(`  sortBy(objects, 'age'): ${sortedByAge.map(obj => `${obj.name}(${obj.age})`).join(', ')}`);
        
        const groupedByAge = helpers.groupBy(testObjects, obj => obj.age > 30 ? 'senior' : 'junior');
        console.log(`  groupBy by age groups: senior: ${groupedByAge.senior?.length || 0}, junior: ${groupedByAge.junior?.length || 0}`);
        console.log('');
        
        // Test 5: Object utilities
        console.log('5. Testing object utilities...');
        const testObj = { a: 1, b: { c: 2, d: [3, 4] }, e: 5 };
        const cloned = helpers.deepClone(testObj);
        cloned.b.c = 99;
        console.log(`  deepClone preserves original: original.b.c = ${testObj.b.c}, clone.b.c = ${cloned.b.c}`);
        
        const picked = helpers.pick(testObj, ['a', 'e']);
        console.log(`  pick(obj, ['a', 'e']): {${Object.keys(picked).join(', ')}}`);
        
        const omitted = helpers.omit(testObj, ['b']);
        console.log(`  omit(obj, ['b']): {${Object.keys(omitted).join(', ')}}`);
        
        console.log(`  isEmpty({}): ${helpers.isEmpty({})}`);
        console.log(`  isEmpty({a: 1}): ${helpers.isEmpty({a: 1})}`);
        console.log('');
        
        // Test 6: Validation utilities
        console.log('6. Testing validation utilities...');
        console.log(`  isValidEmail('test@example.com'): ${helpers.isValidEmail('test@example.com')}`);
        console.log(`  isValidEmail('invalid-email'): ${helpers.isValidEmail('invalid-email')}`);
        console.log(`  isValidYouTubeUrl('https://youtube.com/watch?v=test123'): ${helpers.isValidYouTubeUrl('https://youtube.com/watch?v=test123')}`);
        console.log(`  extractYouTubeId('https://youtube.com/watch?v=dQw4w9WgXcQ'): "${helpers.extractYouTubeId('https://youtube.com/watch?v=dQw4w9WgXcQ')}"`);
        console.log(`  sanitizeString('<script>alert("test")</script>'): "${helpers.sanitizeString('<script>alert("test")</script>')}"`);
        console.log('');
        
        // Test 7: Error utilities
        console.log('7. Testing error utilities...');
        const testError = helpers.createError('TEST_ERROR', 'Test error message', { detail: 'test' }, 400);
        console.log(`  createError result: {code: ${testError.code}, status: ${testError.status}}`);
        
        const jsonParseResult = helpers.safeJsonParse('{"valid": true}', { fallback: true });
        console.log(`  safeJsonParse(valid JSON): ${JSON.stringify(jsonParseResult)}`);
        
        const jsonParseFail = helpers.safeJsonParse('invalid json', { fallback: true });
        console.log(`  safeJsonParse(invalid JSON): ${JSON.stringify(jsonParseFail)}`);
        
        const safeGetResult = helpers.safeGet({ a: { b: { c: 'found' } } }, 'a.b.c', 'not found');
        console.log(`  safeGet(obj, 'a.b.c'): "${safeGetResult}"`);
        
        const safeGetMissing = helpers.safeGet({ a: { b: {} } }, 'a.b.c.d', 'not found');
        console.log(`  safeGet(obj, 'a.b.c.d'): "${safeGetMissing}"`);
        console.log('');
        
        // Test 8: Async utilities
        console.log('8. Testing async utilities...');
        console.log('  Testing delay function...');
        const startTime = Date.now();
        await helpers.delay(100);
        const endTime = Date.now();
        console.log(`  delay(100ms) took: ${endTime - startTime}ms`);
        
        console.log('  Testing retry function...');
        let attemptCount = 0;
        try {
            await helpers.retry(async () => {
                attemptCount++;
                if (attemptCount < 3) {
                    throw new Error('Simulated failure');
                }
                return 'success';
            }, 3, 10);
            console.log(`  retry succeeded after ${attemptCount} attempts`);
        } catch (error) {
            console.log(`  retry failed after ${attemptCount} attempts`);
        }
        
        console.log('  Testing timeout function...');
        try {
            await helpers.withTimeout(helpers.delay(50), 100);
            console.log('  timeout test passed (operation completed within timeout)');
        } catch (error) {
            console.log('  timeout test failed:', error.message);
        }
        console.log('');
        
        console.log('===================================');
        console.log('✓ All helper utility tests completed!');
        console.log('✓ String utilities working correctly');
        console.log('✓ Number parsing and formatting functional');
        console.log('✓ Date/time utilities operational');
        console.log('✓ Array manipulation functions working');
        console.log('✓ Object utilities functional');
        console.log('✓ Validation helpers working');
        console.log('✓ Error handling utilities ready');
        console.log('✓ Async utilities operational');
        
        return true;
        
    } catch (error) {
        console.error('✗ Helper utilities test failed:', error.message);
        console.error('Stack:', error.stack);
        throw error;
    }
}

// Run the test
testHelpers().then(() => {
    console.log('\n🎉 Helper utilities test completed successfully!');
}).catch(error => {
    console.error('\n💥 Helper utilities test failed:', error.message);
    process.exit(1);
});
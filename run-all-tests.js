// File Path: /run-all-tests.js
// Comprehensive test runner for all project test files
// REF-088: Based on actual project test files

const { exec } = require('child_process');
const path = require('path');

// All test files we created (starting with test-)
const tests = [
    // AI Services Tests
    { name: 'OpenAI Service', dir: 'ai-services', file: 'test-openai.js' },
    { name: 'Claude Service', dir: 'ai-services', file: 'test-claude.js' },
    { name: 'Content Analyzer', dir: 'ai-services', file: 'test-analyzer.js' },
    { name: 'Report Generator', dir: 'ai-services', file: 'test-report-generator.js' },
    { name: 'Performance Test', dir: 'ai-services', file: 'test-performance.js' },
    { name: 'Storyboard Generator', dir: 'ai-services', file: 'test-storyboard-generator.js' },
    { name: 'Video Analyzer', dir: 'ai-services', file: 'test-video-analyzer.js' },
    
    // Backend Tests
    { name: 'Database Connection', dir: 'backend', file: 'test-connection.js' },
    { name: 'API Endpoints', dir: 'backend', file: 'test-api.js' },
    { name: 'Task Model', dir: 'backend', file: 'test-task-model.js' },
    { name: 'User Model', dir: 'backend', file: 'test-user-model.js' },
    { name: 'Video Model', dir: 'backend', file: 'test-video-model.js' },
    { name: 'Auth System', dir: 'backend', file: 'test-auth.js' },
    { name: 'Auth Middleware', dir: 'backend', file: 'test-auth-middleware.js' },
    { name: 'AI Service Integration', dir: 'backend', file: 'test-ai-service.js' },
    { name: 'AI Config', dir: 'backend', file: 'test-ai-config.js' },
    { name: 'HTML Report API', dir: 'backend', file: 'test-html-report-api.js' },
    { name: 'Integration Tests', dir: 'backend', file: 'test-integration.js' },
    { name: 'Logger', dir: 'backend', file: 'test-logger.js' },
    { name: 'Routes Index', dir: 'backend', file: 'test-routes-index.js' },
    
    // Scraping Tests
    { name: 'YouTube Scraper', dir: 'scraping', file: 'test-scraper.js' },
    { name: 'Reddit Scraper', dir: 'scraping', file: 'test-reddit-scraper.js' },
    { name: 'YouTube Parser', dir: 'scraping', file: 'test-youtube-parser.js' },
    { name: 'Reddit Parser', dir: 'scraping', file: 'test-reddit-parser.js' },
    { name: 'Browser Setup', dir: 'scraping', file: 'test-browser-setup.js' },
    
    // Config Tests
    { name: 'Config Loader', dir: 'config', file: 'test-config-loader.js' },
    { name: 'Config System', dir: 'config', file: 'test-config.js' },
    { name: 'All Configs', dir: 'config', file: 'test-configs.js' },
    { name: 'AI Config (Config)', dir: 'config', file: 'test-ai-config.js' },
    
    // Shared Tests
    { name: 'Constants', dir: 'shared', file: 'test-constants.js' },
    { name: 'Constants Integration', dir: 'shared', file: 'test-constants-integration.js' },
    { name: 'Helpers', dir: 'shared', file: 'test-helpers.js' },
    { name: 'Validation', dir: 'shared', file: 'test-validation.js' }
];

// Test categories for organized running
const testCategories = {
    core: ['Database Connection', 'API Endpoints', 'Task Model'],
    scraping: ['YouTube Scraper', 'Reddit Scraper', 'YouTube Parser'],
    ai: ['OpenAI Service', 'Claude Service', 'Content Analyzer', 'Report Generator'],
    auth: ['Auth System', 'Auth Middleware', 'User Model'],
    integration: ['Integration Tests', 'AI Service Integration'],
    config: ['Config Loader', 'Config System', 'All Configs'],
    shared: ['Constants', 'Helpers', 'Validation']
};

async function runTest(test) {
    return new Promise((resolve) => {
        console.log(`\n🔄 Running ${test.name}...`);
        
        const command = `cd ${test.dir} && node ${test.file}`;
        const startTime = Date.now();
        
        exec(command, (error, stdout, stderr) => {
            const duration = Date.now() - startTime;
            
            if (error) {
                console.log(`❌ ${test.name} FAILED (${duration}ms)`);
                console.log(`📁 Directory: ${test.dir}`);
                console.log(`📄 File: ${test.file}`);
                console.log(`🚨 Error: ${stderr || error.message}`);
                resolve({ success: false, test: test.name, duration, error: stderr || error.message });
            } else {
                console.log(`✅ ${test.name} PASSED (${duration}ms)`);
                if (stdout && stdout.includes('✓')) {
                    // Show successful test output summary
                    const lines = stdout.split('\n').filter(line => line.includes('✓')).slice(0, 3);
                    lines.forEach(line => console.log(`   ${line.trim()}`));
                }
                resolve({ success: true, test: test.name, duration });
            }
        });
    });
}

async function runTestCategory(categoryName, testNames) {
    console.log(`\n🎯 RUNNING ${categoryName.toUpperCase()} TESTS`);
    console.log('='.repeat(50));
    
    const categoryTests = tests.filter(test => testNames.includes(test.name));
    const results = [];
    
    for (const test of categoryTests) {
        const result = await runTest(test);
        results.push(result);
        
        // Short delay between tests
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    return results;
}

async function runAllTests() {
    console.log('🚀 COMPREHENSIVE TEST SUITE STARTING...');
    console.log('==========================================\n');
    
    const allResults = [];
    let totalPassed = 0;
    let totalFailed = 0;
    const startTime = Date.now();
    
    // Run tests by category
    for (const [categoryName, testNames] of Object.entries(testCategories)) {
        const categoryResults = await runTestCategory(categoryName, testNames);
        allResults.push(...categoryResults);
        
        const passed = categoryResults.filter(r => r.success).length;
        const failed = categoryResults.filter(r => !r.success).length;
        
        console.log(`\n📊 ${categoryName.toUpperCase()} SUMMARY: ${passed} passed, ${failed} failed`);
        
        totalPassed += passed;
        totalFailed += failed;
        
        // Delay between categories
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Run remaining tests not in categories
    const categorizedTestNames = Object.values(testCategories).flat();
    const remainingTests = tests.filter(test => !categorizedTestNames.includes(test.name));
    
    if (remainingTests.length > 0) {
        console.log(`\n🔧 RUNNING ADDITIONAL TESTS`);
        console.log('='.repeat(50));
        
        for (const test of remainingTests) {
            const result = await runTest(test);
            allResults.push(result);
            
            if (result.success) totalPassed++;
            else totalFailed++;
            
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
    
    const totalTime = Date.now() - startTime;
    
    // Final Summary
    console.log('\n' + '='.repeat(60));
    console.log('🏁 FINAL TEST RESULTS');
    console.log('='.repeat(60));
    console.log(`✅ Total Passed: ${totalPassed}`);
    console.log(`❌ Total Failed: ${totalFailed}`);
    console.log(`📈 Success Rate: ${Math.round(totalPassed / (totalPassed + totalFailed) * 100)}%`);
    console.log(`⏱️ Total Time: ${Math.round(totalTime / 1000)}s`);
    console.log(`📊 Tests Run: ${allResults.length}`);
    
    // Show failed tests
    const failedTests = allResults.filter(r => !r.success);
    if (failedTests.length > 0) {
        console.log('\n❌ FAILED TESTS:');
        failedTests.forEach(test => {
            console.log(`   • ${test.test}: ${test.error?.substring(0, 100)}...`);
        });
    }
    
    // Show slowest tests
    const slowestTests = allResults
        .sort((a, b) => b.duration - a.duration)
        .slice(0, 5);
    
    console.log('\n⏱️ SLOWEST TESTS:');
    slowestTests.forEach(test => {
        console.log(`   • ${test.test}: ${test.duration}ms`);
    });
    
    if (totalFailed === 0) {
        console.log('\n🎉 ALL TESTS PASSED! Your backend is fully functional!');
        console.log('✨ Ready for frontend development!');
    } else {
        console.log('\n⚠️ Some tests failed. Fix these before proceeding:');
        failedTests.forEach(test => {
            console.log(`   🔧 ${test.test}`);
        });
    }
    
    console.log('\n📝 TIP: Run individual test categories with:');
    console.log('   node run-all-tests.js --category=core');
    console.log('   node run-all-tests.js --category=ai');
    
    return allResults;
}

// Handle command line arguments
const args = process.argv.slice(2);
const categoryArg = args.find(arg => arg.startsWith('--category='));

if (categoryArg) {
    const categoryName = categoryArg.split('=')[1];
    if (testCategories[categoryName]) {
        runTestCategory(categoryName, testCategories[categoryName]);
    } else {
        console.log(`❌ Unknown category: ${categoryName}`);
        console.log(`Available categories: ${Object.keys(testCategories).join(', ')}`);
    }
} else {
    runAllTests();
}
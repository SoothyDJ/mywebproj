const BrowserSetup = require('./utils/browser-setup');

async function testBrowserSetup() {
    const browserSetup = new BrowserSetup();
    
    try {
        console.log('Testing Browser Setup utilities...');
        
        // Test the browser setup
        await browserSetup.test();
        
        console.log('\n✓ Browser Setup test completed successfully!');
        
    } catch (error) {
        console.error('✗ Browser Setup test failed:', error.message);
    }
}

testBrowserSetup();
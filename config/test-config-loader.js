// File Path: /config/test-config-loader.js
// Test configuration loading with environment variables
// REF-102: Fixed corrupted CDATASection code

require('dotenv').config({ path: '../backend/.env' });

function testConfigLoader() {
    try {
        console.log('Testing Configuration Loader...');
        console.log('===================================\n');
        
        // Test loading with current environment
        const env = process.env.NODE_ENV || 'development';
        console.log(`Current environment: ${env}`);
        
        // Load config based on environment
        const configFile = env === 'production' ? './production.json' : './development.json';
        const config = require(configFile);
        
        console.log('Loaded configuration sections:');
        console.log(`  - Server: ${config.server ? '✓' : '✗'}`);
        console.log(`  - Database: ${config.database ? '✓' : '✗'}`);
        console.log(`  - AI: ${config.ai ? '✓' : '✗'}`);
        console.log(`  - Scraping: ${config.scraping ? '✓' : '✗'}`);
        console.log(`  - Security: ${config.security ? '✓' : '✗'}`);
        
        // Test environment variable substitution simulation
        console.log('\nTesting environment variable substitution:');
        if (env === 'development') {
            console.log(`  Database host: ${config.database.host}`);
            console.log(`  Server port: ${config.database.port}`);
            console.log(`  AI default provider: ${config.ai.defaultProvider}`);
        } else {
            console.log('  Production config uses environment variables (${VAR} format)');
            console.log('  This would be resolved at runtime with actual env values');
        }
        
        console.log('\n✓ Configuration loader test completed!');
        return config;
        
    } catch (error) {
        console.error('✗ Configuration loader test failed:', error.message);
        throw error;
    }
}

testConfigLoader();
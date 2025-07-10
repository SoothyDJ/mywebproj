const fs = require('fs');
const path = require('path');

function testDatabaseConfig() {
    try {
        console.log('Testing database configuration...');
        
        // Read the database config
        const configPath = path.join(__dirname, 'database.json');
        const configContent = fs.readFileSync(configPath, 'utf8');
        
        // Parse JSON
        const config = JSON.parse(configContent);
        
        // Test structure
        const environments = ['development', 'test', 'production'];
        const requiredFields = ['host', 'port', 'database', 'username', 'password', 'dialect'];
        
        console.log('✓ Database config file loaded successfully');
        
        environments.forEach(env => {
            if (!config[env]) {
                throw new Error(`Missing ${env} environment config`);
            }
            
            requiredFields.forEach(field => {
                if (!config[env][field]) {
                    throw new Error(`Missing ${field} in ${env} config`);
                }
            });
            
            console.log(`✓ ${env} environment config valid`);
        });
        
        // Test development config specifically
        const devConfig = config.development;
        console.log('Development config:');
        console.log(`  Host: ${devConfig.host}`);
        console.log(`  Port: ${devConfig.port}`);
        console.log(`  Database: ${devConfig.database}`);
        console.log(`  Max connections: ${devConfig.pool.max}`);
        
        console.log('\n✓ Database configuration test passed!');
        return config;
        
    } catch (error) {
        console.error('✗ Database config test failed:', error.message);
        throw error;
    }
}

testDatabaseConfig();
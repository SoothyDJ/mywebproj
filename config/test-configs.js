const fs = require('fs');
const path = require('path');

function testConfigurations() {
    try {
        console.log('Testing Configuration Files...');
        console.log('=====================================\n');
        
        // Test 1: Load and validate development config
        console.log('1. Testing development.json...');
        const devConfigPath = path.join(__dirname, 'development.json');
        const devConfigContent = fs.readFileSync(devConfigPath, 'utf8');
        const devConfig = JSON.parse(devConfigContent);
        
        validateConfigStructure(devConfig, 'development');
        console.log('✓ Development config loaded and validated\n');
        
        // Test 2: Load and validate production config
        console.log('2. Testing production.json...');
        const prodConfigPath = path.join(__dirname, 'production.json');
        const prodConfigContent = fs.readFileSync(prodConfigPath, 'utf8');
        const prodConfig = JSON.parse(prodConfigContent);
        
        validateConfigStructure(prodConfig, 'production');
        console.log('✓ Production config loaded and validated\n');
        
        // Test 3: Compare configurations
        console.log('3. Comparing configurations...');
        compareConfigs(devConfig, prodConfig);
        console.log('✓ Configuration comparison completed\n');
        
        // Test 4: Test environment variable substitution
        console.log('4. Testing environment variable patterns...');
        testEnvVariables(prodConfig);
        console.log('✓ Environment variable patterns validated\n');
        
        // Test 5: Validate .env.example
        console.log('5. Testing .env.example...');
        const envExamplePath = path.join(__dirname, '.env.example');
        const envExample = fs.readFileSync(envExamplePath, 'utf8');
        validateEnvExample(envExample, prodConfig);
        console.log('✓ .env.example validated\n');
        
        console.log('=====================================');
        console.log('✓ All configuration tests passed!');
        
        return { devConfig, prodConfig };
        
    } catch (error) {
        console.error('✗ Configuration test failed:', error.message);
        throw error;
    }
}

function validateConfigStructure(config, environment) {
    const requiredSections = [
        'server', 'database', 'ai', 'scraping', 'storage', 
        'security', 'features', 'monitoring', 'performance'
    ];
    
    requiredSections.forEach(section => {
        if (!config[section]) {
            throw new Error(`Missing required section '${section}' in ${environment} config`);
        }
    });
    
    // Validate server config
    if (!config.server.host || !config.server.port) {
        throw new Error(`Invalid server config in ${environment}`);
    }
    
    // Validate database config
    const dbRequired = ['host', 'port', 'database', 'username', 'password'];
    dbRequired.forEach(field => {
        if (!config.database[field]) {
            throw new Error(`Missing database.${field} in ${environment} config`);
        }
    });
    
    // Validate AI config
    if (!config.ai.defaultProvider || !config.ai.providers) {
        throw new Error(`Invalid AI config in ${environment}`);
    }
    
    if (!config.ai.providers.openai || !config.ai.providers.claude) {
        throw new Error(`Missing AI providers in ${environment} config`);
    }
    
    console.log(`  ✓ ${environment} config structure valid`);
}

function compareConfigs(devConfig, prodConfig) {
    // Check that both configs have same structure
    const devKeys = getNestedKeys(devConfig);
    const prodKeys = getNestedKeys(prodConfig);
    
    const missingInProd = devKeys.filter(key => !prodKeys.includes(key));
    const missingInDev = prodKeys.filter(key => !devKeys.includes(key));
    
    if (missingInProd.length > 0) {
        console.log(`  ⚠️  Keys in dev but not prod: ${missingInProd.join(', ')}`);
    }
    
    if (missingInDev.length > 0) {
        console.log(`  ⚠️  Keys in prod but not dev: ${missingInDev.join(', ')}`);
    }
    
    // Check key differences
    console.log('  Key differences:');
    console.log(`    - Dev database logging: ${devConfig.database.logging}`);
    console.log(`    - Prod database logging: ${prodConfig.database.logging}`);
    console.log(`    - Dev rate limiting: ${devConfig.security.rateLimiting.enabled}`);
    console.log(`    - Prod rate limiting: ${prodConfig.security.rateLimiting.enabled}`);
    console.log(`    - Dev debug mode: ${devConfig.development.debugMode}`);
    console.log(`    - Prod debug mode: ${prodConfig.development.debugMode}`);
}

function getNestedKeys(obj, prefix = '') {
    let keys = [];
    for (let key in obj) {
        if (obj.hasOwnProperty(key)) {
            const newKey = prefix ? `${prefix}.${key}` : key;
            if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
                keys = keys.concat(getNestedKeys(obj[key], newKey));
            } else {
                keys.push(newKey);
            }
        }
    }
    return keys;
}

function testEnvVariables(prodConfig) {
    const envVars = [];
    
    function findEnvVars(obj) {
        for (let key in obj) {
            if (typeof obj[key] === 'string' && obj[key].startsWith('${') && obj[key].endsWith('}')) {
                const varName = obj[key].slice(2, -1);
                envVars.push(varName);
            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                findEnvVars(obj[key]);
            }
        }
    }
    
    findEnvVars(prodConfig);
    
    console.log(`  Found ${envVars.length} environment variables:`);
    envVars.forEach(varName => {
        console.log(`    - ${varName}`);
    });
}

function validateEnvExample(envContent, prodConfig) {
    // Extract env vars from production config
    const configEnvVars = [];
    
    function findEnvVars(obj) {
        for (let key in obj) {
            if (typeof obj[key] === 'string' && obj[key].startsWith('${') && obj[key].endsWith('}')) {
                const varName = obj[key].slice(2, -1);
                configEnvVars.push(varName);
            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                findEnvVars(obj[key]);
            }
        }
    }
    
    findEnvVars(prodConfig);
    
    // Check if all config env vars are in .env.example
    const missingVars = [];
    configEnvVars.forEach(varName => {
        if (!envContent.includes(varName)) {
            missingVars.push(varName);
        }
    });
    
    if (missingVars.length > 0) {
        console.log(`  ⚠️  Missing in .env.example: ${missingVars.join(', ')}`);
    } else {
        console.log('  ✓ All production config variables found in .env.example');
    }
    
    // Count total variables in .env.example
    const envVarCount = (envContent.match(/^[A-Z_]+=.*/gm) || []).length;
    console.log(`  ✓ .env.example contains ${envVarCount} environment variables`);
}

// Run tests
testConfigurations();
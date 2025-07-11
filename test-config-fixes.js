const { exec } = require('child_process');

const failedTests = [
    { name: 'Config Loader', dir: 'config', file: 'test-config-loader.js' },
    { name: 'AI Config (Config)', dir: 'config', file: 'test-ai-config.js' }
];

async function testConfigFixes() {
    console.log('🔧 TESTING CONFIG FIXES...');
    console.log('=============================\n');
    
    for (const test of failedTests) {
        console.log(`🔄 Testing ${test.name}...`);
        
        const command = `cd ${test.dir} && node ${test.file}`;
        
        try {
            const { stdout, stderr } = await new Promise((resolve, reject) => {
                exec(command, (error, stdout, stderr) => {
                    if (error) reject({ error, stderr });
                    else resolve({ stdout, stderr });
                });
            });
            
            console.log(`✅ ${test.name} FIXED!`);
            if (stdout.includes('✓')) {
                const lines = stdout.split('\n').filter(line => line.includes('✓')).slice(0, 2);
                lines.forEach(line => console.log(`   ${line.trim()}`));
            }
        } catch (err) {
            console.log(`❌ ${test.name} still failing:`);
            console.log(`   ${err.stderr || err.error.message}`);
        }
        
        console.log('');
    }
}

testConfigFixes();
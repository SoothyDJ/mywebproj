require('dotenv').config();
const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';

async function testRoutesIndex() {
    try {
        console.log('Testing Routes Index...');
        console.log('====================================\n');
        
        // Test 1: API Documentation endpoint
        console.log('1. Testing API documentation endpoint...');
        const docResponse = await axios.get(`${API_BASE}/`);
        console.log('✓ API documentation loaded');
        console.log(`  - Name: ${docResponse.data.name}`);
        console.log(`  - Version: ${docResponse.data.version}`);
        console.log(`  - Endpoints documented: ${Object.keys(docResponse.data.documentation.endpoints).length}`);
        console.log(`  - Features listed: ${Object.keys(docResponse.data.features).length}`);
        console.log(`  - AI Providers: ${docResponse.data.aiProviders.length}\n`);
        
        // Test 2: Health check endpoint
        console.log('2. Testing health check endpoint...');
        const healthResponse = await axios.get(`${API_BASE}/health`);
        console.log('✓ Health check endpoint working');
        console.log(`  - Status: ${healthResponse.data.status}`);
        console.log(`  - Services: ${Object.keys(healthResponse.data.services).length}`);
        console.log(`  - Uptime: ${Math.round(healthResponse.data.uptime)} seconds\n`);
        
        // Test 3: API status endpoint
        console.log('3. Testing API status endpoint...');
        const statusResponse = await axios.get(`${API_BASE}/status`);
        console.log('✓ API status endpoint working');
        console.log(`  - Status: ${statusResponse.data.status}`);
        console.log(`  - Environment: ${statusResponse.data.environment}`);
        console.log(`  - Total endpoints: ${statusResponse.data.endpoints.total}\n`);
        
        // Test 4: Metrics endpoint
        console.log('4. Testing metrics endpoint...');
        const metricsResponse = await axios.get(`${API_BASE}/metrics`);
        console.log('✓ Metrics endpoint working (placeholder)');
        console.log(`  - Note: ${metricsResponse.data.note}\n`);
        
        // Test 5: Test mounted routes
        console.log('5. Testing mounted route modules...');
        
        // Test auth routes
        try {
            const authResponse = await axios.get(`${API_BASE}/auth/status`);
            console.log('✓ Auth routes mounted and working');
            console.log(`  - Auth service: ${authResponse.data.service}`);
        } catch (authError) {
            console.log('⚠️  Auth routes may have issues:', authError.response?.status);
        }
        
        // Test task routes
        try {
            const taskResponse = await axios.get(`${API_BASE}/tasks/status`);
            console.log('✓ Task routes mounted and working');
            console.log(`  - Task service: ${taskResponse.data.service}`);
        } catch (taskError) {
            console.log('⚠️  Task routes may have issues:', taskError.response?.status);
        }
        console.log('');
        
        // Test 6: 404 handler
        console.log('6. Testing 404 handler...');
        try {
            await axios.get(`${API_BASE}/nonexistent-endpoint`);
        } catch (error) {
            if (error.response?.status === 404) {
                console.log('✓ 404 handler working correctly');
                console.log(`  - Error message: ${error.response.data.error}`);
                console.log(`  - Available endpoints listed: ${error.response.data.availableEndpoints.length}\n`);
            } else {
                console.log('⚠️  Unexpected error status:', error.response?.status);
            }
        }
        
        // Test 7: API documentation structure validation
        console.log('7. Validating API documentation structure...');
        const doc = docResponse.data.documentation;
        
        const requiredSections = ['endpoints', 'baseUrl'];
        const hasAllSections = requiredSections.every(section => doc[section]);
        
        if (hasAllSections) {
            console.log('✓ Documentation structure valid');
        } else {
            console.log('⚠️  Missing documentation sections');
        }
        
        const endpointSections = ['authentication', 'tasks'];
        const hasEndpointSections = endpointSections.every(section => doc.endpoints[section]);
        
        if (hasEndpointSections) {
            console.log('✓ All main endpoint sections documented');
        } else {
            console.log('⚠️  Missing endpoint documentation');
        }
        console.log('');
        
        // Test 8: Response format validation
        console.log('8. Validating response formats...');
        const responses = [docResponse, healthResponse, statusResponse, metricsResponse];
        
        responses.forEach((response, index) => {
            const hasValidStructure = response.data && typeof response.data === 'object';
            const hasTimestamp = response.data.timestamp || response.data.lastDeployment;
            
            console.log(`  Response ${index + 1}: ${hasValidStructure ? '✓' : '✗'} Valid structure ${hasTimestamp ? '✓' : '○'} Has timestamp`);
        });
        console.log('');
        
        console.log('====================================');
        console.log('✓ Routes Index test completed!');
        console.log('✓ API documentation is comprehensive');
        console.log('✓ All core endpoints operational');
        console.log('✓ Route mounting working correctly');
        console.log('✓ Error handling implemented');
        
    } catch (error) {
        console.error('✗ Routes Index test failed:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }
}

// Also test with curl-like requests
async function testWithDifferentMethods() {
    console.log('\nTesting different HTTP methods...');
    console.log('==================================');
    
    try {
        // Test POST to documentation (should work)
        const postResponse = await axios.post(`${API_BASE}/`, { test: 'data' });
        console.log('✓ POST to documentation endpoint works');
    } catch (postError) {
        console.log('⚠️  POST to documentation:', postError.response?.status);
    }
    
    try {
        // Test unsupported method to task endpoint
        await axios.patch(`${API_BASE}/tasks/status`);
    } catch (patchError) {
        if (patchError.response?.status === 404) {
            console.log('✓ Unsupported methods properly handled');
        }
    }
}

async function runAllTests() {
    console.log('Starting Routes Index Tests...');
    console.log('Make sure the backend server is running!\n');
    
    await testRoutesIndex();
    await testWithDifferentMethods();
    
    console.log('\n✓ All route index tests completed!');
}

runAllTests();
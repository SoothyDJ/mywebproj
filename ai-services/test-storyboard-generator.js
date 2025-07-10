require('dotenv').config({ path: '../backend/.env' });
const StoryboardGenerator = require('./generators/storyboard-generator');

async function testStoryboardGenerator() {
    try {
        console.log('Testing Storyboard Generator with OpenAI...');
        
        // Test with OpenAI
        const openaiGenerator = new StoryboardGenerator({
            aiProvider: 'openai',
            templateStyle: 'professional',
            defaultScenes: 5,
            includeTimestamps: true,
            includeTransitions: true
        });
        
        await openaiGenerator.test();
        
        console.log('\n' + '='.repeat(50));
        console.log('Testing Storyboard Generator with Claude...');
        
        // Test with Claude
        const claudeGenerator = new StoryboardGenerator({
            aiProvider: 'claude',
            templateStyle: 'educational',
            defaultScenes: 6
        });
        
        await claudeGenerator.test();
        
        console.log('\n' + '='.repeat(50));
        console.log('Testing template selection...');
        
        // Test different content types
        const testCases = [
            { title: 'How to Cook Pasta', type: 'tutorial' },
            { title: 'Breaking News Update', type: 'news' },
            { title: 'Ghost Investigation', type: 'horror' },
            { title: 'Science Explained', type: 'educational' }
        ];
        
        testCases.forEach(testCase => {
            const generator = new StoryboardGenerator();
            const sampleVideo = { title: testCase.title, duration: '5:00' };
            const sampleAnalysis = { contentType: testCase.type };
            const contentType = generator.determineContentType(sampleVideo, sampleAnalysis);
            console.log(`"${testCase.title}" → ${contentType} template`);
        });
        
        console.log('\n✓ Storyboard Generator test completed successfully!');
        
    } catch (error) {
        console.error('✗ Storyboard Generator test failed:', error.message);
    }
}

testStoryboardGenerator();
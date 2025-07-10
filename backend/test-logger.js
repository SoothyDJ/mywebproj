require('dotenv').config();
const { logger, errorHandler, performanceMonitor } = require('./utils/logger');

async function testLogger() {
    try {
        console.log('Testing Enhanced Logger System...');
        
        // Test basic logging levels
        logger.info('Logger system initialized');
        logger.debug('Debug message with context', { userId: 123, action: 'test' });
        logger.warn('Warning message', { component: 'test-suite' });
        
        // Test specialized logging
        logger.taskLog(456, 'info', 'Task processing started', { prompt: 'test prompt' });
        logger.aiLog('openai', 'info', 'API call successful', { tokens: 150 });
        logger.scraperLog('info', 'Video scraping completed', { videosFound: 10 });
        
        // Test error handling
        console.log('\nTesting error handling...');
        
        try {
            throw new Error('Database connection failed');
        } catch (error) {
            const errorDetails = errorHandler.handleError(error, { operation: 'database-connect' });
            console.log('Error categorized as:', errorDetails.category);
            console.log('Should retry?', errorHandler.shouldRetry(error, 1));
        }
        
        try {
            throw new Error('OpenAI rate limit exceeded');
        } catch (error) {
            const errorDetails = errorHandler.handleError(error, { service: 'openai' });
            console.log('Error categorized as:', errorDetails.category);
            console.log('Retry delay:', errorHandler.getRetryDelay(2), 'ms');
        }
        
        // Test performance monitoring
        console.log('\nTesting performance monitoring...');
        
        const opId1 = performanceMonitor.startOperation('video-analysis', { videoId: 'test123' });
        await new Promise(resolve => setTimeout(resolve, 100)); // Simulate work
        performanceMonitor.endOperation(opId1, true, { analysisComplete: true });
        
        const opId2 = performanceMonitor.startOperation('storyboard-generation', { scenes: 5 });
        await new Promise(resolve => setTimeout(resolve, 200)); // Simulate work
        performanceMonitor.endOperation(opId2, true, { storyboardGenerated: true });
        
        // Get metrics
        console.log('\nError Statistics:');
        console.log(JSON.stringify(errorHandler.getErrorStats(), null, 2));
        
        console.log('\nPerformance Metrics:');
        console.log(JSON.stringify(performanceMonitor.getMetrics(), null, 2));
        
        logger.info('Logger system test completed successfully');
        
    } catch (error) {
        logger.error('Logger test failed', { error: error.message, stack: error.stack });
    }
}

testLogger();
// File Path: /backend/test-integration.js
// Full workflow integration test: scraping → analysis → report generation
// REF-067: Complete integration test for the entire automation pipeline

require('dotenv').config();
const ContentAnalyzer = require('../ai-services/content-analyzer');
const ReportGenerator = require('../ai-services/generators/report-generator');
const DatabaseConnection = require('./database/connection');
const Task = require('./models/Task');
const fs = require('fs');
const path = require('path');

class IntegrationTest {
    constructor() {
        this.db = new DatabaseConnection();
        this.taskModel = new Task();
        this.analyzer = new ContentAnalyzer();
        this.reportGenerator = new ReportGenerator();
        this.testResults = {
            scraping: false,
            aiAnalysis: false,
            storyboardGeneration: false,
            databaseStorage: false,
            reportGeneration: false,
            fullWorkflow: false
        };
    }

    async runFullIntegrationTest() {
        console.log('🚀 Starting Full Workflow Integration Test');
        console.log('='.repeat(50));
        
        try {
            // Initialize database
            await this.db.connect();
            console.log('✓ Database connected');

            // Test 1: Content Analysis Workflow
            console.log('\n📋 Phase 1: Content Analysis Workflow');
            const analysisResults = await this.testContentAnalysis();
            
            // Test 2: Database Integration
            console.log('\n📋 Phase 2: Database Integration');
            const taskId = await this.testDatabaseIntegration(analysisResults);
            
            // Test 3: Report Generation
            console.log('\n📋 Phase 3: Report Generation');
            await this.testReportGeneration(analysisResults);
            
            // Test 4: API Integration Simulation
            console.log('\n📋 Phase 4: API Integration Simulation');
            await this.testAPIWorkflow(taskId);
            
            // Test 5: End-to-End Validation
            console.log('\n📋 Phase 5: End-to-End Validation');
            await this.validateEndToEnd();
            
            // Generate Test Report
            console.log('\n📋 Phase 6: Test Report Generation');
            await this.generateTestReport();
            
            console.log('\n🎉 INTEGRATION TEST COMPLETED SUCCESSFULLY!');
            this.printTestSummary();
            
        } catch (error) {
            console.error('\n❌ INTEGRATION TEST FAILED:', error.message);
            console.error('Stack trace:', error.stack);
        } finally {
            await this.cleanup();
        }
    }

    async testContentAnalysis() {
        try {
            console.log('  Testing content analysis workflow...');
            
            const testPrompt = "Find 3 videos about ghost encounters from the last week";
            
            // Step 1: Test scraping
            console.log('  → Testing YouTube scraping...');
            await this.analyzer.scraper.initialize();
            const searchParams = this.analyzer.parsePrompt(testPrompt);
            const videos = await this.analyzer.scraper.searchVideos(
                searchParams.query, 
                searchParams.timeFilter, 
                3
            );
            await this.analyzer.scraper.close();
            
            if (videos.length > 0) {
                this.testResults.scraping = true;
                console.log(`  ✓ Scraping successful: ${videos.length} videos found`);
                console.log(`    First video: "${videos[0].title}"`);
            } else {
                throw new Error('No videos found during scraping');
            }

            // Step 2: Test AI analysis
            console.log('  → Testing AI content analysis...');
            const sampleVideo = videos[0];
            const analysis = await this.analyzer.aiService.analyzeVideoContent(sampleVideo);
            
            if (analysis && analysis.summary) {
                this.testResults.aiAnalysis = true;
                console.log('  ✓ AI analysis successful');
                console.log(`    Summary: ${analysis.summary.substring(0, 100)}...`);
                console.log(`    Sentiment: ${analysis.sentiment}`);
                console.log(`    Themes: ${analysis.themes?.join(', ') || 'None'}`);
            } else {
                throw new Error('AI analysis failed or returned invalid data');
            }

            // Step 3: Test storyboard generation
            console.log('  → Testing storyboard generation...');
            const storyboard = await this.analyzer.aiService.generateStoryboard(sampleVideo, analysis);
            
            if (storyboard && storyboard.scenes && storyboard.scenes.length > 0) {
                this.testResults.storyboardGeneration = true;
                console.log('  ✓ Storyboard generation successful');
                console.log(`    Total scenes: ${storyboard.totalScenes}`);
                console.log(`    First scene: "${storyboard.scenes[0].sceneTitle || 'Untitled'}"`);
            } else {
                throw new Error('Storyboard generation failed');
            }

            // Step 4: Test full analyzer workflow
            console.log('  → Testing complete analyzer workflow...');
            const fullResults = await this.analyzer.analyzeContent(testPrompt);
            
            if (fullResults.videos.length > 0 && fullResults.analyses.length > 0) {
                console.log('  ✓ Complete workflow successful');
                console.log(`    Videos processed: ${fullResults.videos.length}`);
                console.log(`    Analyses completed: ${fullResults.analyses.length}`);
                console.log(`    Storyboards generated: ${fullResults.storyboards.length}`);
                
                return fullResults;
            } else {
                throw new Error('Complete workflow failed');
            }

        } catch (error) {
            console.error('  ❌ Content analysis test failed:', error.message);
            throw error;
        }
    }

    async testDatabaseIntegration(analysisResults) {
        try {
            console.log('  Testing database integration...');
            
            // Step 1: Create task
            console.log('  → Creating test task...');
            const task = await this.taskModel.create({
                userId: 1,
                prompt: 'Integration test task',
                taskType: 'youtube_scrape',
                parameters: { maxResults: 3 }
            });
            
            console.log(`  ✓ Task created with ID: ${task.id}`);

            // Step 2: Update task status
            console.log('  → Updating task status...');
            await this.taskModel.updateStatus(task.id, 'running');
            await this.taskModel.updateStatus(task.id, 'completed', null, 'Integration test completed');
            
            // Step 3: Verify task retrieval
            console.log('  → Verifying task retrieval...');
            const retrievedTask = await this.taskModel.findById(task.id);
            
            if (retrievedTask && retrievedTask.status === 'completed') {
                this.testResults.databaseStorage = true;
                console.log('  ✓ Database integration successful');
                console.log(`    Task status: ${retrievedTask.status}`);
                console.log(`    Task duration: ${retrievedTask.duration} seconds`);
                
                return task.id;
            } else {
                throw new Error('Task retrieval failed');
            }

        } catch (error) {
            console.error('  ❌ Database integration test failed:', error.message);
            throw error;
        }
    }

    async testReportGeneration(analysisResults) {
        try {
            console.log('  Testing report generation...');
            
            // Step 1: Generate interactive report
            console.log('  → Generating interactive report...');
            const interactiveReport = this.analyzer.generateInteractiveReport();
            
            if (interactiveReport && interactiveReport.videos.length > 0) {
                console.log('  ✓ Interactive report generated');
                console.log(`    Total videos: ${interactiveReport.summary.totalVideos}`);
                console.log(`    Average views: ${interactiveReport.summary.averageViews.toLocaleString()}`);
            }

            // Step 2: Generate HTML report
            console.log('  → Generating HTML report...');
            const reportData = {
                videos: analysisResults.videos,
                analyses: analysisResults.analyses,
                storyboards: analysisResults.storyboards,
                summary: analysisResults.summary,
                metadata: analysisResults.metadata,
                prompt: 'Integration test prompt'
            };
            
            const htmlReport = await this.reportGenerator.generateHTMLReport(reportData);
            
            if (htmlReport && htmlReport.includes('<!DOCTYPE html>') && htmlReport.length > 1000) {
                this.testResults.reportGeneration = true;
                console.log('  ✓ HTML report generation successful');
                console.log(`    Report size: ${Math.round(htmlReport.length / 1024)}KB`);
                
                // Save report
                const reportPath = path.join(__dirname, 'integration-test-report.html');
                fs.writeFileSync(reportPath, htmlReport);
                console.log(`    Report saved to: ${reportPath}`);
            } else {
                console.log(`    Debug - HTML length: ${htmlReport?.length || 0}`);
                console.log(`    Debug - Contains DOCTYPE: ${htmlReport?.includes('<!DOCTYPE html>') || false}`);
                throw new Error('HTML report generation failed - invalid HTML structure');
            }

        } catch (error) {
            console.error('  ❌ Report generation test failed:', error.message);
            throw error;
        }
    }

    async testAPIWorkflow(taskId) {
        try {
            console.log('  Testing API workflow simulation...');
            
            // Step 1: Simulate task creation workflow
            console.log('  → Simulating task creation workflow...');
            const taskData = {
                userId: 1,
                prompt: 'API workflow test',
                taskType: 'youtube_scrape'
            };
            
            const newTask = await this.taskModel.create(taskData);
            console.log(`  ✓ API task created: ${newTask.id}`);

            // Step 2: Simulate task processing
            console.log('  → Simulating task processing...');
            await this.taskModel.updateStatus(newTask.id, 'running');
            
            // Simulate processing time
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            await this.taskModel.updateStatus(newTask.id, 'completed', null, 'API workflow test completed');
            console.log('  ✓ Task processing simulation complete');

            // Step 3: Verify task statistics
            console.log('  → Testing task statistics...');
            const stats = await this.taskModel.getStatistics();
            console.log(`  ✓ Statistics retrieved: ${stats.totalTasks} total tasks, ${stats.completedTasks} completed`);

        } catch (error) {
            console.error('  ❌ API workflow test failed:', error.message);
            throw error;
        }
    }

    async validateEndToEnd() {
        try {
            console.log('  Validating end-to-end workflow...');
            
            // Check all main components are working (excluding fullWorkflow itself)
            const componentTests = Object.entries(this.testResults)
                .filter(([key]) => key !== 'fullWorkflow');
            
            const allPassed = componentTests.every(([key, value]) => value === true);
            
            if (allPassed) {
                this.testResults.fullWorkflow = true;
                console.log('  ✓ End-to-end validation successful');
                console.log('    All workflow components are functioning correctly');
                console.log(`    Components validated: ${componentTests.map(([key]) => key).join(', ')}`);
            } else {
                const failedTests = componentTests
                    .filter(([key, value]) => value === false)
                    .map(([key]) => key);
                
                throw new Error(`Failed components: ${failedTests.join(', ')}`);
            }

        } catch (error) {
            console.error('  ❌ End-to-end validation failed:', error.message);
            throw error;
        }
    }

    async generateTestReport() {
        try {
            const testReport = {
                timestamp: new Date().toISOString(),
                status: this.testResults.fullWorkflow ? 'PASSED' : 'FAILED',
                components: this.testResults,
                summary: {
                    totalTests: Object.keys(this.testResults).length,
                    passedTests: Object.values(this.testResults).filter(r => r === true).length,
                    failedTests: Object.values(this.testResults).filter(r => r === false).length
                },
                recommendations: this.generateTestRecommendations()
            };

            const reportPath = path.join(__dirname, 'integration-test-results.json');
            fs.writeFileSync(reportPath, JSON.stringify(testReport, null, 2));
            console.log(`  ✓ Test report saved to: ${reportPath}`);

        } catch (error) {
            console.error('  ❌ Test report generation failed:', error.message);
        }
    }

    generateTestRecommendations() {
        const recommendations = [];
        
        if (!this.testResults.scraping) {
            recommendations.push('YouTube scraping service needs attention - check network connectivity and YouTube access');
        }
        
        if (!this.testResults.aiAnalysis) {
            recommendations.push('AI analysis service needs attention - verify API keys and service availability');
        }
        
        if (!this.testResults.databaseStorage) {
            recommendations.push('Database integration needs attention - check PostgreSQL connection and schema');
        }
        
        if (this.testResults.fullWorkflow) {
            recommendations.push('All systems operational - ready for production use');
        }
        
        return recommendations;
    }

    printTestSummary() {
        console.log('\n📊 TEST SUMMARY');
        console.log('='.repeat(30));
        
        Object.entries(this.testResults).forEach(([component, passed]) => {
            const status = passed ? '✅ PASSED' : '❌ FAILED';
            console.log(`${component.padEnd(20)}: ${status}`);
        });
        
        const totalTests = Object.keys(this.testResults).length;
        const passedTests = Object.values(this.testResults).filter(r => r === true).length;
        
        console.log(`\nOverall: ${passedTests}/${totalTests} tests passed`);
        console.log(`Success Rate: ${Math.round((passedTests/totalTests) * 100)}%`);
    }

    async cleanup() {
        try {
            console.log('\n🧹 Cleaning up test environment...');
            
            // Clean up test tasks
            const testTasks = await this.taskModel.findAll({ 
                filters: { taskType: 'youtube_scrape' },
                limit: 10
            });
            
            let cleanedCount = 0;
            for (const task of testTasks) {
                if (task.prompt && (task.prompt.includes('test') || task.prompt.includes('Integration'))) {
                    await this.taskModel.delete(task.id);
                    cleanedCount++;
                }
            }
            
            console.log(`✓ Cleaned up ${cleanedCount} test tasks`);
            
            await this.db.disconnect();
            console.log('✓ Database disconnected');
            
        } catch (error) {
            console.error('❌ Cleanup failed:', error.message);
        }
    }
}

// Run the integration test
async function runIntegrationTest() {
    const integrationTest = new IntegrationTest();
    await integrationTest.runFullIntegrationTest();
}

// Check if this file is being run directly
if (require.main === module) {
    runIntegrationTest().catch(error => {
        console.error('Integration test execution failed:', error.message);
        process.exit(1);
    });
}

module.exports = IntegrationTest;
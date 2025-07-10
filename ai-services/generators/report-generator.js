// File Path: /ai-services/generators/report-generator.js
// HTML report generator for video analysis results
// REF-063: HTML report generator for interactive reports with storyboards

class ReportGenerator {
    constructor() {
        this.templateStyles = this.getDefaultStyles();
    }

    // Generate complete HTML report
    async generateHTMLReport(reportData) {
        try {
            const {
                videos = [],
                analyses = [],
                storyboards = [],
                summary = '',
                metadata = {},
                prompt = ''
            } = reportData;

            const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Video Analysis Report - ${metadata.generatedAt || new Date().toLocaleDateString()}</title>
    <style>${this.templateStyles}</style>
</head>
<body>
    <div class="container">
        ${this.generateHeader(prompt, metadata)}
        ${this.generateExecutiveSummary(videos, analyses, summary)}
        ${this.generateStatistics(videos, analyses)}
        ${this.generateVideoGrid(videos, analyses, storyboards)}
        ${this.generateInsights(analyses)}
        ${this.generateFooter(metadata)}
    </div>
    <script>${this.getInteractiveScripts()}</script>
</body>
</html>`;

            console.log('✓ Generated HTML report');
            return html;

        } catch (error) {
            console.error('✗ HTML report generation failed:', error.message);
            throw error;
        }
    }

    generateHeader(prompt, metadata) {
        return `
        <header class="report-header">
            <h1>🎬 Video Analysis Report</h1>
            <div class="report-meta">
                <div class="meta-item">
                    <strong>Analysis Prompt:</strong> ${prompt || 'Video content analysis'}
                </div>
                <div class="meta-item">
                    <strong>Generated:</strong> ${new Date(metadata.generatedAt || Date.now()).toLocaleString()}
                </div>
                <div class="meta-item">
                    <strong>Total Videos:</strong> ${metadata.totalVideos || 0}
                </div>
            </div>
        </header>`;
    }

    generateExecutiveSummary(videos, analyses, summary) {
        const avgViews = this.calculateAverageViews(videos);
        const topThemes = this.extractTopThemes(analyses);
        const sentimentDist = this.calculateSentimentDistribution(analyses);

        return `
        <section class="executive-summary">
            <h2>📊 Executive Summary</h2>
            <div class="summary-grid">
                <div class="summary-card">
                    <h3>Content Overview</h3>
                    <div class="metric">
                        <span class="metric-value">${videos.length}</span>
                        <span class="metric-label">Videos Analyzed</span>
                    </div>
                    <div class="metric">
                        <span class="metric-value">${avgViews.toLocaleString()}</span>
                        <span class="metric-label">Avg Views</span>
                    </div>
                </div>
                <div class="summary-card">
                    <h3>Top Themes</h3>
                    ${topThemes.slice(0, 3).map(theme => 
                        `<div class="theme-item">${theme.theme} (${theme.count})</div>`
                    ).join('')}
                </div>
                <div class="summary-card">
                    <h3>Sentiment Analysis</h3>
                    <div class="sentiment-bar">
                        <div class="sentiment-positive" style="width: ${(sentimentDist.positive / videos.length * 100)}%">
                            ${sentimentDist.positive} Positive
                        </div>
                        <div class="sentiment-neutral" style="width: ${(sentimentDist.neutral / videos.length * 100)}%">
                            ${sentimentDist.neutral} Neutral
                        </div>
                        <div class="sentiment-negative" style="width: ${(sentimentDist.negative / videos.length * 100)}%">
                            ${sentimentDist.negative} Negative
                        </div>
                    </div>
                </div>
            </div>
            ${summary ? `<div class="ai-summary"><h3>AI Analysis Summary</h3><p>${summary}</p></div>` : ''}
        </section>`;
    }

    generateStatistics(videos, analyses) {
        const stats = this.calculateDetailedStats(videos, analyses);
        
        return `
        <section class="statistics">
            <h2>📈 Detailed Statistics</h2>
            <div class="stats-grid">
                <div class="stat-item">
                    <h4>Total Views</h4>
                    <span class="stat-value">${stats.totalViews.toLocaleString()}</span>
                </div>
                <div class="stat-item">
                    <h4>Avg Duration</h4>
                    <span class="stat-value">${stats.avgDuration}</span>
                </div>
                <div class="stat-item">
                    <h4>Top Channel</h4>
                    <span class="stat-value">${stats.topChannel}</span>
                </div>
                <div class="stat-item">
                    <h4>Content Types</h4>
                    <span class="stat-value">${stats.contentTypes.join(', ')}</span>
                </div>
            </div>
        </section>`;
    }

    generateVideoGrid(videos, analyses, storyboards) {
        return `
        <section class="video-analysis">
            <h2>🎥 Video Analysis Results</h2>
            <div class="video-grid">
                ${videos.map((video, index) => this.generateVideoCard(video, analyses[index], storyboards[index], index)).join('')}
            </div>
        </section>`;
    }

    generateVideoCard(video, analysis, storyboard, index) {
        const hasStoryboard = storyboard && storyboard.scenes && storyboard.scenes.length > 0;
        
        return `
        <div class="video-card" data-video-index="${index}">
            <div class="video-header">
                <h3>${video.title}</h3>
                <div class="video-meta">
                    <span class="channel">📺 ${video.channelName}</span>
                    <span class="views">👁️ ${video.viewCount}</span>
                    <span class="duration">⏱️ ${video.duration}</span>
                </div>
            </div>
            
            <div class="video-analysis">
                ${analysis ? `
                <div class="analysis-section">
                    <h4>🧠 AI Analysis</h4>
                    <p><strong>Summary:</strong> ${analysis.summary}</p>
                    <p><strong>Content Type:</strong> ${analysis.contentType}</p>
                    <p><strong>Sentiment:</strong> <span class="sentiment-${analysis.sentiment}">${analysis.sentiment}</span></p>
                    ${analysis.themes && analysis.themes.length > 0 ? `
                    <div class="themes">
                        <strong>Themes:</strong>
                        ${analysis.themes.map(theme => `<span class="theme-tag">${theme}</span>`).join('')}
                    </div>` : ''}
                </div>` : ''}
                
                ${hasStoryboard ? `
                <div class="storyboard-section">
                    <h4>🎬 Storyboard (${storyboard.totalScenes} scenes)</h4>
                    <button class="toggle-storyboard" onclick="toggleStoryboard(${index})">
                        View Storyboard Details
                    </button>
                    <div class="storyboard-details" id="storyboard-${index}" style="display: none;">
                        ${storyboard.scenes.map(scene => `
                        <div class="scene-card">
                            <h5>Scene ${scene.sequenceNumber}: ${scene.sceneTitle || 'Untitled Scene'}</h5>
                            <p><strong>Duration:</strong> ${scene.duration}</p>
                            <p><strong>Narration:</strong> ${scene.narrationText}</p>
                            ${scene.visualElements && scene.visualElements.length > 0 ? `
                            <p><strong>Visual Elements:</strong> ${scene.visualElements.join(', ')}</p>` : ''}
                            ${scene.audioCues && scene.audioCues.length > 0 ? `
                            <p><strong>Audio Cues:</strong> ${scene.audioCues.join(', ')}</p>` : ''}
                        </div>`).join('')}
                    </div>
                </div>` : ''}
            </div>
            
            <div class="video-footer">
                <a href="${video.videoUrl}" target="_blank" class="source-link">
                    🔗 View Original Video
                </a>
                <div class="attribution">
                    Source: ${video.channelName} • Scraped: ${new Date(video.scrapedAt).toLocaleDateString()}
                </div>
            </div>
        </div>`;
    }

    generateInsights(analyses) {
        const insights = this.generateRecommendations(analyses);
        
        return `
        <section class="insights">
            <h2>💡 Key Insights & Recommendations</h2>
            <div class="insights-grid">
                ${insights.map(insight => `
                <div class="insight-card">
                    <h4>${insight.title}</h4>
                    <p>${insight.description}</p>
                    <span class="insight-type">${insight.type}</span>
                </div>`).join('')}
            </div>
        </section>`;
    }

    generateFooter(metadata) {
        return `
        <footer class="report-footer">
            <div class="footer-content">
                <p>Report generated by Web Automation Platform</p>
                <p>Generated at: ${new Date(metadata.generatedAt || Date.now()).toLocaleString()}</p>
                <p>Analysis powered by AI content analysis and storyboard generation</p>
            </div>
        </footer>`;
    }

    // Helper methods for calculations
    calculateAverageViews(videos) {
        if (!videos.length) return 0;
        const totalViews = videos.reduce((sum, video) => sum + this.parseViewCount(video.viewCount), 0);
        return Math.round(totalViews / videos.length);
    }

    parseViewCount(viewStr) {
        if (!viewStr) return 0;
        const cleanStr = viewStr.replace(/[^0-9.KMB]/gi, '');
        const number = parseFloat(cleanStr);
        
        if (cleanStr.includes('M')) return number * 1000000;
        if (cleanStr.includes('K')) return number * 1000;
        if (cleanStr.includes('B')) return number * 1000000000;
        
        return number || 0;
    }

    extractTopThemes(analyses) {
        const themeCount = {};
        analyses.forEach(analysis => {
            if (analysis && analysis.themes) {
                analysis.themes.forEach(theme => {
                    themeCount[theme] = (themeCount[theme] || 0) + 1;
                });
            }
        });
        
        return Object.entries(themeCount)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([theme, count]) => ({ theme, count }));
    }

    calculateSentimentDistribution(analyses) {
        const distribution = { positive: 0, negative: 0, neutral: 0 };
        analyses.forEach(analysis => {
            if (analysis && analysis.sentiment) {
                distribution[analysis.sentiment]++;
            }
        });
        return distribution;
    }

    calculateDetailedStats(videos, analyses) {
        const totalViews = videos.reduce((sum, video) => sum + this.parseViewCount(video.viewCount), 0);
        const avgDuration = this.calculateAverageDuration(videos);
        const topChannel = this.findTopChannel(videos);
        const contentTypes = [...new Set(analyses.filter(a => a && a.contentType).map(a => a.contentType))];
        
        return {
            totalViews,
            avgDuration,
            topChannel,
            contentTypes
        };
    }

    calculateAverageDuration(videos) {
        if (!videos.length) return '0:00';
        const totalSeconds = videos.reduce((sum, video) => {
            const duration = video.duration || '0:00';
            const parts = duration.split(':');
            if (parts.length === 2) {
                return sum + (parseInt(parts[0]) * 60) + parseInt(parts[1]);
            }
            return sum;
        }, 0);
        
        const avgSeconds = Math.round(totalSeconds / videos.length);
        const minutes = Math.floor(avgSeconds / 60);
        const seconds = avgSeconds % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    findTopChannel(videos) {
        const channelCounts = {};
        videos.forEach(video => {
            if (video.channelName) {
                channelCounts[video.channelName] = (channelCounts[video.channelName] || 0) + 1;
            }
        });
        
        const topChannel = Object.entries(channelCounts)
            .sort(([,a], [,b]) => b - a)[0];
        
        return topChannel ? `${topChannel[0]} (${topChannel[1]} videos)` : 'N/A';
    }

    generateRecommendations(analyses) {
        const recommendations = [];
        const topThemes = this.extractTopThemes(analyses);
        
        if (topThemes.length > 0) {
            recommendations.push({
                type: 'Content Strategy',
                title: 'Popular Content Themes',
                description: `Focus on these trending themes: ${topThemes.slice(0, 3).map(t => t.theme).join(', ')}`
            });
        }
        
        const contentTypes = [...new Set(analyses.filter(a => a && a.contentType).map(a => a.contentType))];
        if (contentTypes.length > 0) {
            recommendations.push({
                type: 'Format Analysis',
                title: 'Content Format Insights',
                description: `Dominant content types: ${contentTypes.join(', ')}. Consider diversifying or doubling down based on performance.`
            });
        }
        
        recommendations.push({
            type: 'Attribution',
            title: 'Source Attribution',
            description: 'All content analysis includes proper attribution links to original creators and channels.'
        });
        
        return recommendations;
    }

    getDefaultStyles() {
        return `
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            color: #333;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .report-header {
            background: white;
            border-radius: 15px;
            padding: 30px;
            margin-bottom: 30px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            text-align: center;
        }
        
        .report-header h1 {
            color: #667eea;
            font-size: 2.5rem;
            margin-bottom: 20px;
        }
        
        .report-meta {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 15px;
            margin-top: 20px;
        }
        
        .meta-item {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #667eea;
        }
        
        .executive-summary, .statistics, .video-analysis, .insights {
            background: white;
            border-radius: 15px;
            padding: 30px;
            margin-bottom: 30px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }
        
        .summary-grid, .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }
        
        .summary-card {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 10px;
            border-left: 4px solid #28a745;
        }
        
        .metric {
            margin: 10px 0;
        }
        
        .metric-value {
            font-size: 2rem;
            font-weight: bold;
            color: #667eea;
            display: block;
        }
        
        .metric-label {
            color: #666;
            font-size: 0.9rem;
        }
        
        .sentiment-bar {
            display: flex;
            height: 30px;
            border-radius: 15px;
            overflow: hidden;
            margin-top: 10px;
        }
        
        .sentiment-positive { background: #28a745; color: white; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; }
        .sentiment-neutral { background: #ffc107; color: black; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; }
        .sentiment-negative { background: #dc3545; color: white; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; }
        
        .video-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: 25px;
            margin-top: 20px;
        }
        
        .video-card {
            background: #f8f9fa;
            border-radius: 12px;
            padding: 20px;
            border-left: 4px solid #667eea;
            transition: transform 0.2s ease;
        }
        
        .video-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        }
        
        .video-header h3 {
            color: #333;
            margin-bottom: 10px;
            font-size: 1.2rem;
        }
        
        .video-meta {
            display: flex;
            gap: 15px;
            margin-bottom: 15px;
            font-size: 0.9rem;
            color: #666;
        }
        
        .theme-tag {
            background: #667eea;
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.8rem;
            margin-right: 5px;
        }
        
        .sentiment-positive { color: #28a745; font-weight: bold; }
        .sentiment-negative { color: #dc3545; font-weight: bold; }
        .sentiment-neutral { color: #ffc107; font-weight: bold; }
        
        .toggle-storyboard {
            background: #667eea;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            cursor: pointer;
            margin: 10px 0;
        }
        
        .scene-card {
            background: white;
            padding: 15px;
            border-radius: 8px;
            margin: 10px 0;
            border-left: 3px solid #28a745;
        }
        
        .source-link {
            color: #667eea;
            text-decoration: none;
            font-weight: bold;
        }
        
        .attribution {
            font-size: 0.8rem;
            color: #666;
            margin-top: 10px;
        }
        
        .insights-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }
        
        .insight-card {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 10px;
            border-left: 4px solid #ffc107;
        }
        
        .insight-type {
            background: #ffc107;
            color: black;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.8rem;
            float: right;
        }
        
        .report-footer {
            background: white;
            border-radius: 15px;
            padding: 20px;
            text-align: center;
            color: #666;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }
        
        @media (max-width: 768px) {
            .container { padding: 10px; }
            .video-grid { grid-template-columns: 1fr; }
            .summary-grid, .stats-grid { grid-template-columns: 1fr; }
        }`;
    }

    getInteractiveScripts() {
        return `
        function toggleStoryboard(index) {
            const storyboard = document.getElementById('storyboard-' + index);
            const button = event.target;
            
            if (storyboard.style.display === 'none') {
                storyboard.style.display = 'block';
                button.textContent = 'Hide Storyboard Details';
            } else {
                storyboard.style.display = 'none';
                button.textContent = 'View Storyboard Details';
            }
        }
        
        // Add smooth scrolling
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                document.querySelector(this.getAttribute('href')).scrollIntoView({
                    behavior: 'smooth'
                });
            });
        });`;
    }
}

module.exports = ReportGenerator;

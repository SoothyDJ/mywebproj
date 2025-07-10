import React, { useState } from 'react';

const App = () => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const createTask = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }
    setLoading(true);
    setError('Test mode - no actual API call');
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '20px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ fontSize: '3rem', fontWeight: 'bold', color: 'white', marginBottom: '10px' }}>
            🤖 AI Web Automation Platform
          </h1>
          <p style={{ fontSize: '1.2rem', color: '#e0e7ff' }}>
            Intelligent web scraping and content analysis
          </p>
        </div>

        <div style={{ background: 'white', borderRadius: '15px', padding: '30px' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '20px' }}>🎯 Task Prompt</h2>
          
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            style={{
              width: '100%',
              height: '120px',
              border: '2px solid #e0e0e0',
              borderRadius: '8px',
              padding: '12px',
              fontSize: '14px',
              marginBottom: '20px'
            }}
            placeholder="Enter your automation task here..."
          />
          
          <button
            onClick={createTask}
            disabled={loading}
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            {loading ? '🚀 Processing...' : '🚀 Execute Task'}
          </button>

          {error && (
            <div style={{ marginTop: '20px', padding: '10px', background: '#fee', border: '1px solid #fcc', borderRadius: '5px' }}>
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
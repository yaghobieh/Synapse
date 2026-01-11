import React from 'react';

// Simple test component first
function SimpleCounter() {
  const [count, setCount] = React.useState(0);

  console.log('🧠 SimpleCounter rendered with count:', count);

  return (
    <div style={{ padding: '20px', border: '2px solid #7C3AED', borderRadius: '8px', backgroundColor: '#FAFAFA' }}>
      <h2>Simple Counter Test</h2>
      <p>Count: {count}</p>
      <button
        onClick={() => setCount(count + 1)}
        style={{ padding: '10px 20px', backgroundColor: '#7C3AED', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
      >
        Increment
      </button>
      <p style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
        If you see this, React is working! 🎉
      </p>
    </div>
  );
}

function App() {
  console.log('🧠 Synapse App component is rendering!');

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🧠 Synapse Demo</h1>
      <p style={{ color: '#666', marginBottom: '20px' }}>
        React is mounting successfully! If you see this message, the demo is working.
      </p>

      <SimpleCounter />

      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#F3F4F6', borderRadius: '8px' }}>
        <h3>Next Steps:</h3>
        <ol>
          <li>✅ React is working</li>
          <li>🔄 Loading full Synapse components...</li>
          <li>🧠 Testing store integration</li>
          <li>🔧 Checking DevTools connection</li>
        </ol>
      </div>
    </div>
  );
}

export default App;

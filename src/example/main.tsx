import React from 'react';
import ReactDOM from 'react-dom/client';

// Debug logging
console.log('🧠 main.tsx is loading...');

try {
  console.log('🧠 React imports successful');

  // Simple test component without any Synapse dependencies
  function TestApp() {
    const [count, setCount] = React.useState(0);

    return React.createElement('div', {
      style: {
        padding: '20px',
        fontFamily: 'Arial, sans-serif',
        backgroundColor: '#f0f0f0',
        minHeight: '100vh'
      }
    }, [
      React.createElement('h1', { key: 'title' }, '🧠 Synapse Test'),
      React.createElement('p', { key: 'desc' }, 'React is working! Count: ' + count),
      React.createElement('button', {
        key: 'button',
        onClick: () => setCount(count + 1),
        style: {
          padding: '10px 20px',
          backgroundColor: '#7C3AED',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer'
        }
      }, 'Increment'),
      React.createElement('p', {
        key: 'success',
        style: { marginTop: '20px', color: '#10B981', fontWeight: 'bold' }
      }, '✅ React mounting successful!')
    ]);
  }

  console.log('🧠 Test component defined, checking root element...');

  // Check if root element exists
  const rootElement = document.getElementById('root');
  console.log('🧠 Root element:', rootElement);

  if (!rootElement) {
    console.error('❌ Root element not found!');
    document.body.innerHTML = '<h1 style="color: red;">❌ Root element not found!</h1>';
  } else {
    console.log('✅ Root element found, creating React root...');

    // Create root element
    const root = ReactDOM.createRoot(rootElement);

    console.log('✅ React root created, rendering test app...');

    // Render test app
    root.render(
      React.createElement(React.StrictMode, null,
        React.createElement(TestApp, null)
      )
    );

    console.log('🧠 Test App Rendered Successfully!');
  }

} catch (error: unknown) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error('❌ Error in main.tsx:', error);
  document.body.innerHTML = '<h1 style="color: red;">❌ JavaScript Error: ' + errorMessage + '</h1>';
}

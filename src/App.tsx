import React from 'react';
import Button from './components/Button';
import Card from './components/Card';

const App: React.FC = () => {
  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h1 style={{ color: '#333', marginBottom: '10px' }}>Remote App (Standalone Mode)</h1>
      <p style={{ color: '#666', marginBottom: '30px' }}>
        This is a standalone React app that exposes components via Module Federation.
      </p>

      <h2 style={{ color: '#333', marginTop: '30px', marginBottom: '15px' }}>Button Component</h2>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
        <Button
          label="Primary Button"
          variant="primary"
          onClick={() => alert('Primary button clicked!')}
        />
        <Button
          label="Secondary Button"
          variant="secondary"
          onClick={() => alert('Secondary button clicked!')}
        />
      </div>

      <h2 style={{ color: '#333', marginTop: '30px', marginBottom: '15px' }}>Card Component</h2>
      <Card
        title="Example Card"
        content="This is an example card component that can be federated to other applications."
      />
      <Card
        title="Another Card"
        content="Module Federation allows you to share components across different applications at runtime."
      />

      <div style={{ marginTop: '40px', padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
        <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>Module Federation Info</h3>
        <ul style={{ margin: 0, paddingLeft: '20px', color: '#666' }}>
          <li>Remote Entry: <code>http://localhost:3001/remoteEntry.js</code></li>
          <li>Scope: <code>remoteApp</code></li>
          <li>Exposed Modules:
            <ul>
              <li><code>./Button</code></li>
              <li><code>./Card</code></li>
            </ul>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default App;

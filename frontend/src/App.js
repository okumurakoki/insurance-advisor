import React from 'react';

function App() {
  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'Arial, sans-serif',
      textAlign: 'center',
      marginTop: '50px'
    }}>
      <h1>🏦 変額保険アドバイザリーシステム</h1>
      <p>システムが正常に動作しています</p>
      <div style={{ 
        background: '#f5f5f5', 
        padding: '20px', 
        borderRadius: '8px',
        margin: '20px auto',
        maxWidth: '400px'
      }}>
        <h3>デモアカウント</h3>
        <p><strong>代理店:</strong> demo-agency / password</p>
        <p><strong>担当者:</strong> demo-agent / password</p>
        <p><strong>顧客:</strong> demo-customer / password</p>
      </div>
      <p style={{ color: '#666', fontSize: '14px' }}>
        バックエンドAPI: {process.env.REACT_APP_API_URL}
      </p>
    </div>
  );
}

export default App;
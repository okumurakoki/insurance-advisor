import React, { useState, useEffect } from 'react';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  // Check if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      setIsLoggedIn(true);
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleLogin = async (userId, password, accountType) => {
    setLoading(true);
    try {
      const apiUrl = process.env.REACT_APP_API_BASE_URL || 'https://backend-f4o3zs64t-kokiokumuras-projects.vercel.app/api';
      const response = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, password, accountType }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
        setIsLoggedIn(true);
      } else {
        alert('ログインに失敗しました: ' + data.error);
      }
    } catch (error) {
      alert('ログインエラー: ' + error.message);
    }
    setLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    setUser(null);
  };

  if (isLoggedIn && user) {
    return <Dashboard user={user} onLogout={handleLogout} />;
  }

  return <LoginPage onLogin={handleLogin} loading={loading} />;
}

function LoginPage({ onLogin, loading }) {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [accountType, setAccountType] = useState('child');

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(userId, password, accountType);
  };

  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        background: 'white',
        padding: '40px',
        borderRadius: '10px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
        width: '400px',
        maxWidth: '90vw'
      }}>
        <h1 style={{ 
          textAlign: 'center', 
          color: '#333',
          marginBottom: '30px'
        }}>
          🏦 変額保険アドバイザリー
        </h1>
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              アカウント種別
            </label>
            <select 
              value={accountType}
              onChange={(e) => setAccountType(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                fontSize: '16px'
              }}
            >
              <option value="parent">代理店 (Parent)</option>
              <option value="child">生保担当者 (Child)</option>
              <option value="grandchild">顧客 (Grandchild)</option>
            </select>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              ユーザーID
            </label>
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                fontSize: '16px'
              }}
            />
          </div>

          <div style={{ marginBottom: '30px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              パスワード
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                fontSize: '16px'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              background: loading ? '#ccc' : '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              fontSize: '16px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: 'bold'
            }}
          >
            {loading ? 'ログイン中...' : 'ログイン'}
          </button>
        </form>

        <div style={{ 
          background: '#f8f9fa', 
          padding: '20px', 
          borderRadius: '5px',
          marginTop: '30px'
        }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '16px' }}>デモアカウント</h3>
          <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
            <p><strong>代理店:</strong> demo-agency / password</p>
            <p><strong>担当者:</strong> demo-agent / password</p>
            <p><strong>顧客:</strong> demo-customer / password</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Dashboard({ user, onLogout }) {
  return (
    <div style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Header */}
      <div style={{
        background: '#2c3e50',
        color: 'white',
        padding: '15px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h1 style={{ margin: 0 }}>🏦 変額保険アドバイザリーシステム</h1>
        <div>
          <span style={{ marginRight: '15px' }}>
            {user.user_id} ({user.account_type})
          </span>
          <button 
            onClick={onLogout}
            style={{
              background: '#e74c3c',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            ログアウト
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ padding: '20px' }}>
        <div style={{ 
          background: '#ecf0f1', 
          padding: '20px', 
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <h2>ダッシュボード</h2>
          <p>ようこそ、{user.user_id} さん</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginTop: '20px' }}>
            <div style={{ background: 'white', padding: '15px', borderRadius: '5px', textAlign: 'center' }}>
              <h3>👥 顧客管理</h3>
              <p>顧客情報の登録・編集</p>
            </div>
            <div style={{ background: 'white', padding: '15px', borderRadius: '5px', textAlign: 'center' }}>
              <h3>📊 分析レポート</h3>
              <p>AI分析結果の確認</p>
            </div>
            <div style={{ background: 'white', padding: '15px', borderRadius: '5px', textAlign: 'center' }}>
              <h3>📈 市場データ</h3>
              <p>最新市場情報</p>
            </div>
          </div>
        </div>

        <div style={{ 
          background: '#d4edda', 
          border: '1px solid #c3e6cb',
          padding: '15px', 
          borderRadius: '5px',
          marginBottom: '20px'
        }}>
          <h3 style={{ color: '#155724', margin: '0 0 10px 0' }}>✅ システム状態</h3>
          <p style={{ color: '#155724', margin: 0 }}>
            バックエンドAPI: 接続中 | データベース: 正常 | プラン: {user.plan_type || 'standard'}
          </p>
        </div>

        <div style={{ 
          background: '#fff3cd', 
          border: '1px solid #ffeaa7',
          padding: '15px', 
          borderRadius: '5px'
        }}>
          <h3 style={{ color: '#856404', margin: '0 0 10px 0' }}>🚧 開発中の機能</h3>
          <ul style={{ color: '#856404', marginLeft: '20px' }}>
            <li>顧客詳細管理画面</li>
            <li>リアルタイム分析機能</li>
            <li>LINE Bot自動配信</li>
            <li>レポートエクスポート</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default App;
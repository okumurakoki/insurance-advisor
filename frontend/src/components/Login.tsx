import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Link,
  Divider
} from '@mui/material';
import { Login as LoginIcon } from '@mui/icons-material';

interface LoginProps {
  onLoginSuccess: (token: string, user: any) => void;
  apiBaseUrl: string;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess, apiBaseUrl }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [accountType, setAccountType] = useState<'parent' | 'child' | 'grandchild' | 'admin'>('child');
  const [agencyUserId, setAgencyUserId] = useState('');
  const [staffUserId, setStaffUserId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${apiBaseUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          password,
          accountType,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        onLoginSuccess(data.token, data.user);
      } else {
        setError(data.error || 'ログインに失敗しました');
      }
    } catch (err) {
      setError('ログインに失敗しました。ネットワークを確認してください。');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const body: any = {
        userId,
        password,
        accountType,
      };

      if (accountType === 'child' && agencyUserId) {
        body.agencyUserId = agencyUserId;
      }

      if (accountType === 'grandchild' && staffUserId) {
        body.staffUserId = staffUserId;
      }

      const response = await fetch(`${apiBaseUrl}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('登録が完了しました！ログインしてください。');
        setMode('login');
        setPassword('');
      } else {
        console.error('Registration error response:', data);
        const errorMsg = data.message || data.error || '登録に失敗しました';
        setError(errorMsg);
        // 詳細をアラートで表示
        if (data.message) {
          alert(`登録エラー: ${data.message}`);
        }
      }
    } catch (err) {
      console.error('Registration exception:', err);
      setError('登録に失敗しました。ネットワークを確認してください。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: 2,
      }}
    >
      <Card sx={{ maxWidth: 500, width: '100%', boxShadow: 4 }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <LoginIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
            <Typography variant="h4" component="h1" gutterBottom>
              変額保険アドバイザー
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {mode === 'login' ? 'ログイン' : '新規登録'}
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}

          <form onSubmit={mode === 'login' ? handleLogin : handleRegister}>
            <TextField
              fullWidth
              label="ユーザーID"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              margin="normal"
              required
              autoComplete="username"
            />

            <TextField
              fullWidth
              label="パスワード"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              required
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />

            <FormControl fullWidth margin="normal" required>
              <InputLabel>アカウント種別</InputLabel>
              <Select
                value={accountType}
                onChange={(e) => setAccountType(e.target.value as any)}
                label="アカウント種別"
              >
                <MenuItem value="admin">管理者</MenuItem>
                <MenuItem value="parent" disabled={mode === 'register'}>
                  代理店（管理者のみ作成可能）
                </MenuItem>
                <MenuItem value="child">担当者</MenuItem>
                <MenuItem value="grandchild">顧客</MenuItem>
              </Select>
            </FormControl>

            {mode === 'register' && accountType === 'child' && (
              <TextField
                fullWidth
                label="代理店ID"
                value={agencyUserId}
                onChange={(e) => setAgencyUserId(e.target.value)}
                margin="normal"
                required
                helperText="所属する代理店のユーザーIDを入力してください"
              />
            )}

            {mode === 'register' && accountType === 'grandchild' && (
              <TextField
                fullWidth
                label="担当者ID"
                value={staffUserId}
                onChange={(e) => setStaffUserId(e.target.value)}
                margin="normal"
                required
                helperText="担当者のユーザーIDを入力してください"
              />
            )}

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ mt: 3, mb: 2 }}
            >
              {loading ? (
                <CircularProgress size={24} />
              ) : mode === 'login' ? (
                'ログイン'
              ) : (
                '新規登録'
              )}
            </Button>
          </form>

          <Divider sx={{ my: 2 }} />

          <Box sx={{ textAlign: 'center' }}>
            {mode === 'login' ? (
              <Typography variant="body2">
                アカウントをお持ちでない方は{' '}
                <Link
                  component="button"
                  variant="body2"
                  onClick={() => {
                    setMode('register');
                    setError('');
                    setSuccess('');
                  }}
                >
                  新規登録
                </Link>
              </Typography>
            ) : (
              <Typography variant="body2">
                すでにアカウントをお持ちの方は{' '}
                <Link
                  component="button"
                  variant="body2"
                  onClick={() => {
                    setMode('login');
                    setError('');
                    setSuccess('');
                  }}
                >
                  ログイン
                </Link>
              </Typography>
            )}
          </Box>

          {mode === 'register' && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'info.lighter', borderRadius: 1 }}>
              <Typography variant="caption" color="text.secondary">
                <strong>登録について：</strong>
                <br />
                • 担当者: 代理店IDが必要です
                <br />
                • 顧客: 担当者IDが必要です
              </Typography>
            </Box>
          )}

          <Box sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: 'grey.300', textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              代理店として新規登録する場合
            </Typography>
            <Button
              variant="outlined"
              color="primary"
              onClick={() => window.location.href = '/agency-register'}
              fullWidth
            >
              代理店登録はこちら
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Login;

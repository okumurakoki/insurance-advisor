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
  Divider,
  Grid,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Login as LoginIcon,
  TrendingUp,
  Security,
  Speed,
  AccountBalance,
} from '@mui/icons-material';
import { saasColors } from '../theme/saasTheme';

interface LoginProps {
  onLoginSuccess: (token: string, user: any) => void;
  apiBaseUrl: string;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess, apiBaseUrl }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
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

  const features = [
    {
      icon: <TrendingUp sx={{ fontSize: 32 }} />,
      title: '最適な資産配分',
      description: 'AIが市場データを分析し、最適なポートフォリオを提案',
    },
    {
      icon: <Security sx={{ fontSize: 32 }} />,
      title: '安心のセキュリティ',
      description: '金融機関レベルのセキュリティで大切な情報を保護',
    },
    {
      icon: <Speed sx={{ fontSize: 32 }} />,
      title: 'リアルタイム分析',
      description: '最新の市場動向をリアルタイムで反映した分析',
    },
  ];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        backgroundColor: saasColors.background.default,
      }}
    >
      <Grid container sx={{ minHeight: '100vh' }}>
        {/* Left side - Login Form */}
        <Grid
          item
          xs={12}
          md={5}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: { xs: 3, md: 6 },
            backgroundColor: saasColors.background.paper,
          }}
        >
          <Box sx={{ width: '100%', maxWidth: 420 }}>
            {/* Logo */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 4 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  backgroundColor: saasColors.primary,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <AccountBalance sx={{ color: 'white', fontSize: 28 }} />
              </Box>
              <Box>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 700, color: saasColors.text.primary, lineHeight: 1.2 }}
                >
                  変額保険
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: saasColors.text.secondary }}
                >
                  アドバイザー
                </Typography>
              </Box>
            </Box>

            {/* Title */}
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, color: saasColors.text.primary }}>
              {mode === 'login' ? 'ログイン' : '新規登録'}
            </Typography>
            <Typography variant="body2" sx={{ color: saasColors.text.secondary, mb: 4 }}>
              {mode === 'login'
                ? 'アカウント情報を入力してください'
                : '必要な情報を入力して登録してください'}
            </Typography>

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
                sx={{
                  mt: 3,
                  mb: 2,
                  py: 1.5,
                  backgroundColor: saasColors.primary,
                  '&:hover': {
                    backgroundColor: saasColors.background.sidebarHover,
                  },
                }}
              >
                {loading ? (
                  <CircularProgress size={24} sx={{ color: 'white' }} />
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
                <Typography variant="body2" color="text.secondary">
                  アカウントをお持ちでない方は{' '}
                  <Link
                    component="button"
                    variant="body2"
                    sx={{ color: saasColors.primary, fontWeight: 600 }}
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
                <Typography variant="body2" color="text.secondary">
                  すでにアカウントをお持ちの方は{' '}
                  <Link
                    component="button"
                    variant="body2"
                    sx={{ color: saasColors.primary, fontWeight: 600 }}
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
              <Box sx={{ mt: 2, p: 2, bgcolor: saasColors.background.default, borderRadius: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  <strong>登録について：</strong>
                  <br />
                  • 担当者: 代理店IDが必要です
                  <br />
                  • 顧客: 担当者IDが必要です
                </Typography>
              </Box>
            )}

            <Box sx={{ mt: 3, pt: 2, borderTop: `1px solid ${saasColors.border}`, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                代理店として新規登録する場合
              </Typography>
              <Button
                variant="outlined"
                onClick={() => window.location.href = '/agency-register'}
                fullWidth
                sx={{
                  borderColor: saasColors.primary,
                  color: saasColors.primary,
                  '&:hover': {
                    borderColor: saasColors.background.sidebarHover,
                    backgroundColor: 'rgba(30, 58, 95, 0.04)',
                  },
                }}
              >
                代理店登録はこちら
              </Button>
            </Box>
          </Box>
        </Grid>

        {/* Right side - Catchphrase (hidden on mobile) */}
        {!isMobile && (
          <Grid
            item
            md={7}
            sx={{
              backgroundColor: saasColors.primary,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              p: 8,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Background pattern */}
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                opacity: 0.1,
                background: `radial-gradient(circle at 20% 80%, ${saasColors.secondary} 0%, transparent 50%),
                             radial-gradient(circle at 80% 20%, ${saasColors.accent} 0%, transparent 50%)`,
              }}
            />

            <Box sx={{ position: 'relative', zIndex: 1, maxWidth: 600 }}>
              <Typography
                variant="h2"
                sx={{
                  fontWeight: 700,
                  color: 'white',
                  mb: 2,
                  lineHeight: 1.2,
                }}
              >
                変額保険の運用を、
                <br />
                もっとスマートに。
              </Typography>

              <Typography
                variant="h6"
                sx={{
                  color: 'rgba(255, 255, 255, 0.8)',
                  mb: 6,
                  fontWeight: 400,
                  lineHeight: 1.6,
                }}
              >
                AIが最新の市場データを分析し、お客様一人ひとりに
                最適な資産配分をご提案。変額保険の運用を効率化し、
                顧客満足度の向上をサポートします。
              </Typography>

              {/* Features */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {features.map((feature, index) => (
                  <Box key={index} sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    <Box
                      sx={{
                        width: 56,
                        height: 56,
                        borderRadius: 2,
                        backgroundColor: 'rgba(255, 255, 255, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        flexShrink: 0,
                      }}
                    >
                      {feature.icon}
                    </Box>
                    <Box>
                      <Typography
                        variant="subtitle1"
                        sx={{ fontWeight: 600, color: 'white', mb: 0.5 }}
                      >
                        {feature.title}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                      >
                        {feature.description}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>

            {/* Version */}
            <Box sx={{ position: 'absolute', bottom: 32, left: 64 }}>
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                v1.8.9
              </Typography>
            </Box>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default Login;

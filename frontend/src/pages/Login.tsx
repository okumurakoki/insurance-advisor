import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  MenuItem,
  Alert,
  Container,
  FormControl,
  InputLabel,
  Select,
  CircularProgress,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

const Login: React.FC = () => {
  const [formData, setFormData] = useState({
    userId: '',
    password: '',
    accountType: '' as 'parent' | 'child' | 'grandchild' | '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!formData.accountType) {
      setError('アカウント種別を選択してください');
      setLoading(false);
      return;
    }

    try {
      await login(formData.userId, formData.password, formData.accountType);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.error || 'ログインに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ padding: 4, width: '100%' }}>
          <Typography component="h1" variant="h5" align="center" gutterBottom>
            変額保険アドバイザリーシステム
          </Typography>
          <Typography variant="subtitle1" align="center" gutterBottom sx={{ mb: 3 }}>
            ログイン
          </Typography>
          
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          
          <Box component="form" onSubmit={handleSubmit}>
            <FormControl fullWidth margin="normal" required>
              <InputLabel>アカウント種別</InputLabel>
              <Select
                value={formData.accountType}
                label="アカウント種別"
                onChange={(e) => setFormData({ ...formData, accountType: e.target.value as any })}
              >
                <MenuItem value="parent">代理店（親アカウント）</MenuItem>
                <MenuItem value="child">生保担当者（子アカウント）</MenuItem>
                <MenuItem value="grandchild">顧客（孫アカウント）</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              margin="normal"
              required
              fullWidth
              id="userId"
              label="ユーザーID"
              name="userId"
              autoComplete="username"
              autoFocus
              value={formData.userId}
              onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="パスワード"
              type="password"
              id="password"
              autoComplete="current-password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading || !formData.accountType || !formData.userId || !formData.password}
            >
              {loading ? <CircularProgress size={24} /> : 'ログイン'}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login;
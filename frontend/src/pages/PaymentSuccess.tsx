import React, { useEffect, useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import { CheckCircle, Error as ErrorIcon } from '@mui/icons-material';
import { useSearchParams, useNavigate } from 'react-router-dom';

const PaymentSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    // セッションIDがある場合は支払い成功とみなす
    if (sessionId) {
      // Webhookで処理されるため、少し待ってから成功表示
      setTimeout(() => {
        setStatus('success');
      }, 2000);
    } else {
      setStatus('error');
    }
  }, [sessionId]);

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        {status === 'loading' && (
          <Box>
            <CircularProgress size={60} sx={{ mb: 3 }} />
            <Typography variant="h5" gutterBottom>
              決済を確認中...
            </Typography>
            <Typography variant="body2" color="text.secondary">
              しばらくお待ちください
            </Typography>
          </Box>
        )}

        {status === 'success' && (
          <Box>
            <CheckCircle sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
            <Typography variant="h4" gutterBottom>
              登録完了！
            </Typography>
            <Typography variant="body1" sx={{ mb: 3 }}>
              お支払いが完了し、アカウントが有効化されました。
              <br />
              ログインしてサービスをご利用ください。
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/login')}
              sx={{ mt: 2 }}
            >
              ログインページへ
            </Button>
          </Box>
        )}

        {status === 'error' && (
          <Box>
            <ErrorIcon sx={{ fontSize: 80, color: 'error.main', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              エラーが発生しました
            </Typography>
            <Alert severity="error" sx={{ mb: 3 }}>
              決済の確認に失敗しました。
            </Alert>
            <Button
              variant="outlined"
              onClick={() => navigate('/agency-register')}
            >
              登録ページに戻る
            </Button>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default PaymentSuccess;

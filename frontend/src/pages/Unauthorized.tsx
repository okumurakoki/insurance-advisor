import React from 'react';
import { Container, Typography, Button, Box, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Block as BlockIcon } from '@mui/icons-material';

const Unauthorized: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
        <BlockIcon sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
        <Typography variant="h4" component="h1" gutterBottom>
          アクセスが拒否されました
        </Typography>
        <Typography variant="body1" paragraph sx={{ mb: 3 }}>
          このページにアクセスする権限がありません。
          別のアカウントでログインするか、管理者にお問い合わせください。
        </Typography>
        <Box display="flex" gap={2} justifyContent="center">
          <Button
            variant="outlined"
            onClick={() => navigate('/dashboard')}
          >
            ダッシュボードへ
          </Button>
          <Button
            variant="contained"
            onClick={() => navigate('/login')}
          >
            再ログイン
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default Unauthorized;
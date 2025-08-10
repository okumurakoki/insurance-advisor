import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  TextField,
  Button,
  Divider,
  Alert,
  Card,
  CardContent,
  Chip,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const Profile: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('新しいパスワードが一致しません');
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setPasswordError('パスワードは8文字以上で入力してください');
      return;
    }

    setChangingPassword(true);
    try {
      await api.changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      setPasswordSuccess('パスワードを変更しました');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (err: any) {
      setPasswordError(err.response?.data?.error || 'パスワードの変更に失敗しました');
    } finally {
      setChangingPassword(false);
    }
  };

  const getAccountTypeLabel = (type: string) => {
    const labels = {
      parent: '代理店（親アカウント）',
      child: '生保担当者（子アカウント）',
      grandchild: '顧客（孫アカウント）',
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getPlanTypeLabel = (type: string) => {
    const labels = {
      standard: 'スタンダードプラン',
      master: 'マスタープラン',
      exceed: 'エクシードプラン',
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getPlanColor = (type: string): 'default' | 'primary' | 'secondary' => {
    const colors = {
      standard: 'default' as const,
      master: 'primary' as const,
      exceed: 'secondary' as const,
    };
    return colors[type as keyof typeof colors] || 'default';
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        プロフィール
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                アカウント情報
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Box mb={2}>
                <Typography color="textSecondary" variant="body2">ユーザーID</Typography>
                <Typography variant="body1">{user?.userId}</Typography>
              </Box>
              
              <Box mb={2}>
                <Typography color="textSecondary" variant="body2">アカウント種別</Typography>
                <Typography variant="body1">
                  {getAccountTypeLabel(user?.accountType || '')}
                </Typography>
              </Box>
              
              <Box mb={2}>
                <Typography color="textSecondary" variant="body2">契約プラン</Typography>
                <Box mt={1}>
                  <Chip
                    label={getPlanTypeLabel(user?.planType || '')}
                    color={getPlanColor(user?.planType || '')}
                  />
                </Box>
              </Box>
              
              <Box>
                <Typography color="textSecondary" variant="body2">顧客登録上限</Typography>
                <Typography variant="h6" color="primary">
                  {user?.customerLimit}人
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                プラン詳細
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              {user?.planType === 'standard' && (
                <>
                  <Typography variant="body2" paragraph>
                    基本的な機能をご利用いただけます。
                  </Typography>
                  <ul>
                    <li>顧客登録: 最大10人</li>
                    <li>分析頻度: 月1回</li>
                    <li>エクスポート: PDF形式</li>
                  </ul>
                </>
              )}
              
              {user?.planType === 'master' && (
                <>
                  <Typography variant="body2" paragraph>
                    より高度な機能をご利用いただけます。
                  </Typography>
                  <ul>
                    <li>顧客登録: 最大50人</li>
                    <li>分析頻度: 週1回</li>
                    <li>エクスポート: PDF・Excel形式</li>
                  </ul>
                </>
              )}
              
              {user?.planType === 'exceed' && (
                <>
                  <Typography variant="body2" paragraph>
                    すべての機能を無制限でご利用いただけます。
                  </Typography>
                  <ul>
                    <li>顧客登録: 無制限（999人）</li>
                    <li>分析頻度: 毎日</li>
                    <li>エクスポート: PDF・Excel・API形式</li>
                  </ul>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              パスワード変更
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            {passwordError && <Alert severity="error" sx={{ mb: 2 }}>{passwordError}</Alert>}
            {passwordSuccess && <Alert severity="success" sx={{ mb: 2 }}>{passwordSuccess}</Alert>}
            
            <Box component="form" onSubmit={handlePasswordChange}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    type="password"
                    label="現在のパスワード"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="password"
                    label="新しいパスワード"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    required
                    helperText="8文字以上で入力してください"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="password"
                    label="新しいパスワード（確認）"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    required
                  />
                </Grid>
              </Grid>
              
              <Box mt={3} display="flex" justifyContent="flex-end">
                <Button
                  type="submit"
                  variant="contained"
                  disabled={changingPassword || !passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword}
                >
                  パスワード変更
                </Button>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Profile;
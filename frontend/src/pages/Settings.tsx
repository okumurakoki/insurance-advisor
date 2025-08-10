import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Switch,
  FormControlLabel,
  Button,
  Divider,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Card,
  CardContent,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const Settings: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [settings, setSettings] = useState({
    emailNotifications: true,
    analysisReminders: true,
    monthlyReports: false,
    language: 'ja',
    theme: 'light',
  });
  const [planUpgrading, setPlanUpgrading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSettingChange = (setting: string, value: any) => {
    setSettings({ ...settings, [setting]: value });
    // In a real app, you would save these settings to the backend
  };

  const handlePlanUpgrade = async (newPlan: 'standard' | 'master' | 'exceed') => {
    if (newPlan === user?.planType) return;

    setPlanUpgrading(true);
    setError('');
    setMessage('');

    try {
      await api.updatePlan(newPlan);
      await refreshUser();
      setMessage(`プランを${getPlanLabel(newPlan)}に変更しました`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'プランの変更に失敗しました');
    } finally {
      setPlanUpgrading(false);
    }
  };

  const getPlanLabel = (plan: string) => {
    const labels = {
      standard: 'スタンダード',
      master: 'マスター',
      exceed: 'エクシード',
    };
    return labels[plan as keyof typeof labels] || plan;
  };

  const getPlanPrice = (plan: string) => {
    const prices = {
      standard: '無料',
      master: '¥5,000/月',
      exceed: '¥15,000/月',
    };
    return prices[plan as keyof typeof prices] || '';
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        設定
      </Typography>

      {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          通知設定
        </Typography>
        <Divider sx={{ mb: 2 }} />
        
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.emailNotifications}
                  onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
                />
              }
              label="メール通知を受け取る"
            />
          </Grid>
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.analysisReminders}
                  onChange={(e) => handleSettingChange('analysisReminders', e.target.checked)}
                />
              }
              label="分析リマインダーを受け取る"
            />
          </Grid>
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.monthlyReports}
                  onChange={(e) => handleSettingChange('monthlyReports', e.target.checked)}
                />
              }
              label="月次レポートを受け取る"
            />
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          表示設定
        </Typography>
        <Divider sx={{ mb: 2 }} />
        
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>言語</InputLabel>
              <Select
                value={settings.language}
                label="言語"
                onChange={(e) => handleSettingChange('language', e.target.value)}
              >
                <MenuItem value="ja">日本語</MenuItem>
                <MenuItem value="en">English</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>テーマ</InputLabel>
              <Select
                value={settings.theme}
                label="テーマ"
                onChange={(e) => handleSettingChange('theme', e.target.value)}
              >
                <MenuItem value="light">ライト</MenuItem>
                <MenuItem value="dark">ダーク</MenuItem>
                <MenuItem value="auto">自動</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {user?.accountType === 'parent' && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            プラン変更
          </Typography>
          <Divider sx={{ mb: 3 }} />
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Card variant={user.planType === 'standard' ? 'outlined' : undefined}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    スタンダード
                  </Typography>
                  <Typography variant="h4" color="primary" gutterBottom>
                    {getPlanPrice('standard')}
                  </Typography>
                  <Typography variant="body2" paragraph>
                    • 顧客登録: 10人まで<br />
                    • 分析頻度: 月1回<br />
                    • エクスポート: PDF
                  </Typography>
                  <Button
                    fullWidth
                    variant={user.planType === 'standard' ? 'contained' : 'outlined'}
                    disabled={user.planType === 'standard' || planUpgrading}
                    onClick={() => handlePlanUpgrade('standard')}
                  >
                    {user.planType === 'standard' ? '現在のプラン' : '変更'}
                  </Button>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card variant={user.planType === 'master' ? 'outlined' : undefined}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    マスター
                  </Typography>
                  <Typography variant="h4" color="primary" gutterBottom>
                    {getPlanPrice('master')}
                  </Typography>
                  <Typography variant="body2" paragraph>
                    • 顧客登録: 50人まで<br />
                    • 分析頻度: 週1回<br />
                    • エクスポート: PDF, Excel
                  </Typography>
                  <Button
                    fullWidth
                    variant={user.planType === 'master' ? 'contained' : 'outlined'}
                    disabled={user.planType === 'master' || planUpgrading}
                    onClick={() => handlePlanUpgrade('master')}
                  >
                    {user.planType === 'master' ? '現在のプラン' : '変更'}
                  </Button>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card variant={user.planType === 'exceed' ? 'outlined' : undefined}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    エクシード
                  </Typography>
                  <Typography variant="h4" color="primary" gutterBottom>
                    {getPlanPrice('exceed')}
                  </Typography>
                  <Typography variant="body2" paragraph>
                    • 顧客登録: 無制限<br />
                    • 分析頻度: 毎日<br />
                    • エクスポート: PDF, Excel, API
                  </Typography>
                  <Button
                    fullWidth
                    variant={user.planType === 'exceed' ? 'contained' : 'outlined'}
                    disabled={user.planType === 'exceed' || planUpgrading}
                    onClick={() => handlePlanUpgrade('exceed')}
                  >
                    {user.planType === 'exceed' ? '現在のプラン' : '変更'}
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Paper>
      )}
    </Container>
  );
};

export default Settings;
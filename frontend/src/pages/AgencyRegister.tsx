import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Grid,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  CardActions,
  Chip,
  InputAdornment,
  IconButton,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Check,
  Business,
} from '@mui/icons-material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';

// 環境変数から取得し、/apiが含まれていない場合は追加
const baseUrl = (process.env.REACT_APP_API_URL || 'https://api.insurance-optimizer.com').replace(/\/+$/, '');
const API_URL = baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;

interface PlanDefinition {
  plan_type: string;
  plan_name: string;
  monthly_price: number;
  staff_limit: number;
  customer_limit: number;
  customer_limit_per_staff: number;
  description: string;
}

const AgencyRegister: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(1); // 1: 情報入力, 2: プラン選択
  const [formData, setFormData] = useState({
    userId: '',
    password: '',
    confirmPassword: '',
  });
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [plans, setPlans] = useState<PlanDefinition[]>([]);
  const [loading, setLoading] = useState(false);
  const [plansLoading, setPlansLoading] = useState(true);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // キャンセルされた場合のメッセージ
  const cancelled = searchParams.get('cancelled');

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await axios.get(`${API_URL}/stripe/available-plans`);
      if (response.data.success) {
        setPlans(response.data.plans);
      }
    } catch (err) {
      console.error('Failed to fetch plans:', err);
      // フォールバック用のプラン情報
      setPlans([
        { plan_type: 'bronze', plan_name: 'ブロンズ', monthly_price: 980, staff_limit: 1, customer_limit: 50, customer_limit_per_staff: 10, description: '個人向けスタータープラン' },
        { plan_type: 'silver', plan_name: 'シルバー', monthly_price: 1980, staff_limit: 3, customer_limit: 150, customer_limit_per_staff: 15, description: '小規模代理店向け' },
        { plan_type: 'gold', plan_name: 'ゴールド', monthly_price: 3980, staff_limit: 10, customer_limit: 500, customer_limit_per_staff: 20, description: '中規模代理店向け' },
        { plan_type: 'platinum', plan_name: 'プラチナ', monthly_price: 8980, staff_limit: 30, customer_limit: 1500, customer_limit_per_staff: 30, description: '大規模代理店向け' },
      ]);
    } finally {
      setPlansLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    setError('');
  };

  const validateStep1 = () => {
    if (!formData.userId || formData.userId.length < 4) {
      setError('ログインIDは4文字以上で入力してください');
      return false;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(formData.userId)) {
      setError('ログインIDは半角英数字とアンダースコアのみ使用できます');
      return false;
    }
    if (!formData.password || formData.password.length < 8) {
      setError('パスワードは8文字以上で入力してください');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('パスワードが一致しません');
      return false;
    }
    return true;
  };

  const handleNextStep = () => {
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handleSubmit = async () => {
    if (!selectedPlan) {
      setError('プランを選択してください');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 1. アカウント作成
      const registerResponse = await axios.post(`${API_URL}/auth/register`, {
        userId: formData.userId,
        password: formData.password,
        accountType: 'parent',
        planType: selectedPlan,
      });

      if (!registerResponse.data.requiresPayment) {
        // 支払い不要（管理者が作成した場合など）
        navigate('/login?registered=true');
        return;
      }

      // 2. Stripe Checkout Sessionを作成
      const checkoutResponse = await axios.post(`${API_URL}/stripe/create-initial-checkout`, {
        userId: formData.userId,
        planType: selectedPlan,
      });

      if (checkoutResponse.data.success && checkoutResponse.data.url) {
        // Stripe Checkoutページにリダイレクト
        window.location.href = checkoutResponse.data.url;
      } else {
        setError('決済ページの作成に失敗しました');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.response?.data?.message || '登録に失敗しました';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
    }).format(price);
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Business sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
          <Box>
            <Typography variant="h4" component="h1">
              代理店登録
            </Typography>
            <Typography variant="body2" color="text.secondary">
              変額保険アドバイザリーシステム
            </Typography>
          </Box>
        </Box>

        {cancelled && (
          <Alert severity="info" sx={{ mb: 3 }}>
            決済がキャンセルされました。再度お試しください。
          </Alert>
        )}

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        {/* ステップインジケーター */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Chip
              label="1. アカウント情報"
              color={step >= 1 ? 'primary' : 'default'}
              sx={{ mr: 1 }}
            />
            <Box sx={{ width: 40, height: 2, bgcolor: step >= 2 ? 'primary.main' : 'grey.300' }} />
            <Chip
              label="2. プラン選択"
              color={step >= 2 ? 'primary' : 'default'}
              sx={{ ml: 1 }}
            />
          </Box>
        </Box>

        {step === 1 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              アカウント情報を入力
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  label="ログインID"
                  value={formData.userId}
                  onChange={(e) => handleChange('userId', e.target.value)}
                  helperText="4文字以上の半角英数字（例: agency001）"
                  autoComplete="username"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  type={showPassword ? 'text' : 'password'}
                  label="パスワード"
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  helperText="8文字以上"
                  autoComplete="new-password"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  type={showPassword ? 'text' : 'password'}
                  label="パスワード（確認）"
                  value={formData.confirmPassword}
                  onChange={(e) => handleChange('confirmPassword', e.target.value)}
                  autoComplete="new-password"
                />
              </Grid>
            </Grid>

            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
              <Button
                variant="outlined"
                onClick={() => navigate('/login')}
              >
                ログインページへ
              </Button>
              <Button
                variant="contained"
                onClick={handleNextStep}
                disabled={!formData.userId || !formData.password || !formData.confirmPassword}
              >
                次へ：プラン選択
              </Button>
            </Box>
          </Box>
        )}

        {step === 2 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              プランを選択
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              ※ 料金は契約保険会社数によって変動します（基本料金 × 契約保険会社数）
            </Typography>

            {plansLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Grid container spacing={2}>
                {plans.map((plan) => (
                  <Grid item xs={12} sm={6} key={plan.plan_type}>
                    <Card
                      sx={{
                        height: '100%',
                        cursor: 'pointer',
                        border: selectedPlan === plan.plan_type ? 2 : 1,
                        borderColor: selectedPlan === plan.plan_type ? 'primary.main' : 'grey.300',
                        transition: 'all 0.2s',
                        '&:hover': {
                          borderColor: 'primary.main',
                          boxShadow: 2,
                        },
                      }}
                      onClick={() => setSelectedPlan(plan.plan_type)}
                    >
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="h6" component="h3">
                            {plan.plan_name}
                          </Typography>
                          {selectedPlan === plan.plan_type && (
                            <Check color="primary" />
                          )}
                        </Box>
                        <Typography variant="h4" color="primary" sx={{ mb: 1 }}>
                          {formatPrice(plan.monthly_price)}
                          <Typography component="span" variant="body2" color="text.secondary">
                            /月〜
                          </Typography>
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {plan.description}
                        </Typography>
                        <Box sx={{ borderTop: 1, borderColor: 'grey.200', pt: 2 }}>
                          <Typography variant="body2">
                            担当者数: 最大{plan.staff_limit}名
                          </Typography>
                          <Typography variant="body2">
                            顧客数: 担当者あたり{plan.customer_limit_per_staff}名
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}

            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
              <Button
                variant="outlined"
                onClick={() => setStep(1)}
              >
                戻る
              </Button>
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={loading || !selectedPlan}
                sx={{ minWidth: 200 }}
              >
                {loading ? <CircularProgress size={24} /> : '登録して支払いへ'}
              </Button>
            </Box>
          </Box>
        )}

        <Box sx={{ mt: 4, pt: 3, borderTop: 1, borderColor: 'grey.200' }}>
          <Typography variant="body2" color="text.secondary" align="center">
            既にアカウントをお持ちの方は{' '}
            <Button
              variant="text"
              size="small"
              onClick={() => navigate('/login')}
            >
              ログイン
            </Button>
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default AgencyRegister;

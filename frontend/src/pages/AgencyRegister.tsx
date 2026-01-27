import React, { useState, useEffect } from 'react';
import {
  TextField,
  Button,
  Typography,
  Box,
  Grid,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Chip,
  InputAdornment,
  IconButton,
  Checkbox,
  FormControlLabel,
  Divider,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Check,
  Business as BusinessIcon,
  AccountBalance,
  TrendingUp,
  Security,
  Groups,
} from '@mui/icons-material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { saasColors } from '../theme/saasTheme';

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

interface InsuranceCompany {
  id: number;
  company_code: string;
  company_name: string;
  display_name: string;
}

const AgencyRegister: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(1); // 1: 情報入力, 2: 保険会社選択, 3: プラン選択
  const [formData, setFormData] = useState({
    userId: '',
    password: '',
    confirmPassword: '',
  });
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [selectedCompanies, setSelectedCompanies] = useState<number[]>([]);
  const [plans, setPlans] = useState<PlanDefinition[]>([]);
  const [companies, setCompanies] = useState<InsuranceCompany[]>([]);
  const [loading, setLoading] = useState(false);
  const [plansLoading, setPlansLoading] = useState(true);
  const [companiesLoading, setCompaniesLoading] = useState(true);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // キャンセルされた場合のメッセージ
  const cancelled = searchParams.get('cancelled');

  useEffect(() => {
    fetchPlans();
    fetchCompanies();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await axios.get(`${API_URL}/stripe/available-plans`);
      if (response.data.success) {
        setPlans(response.data.plans);
      }
    } catch (err) {
      console.error('Failed to fetch plans:', err);
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

  const fetchCompanies = async () => {
    try {
      const response = await axios.get(`${API_URL}/insurance/companies`);
      setCompanies(response.data);
    } catch (err) {
      console.error('Failed to fetch companies:', err);
    } finally {
      setCompaniesLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    setError('');
  };

  const handleCompanyToggle = (companyId: number) => {
    setSelectedCompanies(prev =>
      prev.includes(companyId)
        ? prev.filter(id => id !== companyId)
        : [...prev, companyId]
    );
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

  const validateStep2 = () => {
    if (selectedCompanies.length === 0) {
      setError('契約する保険会社を最低1社選択してください');
      return false;
    }
    return true;
  };

  const handleNextStep = () => {
    if (step === 1 && validateStep1()) {
      setError('');
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setError('');
      setStep(3);
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
      // 1. アカウント作成（保険会社も含む）
      const registerResponse = await axios.post(`${API_URL}/auth/register`, {
        userId: formData.userId,
        password: formData.password,
        accountType: 'parent',
        planType: selectedPlan,
        insuranceCompanyIds: selectedCompanies,
      });

      if (!registerResponse.data.requiresPayment) {
        navigate('/login?registered=true');
        return;
      }

      // 2. Stripe Checkout Sessionを作成
      const checkoutResponse = await axios.post(`${API_URL}/stripe/create-initial-checkout`, {
        userId: formData.userId,
        planType: selectedPlan,
      });

      if (checkoutResponse.data.success && checkoutResponse.data.url) {
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

  const calculateTotalPrice = () => {
    const plan = plans.find(p => p.plan_type === selectedPlan);
    if (!plan) return 0;
    return plan.monthly_price * Math.max(selectedCompanies.length, 1);
  };

  const features = [
    {
      icon: <TrendingUp sx={{ fontSize: 32 }} />,
      title: 'AI最適化分析',
      description: '最新の市場データを元に、最適なポートフォリオを自動提案',
    },
    {
      icon: <Groups sx={{ fontSize: 32 }} />,
      title: 'チーム管理',
      description: '担当者ごとの顧客管理と進捗状況を一元管理',
    },
    {
      icon: <Security sx={{ fontSize: 32 }} />,
      title: 'セキュアな環境',
      description: '金融機関レベルのセキュリティで大切なデータを保護',
    },
  ];

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <>
            <Typography variant="body2" sx={{ color: saasColors.text.secondary, mb: 3 }}>
              代理店アカウントの基本情報を入力してください
            </Typography>
            <TextField
              required
              fullWidth
              label="ログインID"
              value={formData.userId}
              onChange={(e) => handleChange('userId', e.target.value)}
              helperText="4文字以上の半角英数字（例: agency001）"
              autoComplete="username"
              margin="normal"
            />
            <TextField
              required
              fullWidth
              type={showPassword ? 'text' : 'password'}
              label="パスワード"
              value={formData.password}
              onChange={(e) => handleChange('password', e.target.value)}
              helperText="8文字以上"
              autoComplete="new-password"
              margin="normal"
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
            <TextField
              required
              fullWidth
              type={showPassword ? 'text' : 'password'}
              label="パスワード（確認）"
              value={formData.confirmPassword}
              onChange={(e) => handleChange('confirmPassword', e.target.value)}
              autoComplete="new-password"
              margin="normal"
            />
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
              <Button
                variant="text"
                onClick={() => navigate('/login')}
                sx={{ color: saasColors.text.secondary }}
              >
                ログインへ戻る
              </Button>
              <Button
                variant="contained"
                onClick={handleNextStep}
                disabled={!formData.userId || !formData.password || !formData.confirmPassword}
                sx={{
                  backgroundColor: saasColors.primary,
                  '&:hover': { backgroundColor: saasColors.background.sidebarHover },
                }}
              >
                次へ
              </Button>
            </Box>
          </>
        );

      case 2:
        return (
          <>
            <Typography variant="body2" sx={{ color: saasColors.text.secondary, mb: 3 }}>
              分析を利用したい保険会社を選択してください（複数選択可）
            </Typography>
            {companiesLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Box sx={{ maxHeight: 300, overflowY: 'auto', mb: 2 }}>
                <Grid container spacing={1}>
                  {companies.map((company) => (
                    <Grid item xs={12} sm={6} key={company.id}>
                      <Card
                        sx={{
                          cursor: 'pointer',
                          border: selectedCompanies.includes(company.id) ? 2 : 1,
                          borderColor: selectedCompanies.includes(company.id) ? saasColors.primary : saasColors.border,
                          transition: 'all 0.2s',
                          '&:hover': {
                            borderColor: saasColors.primary,
                          },
                        }}
                        onClick={() => handleCompanyToggle(company.id)}
                      >
                        <CardContent sx={{ py: 1, px: 2, '&:last-child': { pb: 1 } }}>
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={selectedCompanies.includes(company.id)}
                                onChange={() => handleCompanyToggle(company.id)}
                                sx={{ color: saasColors.primary, '&.Mui-checked': { color: saasColors.primary } }}
                              />
                            }
                            label={
                              <Typography variant="body2">
                                {company.display_name || company.company_name}
                              </Typography>
                            }
                            sx={{ m: 0 }}
                          />
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}
            <Box sx={{ p: 1.5, bgcolor: saasColors.background.default, borderRadius: 1, mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                選択中: <strong>{selectedCompanies.length}社</strong>
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Button variant="outlined" onClick={() => setStep(1)}>
                戻る
              </Button>
              <Button
                variant="contained"
                onClick={handleNextStep}
                disabled={selectedCompanies.length === 0}
                sx={{
                  backgroundColor: saasColors.primary,
                  '&:hover': { backgroundColor: saasColors.background.sidebarHover },
                }}
              >
                次へ
              </Button>
            </Box>
          </>
        );

      case 3:
        return (
          <>
            <Typography variant="body2" sx={{ color: saasColors.text.secondary, mb: 2 }}>
              ご利用プランを選択してください
            </Typography>
            <Alert severity="info" sx={{ mb: 2, fontSize: '12px' }}>
              月額料金 = 基本料金 × 契約保険会社数（{selectedCompanies.length}社）
            </Alert>
            {plansLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Box sx={{ maxHeight: 280, overflowY: 'auto', mb: 2 }}>
                <Grid container spacing={1}>
                  {plans.map((plan) => (
                    <Grid item xs={12} sm={6} key={plan.plan_type}>
                      <Card
                        sx={{
                          cursor: 'pointer',
                          border: selectedPlan === plan.plan_type ? 2 : 1,
                          borderColor: selectedPlan === plan.plan_type ? saasColors.primary : saasColors.border,
                          transition: 'all 0.2s',
                          '&:hover': {
                            borderColor: saasColors.primary,
                          },
                        }}
                        onClick={() => setSelectedPlan(plan.plan_type)}
                      >
                        <CardContent sx={{ p: 1.5 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                            <Typography variant="subtitle2" fontWeight={600}>
                              {plan.plan_name}
                            </Typography>
                            {selectedPlan === plan.plan_type && (
                              <Check sx={{ color: saasColors.primary, fontSize: 18 }} />
                            )}
                          </Box>
                          <Typography variant="h6" sx={{ color: saasColors.primary }}>
                            {formatPrice(plan.monthly_price * selectedCompanies.length)}
                            <Typography component="span" variant="caption" color="text.secondary">/月</Typography>
                          </Typography>
                          <Typography variant="caption" color="text.secondary" display="block">
                            担当者: {plan.staff_limit}名 / 顧客: {plan.customer_limit_per_staff}名/担当
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}
            {selectedPlan && (
              <Box sx={{ p: 1.5, bgcolor: saasColors.primary, color: 'white', borderRadius: 1, mb: 2 }}>
                <Typography variant="body2" fontWeight={600}>
                  お支払い金額: {formatPrice(calculateTotalPrice())}/月
                </Typography>
              </Box>
            )}
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Button variant="outlined" onClick={() => setStep(2)}>
                戻る
              </Button>
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={loading || !selectedPlan}
                sx={{
                  backgroundColor: saasColors.primary,
                  '&:hover': { backgroundColor: saasColors.background.sidebarHover },
                }}
              >
                {loading ? <CircularProgress size={20} sx={{ color: 'white' }} /> : '登録して支払いへ'}
              </Button>
            </Box>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        backgroundColor: saasColors.background.default,
      }}
    >
      <Grid container sx={{ minHeight: '100vh' }}>
        {/* Left side - Registration Form */}
        <Grid
          item
          xs={12}
          md={5}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: { xs: 3, md: 5 },
            backgroundColor: saasColors.background.paper,
          }}
        >
          <Box sx={{ width: '100%', maxWidth: 440 }}>
            {/* Logo */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
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
              代理店登録
            </Typography>

            {/* Step Indicator */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
              <Chip
                label="1. アカウント"
                size="small"
                sx={{
                  bgcolor: step >= 1 ? saasColors.primary : saasColors.border,
                  color: step >= 1 ? 'white' : saasColors.text.secondary,
                  fontWeight: 500,
                }}
              />
              <Box sx={{ width: 16, height: 2, bgcolor: step >= 2 ? saasColors.primary : saasColors.border }} />
              <Chip
                label="2. 保険会社"
                size="small"
                sx={{
                  bgcolor: step >= 2 ? saasColors.primary : saasColors.border,
                  color: step >= 2 ? 'white' : saasColors.text.secondary,
                  fontWeight: 500,
                }}
              />
              <Box sx={{ width: 16, height: 2, bgcolor: step >= 3 ? saasColors.primary : saasColors.border }} />
              <Chip
                label="3. プラン"
                size="small"
                sx={{
                  bgcolor: step >= 3 ? saasColors.primary : saasColors.border,
                  color: step >= 3 ? 'white' : saasColors.text.secondary,
                  fontWeight: 500,
                }}
              />
            </Box>

            {cancelled && (
              <Alert severity="info" sx={{ mb: 2 }}>
                決済がキャンセルされました。再度お試しください。
              </Alert>
            )}

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {renderStepContent()}

            <Divider sx={{ my: 3 }} />

            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                既にアカウントをお持ちの方は{' '}
                <Button
                  variant="text"
                  size="small"
                  onClick={() => navigate('/login')}
                  sx={{ color: saasColors.primary, fontWeight: 600 }}
                >
                  ログイン
                </Button>
              </Typography>
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
                opacity: 0.08,
                background: `radial-gradient(circle at 20% 80%, ${saasColors.secondary} 0%, transparent 50%),
                             radial-gradient(circle at 80% 20%, ${saasColors.accent} 0%, transparent 50%)`,
              }}
            />

            <Box sx={{ position: 'relative', zIndex: 1, maxWidth: 560 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <BusinessIcon sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: 28 }} />
                <Typography variant="overline" sx={{ color: 'rgba(255, 255, 255, 0.7)', letterSpacing: 2 }}>
                  FOR AGENCIES
                </Typography>
              </Box>

              <Typography
                variant="h2"
                sx={{
                  fontWeight: 700,
                  color: 'white',
                  mb: 2,
                  lineHeight: 1.2,
                }}
              >
                代理店業務を、
                <br />
                次のステージへ。
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
                AIが最新の市場データを分析し、担当者ごとの顧客管理から
                最適な資産配分の提案まで、代理店業務全体を効率化。
                チーム全体の生産性向上をサポートします。
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
                        backgroundColor: 'rgba(255, 255, 255, 0.12)',
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

export default AgencyRegister;

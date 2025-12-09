import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Alert,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  Divider,
} from '@mui/material';
import {
  Business as BusinessIcon,
  Settings as SettingsIcon,
  CreditCard as CreditCardIcon,
  Cancel as CancelIcon,
  Check as CheckIcon,
} from '@mui/icons-material';
import api from '../services/api.ts';

interface InsuranceCompany {
  id: number;
  company_code: string;
  company_name: string;
  company_name_en: string;
  display_name: string;
  is_active: boolean;
}

interface AgencyCompany {
  id: number;
  company_id: number;
  company_code: string;
  company_name: string;
  display_name: string;
  contract_start_date: string;
  contract_end_date: string | null;
  is_active: boolean;
}

interface UserContract {
  id: number;
  user_id: number;
  company_id: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  company_code: string;
  company_name: string;
  display_name: string;
}

interface AgencyStats {
  staffCount: number;
  staffLimit: number;
  customerCount: number;
  customerLimit: number;
  planType: string;
  planName: string;
  monthlyPrice: number;
  basePlanPrice?: number;
  contractCount?: number;
  effectiveContractCount?: number;
}

interface PlanDefinition {
  plan_type: string;
  plan_name: string;
  monthly_price: number;
  staff_limit: number;
  customer_limit: number;
  customer_limit_per_staff: number;
  description: string;
}

const AgencySettings: React.FC = () => {
  const [myCompanies, setMyCompanies] = useState<AgencyCompany[]>([]);
  const [agencyStats, setAgencyStats] = useState<AgencyStats | null>(null);
  const [availablePlans, setAvailablePlans] = useState<PlanDefinition[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // ダイアログ状態
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedNewPlan, setSelectedNewPlan] = useState<string>('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [myComps, stats, plans] = await Promise.all([
        api.getMyInsuranceCompanies(),
        api.getMyAgencyStats().catch(() => null),
        api.getAvailablePlans().catch(() => []),
      ]);
      setMyCompanies(myComps as any);
      if (stats) {
        setAgencyStats(stats);
      }
      if (plans && Array.isArray(plans)) {
        setAvailablePlans(plans);
      }
    } catch (err: any) {
      console.error('Failed to load data:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handlePlanChange = async () => {
    if (!selectedNewPlan) return;

    setActionLoading(true);
    setError(null);

    try {
      await api.changePlan(selectedNewPlan);
      setSuccess('プランを変更しました');
      setPlanDialogOpen(false);
      setSelectedNewPlan('');
      loadData(); // 再読み込み
    } catch (err: any) {
      setError(err.message || 'プラン変更に失敗しました');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    setActionLoading(true);
    setError(null);

    try {
      await api.cancelSubscription();
      setSuccess('サブスクリプションを解約しました');
      setCancelDialogOpen(false);
      loadData(); // 再読み込み
    } catch (err: any) {
      setError(err.message || '解約に失敗しました');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenPortal = async () => {
    setActionLoading(true);
    try {
      const result = await api.createPortalSession();
      if (result.url) {
        window.location.href = result.url;
      }
    } catch (err: any) {
      setError(err.message || '請求ポータルを開けませんでした');
      setActionLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
    }).format(price);
  };

  if (loading && myCompanies.length === 0) {
    return (
      <Container>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SettingsIcon fontSize="large" />
          代理店設定
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          プランと取り扱い保険会社を管理します
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* プラン・請求情報 */}
      {agencyStats && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CreditCardIcon />
            プラン・請求情報
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
              <Typography variant="body2" color="text.secondary">
                現在のプラン
              </Typography>
              <Typography variant="h6">
                {agencyStats.planName}
              </Typography>
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography variant="body2" color="text.secondary">
                契約保険会社数
              </Typography>
              <Typography variant="h6">
                {agencyStats.contractCount || myCompanies.length}社
              </Typography>
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography variant="body2" color="text.secondary">
                基本料金
              </Typography>
              <Typography variant="h6">
                {formatPrice(agencyStats.basePlanPrice || 0)}/社
              </Typography>
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography variant="body2" color="text.secondary">
                月額料金（合計）
              </Typography>
              <Typography variant="h5" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                {formatPrice(agencyStats.monthlyPrice)}/月
              </Typography>
            </Grid>
          </Grid>

          {agencyStats.basePlanPrice && agencyStats.contractCount && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              料金計算: {formatPrice(agencyStats.basePlanPrice)} × {agencyStats.contractCount}社 = {formatPrice(agencyStats.monthlyPrice)}
            </Typography>
          )}

          <Divider sx={{ my: 3 }} />

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              onClick={() => setPlanDialogOpen(true)}
              startIcon={<SettingsIcon />}
            >
              プラン変更
            </Button>
            <Button
              variant="outlined"
              onClick={handleOpenPortal}
              disabled={actionLoading}
              startIcon={<CreditCardIcon />}
            >
              請求・支払い管理
            </Button>
            <Button
              variant="outlined"
              color="error"
              onClick={() => setCancelDialogOpen(true)}
              startIcon={<CancelIcon />}
            >
              解約
            </Button>
          </Box>
        </Paper>
      )}

      {/* 取り扱い保険会社 */}
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6">取り扱い中の保険会社</Typography>
          <Chip
            label="保険会社の追加・削除は管理者にお問い合わせください"
            color="info"
            size="small"
          />
        </Box>

        {myCompanies.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body1" color="text.secondary">
              取り扱い保険会社が登録されていません
            </Typography>
          </Box>
        ) : (
          <List>
            {myCompanies.map((company) => (
              <ListItem key={company.id} sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <BusinessIcon sx={{ mr: 2, color: 'primary.main' }} />
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="h6">{company.display_name}</Typography>
                      <Chip label="契約中" color="success" size="small" />
                    </Box>
                  }
                  secondary={`契約開始日: ${new Date(company.contract_start_date).toLocaleDateString('ja-JP')}`}
                />
              </ListItem>
            ))}
          </List>
        )}
      </Paper>

      {/* プラン変更ダイアログ */}
      <Dialog open={planDialogOpen} onClose={() => setPlanDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>プランを変更</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            新しいプランを選択してください。変更は即時反映され、日割り計算で請求されます。
          </Typography>
          <Grid container spacing={2}>
            {availablePlans.map((plan) => (
              <Grid item xs={12} sm={6} key={plan.plan_type}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    border: selectedNewPlan === plan.plan_type ? 2 : 1,
                    borderColor: selectedNewPlan === plan.plan_type ? 'primary.main' : 'grey.300',
                    bgcolor: agencyStats?.planType === plan.plan_type ? 'grey.100' : 'white',
                    '&:hover': {
                      borderColor: 'primary.main',
                    },
                  }}
                  onClick={() => {
                    if (agencyStats?.planType !== plan.plan_type) {
                      setSelectedNewPlan(plan.plan_type);
                    }
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="h6">{plan.plan_name}</Typography>
                      {agencyStats?.planType === plan.plan_type && (
                        <Chip label="現在のプラン" size="small" color="primary" />
                      )}
                      {selectedNewPlan === plan.plan_type && (
                        <CheckIcon color="primary" />
                      )}
                    </Box>
                    <Typography variant="h5" color="primary" sx={{ my: 1 }}>
                      {formatPrice(plan.monthly_price * (agencyStats?.contractCount || 1))}/月
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      基本料金: {formatPrice(plan.monthly_price)}/社
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {plan.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPlanDialogOpen(false)}>キャンセル</Button>
          <Button
            variant="contained"
            onClick={handlePlanChange}
            disabled={!selectedNewPlan || actionLoading}
          >
            {actionLoading ? <CircularProgress size={24} /> : 'プランを変更'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 解約確認ダイアログ */}
      <Dialog open={cancelDialogOpen} onClose={() => setCancelDialogOpen(false)}>
        <DialogTitle>サブスクリプションを解約</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            解約すると、現在の請求期間終了後にサービスが利用できなくなります。
          </Alert>
          <Typography variant="body1">
            本当に解約しますか？この操作は取り消せません。
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialogOpen(false)}>キャンセル</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleCancelSubscription}
            disabled={actionLoading}
          >
            {actionLoading ? <CircularProgress size={24} /> : '解約する'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AgencySettings;

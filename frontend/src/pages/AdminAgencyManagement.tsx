import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Chip,
  Card,
  CardContent,
  Tabs,
  Tab,
  TextField,
  Divider,
} from '@mui/material';
import {
  Business as BusinessIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import api from '../services/api.ts';

interface Agency {
  id: number;
  user_id?: string;
  userId?: string;
  account_type?: string;
  planType?: string;
  isActive?: boolean;
}

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

interface PlanDefinition {
  plan_type: string;
  plan_name: string;
  monthly_price: number;
  staff_limit: number;
  customer_limit: number | null;
  customer_limit_per_staff: number | null;
  description: string;
  is_active: boolean;
}

const AdminAgencyManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<number>(0);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [selectedAgencyId, setSelectedAgencyId] = useState<number | null>(null);
  const [allCompanies, setAllCompanies] = useState<InsuranceCompany[]>([]);
  const [agencyCompanies, setAgencyCompanies] = useState<UserContract[]>([]);
  const [agencyStats, setAgencyStats] = useState<AgencyStats | null>(null);
  const [plans, setPlans] = useState<PlanDefinition[]>([]);
  const [selectedPlanType, setSelectedPlanType] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [openAddDialog, setOpenAddDialog] = useState<boolean>(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<number>(0);

  useEffect(() => {
    loadAgencies();
    loadAllCompanies();
    loadPlans();
  }, []);

  useEffect(() => {
    if (selectedAgencyId) {
      loadAgencyCompanies(selectedAgencyId);
      loadAgencyStats(selectedAgencyId);
    }
  }, [selectedAgencyId]);

  const loadAgencies = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getAgencies();
      setAgencies(data);
      if (data.length > 0 && !selectedAgencyId) {
        setSelectedAgencyId(data[0].id);
      }
    } catch (err: any) {
      console.error('Failed to load agencies:', err);
      setError(err.message || 'Failed to load agencies');
    } finally {
      setLoading(false);
    }
  };

  const loadAllCompanies = async () => {
    try {
      const companies = await api.getInsuranceCompanies();
      setAllCompanies(companies);
    } catch (err: any) {
      console.error('Failed to load companies:', err);
      setError(err.message || 'Failed to load companies');
    }
  };

  const loadPlans = async () => {
    try {
      const planData = await api.getPlans();
      setPlans(planData);
    } catch (err: any) {
      console.error('Failed to load plans:', err);
      setError(err.message || 'Failed to load plans');
    }
  };

  const loadAgencyCompanies = async (agencyId: number) => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getUserContracts(agencyId);
      setAgencyCompanies(data);
    } catch (err: any) {
      console.error('Failed to load agency companies:', err);
      setError(err.message || 'Failed to load agency companies');
    } finally {
      setLoading(false);
    }
  };

  const loadAgencyStats = async (agencyId: number) => {
    try {
      const stats = await api.getAgencyStats(agencyId);
      setAgencyStats(stats);
    } catch (err: any) {
      console.error('Failed to load agency stats:', err);
      setAgencyStats(null);
    }
  };

  const handleAddCompany = async () => {
    if (!selectedCompanyId || !selectedAgencyId) {
      setError('保険会社と代理店を選択してください');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await api.addUserContract(selectedAgencyId, selectedCompanyId);
      setSuccess('保険会社を追加しました');
      setOpenAddDialog(false);
      setSelectedCompanyId(0);
      await loadAgencyCompanies(selectedAgencyId);
      await loadAgencyStats(selectedAgencyId);
    } catch (err: any) {
      console.error('Failed to add company:', err);
      setError(err.message || 'Failed to add company');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveCompany = async (contractId: number) => {
    if (!window.confirm('この保険会社との契約を削除しますか？') || !selectedAgencyId) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await api.removeUserContract(selectedAgencyId, contractId);
      setSuccess('保険会社との契約を削除しました');
      await loadAgencyCompanies(selectedAgencyId);
      await loadAgencyStats(selectedAgencyId);
    } catch (err: any) {
      console.error('Failed to remove company:', err);
      setError(err.message || 'Failed to remove company');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePlan = async () => {
    if (!selectedAgencyId || !selectedPlanType) {
      setError('代理店とプランを選択してください');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await api.updateAgencyPlan(selectedAgencyId, { planType: selectedPlanType });
      setSuccess('プランを更新しました');
      await loadAgencies();
      await loadAgencyStats(selectedAgencyId);
      setSelectedPlanType('');
    } catch (err: any) {
      console.error('Failed to update plan:', err);
      setError(err.message || 'Failed to update plan');
    } finally {
      setLoading(false);
    }
  };

  const selectedAgency = agencies.find(a => a.id === selectedAgencyId);
  const availableCompanies = allCompanies.filter(
    (company) => !agencyCompanies.some((ac) => ac.company_id === company.id)
  );

  if (loading && agencies.length === 0) {
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
          代理店管理
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          各代理店のプラン・保険会社を管理します（管理者専用）
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

      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)} aria-label="代理店管理タブ">
          <Tab label="保険会社管理" />
          <Tab label="プラン設定" />
        </Tabs>
      </Paper>

      {activeTab === 0 && (
        <Grid container spacing={3}>
        {/* 代理店選択 */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                代理店選択
              </Typography>
              <FormControl fullWidth>
                <InputLabel>代理店</InputLabel>
                <Select
                  value={selectedAgencyId || ''}
                  onChange={(e) => setSelectedAgencyId(e.target.value as number)}
                  label="代理店"
                >
                  {agencies.map((agency) => (
                    <MenuItem key={agency.id} value={agency.id}>
                      {agency.userId || agency.user_id}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {selectedAgency && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    アカウントタイプ: {selectedAgency.account_type || 'parent'}
                  </Typography>
                  {selectedAgency.planType && (
                    <Typography variant="body2" color="text.secondary">
                      プラン: {selectedAgency.planType}
                    </Typography>
                  )}
                </Box>
              )}
              {agencyStats && (
                <Box sx={{ mt: 3, p: 2, backgroundColor: '#f8f9fa', borderRadius: 1 }}>
                  <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                    月額料金
                  </Typography>
                  <Typography variant="h5" color="primary.main" gutterBottom sx={{ fontWeight: 'bold' }}>
                    ¥{agencyStats.monthlyPrice.toLocaleString()}/月
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    契約保険会社数: {agencyStats.contractCount || 0}社
                  </Typography>
                  {agencyStats.basePlanPrice && (
                    <>
                      <Typography variant="body2" color="text.secondary">
                        基本料金: ¥{agencyStats.basePlanPrice.toLocaleString()}/社
                      </Typography>
                      {agencyStats.contractCount && (
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                          計算: ¥{agencyStats.basePlanPrice.toLocaleString()} × {agencyStats.contractCount}社
                        </Typography>
                      )}
                    </>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* 契約保険会社一覧 */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6">契約中の保険会社</Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setOpenAddDialog(true)}
                disabled={!selectedAgencyId || availableCompanies.length === 0}
              >
                保険会社を追加
              </Button>
            </Box>

            {!selectedAgencyId ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" color="text.secondary">
                  代理店を選択してください
                </Typography>
              </Box>
            ) : agencyCompanies.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" color="text.secondary">
                  契約中の保険会社がありません
                </Typography>
              </Box>
            ) : (
              <List>
                {agencyCompanies.map((company) => (
                  <ListItem key={company.id} sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <BusinessIcon sx={{ mr: 2, color: 'primary.main' }} />
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="h6">{company.display_name}</Typography>
                          <Chip label={company.is_active ? "契約中" : "無効"} color={company.is_active ? "success" : "default"} size="small" />
                        </Box>
                      }
                      secondary={`契約開始日: ${new Date(company.created_at).toLocaleDateString('ja-JP')}`}
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        aria-label="delete"
                        onClick={() => handleRemoveCompany(company.id)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Grid>
      </Grid>
      )}

      {activeTab === 1 && (
        <Grid container spacing={3}>
          {/* 代理店選択 */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  代理店選択
                </Typography>
                <FormControl fullWidth>
                  <InputLabel>代理店</InputLabel>
                  <Select
                    value={selectedAgencyId || ''}
                    onChange={(e) => setSelectedAgencyId(e.target.value as number)}
                    label="代理店"
                  >
                    {agencies.map((agency) => (
                      <MenuItem key={agency.id} value={agency.id}>
                        {agency.userId || agency.user_id}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                {selectedAgency && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      現在のプラン: {selectedAgency.planType || 'N/A'}
                    </Typography>
                  </Box>
                )}
                {agencyStats && (
                  <Box sx={{ mt: 3, p: 2, backgroundColor: '#f8f9fa', borderRadius: 1 }}>
                    <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                      現在の月額料金
                    </Typography>
                    <Typography variant="h5" color="primary.main" gutterBottom sx={{ fontWeight: 'bold' }}>
                      ¥{agencyStats.monthlyPrice.toLocaleString()}/月
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      契約保険会社数: {agencyStats.contractCount || 0}社
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* プラン変更 */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                プラン変更
              </Typography>
              <Divider sx={{ mb: 3 }} />

              {!selectedAgencyId ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body1" color="text.secondary">
                    代理店を選択してください
                  </Typography>
                </Box>
              ) : (
                <>
                  <FormControl fullWidth sx={{ mb: 3 }}>
                    <InputLabel>新しいプラン</InputLabel>
                    <Select
                      value={selectedPlanType}
                      onChange={(e) => setSelectedPlanType(e.target.value)}
                      label="新しいプラン"
                    >
                      <MenuItem value="">選択してください</MenuItem>
                      {plans.map((plan) => (
                        <MenuItem key={plan.plan_type} value={plan.plan_type}>
                          {plan.plan_name} (¥{plan.monthly_price.toLocaleString()}/社/月)
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {selectedPlanType && (
                    <Box sx={{ mb: 3, p: 2, backgroundColor: '#f0f7ff', borderRadius: 1 }}>
                      <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                        選択中のプラン情報
                      </Typography>
                      {plans.find(p => p.plan_type === selectedPlanType) && (
                        <>
                          <Typography variant="body2">
                            プラン名: {plans.find(p => p.plan_type === selectedPlanType)?.plan_name}
                          </Typography>
                          <Typography variant="body2">
                            基本料金: ¥{plans.find(p => p.plan_type === selectedPlanType)?.monthly_price.toLocaleString()}/社/月
                          </Typography>
                          <Typography variant="body2">
                            スタッフ上限: {plans.find(p => p.plan_type === selectedPlanType)?.staff_limit}名
                          </Typography>
                          <Typography variant="body2">
                            顧客上限: {plans.find(p => p.plan_type === selectedPlanType)?.customer_limit ||
                              `${plans.find(p => p.plan_type === selectedPlanType)?.customer_limit_per_staff}名/スタッフ`}
                          </Typography>
                        </>
                      )}
                    </Box>
                  )}

                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleUpdatePlan}
                    disabled={!selectedPlanType || loading}
                  >
                    プランを更新
                  </Button>
                </>
              )}
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* 保険会社追加ダイアログ */}
      <Dialog
        open={openAddDialog}
        onClose={() => setOpenAddDialog(false)}
        maxWidth="sm"
        fullWidth
        disableRestoreFocus
      >
        <DialogTitle>保険会社を追加</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>保険会社</InputLabel>
            <Select
              value={selectedCompanyId}
              onChange={(e) => setSelectedCompanyId(e.target.value as number)}
              label="保険会社"
              autoFocus
            >
              <MenuItem value={0}>選択してください</MenuItem>
              {availableCompanies.map((company) => (
                <MenuItem key={company.id} value={company.id}>
                  {company.display_name} ({company.company_code})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddDialog(false)}>キャンセル</Button>
          <Button onClick={handleAddCompany} variant="contained" disabled={!selectedCompanyId}>
            追加
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminAgencyManagement;

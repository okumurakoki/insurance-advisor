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
  user_id: string;
  account_type: string;
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

const AdminAgencyManagement: React.FC = () => {
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [selectedAgencyId, setSelectedAgencyId] = useState<number | null>(null);
  const [allCompanies, setAllCompanies] = useState<InsuranceCompany[]>([]);
  const [agencyCompanies, setAgencyCompanies] = useState<AgencyCompany[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [openAddDialog, setOpenAddDialog] = useState<boolean>(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<number>(0);

  useEffect(() => {
    loadAgencies();
    loadAllCompanies();
  }, []);

  useEffect(() => {
    if (selectedAgencyId) {
      loadAgencyCompanies(selectedAgencyId);
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

  const loadAgencyCompanies = async (agencyId: number) => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getAgencyCompanies(agencyId);
      setAgencyCompanies(data);
    } catch (err: any) {
      console.error('Failed to load agency companies:', err);
      setError(err.message || 'Failed to load agency companies');
    } finally {
      setLoading(false);
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
      await api.addAgencyCompany({
        user_id: selectedAgencyId,
        company_id: selectedCompanyId,
        contract_start_date: new Date().toISOString().split('T')[0],
      });
      setSuccess('保険会社を追加しました');
      setOpenAddDialog(false);
      setSelectedCompanyId(0);
      await loadAgencyCompanies(selectedAgencyId);
    } catch (err: any) {
      console.error('Failed to add company:', err);
      setError(err.message || 'Failed to add company');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveCompany = async (agencyCompanyId: number) => {
    if (!window.confirm('この保険会社との契約を削除しますか？')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await api.removeAgencyCompany(agencyCompanyId);
      setSuccess('保険会社との契約を削除しました');
      if (selectedAgencyId) {
        await loadAgencyCompanies(selectedAgencyId);
      }
    } catch (err: any) {
      console.error('Failed to remove company:', err);
      setError(err.message || 'Failed to remove company');
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
          代理店の保険会社管理
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          各代理店が取り扱う保険会社を管理します（管理者専用）
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
                      {agency.user_id}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {selectedAgency && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    アカウントタイプ: {selectedAgency.account_type}
                  </Typography>
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
                          <Chip label="契約中" color="success" size="small" />
                        </Box>
                      }
                      secondary={`契約開始日: ${new Date(company.contract_start_date).toLocaleDateString('ja-JP')}`}
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

      {/* 保険会社追加ダイアログ */}
      <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>保険会社を追加</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>保険会社</InputLabel>
            <Select
              value={selectedCompanyId}
              onChange={(e) => setSelectedCompanyId(e.target.value as number)}
              label="保険会社"
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

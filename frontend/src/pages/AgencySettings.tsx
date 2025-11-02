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
} from '@mui/material';
import {
  Business as BusinessIcon,
  Settings as SettingsIcon,
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

const AgencySettings: React.FC = () => {
  const [myCompanies, setMyCompanies] = useState<AgencyCompany[]>([]);
  const [agencyStats, setAgencyStats] = useState<AgencyStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [myComps, stats] = await Promise.all([
        api.getMyInsuranceCompanies(),
        api.getMyAgencyStats().catch(() => null), // Optional: don't fail if stats unavailable
      ]);
      setMyCompanies(myComps as any);
      if (stats) {
        setAgencyStats(stats);
      }
    } catch (err: any) {
      console.error('Failed to load data:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
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
          取り扱い保険会社設定
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          代理店で取り扱う保険会社を管理します
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

      {agencyStats && (
        <Paper sx={{ p: 3, mb: 3, backgroundColor: '#f8f9fa' }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            プラン料金
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
              <Typography variant="body2" color="text.secondary">
                プラン
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
                ¥{(agencyStats.basePlanPrice || 5000).toLocaleString()}/社
              </Typography>
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography variant="body2" color="text.secondary">
                月額料金（合計）
              </Typography>
              <Typography variant="h5" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                ¥{agencyStats.monthlyPrice.toLocaleString()}/月
              </Typography>
            </Grid>
          </Grid>
          {agencyStats.basePlanPrice && agencyStats.contractCount && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              料金計算: ¥{agencyStats.basePlanPrice.toLocaleString()} × {agencyStats.contractCount}社 = ¥{agencyStats.monthlyPrice.toLocaleString()}
            </Typography>
          )}
        </Paper>
      )}

      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6">取り扱い中の保険会社</Typography>
          <Chip
            label="権限の変更は管理者にお問い合わせください"
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
    </Container>
  );
};

export default AgencySettings;

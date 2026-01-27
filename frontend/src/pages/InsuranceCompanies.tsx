import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Chip,
  Button,
  Stack,
} from '@mui/material';
import {
  Business as BusinessIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import api from '../services/api';

interface InsuranceCompany {
  id: number;
  company_code: string;
  company_name: string;
  company_name_en: string;
  display_name: string;
  is_active: boolean;
  contract_start_date?: string;
  contract_end_date?: string | null;
  created_at?: string;
  updated_at?: string;
}

interface PerformanceData {
  id: number;
  special_account_id: number;
  performance_date: string;
  unit_price: string;
  return_1m: string;
  return_3m: string;
  return_6m: string;
  return_1y: string;
  return_3y: string;
  return_since_inception: string;
  total_assets: string | null;
  account_code: string;
  account_name: string;
  account_type: string;
  benchmark: string | null;
  company_code: string;
  company_name: string;
  display_name: string;
}

const InsuranceCompanies: React.FC = () => {
  const [companies, setCompanies] = useState<InsuranceCompany[]>([]);
  const [selectedCompanyTab, setSelectedCompanyTab] = useState<number>(0);
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCompanies();
  }, []);

  useEffect(() => {
    if (companies.length > 0) {
      loadPerformanceData(companies[selectedCompanyTab].company_code);
    }
  }, [selectedCompanyTab, companies]);

  const loadCompanies = async () => {
    try {
      setLoading(true);
      setError(null);
      // Get only companies available to the current user's agency
      const data = await api.getMyInsuranceCompanies();
      setCompanies(data);
    } catch (err: any) {
      console.error('Failed to load insurance companies:', err);
      setError(err.message || 'Failed to load insurance companies');
    } finally {
      setLoading(false);
    }
  };

  const loadPerformanceData = async (companyCode: string) => {
    try {
      setLoading(true);
      setError(null);
      const data: any[] = await api.getLatestPerformanceByCompany(companyCode);
      setPerformanceData(data);
    } catch (err: any) {
      console.error('Failed to load performance data:', err);
      setError(err.message || 'Failed to load performance data');
    } finally {
      setLoading(false);
    }
  };

  const handleCompanyTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedCompanyTab(newValue);
  };

  const formatNumber = (value: string | null): string => {
    if (!value) return '-';
    const num = parseFloat(value);
    return isNaN(num) ? '-' : num.toFixed(2);
  };

  const getReturnColor = (value: string | null): string => {
    if (!value) return 'inherit';
    const num = parseFloat(value);
    if (isNaN(num)) return 'inherit';
    if (num > 0) return '#4caf50';
    if (num < 0) return '#f44336';
    return 'inherit';
  };

  const groupByAccountType = (data: PerformanceData[]) => {
    const grouped: { [key: string]: PerformanceData[] } = {};
    data.forEach((item) => {
      if (!grouped[item.account_type]) {
        grouped[item.account_type] = [];
      }
      grouped[item.account_type].push(item);
    });
    return grouped;
  };

  if (loading && companies.length === 0) {
    return (
      <Container>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  const groupedData = groupByAccountType(performanceData);

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BusinessIcon fontSize="large" />
          保険会社・特別勘定パフォーマンス
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          各保険会社の特別勘定のパフォーマンスデータを確認できます
        </Typography>
      </Box>

      {error && (
        <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {companies.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Tabs value={selectedCompanyTab} onChange={handleCompanyTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
            {companies.map((company, index) => (
              <Tab
                key={company.id}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <BusinessIcon />
                    <span>{company.display_name}</span>
                  </Box>
                }
              />
            ))}
          </Tabs>
        </Box>
      )}

      {companies.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Card>
            <CardContent>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" color="text.secondary">
                      保険会社
                    </Typography>
                    <Typography variant="h5">
                      {companies[selectedCompanyTab].display_name}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" color="text.secondary">
                      特別勘定数
                    </Typography>
                    <Typography variant="h5">
                      {performanceData.length} 口座
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" color="text.secondary">
                      データ基準日
                    </Typography>
                    <Typography variant="h5">
                      {performanceData.length > 0 ? new Date(performanceData[0].performance_date).toLocaleDateString('ja-JP') : '-'}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" color="text.secondary">
                      ステータス
                    </Typography>
                    <Chip
                      label="アクティブ"
                      color="success"
                      sx={{ mt: 1 }}
                    />
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Box>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        Object.keys(groupedData).map((accountType) => (
          <Paper key={accountType} sx={{ mb: 3, p: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AssessmentIcon />
              {accountType}
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>特別勘定名</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>ユニット・プライス</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>1ヶ月</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>3ヶ月</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>6ヶ月</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>1年</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>3年</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>設定来</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>ベンチマーク</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {groupedData[accountType].map((item) => (
                    <TableRow key={item.id} hover>
                      <TableCell>{item.account_name}</TableCell>
                      <TableCell align="right">{formatNumber(item.unit_price)}</TableCell>
                      <TableCell align="right" sx={{ color: getReturnColor(item.return_1m) }}>
                        {formatNumber(item.return_1m)}%
                      </TableCell>
                      <TableCell align="right" sx={{ color: getReturnColor(item.return_3m) }}>
                        {formatNumber(item.return_3m)}%
                      </TableCell>
                      <TableCell align="right" sx={{ color: getReturnColor(item.return_6m) }}>
                        {formatNumber(item.return_6m)}%
                      </TableCell>
                      <TableCell align="right" sx={{ color: getReturnColor(item.return_1y) }}>
                        {formatNumber(item.return_1y)}%
                      </TableCell>
                      <TableCell align="right" sx={{ color: getReturnColor(item.return_3y) }}>
                        {formatNumber(item.return_3y)}%
                      </TableCell>
                      <TableCell align="right" sx={{ color: getReturnColor(item.return_since_inception) }}>
                        {formatNumber(item.return_since_inception)}%
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" sx={{ display: 'block', maxWidth: 300 }}>
                          {item.benchmark || '-'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        ))
      )}

      {performanceData.length === 0 && !loading && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary">
            パフォーマンスデータがありません
          </Typography>
        </Box>
      )}
    </Container>
  );
};

export default InsuranceCompanies;

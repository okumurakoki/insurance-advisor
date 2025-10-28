import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { Customer } from '../types';
import { useNavigate } from 'react-router-dom';
import {
  Person as PersonIcon,
  Assessment as AssessmentIcon,
  Add as AddIcon,
  TrendingUp as TrendingUpIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    customerCount: 0,
    reportCount: 0,
    totalAssets: 0,
    totalMonthlyPremium: 0,
    averageReturn: 0,
  });
  const [marketData, setMarketData] = useState<any[]>([]);
  const [insuranceCompanies, setInsuranceCompanies] = useState<any[]>([]);
  const [companiesPerformance, setCompaniesPerformance] = useState<any[]>([]);
  const [selectedCompanyCode, setSelectedCompanyCode] = useState<string>('all');

  useEffect(() => {
    fetchDashboardData();
    fetchInsuranceCompanies();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const customersData = await api.getCustomers();
      setCustomers(customersData);

      // Fetch real statistics from API
      try {
        const statisticsData = await api.getStatistics();
        setStats(statisticsData);
      } catch (statsErr) {
        console.error('Failed to fetch statistics:', statsErr);
      }

      // Fetch market data from Supabase Edge Functions
      try {
        const marketResponse = await api.getMarketData();
        if (marketResponse.success) {
          setMarketData(marketResponse.data);
        }
      } catch (marketErr) {
        console.log('Market data not available:', marketErr);
      }
    } catch (err: any) {
      setError('データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const fetchInsuranceCompanies = async () => {
    try {
      // Get user's contracted insurance companies
      const companies = await api.getMyInsuranceCompanies();
      setInsuranceCompanies(companies);

      // Fetch performance data for each company
      const performancePromises = companies.map(async (company: any) => {
        try {
          const performance = await api.getLatestPerformanceByCompany(company.company_code);
          return {
            company,
            performance,
          };
        } catch (err) {
          console.error(`Failed to fetch performance for ${company.company_code}:`, err);
          return {
            company,
            performance: [],
          };
        }
      });

      const performanceData = await Promise.all(performancePromises);
      setCompaniesPerformance(performanceData);
    } catch (err) {
      console.error('Failed to fetch insurance companies:', err);
    }
  };

  const getAccountTypeLabel = (type: string) => {
    const labels = {
      parent: '代理店',
      child: '生保担当者',
      grandchild: '顧客',
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getPlanTypeLabel = (type: string) => {
    const labels = {
      standard: 'スタンダード',
      master: 'マスター',
      exceed: 'エクシード',
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getRiskToleranceLabel = (risk: string) => {
    const labels = {
      conservative: '保守的',
      balanced: 'バランス型',
      aggressive: '積極的',
    };
    return labels[risk as keyof typeof labels] || risk;
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

  const groupByAccountType = (data: any[]) => {
    const grouped: { [key: string]: any[] } = {};
    data.forEach((item) => {
      if (!grouped[item.account_type]) {
        grouped[item.account_type] = [];
      }
      grouped[item.account_type].push(item);
    });
    return grouped;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="calc(100vh - 200px)">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        {/* Header */}
        <Grid item xs={12}>
          <Typography variant="h4" component="h1" gutterBottom>
            ダッシュボード
          </Typography>
          <Box display="flex" gap={2} mb={2}>
            <Chip
              label={getAccountTypeLabel(user?.accountType || '')}
              color="primary"
              icon={<PersonIcon />}
            />
            <Chip
              label={`プラン: ${getPlanTypeLabel(user?.planType || '')}`}
              color="secondary"
            />
            <Chip
              label={`顧客数: ${customers.length} / ${user?.customerLimit}`}
              variant="outlined"
            />
          </Box>
        </Grid>

        {error && (
          <Grid item xs={12}>
            <Alert severity="error">{error}</Alert>
          </Grid>
        )}

        {/* Statistics Cards */}
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    管理中の顧客数
                  </Typography>
                  <Typography variant="h5">
                    {stats.customerCount}
                  </Typography>
                </Box>
                <PersonIcon color="primary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    レポート数
                  </Typography>
                  <Typography variant="h5">
                    {stats.reportCount}
                  </Typography>
                </Box>
                <AssessmentIcon color="secondary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    契約金額合計
                  </Typography>
                  <Typography variant="h5">
                    ¥{Math.round(stats.totalAssets).toLocaleString()}
                  </Typography>
                </Box>
                <TrendingUpIcon color="success" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    月額保険料合計
                  </Typography>
                  <Typography variant="h5">
                    ¥{Math.round(stats.totalMonthlyPremium).toLocaleString()}/月
                  </Typography>
                </Box>
                <TrendingUpIcon color="info" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    平均利回り
                  </Typography>
                  <Typography variant="h5">
                    {stats.averageReturn}%
                  </Typography>
                </Box>
                <AddIcon color="action" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Action Buttons and Company Filter */}
        <Grid item xs={12}>
          <Box display="flex" justifyContent="space-between" alignItems="center" gap={2}>
            <Box display="flex" gap={2}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => navigate('/customers/new')}
                disabled={customers.length >= (user?.customerLimit || 0)}
              >
                新規顧客登録
              </Button>
              <Button
                variant="outlined"
                onClick={() => navigate('/customers')}
              >
                顧客一覧
              </Button>
              {user?.accountType === 'parent' && (
                <Button
                  variant="outlined"
                  onClick={() => navigate('/market-data')}
                >
                  市場データ管理
                </Button>
              )}
            </Box>
            {insuranceCompanies.length > 0 && (
              <FormControl sx={{ minWidth: 250 }}>
                <InputLabel>表示する保険会社</InputLabel>
                <Select
                  value={selectedCompanyCode}
                  onChange={(e) => setSelectedCompanyCode(e.target.value)}
                  label="表示する保険会社"
                  size="small"
                >
                  <MenuItem value="all">すべての保険会社</MenuItem>
                  {insuranceCompanies.map((company: any) => (
                    <MenuItem key={company.company_code} value={company.company_code}>
                      {company.display_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Box>
        </Grid>

        {/* Insurance Companies Performance */}
        {companiesPerformance.length > 0 && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3, mb: 2 }}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <BusinessIcon />
                保険会社・特別勘定パフォーマンス
              </Typography>

              {companiesPerformance
                .filter((item) => selectedCompanyCode === 'all' || item.company.company_code === selectedCompanyCode)
                .map((item, companyIndex) => {
                  const filteredPerformance = companiesPerformance.filter((p) => selectedCompanyCode === 'all' || p.company.company_code === selectedCompanyCode);
                  const isLast = companyIndex === filteredPerformance.length - 1;
                  const groupedData = groupByAccountType(item.performance);

                  return (
                    <Box key={companyIndex} sx={{ mb: isLast ? 0 : 4 }}>
                      {/* Company Header */}
                      <Box sx={{ mb: 2 }}>
                        <Card>
                          <CardContent>
                            <Grid container spacing={3}>
                              <Grid item xs={12} sm={6} md={3}>
                                <Box sx={{ textAlign: 'center' }}>
                                  <Typography variant="h6" color="text.secondary">
                                    保険会社
                                  </Typography>
                                  <Typography variant="h5">
                                    {item.company.display_name}
                                  </Typography>
                                </Box>
                              </Grid>
                              <Grid item xs={12} sm={6} md={3}>
                                <Box sx={{ textAlign: 'center' }}>
                                  <Typography variant="h6" color="text.secondary">
                                    特別勘定数
                                  </Typography>
                                  <Typography variant="h5">
                                    {item.performance.length} 口座
                                  </Typography>
                                </Box>
                              </Grid>
                              <Grid item xs={12} sm={6} md={3}>
                                <Box sx={{ textAlign: 'center' }}>
                                  <Typography variant="h6" color="text.secondary">
                                    データ基準日
                                  </Typography>
                                  <Typography variant="h5">
                                    {item.performance.length > 0 ? new Date(item.performance[0].performance_date).toLocaleDateString('ja-JP') : '-'}
                                  </Typography>
                                </Box>
                              </Grid>
                              <Grid item xs={12} sm={6} md={3}>
                                <Box sx={{ textAlign: 'center' }}>
                                  <Typography variant="h6" color="text.secondary">
                                    ステータス
                                  </Typography>
                                  <Chip
                                    label="契約中"
                                    color="success"
                                    sx={{ mt: 1 }}
                                  />
                                </Box>
                              </Grid>
                            </Grid>
                          </CardContent>
                        </Card>
                      </Box>

                      {/* Performance Tables by Account Type */}
                      {Object.keys(groupedData).map((accountType) => (
                        <Paper key={accountType} sx={{ mb: 2, p: 2 }}>
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
                                {groupedData[accountType].map((perf: any) => (
                                  <TableRow key={perf.id} hover>
                                    <TableCell>{perf.account_name}</TableCell>
                                    <TableCell align="right">{formatNumber(perf.unit_price)}</TableCell>
                                    <TableCell align="right" sx={{ color: getReturnColor(perf.return_1m) }}>
                                      {formatNumber(perf.return_1m)}%
                                    </TableCell>
                                    <TableCell align="right" sx={{ color: getReturnColor(perf.return_3m) }}>
                                      {formatNumber(perf.return_3m)}%
                                    </TableCell>
                                    <TableCell align="right" sx={{ color: getReturnColor(perf.return_6m) }}>
                                      {formatNumber(perf.return_6m)}%
                                    </TableCell>
                                    <TableCell align="right" sx={{ color: getReturnColor(perf.return_1y) }}>
                                      {formatNumber(perf.return_1y)}%
                                    </TableCell>
                                    <TableCell align="right" sx={{ color: getReturnColor(perf.return_3y) }}>
                                      {formatNumber(perf.return_3y)}%
                                    </TableCell>
                                    <TableCell align="right" sx={{ color: getReturnColor(perf.return_since_inception) }}>
                                      {formatNumber(perf.return_since_inception)}%
                                    </TableCell>
                                    <TableCell>
                                      <Typography variant="caption" sx={{ display: 'block', maxWidth: 300 }}>
                                        {perf.benchmark || '-'}
                                      </Typography>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </Paper>
                      ))}
                    </Box>
                  );
                })}
            </Paper>
          </Grid>
        )}

        {/* Market Data */}
        {marketData.length > 0 && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3, mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                📈 市場データ (リアルタイム)
              </Typography>
              <Grid container spacing={2}>
                {marketData.slice(0, 5).map((data, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6">{data.symbol}</Typography>
                        <Typography variant="h5" color="primary">
                          ${data.price?.toFixed(2)}
                        </Typography>
                        <Typography
                          variant="body2"
                          color={data.change >= 0 ? 'success.main' : 'error.main'}
                        >
                          {data.change >= 0 ? '+' : ''}{data.change?.toFixed(2)} ({data.changePercent})
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {data.lastUpdate}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Grid>
        )}

        {/* Recent Customers */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              {selectedCompanyCode === 'all' ? '最近の顧客' : `${insuranceCompanies.find(c => c.company_code === selectedCompanyCode)?.display_name || ''}の顧客`}
            </Typography>
            {customers.length === 0 ? (
              <Typography color="textSecondary">
                まだ顧客が登録されていません
              </Typography>
            ) : (
              <Grid container spacing={2}>
                {customers
                  .filter((customer) =>
                    selectedCompanyCode === 'all' || customer.companyCode === selectedCompanyCode
                  )
                  .slice(0, 10)
                  .map((customer) => (
                    <Grid item xs={12} key={customer.id}>
                      <Card variant="outlined">
                        <CardContent>
                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <Typography variant="h6">{customer.name}</Typography>
                                {customer.displayName && (
                                  <Chip
                                    label={customer.displayName}
                                    size="small"
                                    color="secondary"
                                    variant="outlined"
                                  />
                                )}
                              </Box>
                              <Typography color="textSecondary" variant="body2">
                                契約日: {new Date(customer.contractDate).toLocaleDateString('ja-JP')}
                              </Typography>
                              <Typography color="textSecondary" variant="body2">
                                月額保険料: ¥{customer.monthlyPremium.toLocaleString()}
                              </Typography>
                            </Box>
                            <Box display="flex" gap={1} alignItems="center">
                              <Chip
                                label={getRiskToleranceLabel(customer.riskTolerance)}
                                size="small"
                                color={
                                  customer.riskTolerance === 'conservative' ? 'info' :
                                  customer.riskTolerance === 'balanced' ? 'primary' : 'warning'
                                }
                              />
                              <Button
                                size="small"
                                onClick={() => navigate(`/customers/${customer.id}`)}
                              >
                                詳細
                              </Button>
                              <Button
                                size="small"
                                variant="contained"
                                onClick={() => navigate(`/analysis/new/${customer.id}`)}
                              >
                                分析
                              </Button>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
              </Grid>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;
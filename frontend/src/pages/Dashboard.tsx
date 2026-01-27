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
  AttachMoney as MoneyIcon,
  ShowChart as ChartIcon,
} from '@mui/icons-material';
import { KPICard } from '../components/Dashboard';
import { saasColors } from '../theme/saasTheme';

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
  }, []);

  useEffect(() => {
    if (user) {
      fetchInsuranceCompanies();
    }
  }, [user]);

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
      // Get insurance companies (all for admin, contracted for others)
      const companies: any[] = user?.accountType === 'admin'
        ? await api.getInsuranceCompanies()
        : await api.getMyInsuranceCompanies();

      console.log('[Dashboard] Fetched companies:', companies);
      console.log('[Dashboard] User account type:', user?.accountType);

      const activeCompanies = companies.filter((c: any) => c.is_active);
      console.log('[Dashboard] Active companies:', activeCompanies);
      setInsuranceCompanies(activeCompanies);

      // Fetch performance data for each company
      const performancePromises = activeCompanies.map(async (company: any) => {
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

  // Filter customers by selected company
  const getFilteredCustomers = () => {
    if (selectedCompanyCode === 'all') {
      return customers;
    }
    return customers.filter(customer => customer.companyCode === selectedCompanyCode);
  };

  // Calculate filtered statistics
  const getFilteredStats = () => {
    const filteredCustomers = getFilteredCustomers();
    return {
      customerCount: filteredCustomers.length,
      reportCount: stats.reportCount, // TODO: Filter reports by company
      totalAssets: filteredCustomers.reduce((sum, c) => sum + (c.contractAmount || 0), 0),
      totalMonthlyPremium: filteredCustomers.reduce((sum, c) => sum + (c.monthlyPremium || 0), 0),
      averageReturn: stats.averageReturn, // TODO: Calculate from company data
    };
  };

  const filteredStats = getFilteredStats();

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

        {/* KPI Statistics Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title={selectedCompanyCode === 'all' ? '管理中の顧客数' : '保険会社の顧客数'}
            value={filteredStats.customerCount}
            subtitle={selectedCompanyCode !== 'all' ? `全体: ${stats.customerCount}人` : undefined}
            icon={<PersonIcon />}
            iconBgColor={saasColors.primary}
            onClick={() => navigate('/customers')}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="レポート数"
            value={filteredStats.reportCount}
            icon={<AssessmentIcon />}
            iconBgColor={saasColors.secondary}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title={selectedCompanyCode === 'all' ? '契約金額合計' : '保険会社の契約金額'}
            value={`¥${Math.round(filteredStats.totalAssets).toLocaleString()}`}
            subtitle={selectedCompanyCode !== 'all' ? `全体: ¥${Math.round(stats.totalAssets).toLocaleString()}` : undefined}
            icon={<MoneyIcon />}
            iconBgColor={saasColors.success}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="平均利回り"
            value={`${stats.averageReturn}%`}
            trend={stats.averageReturn !== 0 ? {
              value: stats.averageReturn,
              direction: stats.averageReturn > 0 ? 'up' : stats.averageReturn < 0 ? 'down' : 'flat',
            } : undefined}
            icon={<ChartIcon />}
            iconBgColor={saasColors.info}
            valueColor={stats.averageReturn > 0 ? saasColors.success : stats.averageReturn < 0 ? saasColors.error : undefined}
          />
        </Grid>

        <Grid item xs={12}>
          <KPICard
            title={selectedCompanyCode === 'all' ? '月額保険料合計' : '保険会社の月額保険料'}
            value={`¥${Math.round(filteredStats.totalMonthlyPremium).toLocaleString()}/月`}
            subtitle={selectedCompanyCode !== 'all' ? `全体: ¥${Math.round(stats.totalMonthlyPremium).toLocaleString()}/月` : undefined}
            icon={<TrendingUpIcon />}
            iconBgColor={saasColors.accent}
          />
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
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingUpIcon /> 市場データ (リアルタイム)
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

        {/* Insurance Companies Cards */}
        {insuranceCompanies.length > 0 && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3, mb: 2 }}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <BusinessIcon />
                契約中の保険会社
              </Typography>
              <Grid container spacing={2}>
                {insuranceCompanies.map((company: any) => (
                  <Grid item xs={12} sm={6} md={4} key={company.id}>
                    <Card
                      variant="outlined"
                      sx={{
                        cursor: 'pointer',
                        border: selectedCompanyCode === company.company_code ? '2px solid' : '1px solid',
                        borderColor: selectedCompanyCode === company.company_code ? 'primary.main' : 'divider',
                        bgcolor: selectedCompanyCode === company.company_code ? 'action.selected' : 'background.paper',
                        transition: 'all 0.2s',
                        '&:hover': {
                          borderColor: 'primary.main',
                          boxShadow: 2
                        }
                      }}
                      onClick={() => setSelectedCompanyCode(company.company_code)}
                    >
                      <CardContent>
                        <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                          <BusinessIcon color="primary" sx={{ fontSize: 40 }} />
                          {selectedCompanyCode === company.company_code && (
                            <Chip label="選択中" color="primary" size="small" />
                          )}
                        </Box>
                        <Typography variant="h6" gutterBottom>
                          {company.display_name}
                        </Typography>
                        <Typography variant="body2" color="textSecondary" gutterBottom>
                          契約期間: {new Date(company.contract_start_date).toLocaleDateString('ja-JP')} 〜
                        </Typography>
                        <Box mt={2}>
                          <Button
                            variant="outlined"
                            size="small"
                            fullWidth
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate('/insurance-companies');
                            }}
                          >
                            詳細を見る
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
                {selectedCompanyCode !== 'all' && (
                  <Grid item xs={12}>
                    <Button
                      variant="text"
                      onClick={() => setSelectedCompanyCode('all')}
                      startIcon={<BusinessIcon />}
                    >
                      すべての保険会社を表示
                    </Button>
                  </Grid>
                )}
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
            {getFilteredCustomers().length === 0 ? (
              <Typography color="textSecondary">
                {selectedCompanyCode === 'all' ? 'まだ顧客が登録されていません' : 'この保険会社の顧客はいません'}
              </Typography>
            ) : (
              <Grid container spacing={2}>
                {getFilteredCustomers()
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
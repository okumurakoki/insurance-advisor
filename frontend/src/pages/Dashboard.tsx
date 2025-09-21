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
} from '@mui/icons-material';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalAnalyses: 0,
    avgMonthlyPremium: 0,
  });
  const [marketData, setMarketData] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const customersData = await api.getCustomers();
      setCustomers(customersData);
      
      // Calculate statistics
      const totalCustomers = customersData.length;
      const avgMonthlyPremium = customersData.length > 0
        ? customersData.reduce((sum, c) => sum + c.monthlyPremium, 0) / customersData.length
        : 0;
      
      setStats({
        totalCustomers,
        totalAnalyses: 0, // This would come from a stats API endpoint
        avgMonthlyPremium,
      });

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
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    顧客数
                  </Typography>
                  <Typography variant="h5">
                    {stats.totalCustomers}
                  </Typography>
                </Box>
                <PersonIcon color="primary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    分析実行数
                  </Typography>
                  <Typography variant="h5">
                    {stats.totalAnalyses}
                  </Typography>
                </Box>
                <AssessmentIcon color="secondary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    平均月額保険料
                  </Typography>
                  <Typography variant="h5">
                    ¥{Math.round(stats.avgMonthlyPremium).toLocaleString()}
                  </Typography>
                </Box>
                <TrendingUpIcon color="success" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    空き枠
                  </Typography>
                  <Typography variant="h5">
                    {(user?.customerLimit || 0) - stats.totalCustomers}
                  </Typography>
                </Box>
                <AddIcon color="action" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Action Buttons */}
        <Grid item xs={12}>
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
        </Grid>

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
              最近の顧客
            </Typography>
            {customers.length === 0 ? (
              <Typography color="textSecondary">
                まだ顧客が登録されていません
              </Typography>
            ) : (
              <Grid container spacing={2}>
                {customers.slice(0, 5).map((customer) => (
                  <Grid item xs={12} key={customer.id}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Box>
                            <Typography variant="h6">{customer.name}</Typography>
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
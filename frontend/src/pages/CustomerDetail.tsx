import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Button,
  Chip,
  Divider,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  IconButton,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Edit as EditIcon,
  Assessment as AssessmentIcon,
  ArrowBack as ArrowBackIcon,
  FileDownload as FileDownloadIcon,
  Print as PrintIcon,
} from '@mui/icons-material';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import api from '../services/api';
import { Customer, AnalysisResult } from '../types';

ChartJS.register(ArcElement, Tooltip, Legend);

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const CustomerDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [latestAnalysis, setLatestAnalysis] = useState<any | null>(null);
  const [analysisHistory, setAnalysisHistory] = useState<AnalysisResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [staffName, setStaffName] = useState<string>('');

  useEffect(() => {
    if (id) {
      fetchCustomerData(parseInt(id));
    }
  }, [id]);

  const fetchCustomerData = async (customerId: number) => {
    try {
      const [customerData, history] = await Promise.all([
        api.getCustomer(customerId),
        api.getCustomerAnalysisHistory(customerId),
      ]);

      setCustomer(customerData);
      setAnalysisHistory(history);

      // 最新の分析結果を取得
      if (history.length > 0) {
        setLatestAnalysis(history[0]);
      } else {
        // 分析結果がない場合、顧客のリスクプロファイルに基づいたデフォルト配分を生成
        generateDefaultAllocation(customerData);
      }

      // 担当者情報を取得
      if (customerData.user_id) {
        fetchStaffInfo(customerData.user_id);
      }
    } catch (err: any) {
      setError('データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const fetchStaffInfo = async (userId: number) => {
    try {
      // ユーザー情報APIを呼び出す（担当者名を取得）
      const staffInfo = await api.getUser(userId);
      console.log('Staff info:', staffInfo);
      setStaffName(staffInfo.name || staffInfo.user_id || staffInfo.userId || '担当者不明');
    } catch (err) {
      console.error('Failed to fetch staff info:', err);
      setStaffName('情報取得エラー');
    }
  };

  const generateDefaultAllocation = (customerData: Customer) => {
    // リスクプロファイルに基づいた推奨配分
    // NOTE: This section shows estimated projection when no analysis history exists
    // In a production environment, this should fetch actual market data from the API
    // For now, we show a message to create the first analysis

    let allocation: any = {};
    let expectedReturn = 0;

    if (analysisHistory.length === 0) {
      // No analysis history - show message instead of hardcoded data
      return {
        month: startMonth.toISOString().split('T')[0],
        value: 100,
        cumulativeReturn: 0,
        message: '分析履歴がありません。最初の分析を作成してください。'
      };
    }

    // Use the most recent analysis if available
    const recentAnalysis = analysisHistory[0];
    allocation = recentAnalysis.adjustedAllocation || recentAnalysis.recommendedAllocation || {};

    // Use expected return from the analysis result if available
    expectedReturn = recentAnalysis.expectedReturn || 0;

    setLatestAnalysis({
      id: recentAnalysis.id || null,
      customerId: customerData.id,
      analysisDate: recentAnalysis.analysisDate || new Date().toISOString(),
      allocation: allocation,
      confidenceScore: recentAnalysis.confidenceScore || 0.85,
      recommendationText: recentAnalysis.recommendationText || `現在の市場環境と${getRiskToleranceLabel(customerData.riskTolerance)}のリスクプロファイルに基づいた推奨配分です。`,
      marketAnalysis: recentAnalysis.marketAnalysis || '現在の市場環境は、緩やかな成長トレンドを示しています。テクノロジーとヘルスケアセクターが特に好調で、今後も継続的な成長が期待されます。グローバル経済の回復傾向が続く中、分散投資によるリスク管理が重要です。',
      expectedReturn: expectedReturn,
    });
  };

  const getRiskToleranceLabel = (risk: string) => {
    const labels = {
      conservative: '保守的',
      balanced: 'バランス型',
      aggressive: '積極的',
    };
    return labels[risk as keyof typeof labels] || risk;
  };

  const getRiskToleranceColor = (risk: string): 'info' | 'primary' | 'warning' => {
    const colors = {
      conservative: 'info' as const,
      balanced: 'primary' as const,
      aggressive: 'warning' as const,
    };
    return colors[risk as keyof typeof colors] || 'primary';
  };

  const calculateContractPeriod = (contractDate: string) => {
    const start = new Date(contractDate);
    const now = new Date();
    const years = now.getFullYear() - start.getFullYear();
    const months = now.getMonth() - start.getMonth() + years * 12;

    if (months < 12) {
      return `${months}ヶ月`;
    } else {
      const y = Math.floor(months / 12);
      const m = months % 12;
      return m > 0 ? `${y}年${m}ヶ月` : `${y}年`;
    }
  };

  const chartData = latestAnalysis ? {
    labels: Object.keys(latestAnalysis.allocation || {}),
    datasets: [
      {
        label: '資産配分',
        data: Object.values(latestAnalysis.allocation || {}),
        backgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
          '#9966FF',
          '#FF9F40',
        ],
        hoverBackgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
          '#9966FF',
          '#FF9F40',
        ],
      },
    ],
  } : null;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            return `${context.label}: ${context.parsed}%`;
          },
        },
      },
    },
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="calc(100vh - 200px)">
        <CircularProgress />
      </Box>
    );
  }

  if (!customer) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">顧客が見つかりません</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Box display="flex" alignItems="center">
          <IconButton onClick={() => navigate('/customers')} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" component="h1">
            顧客詳細
          </Typography>
        </Box>
        <Box>
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={() => navigate(`/customers/${customer.id}/edit`)}
            sx={{ mr: 1 }}
          >
            編集
          </Button>
          <Button
            variant="contained"
            startIcon={<AssessmentIcon />}
            onClick={() => navigate(`/analysis/new/${customer.id}`)}
          >
            分析実行
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Typography color="textSecondary" variant="body2">顧客名</Typography>
          <Typography variant="h5" gutterBottom>{customer.name}</Typography>
        </Grid>

        <Grid item xs={12} md={4}>
          <Typography color="textSecondary" variant="body2">担当者</Typography>
          <Typography variant="body1" gutterBottom>
            {staffName || '情報取得中...'}
          </Typography>
        </Grid>

        <Grid item xs={12} md={4}>
          <Typography color="textSecondary" variant="body2">顧客ID</Typography>
          <Typography variant="body1" gutterBottom>{customer.id}</Typography>
        </Grid>
      </Grid>

      <Grid container spacing={2} sx={{ mt: 1, mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Typography color="textSecondary" variant="body2">メールアドレス</Typography>
          <Typography variant="body1">{customer.email || '-'}</Typography>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Typography color="textSecondary" variant="body2">電話番号</Typography>
          <Typography variant="body1">{customer.phone || '-'}</Typography>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Typography color="textSecondary" variant="body2">契約日</Typography>
          <Typography variant="body1">
            {new Date(customer.contractDate).toLocaleDateString('ja-JP')}
          </Typography>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Typography color="textSecondary" variant="body2">契約金額</Typography>
          <Typography variant="body1" color="primary" fontWeight="bold">
            ¥{customer.contractAmount.toLocaleString()}
          </Typography>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Typography color="textSecondary" variant="body2">月額保険料</Typography>
          <Typography variant="body1">¥{customer.monthlyPremium.toLocaleString()}</Typography>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Typography color="textSecondary" variant="body2">リスク許容度</Typography>
          <Box>
            <Chip
              label={getRiskToleranceLabel(customer.riskTolerance)}
              color={getRiskToleranceColor(customer.riskTolerance)}
              size="small"
            />
          </Box>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Typography color="textSecondary" variant="body2">加入保険会社</Typography>
          <Typography variant="body1">
            {customer.displayName || customer.companyName || '-'}
          </Typography>
        </Grid>

        {customer.investmentGoal && (
          <Grid item xs={12} sm={6}>
            <Typography color="textSecondary" variant="body2">投資目標</Typography>
            <Typography variant="body1">{customer.investmentGoal}</Typography>
          </Grid>
        )}

        {customer.notes && (
          <Grid item xs={12}>
            <Typography color="textSecondary" variant="body2">備考</Typography>
            <Typography variant="body1" style={{ whiteSpace: 'pre-wrap' }}>
              {customer.notes}
            </Typography>
          </Grid>
        )}
      </Grid>

      {latestAnalysis && (
        <Paper sx={{ p: 3, mb: 3, backgroundColor: '#f5f9ff' }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" fontWeight="bold" color="primary">
              ✨ 最新の分析結果
            </Typography>
            <Box>
              <Button
                size="small"
                startIcon={<FileDownloadIcon />}
                sx={{ mr: 1 }}
              >
                PDF出力
              </Button>
              <Button
                size="small"
                startIcon={<PrintIcon />}
              >
                EXCEL出力
              </Button>
            </Box>
          </Box>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            分析日時: {latestAnalysis?.analysisDate ? new Date(latestAnalysis.analysisDate).toLocaleDateString('ja-JP') : '未実施'}
          </Typography>

          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                推奨配分
              </Typography>
              {Object.entries(latestAnalysis.allocation).map(([fund, percentage]: [string, any]) => (
                <Box
                  key={fund}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 1,
                    p: 1.5,
                    backgroundColor: 'white',
                    borderRadius: 1,
                    border: '1px solid #e0e0e0',
                  }}
                >
                  <Typography variant="body1" fontWeight="medium">{fund}</Typography>
                  <Typography variant="h6" color="primary" fontWeight="bold">
                    {percentage}%
                  </Typography>
                </Box>
              ))}
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                市場分析
              </Typography>
              <Typography variant="body2" paragraph>
                {latestAnalysis.marketAnalysis}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                信頼度スコア: {(latestAnalysis.confidenceScore * 100).toFixed(0)}%
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      )}

      <Paper sx={{ mt: 3 }}>
        <Tabs
          value={tabValue}
          onChange={(_, newValue) => setTabValue(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="ポートフォリオ" />
          <Tab label="パフォーマンス" />
          <Tab label="履歴データ" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              現在のポートフォリオ配分
            </Typography>
            {chartData && (
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Box height={300}>
                    <Pie data={chartData} options={chartOptions} />
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  {Object.entries(latestAnalysis.allocation).map(([fund, percentage]: [string, any]) => (
                    <Box
                      key={fund}
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mb: 2,
                        p: 2,
                        backgroundColor: '#f5f5f5',
                        borderRadius: 1,
                      }}
                    >
                      <Box display="flex" alignItems="center">
                        <Box
                          sx={{
                            width: 16,
                            height: 16,
                            borderRadius: '50%',
                            mr: 2,
                            backgroundColor: chartData.datasets[0].backgroundColor[
                              Object.keys(latestAnalysis.allocation).indexOf(fund)
                            ],
                          }}
                        />
                        <Typography variant="body1">{fund}</Typography>
                      </Box>
                      <Typography variant="h6" color="primary" fontWeight="bold">
                        {percentage}%
                      </Typography>
                    </Box>
                  ))}
                </Grid>
              </Grid>
            )}
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              パフォーマンス
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" variant="body2">期待リターン</Typography>
                    <Typography variant="h5" color="success.main">
                      {latestAnalysis?.expectedReturn?.toFixed(1) || '0.0'}%
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" variant="body2">契約期間</Typography>
                    <Typography variant="h5">
                      {calculateContractPeriod(customer.contractDate)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" variant="body2">分析回数</Typography>
                    <Typography variant="h5">{analysisHistory.length}回</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" variant="body2">信頼度</Typography>
                    <Typography variant="h5" color="primary">
                      {latestAnalysis ? (latestAnalysis.confidenceScore * 100).toFixed(0) : '0'}%
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              分析履歴
            </Typography>
            {analysisHistory.length === 0 ? (
              <Alert severity="info">まだ分析履歴がありません</Alert>
            ) : (
              <Grid container spacing={2}>
                {analysisHistory.map((analysis) => (
                  <Grid item xs={12} key={analysis.id}>
                    <Card
                      sx={{
                        cursor: 'pointer',
                        '&:hover': { boxShadow: 3 },
                      }}
                      onClick={() => navigate(`/analysis/${analysis.id}`)}
                    >
                      <CardContent>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Box>
                            <Typography variant="h6">
                              {new Date(analysis.analysisDate).toLocaleDateString('ja-JP')}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              信頼度: {(analysis.confidenceScore * 100).toFixed(0)}%
                            </Typography>
                          </Box>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<AssessmentIcon />}
                          >
                            詳細を見る
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        </TabPanel>
      </Paper>

      <Box display="flex" justifyContent="center" sx={{ mt: 3 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/customers')}
        >
          顧客一覧に戻る
        </Button>
      </Box>
    </Container>
  );
};

export default CustomerDetail;

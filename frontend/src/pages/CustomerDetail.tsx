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
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  IconButton,
} from '@mui/material';
import {
  Edit as EditIcon,
  Assessment as AssessmentIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import api from '../services/api';
import { Customer, AnalysisResult } from '../types';

const CustomerDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [analysisHistory, setAnalysisHistory] = useState<AnalysisResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

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
    } catch (err: any) {
      setError('データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!customer) return;
    
    try {
      await api.deleteCustomer(customer.id);
      navigate('/customers');
    } catch (err: any) {
      setError('削除に失敗しました');
    }
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
      <Box display="flex" alignItems="center" mb={3}>
        <IconButton onClick={() => navigate('/customers')} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
          顧客詳細
        </Typography>
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
          新規分析
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              基本情報
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography color="textSecondary" variant="body2">顧客名</Typography>
                <Typography variant="body1" gutterBottom>{customer.name}</Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography color="textSecondary" variant="body2">リスク許容度</Typography>
                <Box>
                  <Chip
                    label={getRiskToleranceLabel(customer.riskTolerance)}
                    color={getRiskToleranceColor(customer.riskTolerance)}
                    size="small"
                  />
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography color="textSecondary" variant="body2">メールアドレス</Typography>
                <Typography variant="body1" gutterBottom>
                  {customer.email || '-'}
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography color="textSecondary" variant="body2">電話番号</Typography>
                <Typography variant="body1" gutterBottom>
                  {customer.phone || '-'}
                </Typography>
              </Grid>
              
              <Grid item xs={12}>
                <Typography color="textSecondary" variant="body2">投資目標</Typography>
                <Typography variant="body1" gutterBottom>
                  {customer.investmentGoal || '未設定'}
                </Typography>
              </Grid>
              
              {customer.notes && (
                <Grid item xs={12}>
                  <Typography color="textSecondary" variant="body2">備考</Typography>
                  <Typography variant="body1" style={{ whiteSpace: 'pre-wrap' }}>
                    {customer.notes}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              分析履歴
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            {analysisHistory.length === 0 ? (
              <Typography color="textSecondary">まだ分析が実行されていません</Typography>
            ) : (
              <List>
                {analysisHistory.map((analysis) => (
                  <ListItem
                    key={analysis.id}
                    divider
                    secondaryAction={
                      <Box>
                        <IconButton
                          edge="end"
                          aria-label="view"
                          onClick={() => navigate(`/analysis/${analysis.id}`)}
                        >
                          <AssessmentIcon />
                        </IconButton>
                        <IconButton
                          edge="end"
                          aria-label="download"
                          onClick={() => api.exportAnalysis(analysis.id, 'pdf')}
                        >
                          <DownloadIcon />
                        </IconButton>
                      </Box>
                    }
                  >
                    <ListItemText
                      primary={`分析日: ${new Date(analysis.analysisDate).toLocaleDateString('ja-JP')}`}
                      secondary={
                        <>
                          信頼度スコア: {(analysis.confidenceScore * 100).toFixed(0)}%
                          <br />
                          {analysis.recommendationText.substring(0, 100)}...
                        </>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                契約情報
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Box mb={2}>
                <Typography color="textSecondary" variant="body2">契約日</Typography>
                <Typography variant="body1">
                  {new Date(customer.contractDate).toLocaleDateString('ja-JP')}
                </Typography>
              </Box>
              
              <Box mb={2}>
                <Typography color="textSecondary" variant="body2">契約期間</Typography>
                <Typography variant="body1">
                  {calculateContractPeriod(customer.contractDate)}
                </Typography>
              </Box>
              
              <Box mb={2}>
                <Typography color="textSecondary" variant="body2">契約金額</Typography>
                <Typography variant="h6">
                  ¥{customer.contractAmount.toLocaleString()}
                </Typography>
              </Box>
              
              <Box>
                <Typography color="textSecondary" variant="body2">月額保険料</Typography>
                <Typography variant="h6" color="primary">
                  ¥{customer.monthlyPremium.toLocaleString()}
                </Typography>
              </Box>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                累計情報
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Box mb={2}>
                <Typography color="textSecondary" variant="body2">総分析回数</Typography>
                <Typography variant="h6">{analysisHistory.length}回</Typography>
              </Box>
              
              <Box mb={2}>
                <Typography color="textSecondary" variant="body2">最終分析日</Typography>
                <Typography variant="body1">
                  {analysisHistory.length > 0
                    ? new Date(analysisHistory[0].analysisDate).toLocaleDateString('ja-JP')
                    : '未実施'}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default CustomerDetail;
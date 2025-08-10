import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  CircularProgress,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  Grid,
  Chip,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import api from '../services/api';
import { Customer } from '../types';

const AnalysisNew: React.FC = () => {
  const { customerId } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [activeStep, setActiveStep] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  const steps = ['顧客情報確認', '市場データ確認', '分析実行', '結果確認'];

  useEffect(() => {
    if (customerId) {
      fetchCustomer(parseInt(customerId));
    }
  }, [customerId]);

  const fetchCustomer = async (id: number) => {
    try {
      const data = await api.getCustomer(id);
      setCustomer(data);
    } catch (err: any) {
      setError('顧客情報の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleAnalysis = async () => {
    if (!customer) return;

    setAnalyzing(true);
    setError('');
    setActiveStep(2);

    try {
      const result = await api.generateRecommendation(customer.id);
      setAnalysisResult(result);
      setActiveStep(3);
    } catch (err: any) {
      setError(err.response?.data?.error || '分析に失敗しました');
      setActiveStep(1);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleComplete = () => {
    if (analysisResult) {
      navigate(`/analysis/${analysisResult.analysisId}`);
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
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(`/customers/${customer.id}`)}
          sx={{ mr: 2 }}
        >
          戻る
        </Button>
        <Typography variant="h4" component="h1">
          運用分析
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper sx={{ p: 3, mb: 3 }}>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Step 0: 顧客情報確認 */}
        {activeStep === 0 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              顧客情報を確認してください
            </Typography>
            <Card variant="outlined" sx={{ mb: 3 }}>
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography color="textSecondary" variant="body2">顧客名</Typography>
                    <Typography variant="body1">{customer.name}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography color="textSecondary" variant="body2">契約日</Typography>
                    <Typography variant="body1">
                      {new Date(customer.contractDate).toLocaleDateString('ja-JP')}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography color="textSecondary" variant="body2">月額保険料</Typography>
                    <Typography variant="body1">
                      ¥{customer.monthlyPremium.toLocaleString()}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography color="textSecondary" variant="body2">リスク許容度</Typography>
                    <Chip
                      label={getRiskToleranceLabel(customer.riskTolerance)}
                      size="small"
                      color="primary"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Typography color="textSecondary" variant="body2">投資目標</Typography>
                    <Typography variant="body1">
                      {customer.investmentGoal || '未設定'}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
            <Box display="flex" justifyContent="flex-end">
              <Button
                variant="contained"
                onClick={() => setActiveStep(1)}
              >
                次へ
              </Button>
            </Box>
          </Box>
        )}

        {/* Step 1: 市場データ確認 */}
        {activeStep === 1 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              市場データの確認
            </Typography>
            <Card variant="outlined" sx={{ mb: 3 }}>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <CheckCircleIcon color="success" sx={{ mr: 1 }} />
                  <Typography>
                    最新の市場データが利用可能です
                  </Typography>
                </Box>
                <Typography variant="body2" color="textSecondary">
                  NotebookLMを使用して、最新の市場動向を分析し、
                  お客様のプロファイルに基づいた最適な資産配分を提案します。
                </Typography>
              </CardContent>
            </Card>
            <Box display="flex" justifyContent="space-between">
              <Button onClick={() => setActiveStep(0)}>
                戻る
              </Button>
              <Button
                variant="contained"
                onClick={handleAnalysis}
                disabled={analyzing}
              >
                分析開始
              </Button>
            </Box>
          </Box>
        )}

        {/* Step 2: 分析実行中 */}
        {activeStep === 2 && (
          <Box textAlign="center" py={5}>
            <CircularProgress size={60} sx={{ mb: 3 }} />
            <Typography variant="h6" gutterBottom>
              分析を実行しています...
            </Typography>
            <Typography color="textSecondary">
              NotebookLMで市場データを分析し、最適な資産配分を計算しています。
              <br />
              この処理には数秒かかる場合があります。
            </Typography>
          </Box>
        )}

        {/* Step 3: 結果確認 */}
        {activeStep === 3 && analysisResult && (
          <Box>
            <Typography variant="h6" gutterBottom>
              分析が完了しました
            </Typography>
            <Alert severity="success" sx={{ mb: 3 }}>
              分析が正常に完了しました。信頼度スコア: {(analysisResult.confidenceScore * 100).toFixed(0)}%
            </Alert>
            
            <Card variant="outlined" sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  推奨資産配分
                </Typography>
                <Grid container spacing={2}>
                  {Object.entries(analysisResult.allocation).map(([asset, percentage]) => (
                    <Grid item xs={12} sm={6} key={asset}>
                      <Box display="flex" justifyContent="space-between">
                        <Typography>{asset}</Typography>
                        <Typography fontWeight="bold">{percentage}%</Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>

            <Card variant="outlined" sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  市場分析サマリー
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {analysisResult.marketAnalysis}
                </Typography>
              </CardContent>
            </Card>

            <Box display="flex" justifyContent="flex-end">
              <Button
                variant="contained"
                onClick={handleComplete}
              >
                詳細を確認
              </Button>
            </Box>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default AnalysisNew;
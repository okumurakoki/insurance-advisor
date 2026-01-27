import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Button,
  Card,
  CardContent,
  Divider,
  CircularProgress,
  Alert,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  PieChart as PieChartIcon,
} from '@mui/icons-material';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import api from '../services/api';
import { AnalysisResult as AnalysisResultType } from '../types';

ChartJS.register(ArcElement, Tooltip, Legend);

const AnalysisResult: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exportAnchorEl, setExportAnchorEl] = useState<null | HTMLElement>(null);
  const [generatingReport, setGeneratingReport] = useState(false);

  useEffect(() => {
    if (id) {
      fetchAnalysis(parseInt(id));
    }
  }, [id]);

  const fetchAnalysis = async (analysisId: number) => {
    try {
      // This would be replaced with actual API call to get analysis by ID
      // For now, we'll simulate with a mock
      setAnalysis({
        id: analysisId,
        customerName: 'テスト顧客',
        analysisDate: new Date().toISOString(),
        confidenceScore: 0.85,
        allocation: {
          '国内株式': 25,
          '海外株式': 35,
          '国内債券': 20,
          '海外債券': 15,
          '不動産': 5,
        },
        marketAnalysis: '現在の市場環境は、緩やかな成長トレンドを示しています。テクノロジーとヘルスケアセクターが特に好調で、今後も継続的な成長が期待されます。',
        adjustmentFactors: {
          contractPeriod: '中期（3年）',
          riskProfile: 'バランス型',
          amountTier: '中額層',
        },
      });
    } catch (err: any) {
      setError('分析結果の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'pdf' | 'excel' | 'api') => {
    try {
      const blob = await api.exportAnalysis(parseInt(id!), format);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analysis_${id}_${new Date().toISOString().split('T')[0]}.${format === 'api' ? 'json' : format}`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.log('Export endpoint not available, using fallback');
      setError('エクスポート機能は準備中です');
    }
    setExportAnchorEl(null);
  };

  const handleGeneratePdfReport = async () => {
    if (!analysis) return;

    setGeneratingReport(true);
    setError('');

    try {
      const reportResult = await api.generatePdfReport(
        'investment_analysis',
        analysis.customerName,
        {
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date().toISOString()
        }
      );

      if (reportResult.success) {
        // Download URL from Supabase Edge Function
        window.open(reportResult.downloadUrl, '_blank');
        alert('PDFレポートが生成されました');
      } else {
        setError('PDFレポートの生成に失敗しました');
      }
    } catch (err: any) {
      console.log('PDF generation endpoint not available, using fallback');
      
      // Fallback: HTML to PDF via print
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>変額保険 投資分析レポート</title>
              <style>
                body { font-family: 'Noto Sans JP', sans-serif; margin: 20px; }
                .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #1976d2; padding-bottom: 20px; }
                .section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
                .allocation { display: flex; flex-wrap: wrap; gap: 10px; }
                .allocation-item { flex: 1; min-width: 150px; padding: 10px; background: #f5f5f5; border-radius: 3px; }
              </style>
            </head>
            <body>
              <div class="header">
                <h1>変額保険 AI分析レポート</h1>
                <p>生成日時: ${new Date().toLocaleDateString('ja-JP')}</p>
              </div>
              <div class="section">
                <h3>顧客情報</h3>
                <p>顧客名: ${analysis.customerName}</p>
                <p>分析日: ${new Date(analysis.analysisDate).toLocaleDateString('ja-JP')}</p>
                <p>信頼度スコア: ${(analysis.confidenceScore * 100).toFixed(0)}%</p>
              </div>
              <div class="section">
                <h3>推奨資産配分</h3>
                <div class="allocation">
                  ${Object.entries(analysis.allocation).map(([asset, percentage]) => 
                    `<div class="allocation-item"><strong>${asset}</strong><br>${percentage}%</div>`
                  ).join('')}
                </div>
              </div>
              <div class="section">
                <h3>市場分析</h3>
                <p>${analysis.marketAnalysis}</p>
              </div>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    } finally {
      setGeneratingReport(false);
    }
  };

  const chartData = {
    labels: Object.keys(analysis?.allocation || {}),
    datasets: [
      {
        label: '資産配分',
        data: Object.values(analysis?.allocation || {}),
        backgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
          '#9966FF',
        ],
        hoverBackgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
          '#9966FF',
        ],
      },
    ],
  };

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

  if (!analysis) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">分析結果が見つかりません</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Box display="flex" alignItems="center">
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(-1)}
            sx={{ mr: 2 }}
          >
            戻る
          </Button>
          <Typography variant="h4" component="h1">
            分析結果
          </Typography>
        </Box>
        <Box>
          <Button
            startIcon={<PrintIcon />}
            onClick={() => window.print()}
            sx={{ mr: 1 }}
          >
            印刷
          </Button>
          <Button
            variant="contained"
            startIcon={generatingReport ? <CircularProgress size={16} /> : <DownloadIcon />}
            onClick={handleGeneratePdfReport}
            disabled={generatingReport}
            sx={{ mr: 1 }}
          >
            {generatingReport ? 'PDF生成中...' : 'PDFレポート'}
          </Button>
          <Button
            startIcon={<DownloadIcon />}
            onClick={(e) => setExportAnchorEl(e.currentTarget)}
          >
            エクスポート
          </Button>
          <Menu
            anchorEl={exportAnchorEl}
            open={Boolean(exportAnchorEl)}
            onClose={() => setExportAnchorEl(null)}
          >
            <MenuItem onClick={() => handleExport('pdf')}>PDF形式</MenuItem>
            <MenuItem onClick={() => handleExport('excel')}>Excel形式</MenuItem>
            <MenuItem onClick={() => handleExport('api')}>JSON形式</MenuItem>
          </Menu>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h5" gutterBottom fontWeight="bold" color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PieChartIcon /> 今月の最適化推奨配分
            </Typography>
            <Typography variant="body2" color="textSecondary" gutterBottom sx={{ mb: 3 }}>
              以下のファンドに配分してください
            </Typography>
            <Divider sx={{ mb: 3 }} />

            {/* 大きくわかりやすい配分表示 */}
            <Box sx={{ mb: 4 }}>
              {Object.entries(analysis.allocation).map(([asset, pct], index) => {
                const percentage = pct as number;
                return (
                <Box
                  key={asset}
                  sx={{
                    mb: 2,
                    p: 2.5,
                    backgroundColor: index % 2 === 0 ? '#f5f5f5' : '#ffffff',
                    borderRadius: 2,
                    border: '2px solid',
                    borderColor: percentage > 25 ? '#1976d2' : percentage > 15 ? '#4caf50' : '#757575',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'all 0.3s',
                    '&:hover': {
                      transform: 'scale(1.02)',
                      boxShadow: 3,
                    }
                  }}
                >
                  <Box>
                    <Typography variant="h6" fontWeight="bold">
                      {asset}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {percentage > 25 ? '重点配分' : percentage > 15 ? '標準配分' : '小額配分'}
                    </Typography>
                  </Box>
                  <Box textAlign="right">
                    <Typography
                      variant="h4"
                      fontWeight="bold"
                      color={percentage > 25 ? 'primary' : percentage > 15 ? 'success.main' : 'text.secondary'}
                    >
                      {percentage}%
                    </Typography>
                  </Box>
                </Box>
              );
              })}
            </Box>

            {/* 円グラフは参考として下部に配置 */}
            <Divider sx={{ mb: 2 }} />
            <Typography variant="body2" color="textSecondary" gutterBottom>
              配分イメージ（参考）
            </Typography>
            <Box height={250} sx={{ mt: 2 }}>
              <Pie data={chartData} options={chartOptions} />
            </Box>
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              市場分析
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="body1" paragraph>
              {analysis.marketAnalysis}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                分析情報
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Box mb={2}>
                <Typography color="textSecondary" variant="body2">分析日</Typography>
                <Typography variant="body1">
                  {new Date(analysis.analysisDate).toLocaleDateString('ja-JP')}
                </Typography>
              </Box>
              
              <Box mb={2}>
                <Typography color="textSecondary" variant="body2">顧客名</Typography>
                <Typography variant="body1">{analysis.customerName}</Typography>
              </Box>
              
              <Box>
                <Typography color="textSecondary" variant="body2">信頼度スコア</Typography>
                <Typography variant="h6" color="primary">
                  {(analysis.confidenceScore * 100).toFixed(0)}%
                </Typography>
              </Box>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                調整要因
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Box mb={2}>
                <Typography color="textSecondary" variant="body2">契約期間</Typography>
                <Typography variant="body1">
                  {analysis.adjustmentFactors.contractPeriod}
                </Typography>
              </Box>
              
              <Box mb={2}>
                <Typography color="textSecondary" variant="body2">リスクプロファイル</Typography>
                <Typography variant="body1">
                  {analysis.adjustmentFactors.riskProfile}
                </Typography>
              </Box>
              
              <Box>
                <Typography color="textSecondary" variant="body2">金額層</Typography>
                <Typography variant="body1">
                  {analysis.adjustmentFactors.amountTier}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default AnalysisResult;
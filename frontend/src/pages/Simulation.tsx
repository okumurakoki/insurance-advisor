import React, { useEffect, useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Slider,
  InputAdornment,
  Chip,
  Divider,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Calculate as CalculateIcon,
  ShowChart as ShowChartIcon,
  AccountBalance as AccountBalanceIcon,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

interface SimulationResult {
  summary: {
    initialAmount: number;
    monthlyPremium: number;
    years: number;
    totalPremiumPaid: number;
    annualReturn: number;
    annualVolatility: number;
    numSimulations: number;
  };
  finalValues: {
    p5: number;
    p25: number;
    p50: number;
    p75: number;
    p95: number;
    mean: number;
  };
  yearlyData: Array<{
    year: number;
    p5: number;
    p25: number;
    p50: number;
    p75: number;
    p95: number;
    mean: number;
  }>;
}

interface Fund {
  id: number;
  account_code: string;
  account_name: string;
  account_type: string;
  company_name: string;
  display_name: string;
  performance_count: number;
}

interface Preset {
  id: string;
  name: string;
  description: string;
  annualReturn: number;
  annualVolatility: number;
}

const Simulation: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 入力フォーム
  const [initialAmount, setInitialAmount] = useState<number>(1000000);
  const [monthlyPremium, setMonthlyPremium] = useState<number>(30000);
  const [years, setYears] = useState<number>(20);
  const [inputMode, setInputMode] = useState<'preset' | 'fund' | 'custom'>('preset');
  const [selectedPreset, setSelectedPreset] = useState<string>('balanced');
  const [selectedFund, setSelectedFund] = useState<number | ''>('');
  const [customReturn, setCustomReturn] = useState<number>(5);
  const [customVolatility, setCustomVolatility] = useState<number>(15);

  // データ
  const [funds, setFunds] = useState<Fund[]>([]);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [fundStats, setFundStats] = useState<{ annualReturn: number; annualVolatility: number } | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedFund) {
      fetchFundStats(selectedFund as number);
    }
  }, [selectedFund]);

  const fetchInitialData = async () => {
    try {
      const [fundsData, presetsData] = await Promise.all([
        api.getSimulationFunds(),
        api.getSimulationPresets(),
      ]);
      setFunds(fundsData);
      setPresets(presetsData);
    } catch (err) {
      console.error('初期データ取得エラー:', err);
    }
  };

  const fetchFundStats = async (fundId: number) => {
    try {
      const data = await api.getFundPerformance(fundId);
      setFundStats({
        annualReturn: data.statistics.annualReturn,
        annualVolatility: data.statistics.annualVolatility,
      });
    } catch (err) {
      console.error('ファンド統計取得エラー:', err);
      setFundStats(null);
    }
  };

  const handleSimulation = async () => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      let params: any = {
        initialAmount,
        monthlyPremium,
        years,
      };

      if (inputMode === 'preset') {
        const preset = presets.find(p => p.id === selectedPreset);
        if (preset) {
          params.customReturn = preset.annualReturn;
          params.customVolatility = preset.annualVolatility;
        }
      } else if (inputMode === 'fund' && selectedFund) {
        params.fundId = selectedFund;
      } else if (inputMode === 'custom') {
        params.customReturn = customReturn;
        params.customVolatility = customVolatility;
      }

      const data = await api.runSimulation(params);
      setResult(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'シミュレーションの実行に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getSelectedReturnVolatility = () => {
    if (inputMode === 'preset') {
      const preset = presets.find(p => p.id === selectedPreset);
      return preset ? { return: preset.annualReturn, volatility: preset.annualVolatility } : null;
    } else if (inputMode === 'fund' && fundStats) {
      return { return: fundStats.annualReturn, volatility: fundStats.annualVolatility };
    } else if (inputMode === 'custom') {
      return { return: customReturn, volatility: customVolatility };
    }
    return null;
  };

  const selectedParams = getSelectedReturnVolatility();

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <ShowChartIcon fontSize="large" />
        運用シミュレーション
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        モンテカルロシミュレーション（1,000回）による将来の運用予測
      </Typography>

      <Grid container spacing={3}>
        {/* 入力フォーム */}
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              シミュレーション条件
            </Typography>

            <Box sx={{ mb: 3 }}>
              <TextField
                fullWidth
                label="初期投資額"
                type="number"
                value={initialAmount}
                onChange={(e) => setInitialAmount(Number(e.target.value))}
                InputProps={{
                  startAdornment: <InputAdornment position="start">¥</InputAdornment>,
                }}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="月額保険料"
                type="number"
                value={monthlyPremium}
                onChange={(e) => setMonthlyPremium(Number(e.target.value))}
                InputProps={{
                  startAdornment: <InputAdornment position="start">¥</InputAdornment>,
                }}
                sx={{ mb: 2 }}
              />
              <Box sx={{ mb: 2 }}>
                <Typography gutterBottom>運用年数: {years}年</Typography>
                <Slider
                  value={years}
                  onChange={(_, value) => setYears(value as number)}
                  min={1}
                  max={40}
                  marks={[
                    { value: 5, label: '5年' },
                    { value: 10, label: '10年' },
                    { value: 20, label: '20年' },
                    { value: 30, label: '30年' },
                    { value: 40, label: '40年' },
                  ]}
                />
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle2" gutterBottom>
              リターン・リスク設定
            </Typography>
            <ToggleButtonGroup
              value={inputMode}
              exclusive
              onChange={(_, value) => value && setInputMode(value)}
              fullWidth
              size="small"
              sx={{ mb: 2 }}
            >
              <ToggleButton value="preset">プリセット</ToggleButton>
              <ToggleButton value="fund">ファンド</ToggleButton>
              <ToggleButton value="custom">カスタム</ToggleButton>
            </ToggleButtonGroup>

            {inputMode === 'preset' && (
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>運用スタイル</InputLabel>
                <Select
                  value={selectedPreset}
                  label="運用スタイル"
                  onChange={(e) => setSelectedPreset(e.target.value)}
                >
                  {presets.map((preset) => (
                    <MenuItem key={preset.id} value={preset.id}>
                      {preset.name} - {preset.description}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            {inputMode === 'fund' && (
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>ファンド選択</InputLabel>
                <Select
                  value={selectedFund}
                  label="ファンド選択"
                  onChange={(e) => setSelectedFund(e.target.value as number)}
                >
                  {funds.map((fund) => (
                    <MenuItem key={fund.id} value={fund.id}>
                      {fund.display_name} - {fund.account_name}
                      {fund.performance_count > 0 && (
                        <Chip size="small" label={`${fund.performance_count}件`} sx={{ ml: 1 }} />
                      )}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            {inputMode === 'custom' && (
              <>
                <TextField
                  fullWidth
                  label="期待リターン（年率）"
                  type="number"
                  value={customReturn}
                  onChange={(e) => setCustomReturn(Number(e.target.value))}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                  }}
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="ボラティリティ（年率）"
                  type="number"
                  value={customVolatility}
                  onChange={(e) => setCustomVolatility(Number(e.target.value))}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                  }}
                  sx={{ mb: 2 }}
                />
              </>
            )}

            {selectedParams && (
              <Alert severity="info" sx={{ mb: 2 }}>
                期待リターン: {formatPercent(selectedParams.return)} / リスク: {formatPercent(selectedParams.volatility)}
              </Alert>
            )}

            <Button
              variant="contained"
              fullWidth
              size="large"
              onClick={handleSimulation}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <CalculateIcon />}
            >
              {loading ? 'シミュレーション中...' : 'シミュレーション実行'}
            </Button>

            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
          </Paper>
        </Grid>

        {/* 結果表示 */}
        <Grid item xs={12} md={7}>
          {result ? (
            <>
              {/* サマリーカード */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6} sm={3}>
                  <Card>
                    <CardContent sx={{ textAlign: 'center', py: 2 }}>
                      <Typography variant="caption" color="text.secondary">
                        払込保険料合計
                      </Typography>
                      <Typography variant="h6">
                        {formatCurrency(result.summary.totalPremiumPaid)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Card sx={{ bgcolor: 'error.light' }}>
                    <CardContent sx={{ textAlign: 'center', py: 2 }}>
                      <Typography variant="caption" color="error.contrastText">
                        下振れ (5%)
                      </Typography>
                      <Typography variant="h6" color="error.contrastText">
                        {formatCurrency(result.finalValues.p5)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Card sx={{ bgcolor: 'primary.main' }}>
                    <CardContent sx={{ textAlign: 'center', py: 2 }}>
                      <Typography variant="caption" color="primary.contrastText">
                        中央値 (50%)
                      </Typography>
                      <Typography variant="h6" color="primary.contrastText">
                        {formatCurrency(result.finalValues.p50)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Card sx={{ bgcolor: 'success.light' }}>
                    <CardContent sx={{ textAlign: 'center', py: 2 }}>
                      <Typography variant="caption" color="success.contrastText">
                        上振れ (95%)
                      </Typography>
                      <Typography variant="h6" color="success.contrastText">
                        {formatCurrency(result.finalValues.p95)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {/* グラフ */}
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  資産推移予測
                </Typography>
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={result.yearlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="year"
                      tickFormatter={(value) => `${value}年`}
                    />
                    <YAxis
                      tickFormatter={(value) => `${(value / 10000).toFixed(0)}万`}
                    />
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                      labelFormatter={(label) => `${label}年後`}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="p95"
                      name="上振れ (95%)"
                      stroke="#4caf50"
                      fill="#4caf50"
                      fillOpacity={0.1}
                    />
                    <Area
                      type="monotone"
                      dataKey="p75"
                      name="やや上振れ (75%)"
                      stroke="#8bc34a"
                      fill="#8bc34a"
                      fillOpacity={0.2}
                    />
                    <Area
                      type="monotone"
                      dataKey="p50"
                      name="中央値 (50%)"
                      stroke="#2196f3"
                      fill="#2196f3"
                      fillOpacity={0.3}
                    />
                    <Area
                      type="monotone"
                      dataKey="p25"
                      name="やや下振れ (25%)"
                      stroke="#ff9800"
                      fill="#ff9800"
                      fillOpacity={0.2}
                    />
                    <Area
                      type="monotone"
                      dataKey="p5"
                      name="下振れ (5%)"
                      stroke="#f44336"
                      fill="#f44336"
                      fillOpacity={0.1}
                    />
                  </AreaChart>
                </ResponsiveContainer>

                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    シミュレーション条件
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6} sm={4}>
                      <Typography variant="body2" color="text.secondary">
                        初期投資額: {formatCurrency(result.summary.initialAmount)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={4}>
                      <Typography variant="body2" color="text.secondary">
                        月額保険料: {formatCurrency(result.summary.monthlyPremium)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={4}>
                      <Typography variant="body2" color="text.secondary">
                        運用年数: {result.summary.years}年
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={4}>
                      <Typography variant="body2" color="text.secondary">
                        期待リターン: {formatPercent(result.summary.annualReturn)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={4}>
                      <Typography variant="body2" color="text.secondary">
                        ボラティリティ: {formatPercent(result.summary.annualVolatility)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={4}>
                      <Typography variant="body2" color="text.secondary">
                        シミュレーション回数: {result.summary.numSimulations.toLocaleString()}回
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              </Paper>
            </>
          ) : (
            <Paper sx={{ p: 4, textAlign: 'center', minHeight: 400, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
              <AccountBalanceIcon sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                シミュレーション結果がここに表示されます
              </Typography>
              <Typography variant="body2" color="text.secondary">
                条件を入力して「シミュレーション実行」をクリックしてください
              </Typography>
            </Paper>
          )}
        </Grid>
      </Grid>
    </Container>
  );
};

export default Simulation;

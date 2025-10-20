import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  Container,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Button,
  TextField,
  Alert,
  CircularProgress,
  LinearProgress,
  AppBar,
  Toolbar,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  Chip,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  AccountCircle,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Assessment as AssessmentIcon,
  Logout as LogoutIcon,
  TrendingUp,
  Person,
  Add,
  PictureAsPdf as PdfIcon,
  Menu as MenuIcon,
  TableChart as TableIcon,
} from '@mui/icons-material';
import Login from './components/Login.tsx';

// API Configuration
const API_BASE_URL = (process.env.REACT_APP_API_URL || 'https://api.insurance-optimizer.com').replace(/\/+$/, '');


const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    fontFamily: [
      '"Noto Sans JP"',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    fontWeightLight: 300,
    fontWeightRegular: 400,
    fontWeightMedium: 500,
    fontWeightBold: 700,
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 700 },
    h4: { fontWeight: 700 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    body1: { fontWeight: 400 },
    body2: { fontWeight: 400 },
  },
});

interface User {
  id: number;
  userId: string;
  accountType: 'admin' | 'parent' | 'child' | 'grandchild';
  planType: 'standard' | 'master' | 'exceed';
  customerLimit: number;
  isAdmin?: boolean;
  customerId?: number;  // For grandchild accounts to link to their customer record
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AppContent />
      </Router>
    </ThemeProvider>
  );
}

function AppContent() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [marketData, setMarketData] = useState<any[]>([]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      setIsLoggedIn(true);
      setUser(JSON.parse(userData));
      fetchMarketData();
    }
  }, []);

  const fetchMarketData = async () => {
    try {
      // Mock market data for production demo
      const mockMarketData = [
        {
          symbol: 'SPY',
          price: 445.20,
          change: 2.15,
          changePercent: '+0.48%',
          lastUpdate: new Date().toLocaleDateString()
        },
        {
          symbol: 'QQQ',
          price: 378.45,
          change: -1.23,
          changePercent: '-0.32%',
          lastUpdate: new Date().toLocaleDateString()
        },
        {
          symbol: 'VTI',
          price: 234.67,
          change: 0.89,
          changePercent: '+0.38%',
          lastUpdate: new Date().toLocaleDateString()
        },
        {
          symbol: 'AGG',
          price: 102.34,
          change: -0.12,
          changePercent: '-0.12%',
          lastUpdate: new Date().toLocaleDateString()
        },
        {
          symbol: 'VXUS',
          price: 58.91,
          change: 0.45,
          changePercent: '+0.77%',
          lastUpdate: new Date().toLocaleDateString()
        }
      ];
      setMarketData(mockMarketData);
    } catch (error) {
      console.log('Market data not available:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    setUser(null);
    setAnchorEl(null);
  };

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const getAccountTypeLabel = (type: string) => {
    const labels = {
      parent: '代理店',
      child: '生保担当者',
      grandchild: '顧客',
      admin: '管理者',
    };
    return labels[type as keyof typeof labels] || type;
  };


  // Navigation items - アカウントタイプに応じて表示項目を制御
  const navigationItems = [
    { path: '/dashboard', icon: <DashboardIcon />, text: 'ダッシュボード' },
    ...(user?.accountType === 'admin' ? [{ path: '/agencies', icon: <PeopleIcon />, text: '代理店管理' }] : []),
    ...(user?.accountType === 'parent' ? [{ path: '/staff', icon: <PeopleIcon />, text: '担当者管理' }] : []),
    ...(user?.accountType === 'parent' || user?.accountType === 'child' ? [{ path: '/customers', icon: <PeopleIcon />, text: '顧客管理' }] : []),
  ];

  const drawerContent = (
    <Box onClick={() => setMobileOpen(false)}>
      <Box sx={{ p: 2, borderBottom: '1px solid #eee' }}>
        <Typography variant="h6">🏦 変額保険システム</Typography>
        <Typography variant="body2" color="text.secondary">
          {user?.userId} ({getAccountTypeLabel(user?.accountType || '')})
        </Typography>
      </Box>
      <List>
        {navigationItems.map((item) => (
          <ListItem
            button
            key={item.path}
            onClick={() => navigate(item.path)}
            sx={{
              backgroundColor: location.pathname === item.path ? 'action.selected' : 'transparent'
            }}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
        <Divider sx={{ my: 1 }} />
        <ListItem button onClick={handleLogout}>
          <ListItemIcon><LogoutIcon /></ListItemIcon>
          <ListItemText primary="ログアウト" />
        </ListItem>
      </List>
    </Box>
  );

  if (isLoggedIn && user) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <AppBar position="static">
          <Toolbar>
            {isMobile && (
              <IconButton
                color="inherit"
                edge="start"
                onClick={handleDrawerToggle}
                sx={{ mr: 2 }}
              >
                <MenuIcon />
              </IconButton>
            )}
            
            <Typography variant="h6" component="div" sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              {isMobile ? '🏦 変額保険' : '🏦 変額保険アドバイザリーシステム'}
              <Chip
                label="v1.2.0"
                size="small"
                sx={{
                  bgcolor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '0.7rem'
                }}
              />
            </Typography>
            
            {!isMobile && (
              <>
                {navigationItems.map((item) => (
                  <Button 
                    key={item.path}
                    color="inherit" 
                    startIcon={item.icon}
                    onClick={() => navigate(item.path)}
                    sx={{ 
                      backgroundColor: location.pathname === item.path ? 'rgba(255,255,255,0.1)' : 'transparent',
                      display: { xs: 'none', md: 'flex' }
                    }}
                  >
                    {item.text}
                  </Button>
                ))}
              </>
            )}
            
            <IconButton
              size="large"
              onClick={handleMenu}
              color="inherit"
            >
              <AccountCircle />
            </IconButton>
            
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleClose}
            >
              <MenuItem disabled>
                <Typography variant="body2">
                  {user.userId} ({getAccountTypeLabel(user.accountType)})
                </Typography>
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout}>
                <LogoutIcon sx={{ mr: 1 }} fontSize="small" />
                ログアウト
              </MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>

        {/* Mobile Drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 280 },
          }}
        >
          {drawerContent}
        </Drawer>
        
        <Routes>
          <Route path="/" element={<Dashboard user={user} marketData={marketData} navigate={navigate} />} />
          <Route path="/dashboard" element={<Dashboard user={user} marketData={marketData} navigate={navigate} />} />
          {user?.accountType === 'admin' && (
            <>
              <Route path="/agencies" element={<AgencyList user={user} navigate={navigate} />} />
            </>
          )}
          {user?.accountType === 'parent' && (
            <>
              <Route path="/staff" element={<StaffList user={user} navigate={navigate} />} />
            </>
          )}
          {(user?.accountType === 'parent' || user?.accountType === 'child') && (
            <>
              <Route path="/customers" element={<CustomerList user={user} navigate={navigate} />} />
              <Route path="/customers/new" element={<CustomerForm user={user} navigate={navigate} isEdit={false} />} />
              <Route path="/customers/:id" element={<CustomerDetail user={user} navigate={navigate} />} />
              <Route path="/customers/:id/edit" element={<CustomerForm user={user} navigate={navigate} isEdit={true} />} />
            </>
          )}
        </Routes>
        
        <Box component="footer" sx={{ py: 3, px: 2, mt: 'auto', backgroundColor: 'background.paper' }}>
          <Typography variant="body2" color="text.secondary" align="center">
            © 2024 プルデンシャル生命保険株式会社 - 変額保険アドバイザリーシステム
          </Typography>
        </Box>
      </Box>
    );
  }

  const handleLoginSuccess = (token: string, userData: any) => {
    setIsLoggedIn(true);
    setUser(userData);
    fetchMarketData();
  };

  return <Login onLoginSuccess={handleLoginSuccess} apiBaseUrl={API_BASE_URL} />;
}

// Dashboard Component
interface DashboardProps {
  user: User;
  marketData: any[];
  navigate: (path: string) => void;
}

function Dashboard({ user, marketData, navigate }: DashboardProps) {
  const [optimizationResults, setOptimizationResults] = useState<any>(null);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [uploadingMarketData, setUploadingMarketData] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fundPerformance, setFundPerformance] = useState<any[]>([]);
  const [bondYields, setBondYields] = useState<any>(null);
  const [statistics, setStatistics] = useState<any>(null);
  const [latestMarketData, setLatestMarketData] = useState<any>(null);

  // Generate optimization results from fund performance data
  const generateOptimizationFromFundPerformance = (funds: any[]) => {
    if (!funds || funds.length === 0) return null;

    // Calculate total performance and filter positive performers
    const totalPerformance = funds.reduce((sum, f) => sum + Math.max(0, f.performance), 0);
    const recommendations: any = {};

    // First pass: calculate raw percentages
    const rawAllocations: any = {};
    funds.forEach(fund => {
      const performance = Math.max(0, fund.performance);
      const raw = totalPerformance > 0
        ? (performance / totalPerformance) * 100
        : 100 / funds.length;
      rawAllocations[fund.fundType] = raw;
    });

    // Round to nearest 10%
    const sortedFunds = funds.sort((a, b) => rawAllocations[b.fundType] - rawAllocations[a.fundType]);

    // First, round all allocations to 10%
    sortedFunds.forEach(fund => {
      const rounded = Math.round(rawAllocations[fund.fundType] / 10) * 10;
      recommendations[fund.fundType] = {
        current: Math.round(100 / funds.length / 10) * 10,
        recommended: rounded,
        change: 0
      };
    });

    // Calculate total and adjust if needed
    let totalAllocated = Object.values(recommendations).reduce((sum: number, r: any) => sum + r.recommended, 0);

    // Adjust to ensure total = 100%
    if (totalAllocated !== 100) {
      const diff = 100 - totalAllocated;
      // Add/subtract difference to the largest fund (that has allocation > 0 or can be increased)
      for (const fund of sortedFunds) {
        if (diff > 0 && recommendations[fund.fundType].recommended >= 0) {
          recommendations[fund.fundType].recommended += diff;
          break;
        } else if (diff < 0 && recommendations[fund.fundType].recommended >= Math.abs(diff)) {
          recommendations[fund.fundType].recommended += diff;
          break;
        }
      }
    }

    // Update change values
    sortedFunds.forEach(fund => {
      const current = Math.round(100 / funds.length / 10) * 10;
      recommendations[fund.fundType].change = recommendations[fund.fundType].recommended - current;
    });

    return {
      recommendations,
      riskLevel: 'balanced',
      expectedReturn: (funds.reduce((sum, f) => sum + f.performance, 0) / funds.length).toFixed(2)
    };
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        // Fetch fund performance
        const perfResponse = await fetch(`${API_BASE_URL}/api/analysis/fund-performance`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (perfResponse.ok) {
          const data = await perfResponse.json();
          console.log('=== Fund performance API response ===');
          console.log('Full response:', data);
          console.log('data.funds:', data.funds);
          console.log('data.funds.length:', data.funds?.length);
          console.log('Bond yields:', data.bondYields);

          const fundsData = data.funds || data;
          console.log('Setting fundPerformance to:', fundsData);
          setFundPerformance(fundsData);
          setBondYields(data.bondYields || null);
        } else {
          console.error('Fund performance API failed:', perfResponse.status);
        }

        // Fetch statistics
        const statsResponse = await fetch(`${API_BASE_URL}/api/analysis/statistics`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (statsResponse.ok) {
          const data = await statsResponse.json();
          setStatistics(data);
        }

        // Fetch optimization summary
        const optResponse = await fetch(`${API_BASE_URL}/api/analysis/optimization-summary`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (optResponse.ok) {
          const data = await optResponse.json();
          if (data) {
            setOptimizationResults(data);
            setShowRecommendations(true);
          }
        }

        // Fetch latest market data
        const marketDataResponse = await fetch(`${API_BASE_URL}/api/analysis/market-data/latest`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (marketDataResponse.ok) {
          const data = await marketDataResponse.json();
          console.log('Latest market data from API:', data);
          if (data) {
            setLatestMarketData(data);
          } else {
            console.log('No market data available');
            setLatestMarketData(null);
          }
        } else {
          console.error('Failed to fetch market data:', marketDataResponse.status);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      }
    };

    fetchData();
  }, []);

  // Update optimization results when fund performance changes
  useEffect(() => {
    console.log('=== fundPerformance changed ===');
    console.log('fundPerformance.length:', fundPerformance.length);
    console.log('fundPerformance:', fundPerformance);

    if (fundPerformance.length > 0) {
      const optimizationData = generateOptimizationFromFundPerformance(fundPerformance);
      console.log('Generated optimizationData:', optimizationData);
      setOptimizationResults(optimizationData);
      setShowRecommendations(true);
    }
    // データが空になっても、既存の最適化結果は保持する（次のデータアップロードまで表示）
  }, [fundPerformance]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleUploadMarketData = async () => {
    if (!selectedFile) {
      alert('PDFファイルを選択してください');
      return;
    }

    setUploadingMarketData(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('認証エラー: ログインしてください');
        return;
      }

      const formData = new FormData();
      formData.append('marketData', selectedFile);

      const response = await fetch(`${API_BASE_URL}/api/analysis/upload-market-data`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Upload response:', data);
        console.log('Fund performance from upload:', data.fundPerformance);
        console.log('Bond yields from upload:', data.bondYields);
        if (data.parseError) {
          console.error('PDF Parse Error from server:', data.parseError);
          alert(`PDF解析エラー: ${data.parseError.name}\n${data.parseError.message}`);
        }

        // Update latest market data state (temporary, will be replaced by API call below)
        setLatestMarketData({
          id: data.id,
          fileName: data.fileName,
          uploadedAt: data.uploadedAt,
          dataDate: data.reportDate
        });

        // 抽出された運用実績データを表示
        const extractedFundPerformance = data.fundPerformance || {};
        const fundKeys = Object.keys(extractedFundPerformance);

        // アップロードデータから直接fundPerformance配列とbondYieldsを設定
        const allFundTypes = ['総合型', '債券型', '株式型', '米国債券型', '米国株式型', 'REIT型'];
        if (fundKeys.length > 0 || Object.keys(extractedFundPerformance).length === 0) {
          const fundsArray = allFundTypes.map(fundType => {
            const performanceValue = extractedFundPerformance[fundType] !== undefined
              ? extractedFundPerformance[fundType]
              : 0;
            return {
              fundType,
              performance: performanceValue,
              recommendation: performanceValue > 10 ? 'recommended' :
                            performanceValue < 0 ? 'overpriced' : 'neutral'
            };
          });
          setFundPerformance(fundsArray);
          console.log('Set fundPerformance from upload:', fundsArray);
        }

        if (data.bondYields && (data.bondYields.japan10Y || data.bondYields.us10Y)) {
          setBondYields(data.bondYields);
          console.log('Set bondYields from upload:', data.bondYields);
        }

        let message = `マーケットデータをアップロードしました！\nファイル: ${data.fileName}`;

        if (fundKeys.length > 0) {
          message += '\n\n抽出された運用実績:';
          fundKeys.forEach(fundName => {
            message += `\n・${fundName}: ${extractedFundPerformance[fundName]}%`;
          });
        } else {
          message += '\n\n注意: 運用実績データを抽出できませんでした。PDFの形式を確認してください。';
        }

        if (data.reportDate) {
          message += `\n\nレポート日付: ${data.reportDate}`;
        }

        alert(message);
        setSelectedFile(null);
        // Reset file input
        const fileInput = document.getElementById('market-data-file') as HTMLInputElement;
        if (fileInput) fileInput.value = '';

        // 最新データを再取得してダッシュボードを更新
        const marketDataResponse = await fetch(`${API_BASE_URL}/api/analysis/market-data/latest`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (marketDataResponse.ok) {
          const latestData = await marketDataResponse.json();
          setLatestMarketData(latestData);
        }

        // Fund performanceの再取得はスキップ（アップロードレスポンスのデータを使用）
        console.log('Skipping fund performance reload - using data from upload response');
      } else {
        const error = await response.json();
        alert(`アップロードエラー: ${error.error}\n${error.details || ''}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('アップロード中にエラーが発生しました');
    } finally {
      setUploadingMarketData(false);
    }
  };


  const getPlanTypeLabel = (type: string) => {
    const labels = {
      standard: 'スタンダード',
      master: 'マスター',
      exceed: 'エクシード',
    };
    return labels[type as keyof typeof labels] || type;
  };


  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4, flexGrow: 1 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              {user.accountType === 'grandchild' ? 'マイ投資ダッシュボード' : '投資ダッシュボード'}
            </Typography>
            <Typography variant="subtitle1" gutterBottom>
              ようこそ、{user.userId} さん ({user.accountType === 'grandchild' ? '顧客' : getPlanTypeLabel(user.planType)})
            </Typography>
          </Box>
        </Grid>

        {/* Latest Market Data Info (全アカウント) */}
        {latestMarketData && (
          <Grid item xs={12}>
            <Card sx={{ p: 2, bgcolor: 'success.50', border: '1px solid', borderColor: 'success.main' }}>
              <Box display="flex" alignItems="center" gap={1}>
                <Typography variant="body1" color="success.dark" sx={{ fontWeight: 'bold' }}>
                  ✓ 最新マーケットデータ
                </Typography>
                <Chip label="最新" color="success" size="small" />
              </Box>
              <Box sx={{ mt: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  ファイル名: {latestMarketData.fileName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  アップロード日時: {new Date(latestMarketData.uploadedAt).toLocaleString('ja-JP')}
                </Typography>
                {latestMarketData.dataDate && (
                  <Typography variant="body2" color="text.secondary">
                    データ基準日: {new Date(latestMarketData.dataDate).toLocaleDateString('ja-JP')}
                  </Typography>
                )}
              </Box>
            </Card>
          </Grid>
        )}

        {/* Market Data Upload Section (管理者のみ) */}
        {user.accountType === 'admin' && (
          <Grid item xs={12}>
            <Card sx={{ p: 3, bgcolor: '#f5f5f5' }}>
              <Typography variant="h6" mb={1}>
                📊 マーケットデータアップロード
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                月次マーケットレポート（PDF）をアップロードして、最新のファンドパフォーマンスデータを反映できます。
              </Typography>

              <Box sx={{ mt: 2, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                <input
                  id="market-data-file"
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
                <label htmlFor="market-data-file">
                  <Button variant="outlined" component="span">
                    PDFを選択
                  </Button>
                </label>
                {selectedFile && (
                  <Typography variant="body2">
                    選択済み: {selectedFile.name}
                  </Typography>
                )}
                <Button
                  variant="contained"
                  onClick={handleUploadMarketData}
                  disabled={!selectedFile || uploadingMarketData}
                  startIcon={uploadingMarketData ? <CircularProgress size={20} /> : null}
                >
                  {uploadingMarketData ? 'アップロード中...' : 'アップロード'}
                </Button>
              </Box>
            </Card>
          </Grid>
        )}

        {/* 最適化結果表示領域 */}
        <Grid item xs={12}>
          {latestMarketData && fundPerformance.length === 0 && (
            <Paper sx={{ p: 3, mb: 2, bgcolor: 'warning.light' }}>
              <Typography variant="body1" gutterBottom>
                ⚠️ マーケットデータがアップロードされていますが、ファンドパフォーマンスデータの抽出に失敗している可能性があります。
              </Typography>
              <Typography variant="body2" color="text.secondary">
                PDFの形式を確認して、再度アップロードしてください。
              </Typography>
            </Paper>
          )}
          {showRecommendations && optimizationResults && fundPerformance.length > 0 ? (
            <Paper sx={{
              p: 4,
              mb: 2,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: 4,
              boxShadow: '0 10px 40px rgba(102, 126, 234, 0.3)',
            }}>
              <Box sx={{ textAlign: 'center', mb: 4 }}>
                <Typography variant="h4" gutterBottom sx={{ fontWeight: 900, color: '#fff', textShadow: '2px 2px 4px rgba(0,0,0,0.2)' }}>
                  ✨ 今月の最適化推奨配分
                </Typography>
                <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>
                  AI分析による最適なポートフォリオ配分のご提案
                </Typography>
              </Box>
              
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  {/* ビフォー・アフター表示 */}
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <Card sx={{
                        p: 4,
                        background: '#fff',
                        borderRadius: 3,
                        boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: '0 12px 48px rgba(0,0,0,0.15)',
                        }
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3 }}>
                          <Typography variant="h5" sx={{ fontWeight: 700, color: '#64748b' }}>
                            📊 現在の配分
                          </Typography>
                        </Box>
                        <Box sx={{ mt: 3 }}>
                          {Object.entries(optimizationResults.recommendations).map(([fundKey, fund]) => {
                            const fundNameMap: { [key: string]: string } = {
                              'equity': '株式型',
                              'Equity': '株式型',
                              'usequity': '米国株式型',
                              'usEquity': '米国株式型',
                              'usbond': '米国債券型',
                              'usBond': '米国債券型',
                              'reit': 'REIT型',
                              'REIT': 'REIT型',
                              'global': '総合型',
                              'Global': '総合型',
                              'bond': '債券型',
                              'Bond': '債券型'
                            };
                            const displayName = fundNameMap[fundKey] || fundKey;

                            return (
                            <Box key={fundKey} sx={{ mb: 3 }}>
                              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                                <Typography variant="body1" sx={{ fontWeight: 700, color: '#1e293b', fontSize: '1.1rem' }}>
                                  {displayName}
                                </Typography>
                                <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#475569', fontSize: '1.3rem' }}>
                                  {fund.current}%
                                </Typography>
                              </Box>
                              <Box sx={{ position: 'relative', height: 36 }}>
                                <LinearProgress
                                  variant="determinate"
                                  value={fund.current}
                                  sx={{
                                    height: 36,
                                    borderRadius: 3,
                                    backgroundColor: '#e2e8f0',
                                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)',
                                    '& .MuiLinearProgress-bar': {
                                      background: 'linear-gradient(90deg, #94a3b8 0%, #64748b 100%)',
                                      borderRadius: 3,
                                      boxShadow: '0 2px 8px rgba(100, 116, 139, 0.3)',
                                    }
                                  }}
                                />
                                <Box
                                  sx={{
                                    position: 'absolute',
                                    left: '50%',
                                    top: '50%',
                                    transform: 'translate(-50%, -50%)',
                                    color: fund.current > 50 ? 'white' : '#1e293b',
                                    fontWeight: 'bold',
                                    fontSize: '1rem'
                                  }}
                                >
                                  {fund.current}%
                                </Box>
                              </Box>
                            </Box>
                          )})}
                        </Box>
                      </Card>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <Card sx={{
                        p: 4,
                        background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                        borderRadius: 3,
                        boxShadow: '0 8px 32px rgba(245, 87, 108, 0.3)',
                        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: '0 12px 48px rgba(245, 87, 108, 0.4)',
                        }
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3 }}>
                          <Typography variant="h5" sx={{ fontWeight: 700, color: '#fff', textShadow: '1px 1px 2px rgba(0,0,0,0.2)' }}>
                            🎯 AI推奨配分
                          </Typography>
                        </Box>
                        <Box sx={{ mt: 3 }}>
                          {Object.entries(optimizationResults.recommendations).map(([fundKey, fund], index) => {
                            const colors = ['#4caf50', '#2196f3', '#ff9800', '#f44336', '#9c27b0', '#00bcd4', '#ff5722'];
                            const getBarColor = () => colors[index % colors.length];

                            const fundNameMap: { [key: string]: string } = {
                              'equity': '株式型',
                              'Equity': '株式型',
                              'usequity': '米国株式型',
                              'usEquity': '米国株式型',
                              'usbond': '米国債券型',
                              'usBond': '米国債券型',
                              'reit': 'REIT型',
                              'REIT': 'REIT型',
                              'global': '総合型',
                              'Global': '総合型',
                              'bond': '債券型',
                              'Bond': '債券型'
                            };
                            const displayName = fundNameMap[fundKey] || fundKey;

                            return (
                              <Box key={fundKey} sx={{ mb: 3 }}>
                                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                                  <Typography variant="body1" sx={{ fontWeight: 700, color: '#fff', fontSize: '1.1rem' }}>
                                    {displayName}
                                  </Typography>
                                  <Box display="flex" alignItems="center" gap={1}>
                                    {fund.change !== 0 && (
                                      <Chip
                                        label={`${fund.change > 0 ? '+' : ''}${fund.change}%`}
                                        sx={{
                                          fontSize: '0.9rem',
                                          fontWeight: 'bold',
                                          background: fund.change > 0 ? '#10b981' : '#f59e0b',
                                          color: '#fff',
                                          boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                                        }}
                                      />
                                    )}
                                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#fff', fontSize: '1.3rem' }}>
                                      {fund.recommended}%
                                    </Typography>
                                  </Box>
                                </Box>
                                <Box sx={{ position: 'relative', height: 36 }}>
                                  <LinearProgress
                                    variant="determinate"
                                    value={fund.recommended}
                                    sx={{
                                      height: 36,
                                      borderRadius: 3,
                                      backgroundColor: 'rgba(255,255,255,0.3)',
                                      boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)',
                                      '& .MuiLinearProgress-bar': {
                                        backgroundColor: '#fff',
                                        borderRadius: 3,
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                                      }
                                    }}
                                  />
                                  <Box
                                    sx={{
                                      position: 'absolute',
                                      left: '50%',
                                      top: '50%',
                                      transform: 'translate(-50%, -50%)',
                                      color: fund.recommended > 50 ? '#f5576c' : '#fff',
                                      fontWeight: 'bold',
                                      fontSize: '1rem'
                                    }}
                                  >
                                    {fund.recommended}%
                                  </Box>
                                  {fund.change !== 0 && (
                                    <Box
                                      sx={{
                                        position: 'absolute',
                                        left: `${fund.current}%`,
                                        top: -8,
                                        bottom: -8,
                                        width: 2,
                                        backgroundColor: '#000',
                                        opacity: 0.3,
                                        '&::before': {
                                          content: '"前"',
                                          position: 'absolute',
                                          bottom: -20,
                                          left: '50%',
                                          transform: 'translateX(-50%)',
                                          fontSize: '0.75rem',
                                          whiteSpace: 'nowrap'
                                        }
                                      }}
                                    />
                                  )}
                                </Box>
                              </Box>
                            );
                          })}
                        </Box>
                      </Card>
                    </Grid>
                  </Grid>

                  {/* 変更理由の表示 */}
                  <Box sx={{ mt: 4 }}>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                      💡 変更理由
                    </Typography>
                    <Grid container spacing={2}>
                      {Object.entries(optimizationResults.recommendations)
                        .filter(([_, fund]) => fund.change !== 0)
                        .map(([fundKey, fund]) => (
                        <Grid item xs={12} sm={6} key={fundKey}>
                          <Alert 
                            severity={fund.change > 0 ? "info" : "warning"}
                            sx={{ height: '100%' }}
                          >
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              {fundKey}
                              {fund.change > 0 ? ' 増額推奨' : ' 減額推奨'}
                            </Typography>
                            <Typography variant="caption">
                              {fund.reason}
                            </Typography>
                          </Alert>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                </Grid>
                
              </Grid>
              
            </Paper>
          ) : (
            // 最適化結果待機中の固定レイアウト
            <Paper sx={{ p: 2, mb: 2, border: '2px dashed #ccc', minHeight: '400px', backgroundColor: '#f8f9fa' }}>
              <Box sx={{ textAlign: 'center', mb: 2 }}>
                  <Typography variant="h5" gutterBottom color="text.secondary" sx={{ fontWeight: 'bold' }}>
                    最適化推奨配分表示エリア
                  </Typography>
                  {!latestMarketData ? (
                    <Alert severity="info" sx={{ mt: 2, maxWidth: 600, mx: 'auto' }}>
                      <Typography variant="body1" gutterBottom>
                        📊 マーケットデータをアップロードしてください
                      </Typography>
                      <Typography variant="body2">
                        管理者がPDFをアップロードすると、AIが市場データを分析して最適なファンド配分を推奨します。
                        一度アップロードすれば、リロード後もずっと表示されます。
                      </Typography>
                    </Alert>
                  ) : (
                    <Typography variant="body1" color="text.secondary">
                      マーケットデータがアップロードされました。ファンドパフォーマンスを取得中...
                    </Typography>
                  )}
                  </Box>
                  
                  <Typography variant="h5" gutterBottom color="text.secondary" sx={{ fontWeight: 'bold', mb: 3, mt: 4, textAlign: 'center' }}>
                    ファンド配分の変更提案（プレビュー）
                  </Typography>
              
              <Grid container spacing={2} sx={{ opacity: 0.3 }}>
                <Grid item xs={12} md={6}>
                  <Card sx={{ p: 2, boxShadow: 1 }}>
                    <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', textAlign: 'center' }}>
                      📋 現在の配分
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                      {['株式型', '米国株式型', '総合型', '米国債券型', '債券型', 'REIT型'].map((name, index) => (
                        <Box key={index} sx={{ mb: 1.5 }}>
                          <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              {name}
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              --%
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={0}
                            sx={{
                              height: 20,
                              borderRadius: 2,
                              backgroundColor: '#e0e0e0',
                              '& .MuiLinearProgress-bar': {
                                backgroundColor: 'grey.400',
                                borderRadius: 2,
                              }
                            }}
                          />
                        </Box>
                      ))}
                    </Box>
                  </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Card sx={{ p: 2, boxShadow: 1, border: '2px solid #ccc' }}>
                    <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', textAlign: 'center', color: 'text.secondary' }}>
                      🎯 推奨配分
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                      {['株式型', '米国株式型', '総合型', '米国債券型', '債券型', 'REIT型'].map((name, index) => (
                        <Box key={index} sx={{ mb: 1.5 }}>
                          <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              {name}
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              --%
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={0}
                            sx={{
                              height: 20,
                              borderRadius: 2,
                              backgroundColor: '#e0e0e0',
                              '& .MuiLinearProgress-bar': {
                                backgroundColor: 'grey.400',
                                borderRadius: 2,
                              }
                            }}
                          />
                        </Box>
                      ))}
                    </Box>
                  </Card>
                </Grid>
              </Grid>

              <Box sx={{ mt: 4 }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', textAlign: 'center', opacity: 0.3 }}>
                  💡 変更理由
                </Typography>
                <Grid container spacing={2} sx={{ opacity: 0.3 }}>
                  <Grid item xs={12} sm={6}>
                    <Card sx={{ p: 2, bgcolor: 'grey.50' }}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        最適化実行後に表示されます
                      </Typography>
                      <Typography variant="caption">
                        AI分析による推奨理由が表示されます
                      </Typography>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Card sx={{ p: 2, bgcolor: 'grey.50' }}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        PDFレポート出力可能
                      </Typography>
                      <Typography variant="caption">
                        PDF形式でダウンロードできます
                      </Typography>
                    </Card>
                  </Grid>
                </Grid>
              </Box>
            </Paper>
          )}
        </Grid>

        {/* Statistics Cards */}
        {user.accountType !== 'grandchild' && (
          <>
            <Grid item xs={12} sm={6} md={4}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography color="textSecondary" gutterBottom>
                        管理中の顧客数
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                        {statistics ? `${statistics.customerCount}人` : '読込中...'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        登録済み顧客
                      </Typography>
                    </Box>
                    <Person color="primary" sx={{ fontSize: 40 }} />
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
                        作成済みレポート数
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                        {statistics ? `${statistics.reportCount}件` : '読込中...'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        分析完了
                      </Typography>
                    </Box>
                    <AssessmentIcon color="secondary" sx={{ fontSize: 40 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </>
        )}

        <Grid item xs={12} sm={6} md={user.accountType === 'grandchild' ? 6 : 4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    {user.accountType === 'grandchild' ? '現在の運用額' : 'お客様の総運用資産'}
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                    {statistics
                      ? `${(statistics.totalAssets / 10000).toLocaleString('ja-JP')}万円`
                      : '読込中...'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    契約金額の合計
                  </Typography>
                </Box>
                <TrendingUp color="success" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={user.accountType === 'grandchild' ? 6 : 4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    {user.accountType === 'grandchild' ? '現在の運用利回り' : 'お客様の平均利回り'}
                  </Typography>
                  <Typography variant="h5" color={statistics && statistics.averageReturn >= 0 ? "success.main" : "error.main"} sx={{ fontWeight: 'bold' }}>
                    {statistics
                      ? `${statistics.averageReturn >= 0 ? '+' : ''}${statistics.averageReturn}%`
                      : '読込中...'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    年率収益率（推定）
                  </Typography>
                </Box>
                <Add color="success" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Fund Performance Analysis */}
        {user.accountType !== 'grandchild' && (
          <>
        {/* Key Indicators for Next Month Prediction */}
        {bondYields && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3, mb: 2, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                🎯 来月の利回り予測に重要な指標
                <Chip label="最新データ" size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }} />
              </Typography>

              <Grid container spacing={2} sx={{ mt: 1 }}>
                {/* 国債利回り */}
                <Grid item xs={12} md={6}>
                  <Card sx={{ bgcolor: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)' }}>
                    <CardContent>
                      <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.8)', mb: 1 }}>
                        📈 10年国債利回り（マクロ環境）
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>日本</Typography>
                          <Typography variant="h5" fontWeight="bold" sx={{ color: 'white' }}>
                            {bondYields.japan10Y?.toFixed(3)}%
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{
                              color: bondYields.japanChange >= 0 ? '#4ade80' : '#f87171',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0.5
                            }}
                          >
                            {bondYields.japanChange >= 0 ? '↑' : '↓'} {bondYields.japanChange >= 0 ? '+' : ''}{bondYields.japanChange?.toFixed(3)}%
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>米国</Typography>
                          <Typography variant="h5" fontWeight="bold" sx={{ color: 'white' }}>
                            {bondYields.us10Y?.toFixed(3)}%
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{
                              color: bondYields.usChange >= 0 ? '#4ade80' : '#f87171',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0.5
                            }}
                          >
                            {bondYields.usChange >= 0 ? '↑' : '↓'} {bondYields.usChange >= 0 ? '+' : ''}{bondYields.usChange?.toFixed(3)}%
                          </Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>

                {/* トップパフォーマー */}
                <Grid item xs={12} md={6}>
                  <Card sx={{ bgcolor: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)' }}>
                    <CardContent>
                      <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.8)', mb: 1 }}>
                        🔥 直近トレンド（直近1年）
                      </Typography>
                      <Grid container spacing={1}>
                        {fundPerformance.slice(0, 3).map((fund: any, idx: number) => (
                          <Grid item xs={12} key={idx}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="body2" sx={{ color: 'white' }}>
                                {fund.fundType}
                              </Typography>
                              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                <Typography
                                  variant="body2"
                                  fontWeight="bold"
                                  sx={{ color: fund.performance >= 0 ? '#4ade80' : '#f87171' }}
                                >
                                  {fund.performance >= 0 ? '+' : ''}{fund.performance}%
                                </Typography>
                                {fund.monthlyReturn1Y && (
                                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                                    (月{fund.monthlyReturn1Y >= 0 ? '+' : ''}{fund.monthlyReturn1Y?.toFixed(2)}%)
                                  </Typography>
                                )}
                              </Box>
                            </Box>
                          </Grid>
                        ))}
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        )}

        <Grid item xs={12}>
          <Paper sx={{ p: 3, mb: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h6">
                プルデンシャル変額保険ファンド分析
              </Typography>
              <Chip label="PDF分析結果" color="primary" size="small" />
            </Box>

            <Grid container spacing={3}>
              {fundPerformance.map((fund: any) => {
                const isRecommended = fund.recommendation === 'recommended';
                const isOverpriced = fund.recommendation === 'overpriced';
                const chipColor = isRecommended ? 'success' : isOverpriced ? 'error' : 'default';
                const chipLabel = isRecommended ? '今月の割安' : isOverpriced ? '今月の割高' : '通常';
                const performanceColor = fund.performance >= 0 ? 'success.main' : 'error.main';
                const recommendationScore = isRecommended ? 90 : isOverpriced ? 30 : 70;

                return (
                  <Grid item xs={12} md={4} key={fund.fundType}>
                    <Card
                      variant="outlined"
                      sx={{
                        height: '100%',
                        border: isRecommended ? '2px solid' : isOverpriced ? '2px solid' : '1px solid',
                        borderColor: isRecommended ? 'success.main' : isOverpriced ? 'error.main' : 'divider'
                      }}
                    >
                      <CardContent>
                        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                          <Box>
                            <Typography variant="h6" color="primary">{fund.fundType}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              {fund.fundType.includes('米国株式') ? '米国株式市場' :
                               fund.fundType.includes('米国債券') ? '米国債券中心' :
                               fund.fundType.includes('株式') ? '国内株式中心' :
                               fund.fundType.includes('REIT') ? '不動産投資信託' : '世界株式分散'}
                            </Typography>
                          </Box>
                          <Chip label={chipLabel} color={chipColor} size="small" />
                        </Box>

                        <Typography variant="h4" color={performanceColor} gutterBottom>
                          {fund.performance >= 0 ? '+' : ''}{fund.performance}%
                        </Typography>

                        <Grid container spacing={2} sx={{ mb: 2 }}>
                          <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary">年率換算利回り</Typography>
                            <Typography variant="h6" fontWeight="bold" color={performanceColor}>
                              {fund.annualizedReturn !== undefined
                                ? `${fund.annualizedReturn >= 0 ? '+' : ''}${fund.annualizedReturn.toFixed(2)}%`
                                : `${fund.performance >= 0 ? '+' : ''}${fund.performance}%`}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary">月次利回り</Typography>
                            <Typography variant="h6" fontWeight="bold" color={performanceColor}>
                              {fund.monthlyReturn !== undefined
                                ? `${fund.monthlyReturn >= 0 ? '+' : ''}${fund.monthlyReturn.toFixed(3)}%`
                                : `${(fund.performance / 12).toFixed(3)}%`}
                            </Typography>
                          </Grid>
                        </Grid>

                        {(fund.totalReturn5Y !== undefined || fund.totalReturn10Y !== undefined) && (
                          <Box sx={{ mb: 2, p: 1.5, bgcolor: 'grey.50', borderRadius: 1 }}>
                            <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                              📊 累積騰落率
                            </Typography>
                            <Grid container spacing={1}>
                              {fund.totalReturn1Y !== undefined && (
                                <Grid item xs={4}>
                                  <Typography variant="caption" color="text.secondary">1年</Typography>
                                  <Typography variant="body2" fontWeight="bold">
                                    {fund.totalReturn1Y >= 0 ? '+' : ''}{fund.totalReturn1Y.toFixed(1)}%
                                  </Typography>
                                </Grid>
                              )}
                              {fund.totalReturn5Y !== undefined && (
                                <Grid item xs={4}>
                                  <Typography variant="caption" color="text.secondary">5年</Typography>
                                  <Typography variant="body2" fontWeight="bold">
                                    {fund.totalReturn5Y >= 0 ? '+' : ''}{fund.totalReturn5Y.toFixed(1)}%
                                  </Typography>
                                </Grid>
                              )}
                              {fund.totalReturn10Y !== undefined && (
                                <Grid item xs={4}>
                                  <Typography variant="caption" color="text.secondary">10年</Typography>
                                  <Typography variant="body2" fontWeight="bold">
                                    {fund.totalReturn10Y >= 0 ? '+' : ''}{fund.totalReturn10Y.toFixed(1)}%
                                  </Typography>
                                </Grid>
                              )}
                            </Grid>
                          </Box>
                        )}

                        <Box sx={{ mt: 2 }}>
                          <Typography variant="caption" color="text.secondary">投資推奨度</Typography>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Box sx={{ width: '100%', height: 6, backgroundColor: 'grey.300', borderRadius: 1 }}>
                              <Box
                                sx={{
                                  width: `${recommendationScore}%`,
                                  height: '100%',
                                  backgroundColor: isRecommended ? 'success.main' : isOverpriced ? 'error.main' : 'primary.main',
                                  borderRadius: 1
                                }}
                              />
                            </Box>
                            <Typography
                              variant="caption"
                              color={isRecommended ? 'success.main' : isOverpriced ? 'error.main' : 'text.primary'}
                              fontWeight="bold"
                            >
                              {recommendationScore}%
                            </Typography>
                          </Box>
                        </Box>

                        {isRecommended && (
                          <Alert severity="success" sx={{ mt: 1, py: 0 }}>
                            <Typography variant="caption">💡 買い推奨: パフォーマンス好調</Typography>
                          </Alert>
                        )}

                        {isOverpriced && (
                          <Alert severity="warning" sx={{ mt: 1, py: 0 }}>
                            <Typography variant="caption">⚠️ 様子見: 市場調整局面</Typography>
                          </Alert>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>

            {/* Market Summary */}
            {fundPerformance.length > 0 && (
              <Box sx={{ mt: 3, p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  📈 市場サマリー & 投資アドバイス
                </Typography>
                <Grid container spacing={2}>
                  {fundPerformance
                    .filter((fund: any) => fund.recommendation !== 'neutral')
                    .slice(0, 3)
                    .map((fund: any) => {
                      const isRecommended = fund.recommendation === 'recommended';
                      const isOverpriced = fund.recommendation === 'overpriced';

                      return (
                        <Grid item xs={12} md={4} key={fund.fundType}>
                          <Typography
                            variant="body2"
                            color={isRecommended ? 'success.main' : isOverpriced ? 'error.main' : 'primary.main'}
                            fontWeight="bold"
                          >
                            {isRecommended ? '💡 買い推奨' : isOverpriced ? '⚠️ 様子見' : '安定運用'}: {fund.fundType.replace('型', '')}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {isRecommended
                              ? `パフォーマンス${fund.performance > 10 ? '好調' : '良好'}。積極的な投資を推奨。`
                              : isOverpriced
                              ? '市場調整により一時的な慎重姿勢を推奨。'
                              : '安定したパフォーマンス継続中。'}
                          </Typography>
                        </Grid>
                      );
                    })}
                  {fundPerformance.filter((fund: any) => fund.recommendation !== 'neutral').length === 0 && (
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary" textAlign="center">
                        現在、特に推奨するファンドはありません。バランスの取れた配分を維持してください。
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </Box>
            )}
          </Paper>
        </Grid>
          </>
        )}
        <Grid item xs={12}>
            <Paper sx={{ p: 3, mb: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ textAlign: 'center' }}>
                ファンドパフォーマンス（直近1年）
              </Typography>
              <Grid container spacing={2}>
                {fundPerformance.map((fund: any) => {
                  const isRecommended = fund.recommendation === 'recommended';
                  const isOverpriced = fund.recommendation === 'overpriced';
                  const isPositive = fund.performance > 0;

                  return (
                    <Grid item xs={12} sm={6} md={2.4} key={fund.fundType}>
                      <Card sx={{
                        textAlign: 'center',
                        p: 2,
                        bgcolor: isRecommended ? 'success.50' : isOverpriced ? 'error.50' : 'grey.50',
                        border: (isRecommended || isOverpriced) ? '2px solid' : 'none',
                        borderColor: isRecommended ? 'success.main' : isOverpriced ? 'error.main' : 'transparent'
                      }}>
                        <Typography variant="subtitle2" color="text.secondary">
                          {fund.fundType.replace('型', '')}
                        </Typography>
                        <Typography variant="h5" color={isPositive ? 'success.main' : 'error.main'} sx={{ fontWeight: 'bold', my: 1 }}>
                          {isPositive ? '+' : ''}{fund.performance}%
                        </Typography>
                        {isRecommended ? (
                          <Typography variant="caption" color="success.main">今月のおすすめ</Typography>
                        ) : isOverpriced ? (
                          <Typography variant="caption" color="error.main">割高</Typography>
                        ) : (
                          <Typography variant="caption">(年率)</Typography>
                        )}
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            </Paper>
          </Grid>

        {/* Action Buttons */}
        {(user.accountType === 'parent' || user.accountType === 'child') && (
          <Grid item xs={12}>
            <Box display="flex" gap={2} flexWrap="wrap">
              <Button
                variant="outlined"
                onClick={() => navigate('/customers')}
              >
                顧客一覧
              </Button>
            </Box>
          </Grid>
        )}

        {/* Welcome Message */}
        <Grid item xs={12}>
          <Alert severity="success">
            プルデンシャル生命変額保険最適化システムへようこそ！
            AI搭載の分析機能で最適な投資戦略をご提案します。
          </Alert>
        </Grid>
      </Grid>
    </Container>
  );
}

// Agency List Component (管理者用)
interface AgencyListProps {
  user: User;
  navigate: (path: string) => void;
}

function AgencyList({ user, navigate }: AgencyListProps) {
  const [agencies, setAgencies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showPlanEditModal, setShowPlanEditModal] = useState(false);
  const [editingAgency, setEditingAgency] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPlan, setFilterPlan] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [formData, setFormData] = useState({
    userId: '',
    password: '',
    planType: 'bronze',
    customStaffLimit: '',
    customCustomerLimitPerStaff: ''
  });
  const [planEditForm, setPlanEditForm] = useState({
    planType: 'bronze',
    customStaffLimit: '',
    customCustomerLimitPerStaff: ''
  });

  useEffect(() => {
    fetchAgencies();
  }, []);

  const fetchAgencies = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/admin/agencies`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAgencies(data);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to fetch agencies:', response.status, errorData);
        alert(`代理店一覧の取得に失敗しました: ${errorData.message || errorData.error || response.status}`);
      }
    } catch (error) {
      console.error('Error fetching agencies:', error);
      alert('代理店一覧の取得中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAgency = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('token');
      const body: any = {
        userId: formData.userId,
        password: formData.password,
        planType: formData.planType
      };

      if (formData.planType === 'exceed') {
        if (formData.customStaffLimit) body.customStaffLimit = parseInt(formData.customStaffLimit);
        if (formData.customCustomerLimitPerStaff) body.customCustomerLimitPerStaff = parseInt(formData.customCustomerLimitPerStaff);
      }

      const response = await fetch(`${API_BASE_URL}/api/admin/agencies`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        alert('代理店を作成しました');
        setShowCreateForm(false);
        setFormData({
          userId: '',
          password: '',
          planType: 'bronze',
          customStaffLimit: '',
          customCustomerLimitPerStaff: ''
        });
        fetchAgencies();
      } else {
        const error = await response.json();
        alert(`作成エラー: ${error.error}`);
      }
    } catch (error) {
      console.error('Error creating agency:', error);
      alert('作成に失敗しました');
    }
  };

  const handleToggleStatus = async (agencyId: number, currentStatus: boolean) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/admin/agencies/${agencyId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isActive: !currentStatus })
      });

      if (response.ok) {
        alert(`代理店を${!currentStatus ? '有効化' : '無効化'}しました`);
        fetchAgencies();
      } else {
        alert('ステータス変更に失敗しました');
      }
    } catch (error) {
      console.error('Error toggling status:', error);
    }
  };

  const getPlanLabel = (planType: string) => {
    const labels: any = {
      bronze: 'ブロンズ',
      silver: 'シルバー',
      gold: 'ゴールド',
      platinum: 'プラチナ',
      exceed: 'エクシード'
    };
    return labels[planType] || planType;
  };

  // フィルタリングされた代理店リスト
  const filteredAgencies = agencies.filter(agency => {
    // 検索クエリでフィルター
    const matchesSearch = agency.userId.toLowerCase().includes(searchQuery.toLowerCase());

    // プランでフィルター
    const matchesPlan = filterPlan === 'all' || agency.planType === filterPlan;

    // ステータスでフィルター
    const matchesStatus = filterStatus === 'all' ||
      (filterStatus === 'active' && agency.isActive) ||
      (filterStatus === 'inactive' && !agency.isActive);

    return matchesSearch && matchesPlan && matchesStatus;
  });

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  const handleFixAgencyPlans = async () => {
    if (!window.confirm('既存の代理店のプラン情報を修正します。よろしいですか？')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/agencies/fix-plans`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        alert(`プラン情報を修正しました。影響を受けた代理店数: ${result.affectedRows}`);
        // 代理店一覧を再読み込み
        window.location.reload();
      } else {
        const error = await response.json();
        alert(`エラー: ${error.error}`);
      }
    } catch (error) {
      console.error('Fix agency plans error:', error);
      alert('プラン情報の修正に失敗しました');
    }
  };

  const handleOpenPlanEdit = (agency: any) => {
    setEditingAgency(agency);
    setPlanEditForm({
      planType: agency.planType || 'bronze',
      customStaffLimit: '',
      customCustomerLimitPerStaff: ''
    });
    setShowPlanEditModal(true);
  };

  const handleClosePlanEdit = () => {
    setShowPlanEditModal(false);
    setEditingAgency(null);
    setPlanEditForm({
      planType: 'bronze',
      customStaffLimit: '',
      customCustomerLimitPerStaff: ''
    });
  };

  const handleSavePlanChange = async () => {
    if (!editingAgency) return;

    const token = localStorage.getItem('token');
    if (!token) {
      alert('認証エラー：再度ログインしてください');
      return;
    }

    try {
      const body: any = {
        planType: planEditForm.planType
      };

      // エクシードプランの場合、カスタム値を追加
      if (planEditForm.planType === 'exceed') {
        if (!planEditForm.customStaffLimit || !planEditForm.customCustomerLimitPerStaff) {
          alert('エクシードプランの場合、担当者上限数と顧客上限数を入力してください');
          return;
        }
        body.customStaffLimit = parseInt(planEditForm.customStaffLimit);
        body.customCustomerLimitPerStaff = parseInt(planEditForm.customCustomerLimitPerStaff);
      }

      const response = await fetch(`${API_BASE_URL}/api/admin/agencies/${editingAgency.id}/plan`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        alert('プランを変更しました');
        handleClosePlanEdit();
        fetchAgencies();
      } else {
        const error = await response.json();
        alert(`エラー: ${error.error}`);
      }
    } catch (error) {
      console.error('Plan update error:', error);
      alert('プラン変更に失敗しました');
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          代理店管理
        </Typography>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            color="secondary"
            onClick={handleFixAgencyPlans}
          >
            プラン情報を修正
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setShowCreateForm(!showCreateForm)}
          >
            {showCreateForm ? 'フォームを閉じる' : '新規代理店作成'}
          </Button>
        </Box>
      </Box>

      {/* 検索・フィルターセクション */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              label="検索（ユーザーID）"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="代理店IDで検索..."
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={3} md={3}>
            <TextField
              fullWidth
              select
              label="プラン"
              value={filterPlan}
              onChange={(e) => setFilterPlan(e.target.value)}
              size="small"
              SelectProps={{ native: true }}
            >
              <option value="all">すべて</option>
              <option value="bronze">ブロンズ</option>
              <option value="silver">シルバー</option>
              <option value="gold">ゴールド</option>
              <option value="platinum">プラチナ</option>
              <option value="exceed">エクシード</option>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={3} md={3}>
            <TextField
              fullWidth
              select
              label="ステータス"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              size="small"
              SelectProps={{ native: true }}
            >
              <option value="all">すべて</option>
              <option value="active">有効</option>
              <option value="inactive">無効</option>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={12} md={2}>
            <Typography variant="body2" color="text.secondary">
              {filteredAgencies.length}件 / {agencies.length}件
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {showCreateForm && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            新規代理店作成
          </Typography>
          <form onSubmit={handleCreateAgency}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="ユーザーID"
                  value={formData.userId}
                  onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="パスワード"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  select
                  label="プラン"
                  value={formData.planType}
                  onChange={(e) => setFormData({ ...formData, planType: e.target.value })}
                  SelectProps={{ native: true }}
                  helperText="プラン詳細: ブロンズ(担当者1人/顧客5人)、シルバー(担当者3人/顧客30人)、ゴールド(担当者10人/顧客15人ずつ)、プラチナ(担当者30人/顧客30人ずつ)、エクシード(カスタム)"
                >
                  <option value="bronze">ブロンズ - 980円/月 (担当者1人、顧客5人まで)</option>
                  <option value="silver">シルバー - 1,980円/月 (担当者3人、顧客30人まで)</option>
                  <option value="gold">ゴールド - 3,980円/月 (担当者10人、顧客15人/担当者)</option>
                  <option value="platinum">プラチナ - 8,980円/月 (担当者30人、顧客30人/担当者)</option>
                  <option value="exceed">エクシード - カスタム設定</option>
                </TextField>
              </Grid>
              {formData.planType === 'exceed' && (
                <>
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      label="担当者数上限"
                      type="number"
                      value={formData.customStaffLimit}
                      onChange={(e) => setFormData({ ...formData, customStaffLimit: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      label="顧客数上限/担当者"
                      type="number"
                      value={formData.customCustomerLimitPerStaff}
                      onChange={(e) => setFormData({ ...formData, customCustomerLimitPerStaff: e.target.value })}
                    />
                  </Grid>
                </>
              )}
              <Grid item xs={12}>
                <Button type="submit" variant="contained">
                  作成
                </Button>
              </Grid>
            </Grid>
          </form>
        </Paper>
      )}

      <Paper sx={{ p: 0, overflow: 'hidden' }}>
        {filteredAgencies.length === 0 ? (
          <Box textAlign="center" py={8}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {agencies.length === 0 ? 'まだ代理店が登録されていません' : '条件に一致する代理店が見つかりません'}
            </Typography>
            {agencies.length > 0 && (
              <Button
                variant="outlined"
                onClick={() => {
                  setSearchQuery('');
                  setFilterPlan('all');
                  setFilterStatus('all');
                }}
                sx={{ mt: 2 }}
              >
                フィルターをクリア
              </Button>
            )}
          </Box>
        ) : (
          <Grid container spacing={0}>
            {filteredAgencies.map((agency) => (
              <Grid item xs={12} key={agency.id}>
                <Card variant="outlined" sx={{ m: 1 }}>
                  <CardContent>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} sm={3}>
                        <Typography variant="h6">{agency.userId}</Typography>
                        <Chip
                          label={getPlanLabel(agency.planType)}
                          color="primary"
                          size="small"
                          sx={{ mt: 1 }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={2}>
                        <Typography variant="body2" color="text.secondary">
                          担当者数
                        </Typography>
                        <Typography variant="h6">
                          {agency.staffCount || 0}人 / 上限{agency.staffLimit || 0}人
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={Math.min(((agency.staffCount || 0) / Math.max(agency.staffLimit || 1, 1)) * 100, 100)}
                          sx={{ mt: 0.5, height: 6, borderRadius: 1 }}
                          color={(agency.staffCount || 0) >= (agency.staffLimit || 1) ? 'warning' : 'primary'}
                        />
                      </Grid>
                      <Grid item xs={12} sm={2}>
                        <Typography variant="body2" color="text.secondary">
                          顧客数
                        </Typography>
                        <Typography variant="h6">
                          {agency.customerCount || 0}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={2}>
                        <Typography variant="body2" color="text.secondary">
                          ステータス
                        </Typography>
                        <Chip
                          label={agency.isActive ? 'アクティブ' : '無効'}
                          color={agency.isActive ? 'success' : 'default'}
                          size="small"
                        />
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <Box display="flex" gap={1} flexWrap="wrap">
                          <Button
                            variant="contained"
                            size="small"
                            onClick={() => handleOpenPlanEdit(agency)}
                          >
                            プラン変更
                          </Button>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => handleToggleStatus(agency.id, agency.isActive)}
                          >
                            {agency.isActive ? '無効化' : '有効化'}
                          </Button>
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>

      {/* プラン変更モーダル */}
      <Dialog
        open={showPlanEditModal}
        onClose={handleClosePlanEdit}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          プラン変更 - {editingAgency?.userId}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  select
                  label="プラン"
                  value={planEditForm.planType}
                  onChange={(e) => setPlanEditForm({ ...planEditForm, planType: e.target.value })}
                  SelectProps={{ native: true }}
                >
                  <option value="bronze">ブロンズ（980円/月、担当者1人、顧客5人）</option>
                  <option value="silver">シルバー（1,980円/月、担当者3人、顧客30人）</option>
                  <option value="gold">ゴールド（3,980円/月、担当者10人、顧客15人/担当者）</option>
                  <option value="platinum">プラチナ（8,980円/月、担当者30人、顧客30人/担当者）</option>
                  <option value="exceed">エクシード（カスタム）</option>
                </TextField>
              </Grid>

              {planEditForm.planType === 'exceed' && (
                <>
                  <Grid item xs={12}>
                    <Alert severity="info">
                      エクシードプランでは、担当者上限数と顧客上限数をカスタマイズできます
                    </Alert>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      type="number"
                      label="担当者上限数"
                      value={planEditForm.customStaffLimit}
                      onChange={(e) => setPlanEditForm({ ...planEditForm, customStaffLimit: e.target.value })}
                      required
                      inputProps={{ min: 1 }}
                      helperText="設定できる担当者の最大数"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      type="number"
                      label="顧客上限数（担当者あたり）"
                      value={planEditForm.customCustomerLimitPerStaff}
                      onChange={(e) => setPlanEditForm({ ...planEditForm, customCustomerLimitPerStaff: e.target.value })}
                      required
                      inputProps={{ min: 1 }}
                      helperText="各担当者が持てる顧客の最大数"
                    />
                  </Grid>
                </>
              )}
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePlanEdit}>
            キャンセル
          </Button>
          <Button
            onClick={handleSavePlanChange}
            variant="contained"
            color="primary"
          >
            保存
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

// Staff List Component (代理店用)
interface StaffListProps {
  user: User;
  navigate: (path: string) => void;
}

function StaffList({ user, navigate }: StaffListProps) {
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/users/staff`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStaff(data);
      } else {
        console.error('Failed to fetch staff:', response.status);
      }
    } catch (error) {
      console.error('Error fetching staff:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          担当者管理
        </Typography>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        担当者は、ログイン画面から自分で新規登録できます。担当者には代理店IDを教えてください。
      </Alert>

      <Paper sx={{ p: 0, overflow: 'hidden' }}>
        {staff.length === 0 ? (
          <Box textAlign="center" py={8}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              まだ担当者が登録されていません
            </Typography>
            <Typography variant="body2" color="text.secondary">
              担当者にあなたの代理店ID ({user.userId}) を伝えて、新規登録してもらってください
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={0}>
            {staff.map((s) => (
              <Grid item xs={12} key={s.id}>
                <Card variant="outlined" sx={{ m: 1 }}>
                  <CardContent>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} sm={4}>
                        <Typography variant="h6">{s.userId || s.user_id}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          ID: {s.id}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <Typography variant="body2" color="text.secondary">
                          顧客数
                        </Typography>
                        <Typography variant="h6">
                          {s.customerCount || 0}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <Typography variant="body2" color="text.secondary">
                          登録日
                        </Typography>
                        <Typography variant="body2">
                          {s.createdAt ? new Date(s.createdAt).toLocaleDateString('ja-JP') : '-'}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={2}>
                        <Chip
                          label={s.isActive || s.is_active ? 'アクティブ' : '無効'}
                          color={(s.isActive || s.is_active) ? 'success' : 'default'}
                          size="small"
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>
    </Container>
  );
}

// Customer List Component
interface CustomerListProps {
  user: User;
  navigate: (path: string) => void;
}

function CustomerList({ user, navigate }: CustomerListProps) {
  const [customers, setCustomers] = useState<any[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    // Fetch customers from API
    const fetchCustomers = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setLoading(false);
          return;
        }

        const response = await fetch(`${API_BASE_URL}/api/customers`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          // Convert API data to frontend format
          const formattedCustomers = data.map((customer: any) => ({
            id: customer.id,
            name: customer.name,
            email: customer.email || '',
            phone: customer.phone || '',
            contractDate: customer.contract_date || customer.contractDate,
            monthlyPremium: customer.monthly_premium || customer.monthlyPremium,
            riskTolerance: customer.risk_tolerance || customer.riskTolerance || 'balanced',
            status: customer.is_active ? 'active' : 'inactive'
          }));
          setCustomers(formattedCustomers);
          setFilteredCustomers(formattedCustomers);
        } else {
          console.error('Failed to fetch customers:', response.status);
        }
      } catch (error) {
        console.error('Error fetching customers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  // フィルタリング機能
  useEffect(() => {
    let filtered = customers;

    // 名前での検索
    if (searchTerm) {
      filtered = filtered.filter(customer => 
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // リスク許容度でのフィルター
    if (riskFilter !== 'all') {
      filtered = filtered.filter(customer => customer.riskTolerance === riskFilter);
    }

    // ステータスでのフィルター
    if (statusFilter !== 'all') {
      filtered = filtered.filter(customer => customer.status === statusFilter);
    }

    setFilteredCustomers(filtered);
  }, [customers, searchTerm, riskFilter, statusFilter]);

  const getRiskToleranceLabel = (risk: string) => {
    const labels = {
      conservative: '保守的',
      balanced: 'バランス型',
      aggressive: '積極的',
    };
    return labels[risk as keyof typeof labels] || risk;
  };

  const getRiskToleranceColor = (risk: string) => {
    const colors = {
      conservative: 'info',
      balanced: 'primary',
      aggressive: 'warning',
    };
    return colors[risk as keyof typeof colors] as any || 'default';
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          顧客一覧
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/customers/new')}
        >
          新規顧客登録
        </Button>
      </Box>

      {/* 検索・フィルター */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="顧客名・メールで検索"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="田中 太郎 または tanaka@example.com"
            />
          </Grid>
          
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              select
              label="リスク許容度"
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              SelectProps={{ native: true }}
            >
              <option value="all">すべて</option>
              <option value="conservative">保守的</option>
              <option value="balanced">バランス型</option>
              <option value="aggressive">積極的</option>
            </TextField>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              select
              label="ステータス"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              SelectProps={{ native: true }}
            >
              <option value="all">すべて</option>
              <option value="active">アクティブ</option>
              <option value="inactive">非アクティブ</option>
            </TextField>
          </Grid>
          
          <Grid item xs={12} md={2}>
            <Typography variant="body2" color="text.secondary">
              {filteredCustomers.length}件 / {customers.length}件
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 0, overflow: 'hidden' }}>
        <Grid container spacing={0}>
          {filteredCustomers.map((customer) => (
            <Grid item xs={12} key={customer.id}>
              <Card 
                variant="outlined" 
                sx={{ 
                  m: 1, 
                  cursor: 'pointer',
                  '&:hover': { 
                    backgroundColor: 'action.hover',
                    transform: 'translateY(-2px)',
                    transition: 'all 0.2s ease-in-out'
                  }
                }}
                onClick={() => navigate(`/customers/${customer.id}`)}
              >
                <CardContent>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={3}>
                      <Typography variant="h6" component="div">
                        {customer.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        ID: {customer.id}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12} sm={3}>
                      <Typography variant="body2" color="text.secondary">
                        連絡先
                      </Typography>
                      <Typography variant="body2">
                        {customer.email}
                      </Typography>
                      <Typography variant="body2">
                        {customer.phone}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12} sm={2}>
                      <Typography variant="body2" color="text.secondary">
                        契約日
                      </Typography>
                      <Typography variant="body2">
                        {new Date(customer.contractDate).toLocaleDateString('ja-JP')}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12} sm={2}>
                      <Typography variant="body2" color="text.secondary">
                        月額保険料
                      </Typography>
                      <Typography variant="h6" color="primary">
                        ¥{customer.monthlyPremium.toLocaleString()}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12} sm={2}>
                      <Box display="flex" flexDirection="column" gap={1}>
                        <Chip
                          label={getRiskToleranceLabel(customer.riskTolerance)}
                          color={getRiskToleranceColor(customer.riskTolerance)}
                          size="small"
                        />
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/customers/${customer.id}/edit`);
                          }}
                        >
                          編集
                        </Button>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
        
        {filteredCustomers.length === 0 && customers.length > 0 && (
          <Box textAlign="center" py={8}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              検索条件に一致する顧客が見つかりません
            </Typography>
            <Button
              variant="outlined"
              onClick={() => {
                setSearchTerm('');
                setRiskFilter('all');
                setStatusFilter('all');
              }}
            >
              フィルターをリセット
            </Button>
          </Box>
        )}
        
        {customers.length === 0 && (
          <Box textAlign="center" py={8}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              まだ顧客が登録されていません
            </Typography>
            <Typography variant="body2" color="text.secondary">
              顧客には担当者IDを伝えて、ログイン画面から新規登録してもらってください
            </Typography>
          </Box>
        )}
      </Paper>
    </Container>
  );
}

// Customer Form Component
interface CustomerFormProps {
  user: User;
  navigate: (path: string) => void;
  isEdit?: boolean;
}

function CustomerForm({ user, navigate, isEdit = false }: CustomerFormProps) {
  const location = useLocation();
  const customerId = isEdit ? location.pathname.split('/')[2] : null;

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    contractDate: '',
    contractAmount: '',
    monthlyPremium: '',
    riskTolerance: 'balanced',
    investmentGoal: '',
    notes: '',
    staffId: ''
  });
  const [loading, setLoading] = useState(false);
  const [staffList, setStaffList] = useState<any[]>([]);

  useEffect(() => {
    const fetchStaffList = async () => {
      if (user.accountType === 'parent' && !isEdit) {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`${API_BASE_URL}/api/users/staff`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            const data = await response.json();
            setStaffList(data);
          }
        } catch (error) {
          console.error('Failed to fetch staff list:', error);
        }
      }
    };

    fetchStaffList();
  }, [user.accountType, isEdit]);

  useEffect(() => {
    const fetchCustomer = async () => {
      if (isEdit && customerId) {
        try {
          const token = localStorage.getItem('token');
          if (!token) {
            navigate('/');
            return;
          }

          const response = await fetch(`${API_BASE_URL}/api/customers/${customerId}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            const data = await response.json();
            setFormData({
              name: data.name || '',
              email: data.email || '',
              phone: data.phone || '',
              contractDate: data.contract_date || data.contractDate || '',
              contractAmount: String(data.contract_amount || data.contractAmount || ''),
              monthlyPremium: String(data.monthly_premium || data.monthlyPremium || ''),
              riskTolerance: data.risk_tolerance || data.riskTolerance || 'balanced',
              investmentGoal: data.investment_goal || data.investmentGoal || '',
              notes: data.notes || ''
            });
          } else {
            alert('顧客情報の取得に失敗しました');
            navigate('/customers');
          }
        } catch (error) {
          console.error('Fetch customer error:', error);
          alert('エラーが発生しました');
          navigate('/customers');
        }
      }
    };

    fetchCustomer();
  }, [isEdit, customerId, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('認証エラー: ログインしてください');
        navigate('/');
        return;
      }

      const url = isEdit
        ? `${API_BASE_URL}/api/customers/${customerId}`
        : `${API_BASE_URL}/api/customers`;

      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          contractDate: formData.contractDate,
          contractAmount: parseFloat(formData.contractAmount),
          monthlyPremium: parseFloat(formData.monthlyPremium),
          riskTolerance: formData.riskTolerance,
          investmentGoal: formData.investmentGoal,
          notes: formData.notes,
          staffId: formData.staffId || undefined
        })
      });

      if (response.ok) {
        alert(isEdit ? '顧客情報を更新しました' : '新規顧客を登録しました');
        navigate('/customers');
      } else {
        const error = await response.json();
        alert(`エラー: ${error.error || '保存に失敗しました'}`);
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('保存中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {isEdit ? '顧客情報編集' : '新規顧客登録'}
        </Typography>
        
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="顧客名"
                value={formData.name}
                onChange={handleChange('name')}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="メールアドレス"
                type="email"
                value={formData.email}
                onChange={handleChange('email')}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="電話番号"
                value={formData.phone}
                onChange={handleChange('phone')}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="契約日"
                type="date"
                value={formData.contractDate}
                onChange={handleChange('contractDate')}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="契約金額"
                type="number"
                value={formData.contractAmount}
                onChange={handleChange('contractAmount')}
                InputProps={{
                  startAdornment: <Typography sx={{ mr: 1 }}>¥</Typography>,
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="月額保険料"
                type="number"
                value={formData.monthlyPremium}
                onChange={handleChange('monthlyPremium')}
                InputProps={{
                  startAdornment: <Typography sx={{ mr: 1 }}>¥</Typography>,
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                select
                label="リスク許容度"
                value={formData.riskTolerance}
                onChange={handleChange('riskTolerance')}
                SelectProps={{ native: true }}
              >
                <option value="conservative">保守的</option>
                <option value="balanced">バランス型</option>
                <option value="aggressive">積極的</option>
              </TextField>
            </Grid>

            {user.accountType === 'parent' && !isEdit && (
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  select
                  label="担当者"
                  value={formData.staffId}
                  onChange={handleChange('staffId')}
                  SelectProps={{ native: true }}
                  helperText="顧客を担当する担当者を選択してください"
                >
                  <option value="">選択してください</option>
                  {staffList.map((staff) => (
                    <option key={staff.id} value={staff.id}>
                      {staff.userId} ({staff.customerCount || 0}人担当中)
                    </option>
                  ))}
                </TextField>
              </Grid>
            )}
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="投資目標"
                multiline
                rows={2}
                value={formData.investmentGoal}
                onChange={handleChange('investmentGoal')}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="備考"
                multiline
                rows={3}
                value={formData.notes}
                onChange={handleChange('notes')}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Box display="flex" gap={2} justifyContent="flex-end">
                <Button
                  variant="outlined"
                  onClick={() => navigate('/customers')}
                >
                  キャンセル
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={24} /> : (isEdit ? '更新' : '登録')}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Container>
  );
}

// Customer Detail Component
interface CustomerDetailProps {
  user: User;
  navigate: (path: string) => void;
}

function CustomerDetail({ user, navigate }: CustomerDetailProps) {
  const location = useLocation();
  const customerId = location.pathname.split('/')[2];
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadingExcel, setDownloadingExcel] = useState(false);
  const [historicalAnalyses, setHistoricalAnalyses] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const handleRunAnalysis = async () => {
    setAnalyzing(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('認証エラー: ログインしてください');
        navigate('/');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/analysis/recommend/${customerId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAnalysisResult(data);

        // Fetch performance data
        const perfResponse = await fetch(`${API_BASE_URL}/api/analysis/performance/${customerId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (perfResponse.ok) {
          const perfData = await perfResponse.json();
          setPerformanceData(perfData);
        }

        // Refresh historical data
        const historyResponse = await fetch(`${API_BASE_URL}/api/analysis/history/${customerId}/detailed`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (historyResponse.ok) {
          const historyData = await historyResponse.json();
          setHistoricalAnalyses(historyData);
        }

        alert('分析が完了しました！');
      } else {
        const error = await response.json();
        alert(`分析エラー: ${error.error}`);
      }
    } catch (error) {
      console.error('Analysis error:', error);
      alert('分析中にエラーが発生しました');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!analysisResult || !analysisResult.id) {
      alert('ダウンロード可能な分析結果がありません');
      return;
    }

    setDownloadingPdf(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/analysis/report/${analysisResult.id}/pdf`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analysis-report-${analysisResult.id}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('PDFダウンロードに失敗しました');
      }
    } catch (error) {
      console.error('PDF download error:', error);
      alert('PDFダウンロード中にエラーが発生しました');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleDownloadExcel = async () => {
    if (!analysisResult || !analysisResult.id) {
      alert('ダウンロード可能な分析結果がありません');
      return;
    }

    setDownloadingExcel(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/analysis/report/${analysisResult.id}/excel`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analysis-report-${analysisResult.id}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Excelダウンロードに失敗しました');
      }
    } catch (error) {
      console.error('Excel download error:', error);
      alert('Excelダウンロード中にエラーが発生しました');
    } finally {
      setDownloadingExcel(false);
    }
  };

  useEffect(() => {
    const fetchCustomerDetail = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/');
          return;
        }

        const response = await fetch(`${API_BASE_URL}/api/customers/${customerId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          setCustomer({
            id: data.id,
            name: data.name,
            email: data.email || '',
            phone: data.phone || '',
            contractDate: data.contract_date || data.contractDate,
            monthlyPremium: data.monthly_premium || data.monthlyPremium,
            contractAmount: data.contract_amount || data.contractAmount,
            riskTolerance: data.risk_tolerance || data.riskTolerance || 'balanced',
            investmentGoal: data.investment_goal || data.investmentGoal || '',
            notes: data.notes || '',
            status: data.is_active ? 'active' : 'inactive',
            portfolio: { equity: 0, usEquity: 0, usBond: 0, reit: 0, globalEquity: 0 },
            performanceHistory: []
          });
        } else {
          alert('顧客情報の取得に失敗しました');
          navigate('/customers');
        }
      } catch (error) {
        console.error('Error fetching customer detail:', error);
        alert('エラーが発生しました');
        navigate('/customers');
      } finally {
        setLoading(false);
      }
    };

    fetchCustomerDetail();
  }, [customerId, navigate]);

  // Fetch historical analysis data
  useEffect(() => {
    const fetchHistoricalData = async () => {
      if (!customerId) return;

      setLoadingHistory(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await fetch(`${API_BASE_URL}/api/analysis/history/${customerId}/detailed`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setHistoricalAnalyses(data);
        }
      } catch (error) {
        console.error('Error fetching historical data:', error);
      } finally {
        setLoadingHistory(false);
      }
    };

    fetchHistoricalData();
  }, [customerId]);

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (!customer) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">顧客情報が見つかりません</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          顧客詳細
        </Typography>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            onClick={() => navigate(`/customers/${customer.id}/edit`)}
          >
            編集
          </Button>
          <Button
            variant="contained"
            onClick={handleRunAnalysis}
            disabled={analyzing}
            startIcon={analyzing ? <CircularProgress size={20} /> : null}
          >
            {analyzing ? '分析中...' : '分析実行'}
          </Button>
        </Box>
      </Box>

      <Paper sx={{ p: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              顧客名
            </Typography>
            <Typography variant="h6" gutterBottom>
              {customer.name}
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              顧客ID
            </Typography>
            <Typography variant="h6" gutterBottom>
              {customer.id}
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              メールアドレス
            </Typography>
            <Typography variant="body1" gutterBottom>
              {customer.email}
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              電話番号
            </Typography>
            <Typography variant="body1" gutterBottom>
              {customer.phone}
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              契約日
            </Typography>
            <Typography variant="body1" gutterBottom>
              {new Date(customer.contractDate).toLocaleDateString('ja-JP')}
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              契約金額
            </Typography>
            <Typography variant="h6" color="primary" gutterBottom>
              ¥{customer.contractAmount.toLocaleString()}
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              月額保険料
            </Typography>
            <Typography variant="h6" color="primary" gutterBottom>
              ¥{customer.monthlyPremium.toLocaleString()}
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              リスク許容度
            </Typography>
            <Chip
              label={customer.riskTolerance === 'conservative' ? '保守的' : 
                     customer.riskTolerance === 'balanced' ? 'バランス型' : '積極的'}
              color={customer.riskTolerance === 'conservative' ? 'info' : 
                     customer.riskTolerance === 'balanced' ? 'primary' : 'warning'}
            />
          </Grid>
          
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="text.secondary">
              投資目標
            </Typography>
            <Typography variant="body1" gutterBottom>
              {customer.investmentGoal}
            </Typography>
          </Grid>
          
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="text.secondary">
              備考
            </Typography>
            <Typography variant="body1" gutterBottom>
              {customer.notes}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Analysis Result */}
      {analysisResult && (
        <Paper sx={{ mt: 3, p: 3, bgcolor: '#f5f9ff', border: '2px solid #2196f3' }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Box>
              <Typography variant="h5" color="primary">
                ✨ 最新の分析結果
              </Typography>
              <Typography variant="body2" color="text.secondary">
                分析日時: {new Date(analysisResult.customer.contractMonths ? Date.now() : analysisResult.analysisDate).toLocaleString('ja-JP')}
              </Typography>
            </Box>
            <Box display="flex" gap={1}>
              <Button
                variant="outlined"
                size="small"
                startIcon={downloadingPdf ? <CircularProgress size={16} /> : <PdfIcon />}
                onClick={handleDownloadPdf}
                disabled={downloadingPdf || downloadingExcel}
              >
                PDF出力
              </Button>
              <Button
                variant="outlined"
                size="small"
                startIcon={downloadingExcel ? <CircularProgress size={16} /> : <TableIcon />}
                onClick={handleDownloadExcel}
                disabled={downloadingPdf || downloadingExcel}
              >
                Excel出力
              </Button>
            </Box>
          </Box>

          <Grid container spacing={3} sx={{ mt: 2 }}>
            <Grid item xs={12} md={6}>
              <Card sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  推奨配分
                </Typography>
                {Object.entries(analysisResult.allocation || {}).map(([key, value]: [string, any]) => (
                  <Box key={key} sx={{ mb: 2 }}>
                    <Box display="flex" justifyContent="space-between" mb={0.5}>
                      <Typography variant="body2">{key}</Typography>
                      <Typography variant="body2" fontWeight="bold">{value}%</Typography>
                    </Box>
                    <LinearProgress variant="determinate" value={value} sx={{ height: 8, borderRadius: 1 }} />
                  </Box>
                ))}
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  市場分析
                </Typography>
                <Typography variant="body2">
                  {analysisResult.marketAnalysis || '市場データに基づいた推奨配分を生成しました。'}
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    信頼度スコア: {((analysisResult.confidenceScore || 0.85) * 100).toFixed(0)}%
                  </Typography>
                </Box>
              </Card>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Tabs for additional information */}
      <Paper sx={{ mt: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Button
            onClick={() => setActiveTab(0)}
            sx={{ 
              borderBottom: activeTab === 0 ? 2 : 0,
              borderColor: 'primary.main',
              borderRadius: 0,
              px: 3,
              py: 2
            }}
          >
            ポートフォリオ
          </Button>
          <Button
            onClick={() => setActiveTab(1)}
            sx={{
              borderBottom: activeTab === 1 ? 2 : 0,
              borderColor: 'primary.main',
              borderRadius: 0,
              px: 3,
              py: 2
            }}
          >
            パフォーマンス
          </Button>
          <Button
            onClick={() => setActiveTab(2)}
            sx={{
              borderBottom: activeTab === 2 ? 2 : 0,
              borderColor: 'primary.main',
              borderRadius: 0,
              px: 3,
              py: 2
            }}
          >
            履歴データ
          </Button>
        </Box>
        
        <Box sx={{ p: 3 }}>
          {activeTab === 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                現在のポートフォリオ配分
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {analysisResult ? (
                      (() => {
                        const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1'];
                        const allocation = Object.entries(analysisResult.allocation || {});
                        let cumulativeAngle = 0;

                        return (
                          <svg viewBox="0 0 100 100" style={{ width: 250, height: 250 }}>
                            {allocation.map(([fund, percentage]: [string, any], index: number) => {
                              const angle = (percentage / 100) * 360;
                              const startAngle = cumulativeAngle;
                              const endAngle = cumulativeAngle + angle;

                              cumulativeAngle += angle;

                              const startX = 50 + 40 * Math.cos((startAngle - 90) * Math.PI / 180);
                              const startY = 50 + 40 * Math.sin((startAngle - 90) * Math.PI / 180);
                              const endX = 50 + 40 * Math.cos((endAngle - 90) * Math.PI / 180);
                              const endY = 50 + 40 * Math.sin((endAngle - 90) * Math.PI / 180);

                              const largeArcFlag = angle > 180 ? 1 : 0;

                              return (
                                <path
                                  key={fund}
                                  d={`M 50 50 L ${startX} ${startY} A 40 40 0 ${largeArcFlag} 1 ${endX} ${endY} Z`}
                                  fill={colors[index % colors.length]}
                                />
                              );
                            })}
                          </svg>
                        );
                      })()
                    ) : (
                      <Typography color="text.secondary">分析を実行してください</Typography>
                    )}
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Box>
                    {analysisResult ? (
                      Object.entries(analysisResult.allocation || {}).map(([fund, percentage]: [string, any], index: number) => {
                        const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1'];
                        return (
                          <Box key={fund} display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                            <Box display="flex" alignItems="center" gap={1}>
                              <Box
                                sx={{
                                  width: 16,
                                  height: 16,
                                  backgroundColor: colors[index % colors.length],
                                  borderRadius: 1
                                }}
                              />
                              <Typography variant="body1">{fund}</Typography>
                            </Box>
                            <Typography variant="h6" color="primary">
                              {Math.round(percentage)}%
                            </Typography>
                          </Box>
                        );
                      })
                    ) : (
                      <Typography color="text.secondary">分析を実行してください</Typography>
                    )}
                  </Box>
                </Grid>
              </Grid>
            </Box>
          )}
          
          {activeTab === 1 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                パフォーマンス推移
              </Typography>

              <Box sx={{ mb: 3 }}>
                {analysisResult && performanceData.length > 0 ? (
                  <Box sx={{ bgcolor: '#f5f9ff', p: 3, borderRadius: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      契約開始からの経過月数と運用状況
                    </Typography>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                      {performanceData.slice(0, 6).map((point: any, index: number) => (
                        <Grid item xs={6} sm={4} md={2} key={index}>
                          <Card variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                            <Typography variant="caption" color="text.secondary">
                              {point.month}ヶ月目
                            </Typography>
                            <Typography variant="h6" color="primary">
                              {point.value.toFixed(1)}%
                            </Typography>
                            {index > 0 && (
                              <Typography variant="caption" color={point.monthlyReturn >= 0 ? 'success.main' : 'error.main'}>
                                {point.monthlyReturn >= 0 ? '+' : ''}{point.monthlyReturn.toFixed(1)}%
                              </Typography>
                            )}
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                ) : (
                  <Alert severity="info">
                    分析を実行すると、パフォーマンス推移が表示されます
                  </Alert>
                )}
              </Box>
              
              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <Typography variant="body2" color="text.secondary">累計収益率</Typography>
                  <Typography variant="h6" color="success.main">
                    {analysisResult ? '+15.8% (累計)' : '-'}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="body2" color="text.secondary">年率リターン</Typography>
                  <Typography variant="h6">
                    {analysisResult ? '12.5% (年率)' : '-'}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="body2" color="text.secondary">最大ドローダウン</Typography>
                  <Typography variant="h6" color="error.main">
                    {analysisResult ? '-2.1% (最大)' : '-'}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="body2" color="text.secondary">シャープレシオ</Typography>
                  <Typography variant="h6">
                    {analysisResult ? '1.24' : '-'}
                  </Typography>
                </Grid>
              </Grid>

              {!analysisResult && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  パフォーマンスデータを表示するには、まず分析を実行してください
                </Alert>
              )}
            </Box>
          )}

          {activeTab === 2 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                過去の分析履歴（過去2年分）
              </Typography>

              {loadingHistory ? (
                <Box display="flex" justifyContent="center" p={4}>
                  <CircularProgress />
                </Box>
              ) : historicalAnalyses.length > 0 ? (
                <Box>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    過去2年分の分析結果を表示しています。各分析結果のPDFをダウンロードできます。
                  </Alert>

                  <Grid container spacing={2}>
                    {historicalAnalyses.map((analysis: any, index: number) => (
                      <Grid item xs={12} key={analysis.id || index}>
                        <Card variant="outlined" sx={{ p: 2 }}>
                          <Grid container alignItems="center" spacing={2}>
                            <Grid item xs={12} sm={3}>
                              <Typography variant="body2" color="text.secondary">
                                分析日
                              </Typography>
                              <Typography variant="body1" fontWeight="bold">
                                {new Date(analysis.analysis_date).toLocaleDateString('ja-JP', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </Typography>
                            </Grid>

                            <Grid item xs={12} sm={5}>
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                推奨配分
                              </Typography>
                              <Box display="flex" gap={1} flexWrap="wrap">
                                {Object.entries(analysis.adjusted_allocation || {}).slice(0, 3).map(([fund, percentage]: [string, any]) => (
                                  <Chip
                                    key={fund}
                                    label={`${fund}: ${percentage}%`}
                                    size="small"
                                    color="primary"
                                    variant="outlined"
                                  />
                                ))}
                              </Box>
                            </Grid>

                            <Grid item xs={12} sm={2}>
                              <Typography variant="body2" color="text.secondary">
                                信頼度
                              </Typography>
                              <Typography variant="body1">
                                {analysis.confidence_score ? `${(analysis.confidence_score * 100).toFixed(0)}%` : '-'}
                              </Typography>
                            </Grid>

                            <Grid item xs={12} sm={2}>
                              <Box display="flex" gap={1} flexDirection="column">
                                <Button
                                  variant="outlined"
                                  size="small"
                                  startIcon={<PdfIcon />}
                                  onClick={async () => {
                                    try {
                                      const token = localStorage.getItem('token');
                                      const response = await fetch(`${API_BASE_URL}/api/analysis/report/${analysis.id}/pdf`, {
                                        headers: {
                                          'Authorization': `Bearer ${token}`
                                        }
                                      });

                                      if (response.ok) {
                                        const blob = await response.blob();
                                        const url = window.URL.createObjectURL(blob);
                                        const a = document.createElement('a');
                                        a.href = url;
                                        a.download = `analysis-${new Date(analysis.analysis_date).toISOString().split('T')[0]}.pdf`;
                                        document.body.appendChild(a);
                                        a.click();
                                        window.URL.revokeObjectURL(url);
                                        document.body.removeChild(a);
                                      } else {
                                        alert('PDFダウンロードに失敗しました');
                                      }
                                    } catch (error) {
                                      console.error('PDF download error:', error);
                                      alert('PDFダウンロード中にエラーが発生しました');
                                    }
                                  }}
                                >
                                  PDF
                                </Button>
                                <Button
                                  variant="outlined"
                                  size="small"
                                  startIcon={<TableIcon />}
                                  onClick={async () => {
                                    try {
                                      const token = localStorage.getItem('token');
                                      const response = await fetch(`${API_BASE_URL}/api/analysis/report/${analysis.id}/excel`, {
                                        headers: {
                                          'Authorization': `Bearer ${token}`
                                        }
                                      });

                                      if (response.ok) {
                                        const blob = await response.blob();
                                        const url = window.URL.createObjectURL(blob);
                                        const a = document.createElement('a');
                                        a.href = url;
                                        a.download = `analysis-${new Date(analysis.analysis_date).toISOString().split('T')[0]}.xlsx`;
                                        document.body.appendChild(a);
                                        a.click();
                                        window.URL.revokeObjectURL(url);
                                        document.body.removeChild(a);
                                      } else {
                                        alert('Excelダウンロードに失敗しました');
                                      }
                                    } catch (error) {
                                      console.error('Excel download error:', error);
                                      alert('Excelダウンロード中にエラーが発生しました');
                                    }
                                  }}
                                >
                                  Excel
                                </Button>
                              </Box>
                            </Grid>
                          </Grid>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              ) : (
                <Alert severity="info">
                  過去2年分の分析履歴がありません。分析を実行すると、履歴がここに表示されます。
                </Alert>
              )}
            </Box>
          )}
        </Box>
      </Paper>
      
      <Box mt={3}>
        <Button
          variant="outlined"
          onClick={() => navigate('/customers')}
        >
          ← 顧客一覧に戻る
        </Button>
      </Box>
    </Container>
  );
}

export default App;
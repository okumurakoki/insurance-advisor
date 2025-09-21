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
  AppBar,
  Toolbar,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  Chip,
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
} from '@mui/icons-material';

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
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
  },
});

interface User {
  id: number;
  userId: string;
  accountType: 'parent' | 'child' | 'grandchild';
  planType: 'standard' | 'master' | 'exceed';
  customerLimit: number;
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
  const [loading, setLoading] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [marketData, setMarketData] = useState<any[]>([]);
  const navigate = useNavigate();
  const location = useLocation();

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

  const handleLogin = async (userId: string, password: string, accountType: string) => {
    setLoading(true);
    
    try {
      // Demo mode - use mock authentication for frontend demo
      if (userId === 'admin' && password === 'password123') {
        const mockUser = {
          id: 1,
          userId: 'admin',
          accountType: 'admin' as const,
          planType: 'exceed' as const,
          customerLimit: 999
        };
        
        localStorage.setItem('token', 'demo-token-' + Date.now());
        localStorage.setItem('user', JSON.stringify(mockUser));
        setUser(mockUser);
        setIsLoggedIn(true);
        fetchMarketData();
        return;
      }
      
      if (userId === 'demo_agency' && password === 'password123') {
        const mockUser = {
          id: 2,
          userId: 'demo_agency',
          accountType: 'parent' as const,
          planType: 'master' as const,
          customerLimit: 50
        };
        
        localStorage.setItem('token', 'demo-token-' + Date.now());
        localStorage.setItem('user', JSON.stringify(mockUser));
        setUser(mockUser);
        setIsLoggedIn(true);
        fetchMarketData();
        return;
      }
      
      if (userId === 'demo_staff' && password === 'password123') {
        const mockUser = {
          id: 3,
          userId: 'demo_staff',
          accountType: 'child' as const,
          planType: 'standard' as const,
          customerLimit: 10
        };
        
        localStorage.setItem('token', 'demo-token-' + Date.now());
        localStorage.setItem('user', JSON.stringify(mockUser));
        setUser(mockUser);
        setIsLoggedIn(true);
        fetchMarketData();
        return;
      }
      
      // For invalid credentials
      alert('ログインに失敗しました: 無効なユーザーIDまたはパスワードです');
    } catch (error) {
      alert('ログインエラー: ' + error);
    }
    setLoading(false);
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

  const getAccountTypeLabel = (type: string) => {
    const labels = {
      parent: '代理店',
      child: '生保担当者',
      grandchild: '顧客',
      admin: '管理者',
    };
    return labels[type as keyof typeof labels] || type;
  };


  if (isLoggedIn && user) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              🏦 変額保険アドバイザリーシステム
            </Typography>
            
            <Button 
              color="inherit" 
              startIcon={<DashboardIcon />}
              onClick={() => navigate('/dashboard')}
              sx={{ backgroundColor: location.pathname === '/dashboard' ? 'rgba(255,255,255,0.1)' : 'transparent' }}
            >
              ダッシュボード
            </Button>
            
            <Button 
              color="inherit" 
              startIcon={<PeopleIcon />}
              onClick={() => navigate('/customers')}
              sx={{ backgroundColor: location.pathname === '/customers' ? 'rgba(255,255,255,0.1)' : 'transparent' }}
            >
              顧客管理
            </Button>
            
            <Button 
              color="inherit" 
              startIcon={<AssessmentIcon />}
              onClick={() => navigate('/products')}
              sx={{ backgroundColor: location.pathname === '/products' ? 'rgba(255,255,255,0.1)' : 'transparent' }}
            >
              ファンド管理
            </Button>
            
            <Button 
              color="inherit" 
              startIcon={<AssessmentIcon />}
              onClick={() => navigate('/reports')}
              sx={{ backgroundColor: location.pathname === '/reports' ? 'rgba(255,255,255,0.1)' : 'transparent' }}
            >
              レポート
            </Button>
            
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
        
        <Routes>
          <Route path="/" element={<Dashboard user={user} marketData={marketData} navigate={navigate} />} />
          <Route path="/dashboard" element={<Dashboard user={user} marketData={marketData} navigate={navigate} />} />
          <Route path="/customers" element={<CustomerList user={user} navigate={navigate} />} />
          <Route path="/customers/new" element={<CustomerForm user={user} navigate={navigate} />} />
          <Route path="/customers/:id" element={<CustomerDetail user={user} navigate={navigate} />} />
          <Route path="/customers/:id/edit" element={<CustomerForm user={user} navigate={navigate} isEdit={true} />} />
          <Route path="/products" element={<ProductList user={user} navigate={navigate} />} />
          <Route path="/products/new" element={<ProductForm user={user} navigate={navigate} />} />
          <Route path="/products/:id" element={<ProductDetail user={user} navigate={navigate} />} />
          <Route path="/products/:id/edit" element={<ProductForm user={user} navigate={navigate} isEdit={true} />} />
          <Route path="/reports" element={<ReportList user={user} navigate={navigate} />} />
          <Route path="/reports/new" element={<ReportForm user={user} navigate={navigate} />} />
          <Route path="/reports/:id" element={<ReportDetail user={user} navigate={navigate} />} />
          <Route path="/portfolio-optimizer" element={<PortfolioOptimizer user={user} navigate={navigate} />} />
        </Routes>
        
        <Box component="footer" sx={{ py: 3, px: 2, mt: 'auto', backgroundColor: 'background.paper' }}>
          <Typography variant="body2" color="text.secondary" align="center">
            © 2024 プルデンシャル生命保険株式会社 - 変額保険アドバイザリーシステム
          </Typography>
        </Box>
      </Box>
    );
  }

  return <LoginPage onLogin={handleLogin} loading={loading} />;
}

// Dashboard Component
interface DashboardProps {
  user: User;
  marketData: any[];
  navigate: (path: string) => void;
}

function Dashboard({ user, marketData, navigate }: DashboardProps) {
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
          <Typography variant="h4" component="h1" gutterBottom>
            ダッシュボード
          </Typography>
          <Typography variant="subtitle1" gutterBottom>
            ようこそ、{user.userId} さん ({getPlanTypeLabel(user.planType)})
          </Typography>
        </Grid>

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
                    5
                  </Typography>
                  <Typography variant="body2" color="success.main">
                    +2 今月
                  </Typography>
                </Box>
                <Person color="primary" sx={{ fontSize: 40 }} />
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
                    分析レポート数
                  </Typography>
                  <Typography variant="h5">
                    3
                  </Typography>
                  <Typography variant="body2" color="primary.main">
                    1件 処理中
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
                    運用資産総額
                  </Typography>
                  <Typography variant="h5">
                    ¥125M
                  </Typography>
                  <Typography variant="body2" color="success.main">
                    +8.2% 先月比
                  </Typography>
                </Box>
                <TrendingUp color="success" sx={{ fontSize: 40 }} />
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
                    平均収益率
                  </Typography>
                  <Typography variant="h5" color="success.main">
                    +6.8%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    年率 (YTD)
                  </Typography>
                </Box>
                <Add color="success" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Fund Performance Analysis */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, mb: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h6">
                📊 プルデンシャル変額保険ファンド分析 (リアルタイム)
              </Typography>
              <Chip label="最終更新: 1分前" color="success" size="small" />
            </Box>
            
            <Grid container spacing={3}>
              {/* 株式型ファンド */}
              <Grid item xs={12} md={4}>
                <Card variant="outlined" sx={{ height: '100%', position: 'relative' }}>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                      <Box>
                        <Typography variant="h6" color="primary">株式型ファンド</Typography>
                        <Typography variant="body2" color="text.secondary">国内株式中心</Typography>
                      </Box>
                      <Chip label="通常" size="small" />
                    </Box>
                    
                    <Typography variant="h4" color="success.main" gutterBottom>
                      +6.8%
                    </Typography>
                    
                    <Grid container spacing={1} sx={{ mb: 2 }}>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">期待収益率</Typography>
                        <Typography variant="body2" fontWeight="bold">6.8%</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">管理手数料</Typography>
                        <Typography variant="body2">1.5%</Typography>
                      </Grid>
                    </Grid>
                    
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="caption" color="text.secondary">投資推奨度</Typography>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Box sx={{ width: '100%', height: 6, backgroundColor: 'grey.300', borderRadius: 1 }}>
                          <Box sx={{ width: '75%', height: '100%', backgroundColor: 'success.main', borderRadius: 1 }} />
                        </Box>
                        <Typography variant="caption">75%</Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* 米国株式型ファンド */}
              <Grid item xs={12} md={4}>
                <Card variant="outlined" sx={{ height: '100%', position: 'relative', border: '2px solid', borderColor: 'success.main' }}>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                      <Box>
                        <Typography variant="h6" color="primary">米国株式型ファンド</Typography>
                        <Typography variant="body2" color="text.secondary">米国株式市場</Typography>
                      </Box>
                      <Chip label="今月の割安" color="success" size="small" />
                    </Box>
                    
                    <Typography variant="h4" color="success.main" gutterBottom>
                      +12.3%
                    </Typography>
                    
                    <Grid container spacing={1} sx={{ mb: 2 }}>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">期待収益率</Typography>
                        <Typography variant="body2" fontWeight="bold">7.5%</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">管理手数料</Typography>
                        <Typography variant="body2">1.8%</Typography>
                      </Grid>
                    </Grid>
                    
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="caption" color="text.secondary">投資推奨度</Typography>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Box sx={{ width: '100%', height: 6, backgroundColor: 'grey.300', borderRadius: 1 }}>
                          <Box sx={{ width: '95%', height: '100%', backgroundColor: 'success.main', borderRadius: 1 }} />
                        </Box>
                        <Typography variant="caption" color="success.main" fontWeight="bold">95%</Typography>
                      </Box>
                    </Box>
                    
                    <Alert severity="success" sx={{ mt: 1, py: 0 }}>
                      <Typography variant="caption">💡 買い時: 市場下落による絶好の投資機会</Typography>
                    </Alert>
                  </CardContent>
                </Card>
              </Grid>

              {/* 米国債券型ファンド */}
              <Grid item xs={12} md={4}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                      <Box>
                        <Typography variant="h6" color="primary">米国債券型ファンド</Typography>
                        <Typography variant="body2" color="text.secondary">米国債券中心</Typography>
                      </Box>
                      <Chip label="安定" color="primary" size="small" />
                    </Box>
                    
                    <Typography variant="h4" color="primary.main" gutterBottom>
                      +3.2%
                    </Typography>
                    
                    <Grid container spacing={1} sx={{ mb: 2 }}>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">期待収益率</Typography>
                        <Typography variant="body2" fontWeight="bold">4.2%</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">管理手数料</Typography>
                        <Typography variant="body2">1.2%</Typography>
                      </Grid>
                    </Grid>
                    
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="caption" color="text.secondary">投資推奨度</Typography>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Box sx={{ width: '100%', height: 6, backgroundColor: 'grey.300', borderRadius: 1 }}>
                          <Box sx={{ width: '60%', height: '100%', backgroundColor: 'primary.main', borderRadius: 1 }} />
                        </Box>
                        <Typography variant="caption">60%</Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* REIT型ファンド */}
              <Grid item xs={12} md={6}>
                <Card variant="outlined" sx={{ border: '2px solid', borderColor: 'error.main' }}>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                      <Box>
                        <Typography variant="h6" color="primary">REIT型ファンド</Typography>
                        <Typography variant="body2" color="text.secondary">不動産投資信託</Typography>
                      </Box>
                      <Chip label="今月の割高" color="error" size="small" />
                    </Box>
                    
                    <Typography variant="h4" color="error.main" gutterBottom>
                      -1.5%
                    </Typography>
                    
                    <Grid container spacing={2}>
                      <Grid item xs={4}>
                        <Typography variant="caption" color="text.secondary">期待収益率</Typography>
                        <Typography variant="body2" fontWeight="bold">5.5%</Typography>
                      </Grid>
                      <Grid item xs={4}>
                        <Typography variant="caption" color="text.secondary">管理手数料</Typography>
                        <Typography variant="body2">1.6%</Typography>
                      </Grid>
                      <Grid item xs={4}>
                        <Typography variant="caption" color="text.secondary">投資推奨度</Typography>
                        <Typography variant="body2" color="error.main" fontWeight="bold">25%</Typography>
                      </Grid>
                    </Grid>
                    
                    <Alert severity="warning" sx={{ mt: 1, py: 0 }}>
                      <Typography variant="caption">⚠️ 様子見: 不動産市場の調整局面</Typography>
                    </Alert>
                  </CardContent>
                </Card>
              </Grid>

              {/* 世界株式型ファンド */}
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                      <Box>
                        <Typography variant="h6" color="primary">世界株式型ファンド</Typography>
                        <Typography variant="body2" color="text.secondary">世界株式分散</Typography>
                      </Box>
                      <Chip label="好調" color="success" size="small" />
                    </Box>
                    
                    <Typography variant="h4" color="success.main" gutterBottom>
                      +8.7%
                    </Typography>
                    
                    <Grid container spacing={2}>
                      <Grid item xs={4}>
                        <Typography variant="caption" color="text.secondary">期待収益率</Typography>
                        <Typography variant="body2" fontWeight="bold">7.2%</Typography>
                      </Grid>
                      <Grid item xs={4}>
                        <Typography variant="caption" color="text.secondary">管理手数料</Typography>
                        <Typography variant="body2">2.0%</Typography>
                      </Grid>
                      <Grid item xs={4}>
                        <Typography variant="caption" color="text.secondary">投資推奨度</Typography>
                        <Typography variant="body2" color="success.main" fontWeight="bold">85%</Typography>
                      </Grid>
                    </Grid>
                    
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="caption" color="text.secondary">地域別構成</Typography>
                      <Typography variant="body2">米国45% | 欧州25% | アジア20% | その他10%</Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Market Summary */}
            <Box sx={{ mt: 3, p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                📈 市場サマリー & 投資アドバイス
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <Typography variant="body2" color="success.main" fontWeight="bold">
                    💡 買い推奨: 米国株式型
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    市場調整により絶好の買い場。長期投資に最適。
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="body2" color="primary.main" fontWeight="bold">
                    📊 安定運用: 米国債券型
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    金利上昇局面でも安定したパフォーマンス。
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="body2" color="error.main" fontWeight="bold">
                    ⚠️ 様子見: REIT型
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    不動産市場の不透明感により一時的な調整が必要。
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          </Paper>
        </Grid>

        {/* Portfolio Analysis Summary */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              📊 ポートフォリオ分析サマリー
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  リスク分析完了
                </Typography>
                <Typography variant="h6" color="primary">
                  2件
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  最適化実行
                </Typography>
                <Typography variant="h6" color="secondary">
                  1件
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  平均推奨配分: 米国債券型35% | 株式型30% | 米国株式型20%
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Fund Performance Summary */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              🎯 ファンドパフォーマンス
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="body2">米国株式型 (割安)</Typography>
                  <Typography variant="body2" color="success.main">+12.3%</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="body2">世界株式型</Typography>
                  <Typography variant="body2" color="success.main">+8.7%</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="body2">株式型</Typography>
                  <Typography variant="body2" color="success.main">+6.8%</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="body2">米国債券型</Typography>
                  <Typography variant="body2" color="primary.main">+3.2%</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2">REIT型 (割高)</Typography>
                  <Typography variant="body2" color="error.main">-1.5%</Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Recent Activities */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              📋 最近のアクティビティ
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <Card variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle2" color="primary">
                    新規顧客登録
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    高橋美咲様が登録されました
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    2時間前
                  </Typography>
                </Card>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Card variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle2" color="secondary">
                    レポート完了
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    佐藤花子様のポートフォリオ最適化
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    5時間前
                  </Typography>
                </Card>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Card variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle2" color="warning.main">
                    市場更新
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    米国株式型ファンドが割安状態に
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    1日前
                  </Typography>
                </Card>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Action Buttons */}
        <Grid item xs={12}>
          <Box display="flex" gap={2} flexWrap="wrap">
            <Button 
              variant="contained" 
              startIcon={<Add />}
              onClick={() => navigate('/customers/new')}
            >
              新規顧客登録
            </Button>
            <Button 
              variant="outlined"
              onClick={() => navigate('/customers')}
            >
              顧客一覧
            </Button>
            <Button 
              variant="outlined"
              onClick={() => navigate('/products')}
            >
              ファンド管理
            </Button>
            <Button 
              variant="outlined"
              onClick={() => navigate('/reports')}
            >
              分析レポート
            </Button>
            <Button 
              variant="outlined"
              onClick={() => navigate('/reports/new')}
            >
              新規分析実行
            </Button>
            <Button 
              variant="outlined"
              color="secondary"
              onClick={() => navigate('/portfolio-optimizer')}
              startIcon={<TrendingUp />}
            >
              ポートフォリオ最適化
            </Button>
          </Box>
        </Grid>

        {/* Welcome Message */}
        <Grid item xs={12}>
          <Alert severity="success">
            🎉 プルデンシャル生命変額保険最適化システムへようこそ！
            AI搭載の分析機能で最適な投資戦略をご提案します。
          </Alert>
        </Grid>
      </Grid>
    </Container>
  );
}

interface LoginPageProps {
  onLogin: (userId: string, password: string, accountType: string) => void;
  loading: boolean;
}

function LoginPage({ onLogin, loading }: LoginPageProps) {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [accountType, setAccountType] = useState('child');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(userId, password, accountType);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Arial, sans-serif'
      }}
    >
      <Paper
        elevation={10}
        sx={{
          padding: 4,
          borderRadius: 2,
          width: 400,
          maxWidth: '90vw'
        }}
      >
        <Typography variant="h4" component="h1" align="center" gutterBottom>
          🏦 変額保険アドバイザリー
        </Typography>
        
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
          <TextField
            select
            fullWidth
            label="アカウント種別"
            value={accountType}
            onChange={(e) => setAccountType(e.target.value)}
            margin="normal"
            SelectProps={{
              native: true,
            }}
          >
            <option value="parent">代理店 (Parent)</option>
            <option value="child">生保担当者 (Child)</option>
            <option value="grandchild">顧客 (Grandchild)</option>
          </TextField>

          <TextField
            fullWidth
            label="ユーザーID"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            margin="normal"
            required
          />

          <TextField
            fullWidth
            label="パスワード"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            margin="normal"
            required
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={loading}
            sx={{ mt: 3, mb: 2 }}
          >
            {loading ? <CircularProgress size={24} /> : 'ログイン'}
          </Button>
        </Box>

        <Paper sx={{ p: 2, mt: 3, backgroundColor: 'grey.100' }}>
          <Typography variant="h6" gutterBottom>
            デモアカウント
          </Typography>
          <Typography variant="body2">
            <strong>代理店:</strong> demo_agency / password123<br />
            <strong>担当者:</strong> demo_staff / password123<br />
            <strong>管理者:</strong> admin / password123
          </Typography>
        </Paper>
      </Paper>
    </Box>
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
    // Mock customer data
    const mockCustomers = [
      {
        id: 1,
        name: '田中 太郎',
        email: 'tanaka@example.com',
        phone: '090-1234-5678',
        contractDate: '2023-01-15',
        monthlyPremium: 25000,
        riskTolerance: 'balanced',
        status: 'active'
      },
      {
        id: 2,
        name: '佐藤 花子',
        email: 'sato@example.com',
        phone: '090-2345-6789',
        contractDate: '2023-03-20',
        monthlyPremium: 18000,
        riskTolerance: 'conservative',
        status: 'active'
      },
      {
        id: 3,
        name: '山田 次郎',
        email: 'yamada@example.com',
        phone: '090-3456-7890',
        contractDate: '2023-05-10',
        monthlyPremium: 35000,
        riskTolerance: 'aggressive',
        status: 'active'
      },
      {
        id: 4,
        name: '鈴木 一郎',
        email: 'suzuki@example.com',
        phone: '090-4567-8901',
        contractDate: '2023-02-28',
        monthlyPremium: 22000,
        riskTolerance: 'conservative',
        status: 'active'
      },
      {
        id: 5,
        name: '高橋 美咲',
        email: 'takahashi@example.com',
        phone: '090-5678-9012',
        contractDate: '2023-04-15',
        monthlyPremium: 28000,
        riskTolerance: 'balanced',
        status: 'inactive'
      }
    ];
    
    setTimeout(() => {
      setCustomers(mockCustomers);
      setFilteredCustomers(mockCustomers);
      setLoading(false);
    }, 500);
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
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => navigate('/customers/new')}
            >
              最初の顧客を登録
            </Button>
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
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    contractDate: '',
    monthlyPremium: '',
    riskTolerance: 'balanced',
    investmentGoal: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Mock save operation
    setTimeout(() => {
      setLoading(false);
      alert(isEdit ? '顧客情報を更新しました' : '新規顧客を登録しました');
      navigate('/customers');
    }, 1000);
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
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    // Mock customer detail data
    const mockCustomer = {
      id: 1,
      name: '田中 太郎',
      email: 'tanaka@example.com',
      phone: '090-1234-5678',
      contractDate: '2023-01-15',
      monthlyPremium: 25000,
      contractAmount: 5000000,
      riskTolerance: 'balanced',
      investmentGoal: '老後資金の準備',
      notes: '定期的な見直しを希望',
      status: 'active',
      portfolio: {
        equity: 25,
        usEquity: 20,
        usBond: 30,
        reit: 15,
        globalEquity: 10
      },
      performanceHistory: [
        { month: '2023-07', value: 100, return: 0 },
        { month: '2023-08', value: 102.3, return: 2.3 },
        { month: '2023-09', value: 101.8, return: -0.5 },
        { month: '2023-10', value: 105.2, return: 3.4 },
        { month: '2023-11', value: 108.7, return: 3.5 },
        { month: '2023-12', value: 112.5, return: 3.8 },
        { month: '2024-01', value: 115.8, return: 3.3 }
      ]
    };
    
    setTimeout(() => {
      setCustomer(mockCustomer);
      setLoading(false);
    }, 500);
  }, []);

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
            onClick={() => navigate(`/analysis/new/${customer.id}`)}
          >
            分析実行
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
            取引履歴
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
                    {/* Simple pie chart representation */}
                    <svg viewBox="0 0 100 100" style={{ width: 250, height: 250 }}>
                      <circle cx="50" cy="50" r="40" fill="#8884d8" />
                      <path d={`M 50 50 L 50 10 A 40 40 0 0 1 90 50 Z`} fill="#82ca9d" />
                      <path d={`M 50 50 L 90 50 A 40 40 0 0 1 50 90 Z`} fill="#ffc658" />
                      <path d={`M 50 50 L 50 90 A 40 40 0 0 1 10 50 Z`} fill="#ff7c7c" />
                      <path d={`M 50 50 L 10 50 A 40 40 0 0 1 50 10 Z`} fill="#8dd1e1" />
                    </svg>
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Box>
                    {Object.entries(customer.portfolio).map(([fund, percentage]) => (
                      <Box key={fund} display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Box 
                            sx={{ 
                              width: 16, 
                              height: 16, 
                              backgroundColor: 
                                fund === 'equity' ? '#8884d8' :
                                fund === 'usEquity' ? '#82ca9d' :
                                fund === 'usBond' ? '#ffc658' :
                                fund === 'reit' ? '#ff7c7c' : '#8dd1e1',
                              borderRadius: 1 
                            }} 
                          />
                          <Typography variant="body1">
                            {fund === 'equity' ? '株式型' :
                             fund === 'usEquity' ? '米国株式型' :
                             fund === 'usBond' ? '米国債券型' :
                             fund === 'reit' ? 'REIT型' : '世界株式型'}
                          </Typography>
                        </Box>
                        <Typography variant="h6" color="primary">
                          {percentage}%
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Grid>
              </Grid>
              
              <Button
                variant="outlined"
                startIcon={<TrendingUp />}
                onClick={() => navigate('/portfolio-optimizer')}
                sx={{ mt: 2 }}
              >
                ポートフォリオを最適化
              </Button>
            </Box>
          )}
          
          {activeTab === 1 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                パフォーマンス推移
              </Typography>
              
              <Box sx={{ height: 300, mb: 3 }}>
                {/* Simple line chart representation */}
                <svg viewBox="0 0 600 300" style={{ width: '100%', height: '100%' }}>
                  <polyline
                    fill="none"
                    stroke="#8884d8"
                    strokeWidth="2"
                    points={customer.performanceHistory.map((point: any, index: number) => 
                      `${index * 85 + 50},${250 - (point.value - 100) * 10}`
                    ).join(' ')}
                  />
                  {customer.performanceHistory.map((point: any, index: number) => (
                    <circle
                      key={index}
                      cx={index * 85 + 50}
                      cy={250 - (point.value - 100) * 10}
                      r="4"
                      fill="#8884d8"
                    />
                  ))}
                </svg>
              </Box>
              
              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <Typography variant="body2" color="text.secondary">累計収益率</Typography>
                  <Typography variant="h6" color="success.main">+15.8%</Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="body2" color="text.secondary">年率リターン</Typography>
                  <Typography variant="h6">12.5%</Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="body2" color="text.secondary">最大ドローダウン</Typography>
                  <Typography variant="h6" color="error.main">-2.1%</Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="body2" color="text.secondary">シャープレシオ</Typography>
                  <Typography variant="h6">1.24</Typography>
                </Grid>
              </Grid>
            </Box>
          )}
          
          {activeTab === 2 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                取引履歴
              </Typography>
              
              <Box>
                <Alert severity="info" sx={{ mb: 2 }}>
                  直近の取引履歴を表示しています
                </Alert>
                
                {[
                  { date: '2024-01-15', type: '月次積立', amount: 25000, status: '完了' },
                  { date: '2023-12-20', type: 'リバランス', amount: 0, status: '完了' },
                  { date: '2023-12-15', type: '月次積立', amount: 25000, status: '完了' },
                  { date: '2023-11-15', type: '月次積立', amount: 25000, status: '完了' },
                ].map((transaction, index) => (
                  <Card key={index} variant="outlined" sx={{ mb: 1, p: 2 }}>
                    <Grid container alignItems="center">
                      <Grid item xs={3}>
                        <Typography variant="body2">{transaction.date}</Typography>
                      </Grid>
                      <Grid item xs={3}>
                        <Typography variant="body1">{transaction.type}</Typography>
                      </Grid>
                      <Grid item xs={3}>
                        <Typography variant="body1" color="primary">
                          ¥{transaction.amount.toLocaleString()}
                        </Typography>
                      </Grid>
                      <Grid item xs={3}>
                        <Chip label={transaction.status} color="success" size="small" />
                      </Grid>
                    </Grid>
                  </Card>
                ))}
              </Box>
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

// Product List Component
interface ProductListProps {
  user: User;
  navigate: (path: string) => void;
}

function ProductList({ user, navigate }: ProductListProps) {
  const [products, setProducts] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => {
    // Mock product data - プルデンシャル変額保険の特別勘定
    const mockProducts = [
      {
        id: 1,
        name: '株式型ファンド',
        category: 'equity',
        provider: 'prudential',
        expectedReturn: 0.068,
        managementFee: 0.015,
        minAmount: 100000,
        maxAmount: 50000000,
        riskLevel: 'high',
        description: '国内株式を中心とした積極運用ファンド',
        status: 'normal',
        monthlyStatus: 'normal'
      },
      {
        id: 2,
        name: '米国株式型ファンド',
        category: 'us_equity',
        provider: 'prudential',
        expectedReturn: 0.075,
        managementFee: 0.018,
        minAmount: 100000,
        maxAmount: 50000000,
        riskLevel: 'high',
        description: '米国株式市場への分散投資ファンド',
        status: 'undervalued',
        monthlyStatus: 'buy'
      },
      {
        id: 3,
        name: '米国債券型ファンド',
        category: 'us_bond',
        provider: 'prudential',
        expectedReturn: 0.042,
        managementFee: 0.012,
        minAmount: 100000,
        maxAmount: 50000000,
        riskLevel: 'medium',
        description: '米国債券を中心とした安定運用ファンド',
        status: 'normal',
        monthlyStatus: 'normal'
      },
      {
        id: 4,
        name: 'REIT型ファンド',
        category: 'reit',
        provider: 'prudential',
        expectedReturn: 0.055,
        managementFee: 0.016,
        minAmount: 100000,
        maxAmount: 50000000,
        riskLevel: 'medium',
        description: '不動産投資信託への分散投資ファンド',
        status: 'overvalued',
        monthlyStatus: 'sell'
      },
      {
        id: 5,
        name: '世界株式型ファンド',
        category: 'global_equity',
        provider: 'prudential',
        expectedReturn: 0.072,
        managementFee: 0.020,
        minAmount: 100000,
        maxAmount: 50000000,
        riskLevel: 'high',
        description: '世界各国の株式市場への分散投資ファンド',
        status: 'normal',
        monthlyStatus: 'normal'
      }
    ];
    
    setTimeout(() => {
      setProducts(mockProducts);
      setFilteredProducts(mockProducts);
      setLoading(false);
    }, 500);
  }, []);

  // フィルタリング機能
  useEffect(() => {
    let filtered = products;

    if (searchTerm) {
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(product => product.category === categoryFilter);
    }

    setFilteredProducts(filtered);
  }, [products, searchTerm, categoryFilter]);

  const getCategoryLabel = (category: string) => {
    const labels = {
      equity: '株式型',
      us_equity: '米国株式型',
      us_bond: '米国債券型',
      reit: 'REIT型',
      global_equity: '世界株式型',
    };
    return labels[category as keyof typeof labels] || category;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      undervalued: 'success',
      normal: 'default',
      overvalued: 'error',
    };
    return colors[status as keyof typeof colors] as any || 'default';
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      undervalued: '今月の割安',
      normal: '通常',
      overvalued: '今月の割高',
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getRiskLevelColor = (level: string) => {
    const colors = {
      low: 'success',
      medium: 'warning', 
      high: 'error',
    };
    return colors[level as keyof typeof colors] as any || 'default';
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
          変額保険ファンド管理
        </Typography>
        {user.accountType === 'parent' && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate('/products/new')}
          >
            新規ファンド登録
          </Button>
        )}
      </Box>

      {/* 検索・フィルター */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="ファンド名・説明で検索"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="米国株式型ファンド"
            />
          </Grid>
          
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              select
              label="ファンド種類"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              SelectProps={{ native: true }}
            >
              <option value="all">すべて</option>
              <option value="equity">株式型</option>
              <option value="us_equity">米国株式型</option>
              <option value="us_bond">米国債券型</option>
              <option value="reit">REIT型</option>
              <option value="global_equity">世界株式型</option>
            </TextField>
          </Grid>
          
          <Grid item xs={12} md={2}>
            <Typography variant="body2" color="text.secondary">
              {filteredProducts.length}件 / {products.length}件
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 0, overflow: 'hidden' }}>
        <Grid container spacing={0}>
          {filteredProducts.map((product) => (
            <Grid item xs={12} key={product.id}>
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
                onClick={() => navigate(`/products/${product.id}`)}
              >
                <CardContent>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={4}>
                      <Typography variant="h6" component="div">
                        {product.name}
                      </Typography>
                      <Chip
                        label={getCategoryLabel(product.category)}
                        color="primary"
                        size="small"
                        sx={{ mt: 1 }}
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={3}>
                      <Typography variant="body2" color="text.secondary">
                        期待収益率 / 管理手数料
                      </Typography>
                      <Typography variant="h6" color="primary">
                        {(product.expectedReturn * 100).toFixed(1)}% / {(product.managementFee * 100).toFixed(1)}%
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12} sm={3}>
                      <Typography variant="body2" color="text.secondary">
                        保険金額範囲
                      </Typography>
                      <Typography variant="body1">
                        ¥{product.minAmount.toLocaleString()} ～ ¥{product.maxAmount.toLocaleString()}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12} sm={2}>
                      <Box display="flex" flexDirection="column" gap={1}>
                        <Chip
                          label={getStatusLabel(product.status)}
                          color={getStatusColor(product.status)}
                          size="small"
                        />
                        <Chip
                          label={product.riskLevel === 'low' ? 'リスク低' : 
                                product.riskLevel === 'medium' ? 'リスク中' : 'リスク高'}
                          color={getRiskLevelColor(product.riskLevel)}
                          size="small"
                        />
                        {user.accountType === 'parent' && (
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/products/${product.id}/edit`);
                            }}
                          >
                            編集
                          </Button>
                        )}
                      </Box>
                    </Grid>
                  </Grid>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    {product.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
        
        {filteredProducts.length === 0 && products.length > 0 && (
          <Box textAlign="center" py={8}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              検索条件に一致するファンドが見つかりません
            </Typography>
            <Button
              variant="outlined"
              onClick={() => {
                setSearchTerm('');
                setCategoryFilter('all');
              }}
            >
              フィルターをリセット
            </Button>
          </Box>
        )}
        
        {products.length === 0 && (
          <Box textAlign="center" py={8}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              まだファンドが登録されていません
            </Typography>
            {user.accountType === 'parent' && (
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => navigate('/products/new')}
              >
                最初のファンドを登録
              </Button>
            )}
          </Box>
        )}
      </Paper>
    </Container>
  );
}

// Product Form Component
interface ProductFormProps {
  user: User;
  navigate: (path: string) => void;
  isEdit?: boolean;
}

function ProductForm({ user, navigate, isEdit = false }: ProductFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    category: 'equity',
    expectedReturn: '',
    managementFee: '',
    minAmount: '',
    maxAmount: '',
    riskLevel: 'medium',
    description: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      alert(isEdit ? 'ファンド情報を更新しました' : '新規ファンドを登録しました');
      navigate('/products');
    }, 1000);
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
          {isEdit ? 'ファンド情報編集' : '新規ファンド登録'}
        </Typography>
        
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="ファンド名"
                value={formData.name}
                onChange={handleChange('name')}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                select
                label="ファンド種類"
                value={formData.category}
                onChange={handleChange('category')}
                SelectProps={{ native: true }}
              >
                <option value="equity">株式型</option>
                <option value="us_equity">米国株式型</option>
                <option value="us_bond">米国債券型</option>
                <option value="reit">REIT型</option>
                <option value="global_equity">世界株式型</option>
              </TextField>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="期待収益率（%）"
                type="number"
                value={formData.expectedReturn}
                onChange={handleChange('expectedReturn')}
                inputProps={{ step: "0.001", min: "0", max: "1" }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="管理手数料（%）"
                type="number"
                value={formData.managementFee}
                onChange={handleChange('managementFee')}
                inputProps={{ step: "0.001", min: "0", max: "1" }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="最低保険金額"
                type="number"
                value={formData.minAmount}
                onChange={handleChange('minAmount')}
                InputProps={{
                  startAdornment: <Typography sx={{ mr: 1 }}>¥</Typography>,
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="最高保険金額"
                type="number"
                value={formData.maxAmount}
                onChange={handleChange('maxAmount')}
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
                label="リスクレベル"
                value={formData.riskLevel}
                onChange={handleChange('riskLevel')}
                SelectProps={{ native: true }}
              >
                <option value="low">低リスク</option>
                <option value="medium">中リスク</option>
                <option value="high">高リスク</option>
              </TextField>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="ファンド説明"
                multiline
                rows={4}
                value={formData.description}
                onChange={handleChange('description')}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Box display="flex" gap={2} justifyContent="flex-end">
                <Button
                  variant="outlined"
                  onClick={() => navigate('/products')}
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

// Product Detail Component
interface ProductDetailProps {
  user: User;
  navigate: (path: string) => void;
}

function ProductDetail({ user, navigate }: ProductDetailProps) {
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock product detail data
    const mockProduct = {
      id: 1,
      name: '株式型ファンド',
      category: 'equity',
      provider: 'prudential',
      expectedReturn: 0.068,
      managementFee: 0.015,
      minAmount: 100000,
      maxAmount: 50000000,
      riskLevel: 'high',
      description: '国内株式を中心とした積極運用ファンドです。長期的な資産成長を目指し、アクティブな運用戦略により市場を上回るリターンの獲得を目標としています。',
      status: 'normal',
      monthlyStatus: 'normal',
      createdDate: '2023-01-01',
      lastUpdated: '2023-06-15'
    };
    
    setTimeout(() => {
      setProduct(mockProduct);
      setLoading(false);
    }, 500);
  }, []);

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (!product) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">ファンド情報が見つかりません</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          ファンド詳細
        </Typography>
        <Box display="flex" gap={2}>
          {user.accountType === 'parent' && (
            <Button
              variant="outlined"
              onClick={() => navigate(`/products/${product.id}/edit`)}
            >
              編集
            </Button>
          )}
          <Button
            variant="contained"
            onClick={() => navigate(`/analysis/new?productId=${product.id}`)}
          >
            このファンドで分析
          </Button>
        </Box>
      </Box>

      <Paper sx={{ p: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              ファンド名
            </Typography>
            <Typography variant="h6" gutterBottom>
              {product.name}
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              ファンドID
            </Typography>
            <Typography variant="h6" gutterBottom>
              {product.id}
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              カテゴリ
            </Typography>
            <Chip
              label={product.category === 'equity' ? '株式型' :
                     product.category === 'us_equity' ? '米国株式型' :
                     product.category === 'us_bond' ? '米国債券型' :
                     product.category === 'reit' ? 'REIT型' : '世界株式型'}
              color="primary"
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              リスクレベル
            </Typography>
            <Chip
              label={product.riskLevel === 'low' ? 'リスク低' : 
                     product.riskLevel === 'medium' ? 'リスク中' : 'リスク高'}
              color={product.riskLevel === 'low' ? 'success' : 
                     product.riskLevel === 'medium' ? 'warning' : 'error'}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              期待収益率
            </Typography>
            <Typography variant="h6" color="primary" gutterBottom>
              {(product.expectedReturn * 100).toFixed(2)}%
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              管理手数料
            </Typography>
            <Typography variant="h6" color="primary" gutterBottom>
              {(product.managementFee * 100).toFixed(2)}%
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              最低保険金額
            </Typography>
            <Typography variant="body1" gutterBottom>
              ¥{product.minAmount.toLocaleString()}
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              最高保険金額
            </Typography>
            <Typography variant="body1" gutterBottom>
              ¥{product.maxAmount.toLocaleString()}
            </Typography>
          </Grid>
          
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="text.secondary">
              ファンド説明
            </Typography>
            <Typography variant="body1" gutterBottom>
              {product.description}
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              作成日
            </Typography>
            <Typography variant="body1" gutterBottom>
              {new Date(product.createdDate).toLocaleDateString('ja-JP')}
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              最終更新日
            </Typography>
            <Typography variant="body1" gutterBottom>
              {new Date(product.lastUpdated).toLocaleDateString('ja-JP')}
            </Typography>
          </Grid>
        </Grid>
      </Paper>
      
      <Box mt={3}>
        <Button
          variant="outlined"
          onClick={() => navigate('/products')}
        >
          ← ファンド一覧に戻る
        </Button>
      </Box>
    </Container>
  );
}

// Report List Component
interface ReportListProps {
  user: User;
  navigate: (path: string) => void;
}

function ReportList({ user, navigate }: ReportListProps) {
  const [reports, setReports] = useState<any[]>([]);
  const [filteredReports, setFilteredReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    // Mock report data
    const mockReports = [
      {
        id: 1,
        title: '田中太郎様 リスク分析レポート',
        customerId: 1,
        customerName: '田中太郎',
        type: 'risk_analysis',
        status: 'completed',
        createdDate: '2024-01-15',
        completedDate: '2024-01-15',
        summary: '保守的な運用プロファイルに基づく最適なポートフォリオ配分を提案',
        recommendations: 3
      },
      {
        id: 2,
        title: '佐藤花子様 ポートフォリオ最適化レポート',
        customerId: 2,
        customerName: '佐藤花子',
        type: 'portfolio_optimization',
        status: 'completed',
        createdDate: '2024-01-20',
        completedDate: '2024-01-20',
        summary: 'バランス型運用における効率的フロンティア分析結果',
        recommendations: 5
      },
      {
        id: 3,
        title: '山田次郎様 パフォーマンス分析レポート',
        customerId: 3,
        customerName: '山田次郎',
        type: 'performance_analysis',
        status: 'processing',
        createdDate: '2024-01-25',
        completedDate: null,
        summary: '積極的運用の6ヶ月パフォーマンス評価（処理中）',
        recommendations: 0
      }
    ];
    
    setTimeout(() => {
      setReports(mockReports);
      setFilteredReports(mockReports);
      setLoading(false);
    }, 500);
  }, []);

  // フィルタリング機能
  useEffect(() => {
    let filtered = reports;

    if (searchTerm) {
      filtered = filtered.filter(report => 
        report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.customerName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(report => report.type === typeFilter);
    }

    setFilteredReports(filtered);
  }, [reports, searchTerm, typeFilter]);

  const getTypeLabel = (type: string) => {
    const labels = {
      risk_analysis: 'リスク分析',
      portfolio_optimization: 'ポートフォリオ最適化',
      performance_analysis: 'パフォーマンス分析',
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      completed: 'success',
      processing: 'warning',
      failed: 'error',
    };
    return colors[status as keyof typeof colors] as any || 'default';
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      completed: '完了',
      processing: '処理中',
      failed: '失敗',
    };
    return labels[status as keyof typeof labels] || status;
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
          分析レポート管理
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/reports/new')}
        >
          新規レポート作成
        </Button>
      </Box>

      {/* 検索・フィルター */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="レポート名・顧客名で検索"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="田中太郎 リスク分析"
            />
          </Grid>
          
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              select
              label="レポート種類"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              SelectProps={{ native: true }}
            >
              <option value="all">すべて</option>
              <option value="risk_analysis">リスク分析</option>
              <option value="portfolio_optimization">ポートフォリオ最適化</option>
              <option value="performance_analysis">パフォーマンス分析</option>
            </TextField>
          </Grid>
          
          <Grid item xs={12} md={2}>
            <Typography variant="body2" color="text.secondary">
              {filteredReports.length}件 / {reports.length}件
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 0, overflow: 'hidden' }}>
        <Grid container spacing={0}>
          {filteredReports.map((report) => (
            <Grid item xs={12} key={report.id}>
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
                onClick={() => navigate(`/reports/${report.id}`)}
              >
                <CardContent>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={4}>
                      <Typography variant="h6" component="div">
                        {report.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        顧客: {report.customerName}
                      </Typography>
                      <Chip
                        label={getTypeLabel(report.type)}
                        color="primary"
                        size="small"
                        sx={{ mt: 1 }}
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={3}>
                      <Typography variant="body2" color="text.secondary">
                        作成日 / 完了日
                      </Typography>
                      <Typography variant="body1">
                        {new Date(report.createdDate).toLocaleDateString('ja-JP')}
                      </Typography>
                      {report.completedDate && (
                        <Typography variant="body2" color="text.secondary">
                          {new Date(report.completedDate).toLocaleDateString('ja-JP')}
                        </Typography>
                      )}
                    </Grid>
                    
                    <Grid item xs={12} sm={3}>
                      <Typography variant="body2" color="text.secondary">
                        推奨事項数
                      </Typography>
                      <Typography variant="h6" color="primary">
                        {report.recommendations}件
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12} sm={2}>
                      <Box display="flex" flexDirection="column" gap={1}>
                        <Chip
                          label={getStatusLabel(report.status)}
                          color={getStatusColor(report.status)}
                          size="small"
                        />
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={(e) => {
                            e.stopPropagation();
                            // PDF ダウンロード機能
                            alert('PDFダウンロード機能は実装予定です');
                          }}
                        >
                          PDF
                        </Button>
                      </Box>
                    </Grid>
                  </Grid>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    {report.summary}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
        
        {filteredReports.length === 0 && reports.length > 0 && (
          <Box textAlign="center" py={8}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              検索条件に一致するレポートが見つかりません
            </Typography>
            <Button
              variant="outlined"
              onClick={() => {
                setSearchTerm('');
                setTypeFilter('all');
              }}
            >
              フィルターをリセット
            </Button>
          </Box>
        )}
        
        {reports.length === 0 && (
          <Box textAlign="center" py={8}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              まだレポートが作成されていません
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => navigate('/reports/new')}
            >
              最初のレポートを作成
            </Button>
          </Box>
        )}
      </Paper>
    </Container>
  );
}

// Report Form Component
interface ReportFormProps {
  user: User;
  navigate: (path: string) => void;
}

function ReportForm({ user, navigate }: ReportFormProps) {
  const [formData, setFormData] = useState({
    customerId: '',
    type: 'risk_analysis',
    title: '',
    description: ''
  });
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Mock customer data for selection
    const mockCustomers = [
      { id: 1, name: '田中太郎' },
      { id: 2, name: '佐藤花子' },
      { id: 3, name: '山田次郎' }
    ];
    setCustomers(mockCustomers);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      alert('レポート生成を開始しました。完了までお待ちください。');
      navigate('/reports');
    }, 2000);
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
          新規レポート作成
        </Typography>
        
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                select
                label="対象顧客"
                value={formData.customerId}
                onChange={handleChange('customerId')}
                SelectProps={{ native: true }}
              >
                <option value="">顧客を選択してください</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </TextField>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                select
                label="レポート種類"
                value={formData.type}
                onChange={handleChange('type')}
                SelectProps={{ native: true }}
              >
                <option value="risk_analysis">リスク分析</option>
                <option value="portfolio_optimization">ポートフォリオ最適化</option>
                <option value="performance_analysis">パフォーマンス分析</option>
              </TextField>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="レポートタイトル"
                value={formData.title}
                onChange={handleChange('title')}
                placeholder="例: 田中太郎様 リスク分析レポート"
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="説明・備考"
                multiline
                rows={4}
                value={formData.description}
                onChange={handleChange('description')}
                placeholder="レポート作成の目的や特記事項があれば記入してください"
              />
            </Grid>
            
            <Grid item xs={12}>
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  レポート生成には数分かかる場合があります。生成完了後、メール通知をお送りします。
                </Typography>
              </Alert>
            </Grid>
            
            <Grid item xs={12}>
              <Box display="flex" gap={2} justifyContent="flex-end">
                <Button
                  variant="outlined"
                  onClick={() => navigate('/reports')}
                >
                  キャンセル
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={24} /> : 'レポート生成開始'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Container>
  );
}

// Report Detail Component
interface ReportDetailProps {
  user: User;
  navigate: (path: string) => void;
}

function ReportDetail({ user, navigate }: ReportDetailProps) {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock report detail data
    const mockReport = {
      id: 1,
      title: '田中太郎様 リスク分析レポート',
      customerId: 1,
      customerName: '田中太郎',
      type: 'risk_analysis',
      status: 'completed',
      createdDate: '2024-01-15',
      completedDate: '2024-01-15',
      summary: '保守的な運用プロファイルに基づく最適なポートフォリオ配分を提案',
      content: {
        riskProfile: 'conservative',
        recommendedAllocation: {
          equity: 30,
          usEquity: 20,
          usBond: 35,
          reit: 10,
          globalEquity: 5
        },
        expectedReturn: 4.2,
        volatility: 8.5,
        recommendations: [
          '現在のリスク許容度（保守的）に適した配分',
          '米国債券型ファンドの比重を高めることで安定性を確保',
          '年1回のリバランスを推奨'
        ]
      }
    };
    
    setTimeout(() => {
      setReport(mockReport);
      setLoading(false);
    }, 500);
  }, []);

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (!report) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">レポートが見つかりません</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          レポート詳細
        </Typography>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            onClick={() => alert('PDFダウンロード機能は実装予定です')}
          >
            PDFダウンロード
          </Button>
          <Button
            variant="contained"
            onClick={() => navigate(`/customers/${report.customerId}`)}
          >
            顧客詳細を見る
          </Button>
        </Box>
      </Box>

      <Paper sx={{ p: 4, mb: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="h5" gutterBottom>
              {report.title}
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              対象顧客
            </Typography>
            <Typography variant="h6" gutterBottom>
              {report.customerName}
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              レポート種類
            </Typography>
            <Chip
              label={report.type === 'risk_analysis' ? 'リスク分析' : 
                     report.type === 'portfolio_optimization' ? 'ポートフォリオ最適化' : 'パフォーマンス分析'}
              color="primary"
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              作成日
            </Typography>
            <Typography variant="body1" gutterBottom>
              {new Date(report.createdDate).toLocaleDateString('ja-JP')}
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              完了日
            </Typography>
            <Typography variant="body1" gutterBottom>
              {report.completedDate ? new Date(report.completedDate).toLocaleDateString('ja-JP') : '処理中'}
            </Typography>
          </Grid>
          
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="text.secondary">
              サマリー
            </Typography>
            <Typography variant="body1" gutterBottom>
              {report.summary}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* レポート内容 */}
      <Paper sx={{ p: 4, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          推奨ポートフォリオ配分
        </Typography>
        
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {Object.entries(report.content.recommendedAllocation).map(([fund, percentage]) => (
            <Grid item xs={6} sm={4} key={fund}>
              <Card variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  {fund === 'equity' ? '株式型' :
                   fund === 'usEquity' ? '米国株式型' :
                   fund === 'usBond' ? '米国債券型' :
                   fund === 'reit' ? 'REIT型' : '世界株式型'}
                </Typography>
                <Typography variant="h5" color="primary">
                  {percentage}%
                </Typography>
              </Card>
            </Grid>
          ))}
        </Grid>
        
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={6}>
            <Typography variant="subtitle2" color="text.secondary">
              期待収益率
            </Typography>
            <Typography variant="h6" color="success.main">
              {report.content.expectedReturn}%
            </Typography>
          </Grid>
          
          <Grid item xs={6}>
            <Typography variant="subtitle2" color="text.secondary">
              予想ボラティリティ
            </Typography>
            <Typography variant="h6" color="warning.main">
              {report.content.volatility}%
            </Typography>
          </Grid>
        </Grid>
        
        <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
          推奨事項
        </Typography>
        {report.content.recommendations.map((rec: string, index: number) => (
          <Alert severity="info" sx={{ mb: 1 }} key={index}>
            {rec}
          </Alert>
        ))}
      </Paper>
      
      <Box>
        <Button
          variant="outlined"
          onClick={() => navigate('/reports')}
        >
          ← レポート一覧に戻る
        </Button>
      </Box>
    </Container>
  );
}

// Portfolio Optimizer Component
interface PortfolioOptimizerProps {
  user: User;
  navigate: (path: string) => void;
}

function PortfolioOptimizer({ user, navigate }: PortfolioOptimizerProps) {
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [riskTolerance, setRiskTolerance] = useState('balanced');
  const [investmentAmount, setInvestmentAmount] = useState('1000000');
  const [optimizedPortfolio, setOptimizedPortfolio] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const calculateOptimalPortfolio = () => {
    setLoading(true);
    
    // Mock optimization calculation
    setTimeout(() => {
      const portfolios = {
        conservative: {
          equity: 20,
          usEquity: 10,
          usBond: 50,
          reit: 10,
          globalEquity: 10,
          expectedReturn: 4.2,
          risk: 6.5,
          sharpeRatio: 0.65
        },
        balanced: {
          equity: 25,
          usEquity: 20,
          usBond: 30,
          reit: 15,
          globalEquity: 10,
          expectedReturn: 5.8,
          risk: 9.2,
          sharpeRatio: 0.78
        },
        aggressive: {
          equity: 30,
          usEquity: 30,
          usBond: 10,
          reit: 10,
          globalEquity: 20,
          expectedReturn: 7.5,
          risk: 14.3,
          sharpeRatio: 0.82
        }
      };
      
      setOptimizedPortfolio(portfolios[riskTolerance as keyof typeof portfolios]);
      setLoading(false);
    }, 1500);
  };

  const data = optimizedPortfolio ? [
    { name: '株式型', value: optimizedPortfolio.equity, color: '#8884d8' },
    { name: '米国株式型', value: optimizedPortfolio.usEquity, color: '#82ca9d' },
    { name: '米国債券型', value: optimizedPortfolio.usBond, color: '#ffc658' },
    { name: 'REIT型', value: optimizedPortfolio.reit, color: '#ff7c7c' },
    { name: '世界株式型', value: optimizedPortfolio.globalEquity, color: '#8dd1e1' }
  ] : [];

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        🎯 ポートフォリオ最適化エンジン
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              最適化パラメータ
            </Typography>
            
            <Box sx={{ mt: 2 }}>
              <TextField
                fullWidth
                select
                label="顧客選択"
                value={selectedCustomer}
                onChange={(e) => setSelectedCustomer(e.target.value)}
                SelectProps={{ native: true }}
                sx={{ mb: 2 }}
              >
                <option value="">新規シミュレーション</option>
                <option value="1">田中太郎</option>
                <option value="2">佐藤花子</option>
                <option value="3">山田次郎</option>
              </TextField>
              
              <TextField
                fullWidth
                select
                label="リスク許容度"
                value={riskTolerance}
                onChange={(e) => setRiskTolerance(e.target.value)}
                SelectProps={{ native: true }}
                sx={{ mb: 2 }}
              >
                <option value="conservative">保守的</option>
                <option value="balanced">バランス型</option>
                <option value="aggressive">積極的</option>
              </TextField>
              
              <TextField
                fullWidth
                label="投資金額"
                type="number"
                value={investmentAmount}
                onChange={(e) => setInvestmentAmount(e.target.value)}
                InputProps={{
                  startAdornment: <Typography sx={{ mr: 1 }}>¥</Typography>,
                }}
                sx={{ mb: 2 }}
              />
              
              <Button
                fullWidth
                variant="contained"
                onClick={calculateOptimalPortfolio}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : null}
              >
                {loading ? '最適化中...' : '最適化実行'}
              </Button>
            </Box>
          </Paper>
          
          {optimizedPortfolio && (
            <Paper sx={{ p: 3, mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                最適化結果
              </Typography>
              
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  期待収益率
                </Typography>
                <Typography variant="h5" color="success.main" gutterBottom>
                  {optimizedPortfolio.expectedReturn}%
                </Typography>
                
                <Typography variant="body2" color="text.secondary">
                  リスク（標準偏差）
                </Typography>
                <Typography variant="h5" color="warning.main" gutterBottom>
                  {optimizedPortfolio.risk}%
                </Typography>
                
                <Typography variant="body2" color="text.secondary">
                  シャープレシオ
                </Typography>
                <Typography variant="h5" color="primary.main">
                  {optimizedPortfolio.sharpeRatio}
                </Typography>
              </Box>
              
              <Button
                fullWidth
                variant="outlined"
                sx={{ mt: 2 }}
                onClick={() => alert('レポート生成機能は実装中です')}
              >
                レポートを生成
              </Button>
            </Paper>
          )}
        </Grid>
        
        <Grid item xs={12} md={8}>
          {optimizedPortfolio ? (
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                最適化ポートフォリオ配分
              </Typography>
              
              <Box sx={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Box sx={{ width: 300, height: 300 }}>
                  {/* 簡易的な円グラフ表示 */}
                  <svg viewBox="0 0 100 100">
                    {data.reduce((acc, item, index) => {
                      const startAngle = acc;
                      const endAngle = acc + (item.value / 100) * 360;
                      const x1 = 50 + 40 * Math.cos((startAngle * Math.PI) / 180);
                      const y1 = 50 + 40 * Math.sin((startAngle * Math.PI) / 180);
                      const x2 = 50 + 40 * Math.cos((endAngle * Math.PI) / 180);
                      const y2 = 50 + 40 * Math.sin((endAngle * Math.PI) / 180);
                      const largeArcFlag = item.value > 50 ? 1 : 0;
                      
                      return (
                        <g key={index}>
                          <path
                            d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                            fill={item.color}
                            stroke="white"
                            strokeWidth="0.5"
                          />
                          <text
                            x={50 + 25 * Math.cos(((startAngle + endAngle) / 2 * Math.PI) / 180)}
                            y={50 + 25 * Math.sin(((startAngle + endAngle) / 2 * Math.PI) / 180)}
                            textAnchor="middle"
                            fontSize="4"
                            fill="white"
                          >
                            {item.value}%
                          </text>
                        </g>
                      );
                    }, 0)}
                  </svg>
                </Box>
              </Box>
              
              <Grid container spacing={2} sx={{ mt: 2 }}>
                {data.map((item, index) => (
                  <Grid item xs={12} sm={6} key={index}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Box
                        sx={{
                          width: 16,
                          height: 16,
                          backgroundColor: item.color,
                          borderRadius: 1
                        }}
                      />
                      <Typography variant="body2">
                        {item.name}: {item.value}%
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
              
              <Alert severity="info" sx={{ mt: 3 }}>
                <Typography variant="body2">
                  この配分は、選択されたリスク許容度「{
                    riskTolerance === 'conservative' ? '保守的' :
                    riskTolerance === 'balanced' ? 'バランス型' : '積極的'
                  }」に基づいて最適化されています。定期的なリバランスをお勧めします。
                </Typography>
              </Alert>
            </Paper>
          ) : (
            <Paper sx={{ p: 3, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Box textAlign="center">
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  パラメータを設定して最適化を実行してください
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  モンテカルロシミュレーションと効率的フロンティア分析により
                  最適なポートフォリオを提案します
                </Typography>
              </Box>
            </Paper>
          )}
        </Grid>
      </Grid>
    </Container>
  );
}

export default App;
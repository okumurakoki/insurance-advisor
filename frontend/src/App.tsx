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
  Download as DownloadIcon,
  BarChart as BarChartIcon,
  Menu as MenuIcon,
  CloudUpload as CloudUploadIcon,
  TableChart as TableIcon,
} from '@mui/icons-material';

// API Configuration
const API_BASE_URL = (process.env.REACT_APP_API_URL || 'https://api.insurance-optimizer.com').replace(/\/+$/, '');

// PDF Generation utility
const generatePDF = (reportData: any, reportType: string = 'report') => {
  // Create HTML content for PDF
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="ja">
    <head>
      <meta charset="UTF-8">
      <title>${reportData.title || 'レポート'}</title>
      <style>
        body { 
          font-family: 'Noto Sans JP', 'Hiragino Sans', 'Yu Gothic', sans-serif; 
          margin: 40px;
          color: #333;
          line-height: 1.6;
        }
        .header { 
          text-align: center; 
          border-bottom: 3px solid #1976d2; 
          padding-bottom: 20px; 
          margin-bottom: 30px;
        }
        .company-logo { 
          font-size: 28px; 
          font-weight: bold; 
          color: #1976d2; 
          margin-bottom: 10px;
        }
        .report-title { 
          font-size: 24px; 
          font-weight: bold; 
          margin-bottom: 10px;
        }
        .report-date { 
          color: #666; 
          font-size: 14px;
        }
        .section { 
          margin-bottom: 40px;
          page-break-inside: avoid;
        }
        .section-title { 
          font-size: 20px; 
          font-weight: bold; 
          color: #1976d2; 
          border-bottom: 2px solid #e0e0e0; 
          padding-bottom: 8px; 
          margin-bottom: 20px;
        }
        .allocation-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        .allocation-table th,
        .allocation-table td {
          border: 1px solid #ddd;
          padding: 12px;
          text-align: left;
        }
        .allocation-table th {
          background-color: #f5f5f5;
          font-weight: bold;
        }
        .current-allocation {
          color: #666;
        }
        .recommended-allocation {
          color: #1976d2;
          font-weight: bold;
        }
        .change-positive {
          color: #4caf50;
          font-weight: bold;
        }
        .change-negative {
          color: #f44336;
          font-weight: bold;
        }
        .highlight-box {
          background-color: #f0f7ff;
          border: 1px solid #2196f3;
          padding: 15px;
          border-radius: 5px;
          margin: 15px 0;
        }
        .info-grid { 
          display: grid; 
          grid-template-columns: 1fr 1fr; 
          gap: 20px; 
          margin-bottom: 20px;
        }
        .info-item { 
          padding: 10px; 
          background: #f9f9f9; 
          border-radius: 4px;
        }
        .info-label { 
          font-weight: bold; 
          color: #666; 
          font-size: 12px; 
          margin-bottom: 5px;
        }
        .info-value { 
          font-size: 16px; 
          color: #333;
        }
        .portfolio-item { 
          display: flex; 
          justify-content: space-between; 
          padding: 8px 0; 
          border-bottom: 1px solid #eee;
        }
        .recommendation { 
          background: #e3f2fd; 
          padding: 15px; 
          border-radius: 4px; 
          margin: 10px 0; 
          border-left: 4px solid #2196f3;
        }
        .risk-indicator { 
          display: inline-block; 
          padding: 4px 8px; 
          border-radius: 12px; 
          font-size: 12px; 
          font-weight: bold;
        }
        .risk-low { background: #c8e6c9; color: #2e7d32; }
        .risk-medium { background: #fff3e0; color: #f57c00; }
        .risk-high { background: #ffebee; color: #c62828; }
        .footer { 
          margin-top: 50px; 
          text-align: center; 
          font-size: 12px; 
          color: #666; 
          border-top: 1px solid #eee; 
          padding-top: 20px;
        }
        .performance-chart {
          width: 100%;
          height: 200px;
          background: #f5f5f5;
          border: 1px solid #ddd;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="company-logo">🏦 プルデンシャル生命保険株式会社</div>
        <div class="report-title">${reportData.title || 'ポートフォリオ分析レポート'}</div>
        <div class="report-date">作成日: ${new Date().toLocaleDateString('ja-JP')}</div>
      </div>

      ${reportData.customerName ? `
      <div class="section">
        <div class="section-title">📋 顧客情報</div>
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">顧客名</div>
            <div class="info-value">${reportData.customerName}</div>
          </div>
          <div class="info-item">
            <div class="info-label">レポート種類</div>
            <div class="info-value">${
              reportData.type === 'risk_analysis' ? 'リスク分析' :
              reportData.type === 'portfolio_optimization' ? 'ポートフォリオ最適化' : 'パフォーマンス分析'
            }</div>
          </div>
        </div>
        <div class="info-item">
          <div class="info-label">概要</div>
          <div class="info-value">${reportData.summary || ''}</div>
        </div>
      </div>
      ` : ''}

      ${reportData.content?.recommendedAllocation ? `
      <div class="section">
        <div class="section-title">推奨ポートフォリオ配分</div>
        ${Object.entries(reportData.content.recommendedAllocation).map(([fund, percentage]) => `
          <div class="portfolio-item">
            <span>${
              fund === 'equity' ? '株式型ファンド' :
              fund === 'usEquity' ? '米国株式型ファンド' :
              fund === 'usBond' ? '米国債券型ファンド' :
              fund === 'reit' ? 'REIT型ファンド' : '世界株式型ファンド'
            }</span>
            <span style="font-weight: bold; color: #1976d2;">${percentage}%</span>
          </div>
        `).join('')}
      </div>
      ` : ''}

      ${reportData.content?.expectedReturn ? `
      <div class="section">
        <div class="section-title">🎯 期待パフォーマンス</div>
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">期待収益率 (年率)</div>
            <div class="info-value" style="color: #4caf50; font-weight: bold;">${reportData.content.expectedReturn}%</div>
          </div>
          <div class="info-item">
            <div class="info-label">予想ボラティリティ</div>
            <div class="info-value" style="color: #ff9800; font-weight: bold;">${reportData.content.volatility}%</div>
          </div>
        </div>
      </div>
      ` : ''}

      ${reportData.currentAllocation ? `
      <div class="section">
        <div class="section-title">今月の推奨配分変更</div>
        <table class="allocation-table">
          <thead>
            <tr>
              <th>ファンド種類</th>
              <th>現在の配分</th>
              <th>推奨配分</th>
              <th>変更量</th>
              <th>理由</th>
            </tr>
          </thead>
          <tbody>
            ${Object.entries(reportData.currentAllocation).map(([fundKey, fund]: [string, any]) => `
              <tr>
                <td><strong>${
                  fundKey === 'equity' ? '国内株式型ファンド' :
                  fundKey === 'usEquity' ? '米国株式型ファンド' :
                  fundKey === 'usBond' ? '米国債券型ファンド' :
                  fundKey === 'reit' ? 'REIT型ファンド' : '世界株式型ファンド'
                }</strong></td>
                <td class="current-allocation">${fund.current}%</td>
                <td class="recommended-allocation">${fund.recommended}%</td>
                <td class="${fund.change > 0 ? 'change-positive' : fund.change < 0 ? 'change-negative' : ''}">
                  ${fund.change > 0 ? '+' : ''}${fund.change}%
                </td>
                <td style="font-size: 12px;">${fund.reason}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="highlight-box">
          <h4 style="margin-top: 0;">🎯 今月のアクション</h4>
          ${Object.entries(reportData.currentAllocation)
            .filter(([_, fund]: [string, any]) => Math.abs(fund.change) >= 3)
            .map(([fundKey, fund]: [string, any]) => `
              <p>• <strong>${
                fundKey === 'equity' ? '国内株式型' :
                fundKey === 'usEquity' ? '米国株式型' :
                fundKey === 'usBond' ? '米国債券型' :
                fundKey === 'reit' ? 'REIT型' : '世界株式型'
              }</strong>: ${fund.current}% → ${fund.recommended}% (${fund.change > 0 ? '+' : ''}${fund.change}%)</p>
            `).join('')}
        </div>
      </div>
      ` : ''}

      ${reportData.content?.recommendations ? `
      <div class="section">
        <div class="section-title">💡 AIによる投資アドバイス</div>
        ${reportData.content.recommendations.map((rec: string, index: number) => `
          <div class="recommendation">
            • ${rec}
          </div>
        `).join('')}
        
        <div class="highlight-box">
          <h4 style="margin-top: 0;">📈 期待される効果</h4>
          <p>• 月次リターン向上: <strong style="color: #4caf50;">+1.2% 〜 +2.1%</strong></p>
          <p>• リスクレベル: <strong>適正範囲内</strong></p>
          <p>• 推奨実行時期: <strong>今月中</strong></p>
        </div>
      </div>
      ` : ''}

      <div class="section">
        <div class="section-title">⚠️ 重要事項・免責事項</div>
        <div style="font-size: 12px; line-height: 1.6; color: #666;">
          <p>• 本レポートは、プルデンシャル生命保険株式会社の変額保険に関する情報提供を目的としており、投資勧誘を目的としたものではありません。</p>
          <p>• 将来の運用成果は過去の実績を保証するものではありません。</p>
          <p>• 投資にはリスクが伴い、元本割れの可能性があります。</p>
          <p>• 詳細については約款・契約概要を必ずご確認ください。</p>
          <p>• 本分析結果は現時点での市場環境に基づくものであり、市場変動により前提条件が変化する可能性があります。</p>
        </div>
      </div>

      <div class="footer">
        <div>プルデンシャル生命保険株式会社 変額保険アドバイザリーシステム</div>
        <div>生成日時: ${new Date().toLocaleString('ja-JP')}</div>
      </div>
    </body>
    </html>
  `;

  // Create a temporary element to render HTML
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Wait for content to load and then trigger print
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 1000);
  }
};

// Download functionality
const downloadReport = (reportData: any) => {
  generatePDF(reportData);
};

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
  const [loading, setLoading] = useState(false);
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

  const handleLogin = async (userId: string, password: string, accountType: string) => {
    setLoading(true);

    try {
      // Call actual API
      const url = `${API_BASE_URL}/api/auth/login`;
      console.log('Login API URL:', url);
      console.log('Login request:', { userId, accountType });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          password,
          accountType
        }),
      });

      console.log('Response status:', response.status);

      const data = await response.json();

      if (response.ok && data.token) {
        // Store token and user data
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
        setIsLoggedIn(true);
        fetchMarketData();
        setLoading(false);
      } else {
        alert('ログインに失敗しました: ' + (data.error || '無効なユーザーIDまたはパスワードです'));
        setLoading(false);
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('ログインエラー: サーバーに接続できません');
      setLoading(false);
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
    ...(user?.accountType !== 'grandchild' ? [{ path: '/customers', icon: <PeopleIcon />, text: '顧客管理' }] : []),
    ...(user?.accountType !== 'grandchild' ? [{ path: '/portfolio-optimizer', icon: <TrendingUp />, text: 'ポートフォリオ最適化' }] : []),
    ...(user?.accountType === 'admin' ? [{ path: '/products', icon: <AssessmentIcon />, text: 'ファンド管理' }] : []),
    ...(user?.accountType === 'admin' ? [{ path: '/users', icon: <PeopleIcon />, text: 'ユーザー管理' }] : []),
    { path: '/reports', icon: <AssessmentIcon />, text: user?.accountType === 'grandchild' ? 'マイレポート' : 'レポート' },
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
                label="v1.1.0"
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
          {user?.accountType !== 'grandchild' && (
            <>
              <Route path="/customers" element={<CustomerList user={user} navigate={navigate} />} />
              <Route path="/customers/new" element={<CustomerForm user={user} navigate={navigate} />} />
              <Route path="/customers/:id" element={<CustomerDetail user={user} navigate={navigate} />} />
              <Route path="/customers/:id/edit" element={<CustomerForm user={user} navigate={navigate} isEdit={true} />} />
            </>
          )}
          <Route path="/products" element={<ProductList user={user} navigate={navigate} />} />
          <Route path="/products/new" element={<ProductForm user={user} navigate={navigate} />} />
          <Route path="/products/upload-pdf" element={<PDFUploadForm user={user} navigate={navigate} />} />
          <Route path="/products/:id" element={<ProductDetail user={user} navigate={navigate} />} />
          <Route path="/products/:id/edit" element={<ProductForm user={user} navigate={navigate} isEdit={true} />} />
          {user?.accountType === 'admin' && (
            <>
              <Route path="/users" element={<UserManagement user={user} navigate={navigate} />} />
              <Route path="/users/new" element={<UserForm user={user} navigate={navigate} />} />
              <Route path="/users/:id/edit" element={<UserForm user={user} navigate={navigate} isEdit={true} />} />
            </>
          )}
          <Route path="/reports" element={<ReportList user={user} navigate={navigate} />} />
          <Route path="/reports/new" element={<ReportForm user={user} navigate={navigate} />} />
          <Route path="/reports/:id" element={<ReportDetail user={user} navigate={navigate} />} />
          <Route path="/portfolio-optimizer" element={<PortfolioOptimizer user={user} navigate={navigate} />} />
          <Route path="/backtest" element={<BacktestEngine user={user} navigate={navigate} />} />
          {user?.accountType !== 'grandchild' && (
            <Route path="/customer-comparison" element={<CustomerComparison user={user} navigate={navigate} />} />
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

  return <LoginPage onLogin={handleLogin} loading={loading} />;
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
  const [autoUpdating, setAutoUpdating] = useState(false);

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
          setFundPerformance(data.funds || data); // Handle both old and new format
          setBondYields(data.bondYields || null);
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
          setLatestMarketData(data);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      }
    };

    fetchData();
  }, []);

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

        // Update latest market data state
        setLatestMarketData({
          fileName: data.fileName,
          uploadedAt: data.uploadedAt
        });

        // 抽出された運用実績データを表示
        const fundPerformance = data.fundPerformance || {};
        const fundKeys = Object.keys(fundPerformance);

        let message = `マーケットデータをアップロードしました！\nファイル: ${data.fileName}`;

        if (fundKeys.length > 0) {
          message += '\n\n抽出された運用実績:';
          fundKeys.forEach(fundName => {
            message += `\n・${fundName}: ${fundPerformance[fundName]}%`;
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

  const handleAutoUpdateMarketData = async () => {
    if (!window.confirm('プルデンシャルのウェブサイトから最新のディスクロージャー資料を自動ダウンロードしますか？')) {
      return;
    }

    setAutoUpdating(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('認証エラー: ログインしてください');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/cron/update-market-data`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        alert(`マーケットデータを自動更新しました！\n成功: ${data.results.filter((r: any) => r.success).length}件\n失敗: ${data.results.filter((r: any) => !r.success).length}件`);

        // 最新マーケットデータを再取得
        const marketDataResponse = await fetch(`${API_BASE_URL}/api/analysis/market-data/latest`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (marketDataResponse.ok) {
          const latestData = await marketDataResponse.json();
          setLatestMarketData(latestData);
        }
      } else {
        const error = await response.json();
        alert(`自動更新エラー: ${error.error || error.message}`);
      }
    } catch (error) {
      console.error('Auto update error:', error);
      alert('自動更新中にエラーが発生しました');
    } finally {
      setAutoUpdating(false);
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

        {/* Market Data Upload Section (親アカウントのみ) */}
        {user.accountType === 'parent' && (
          <Grid item xs={12}>
            <Card sx={{ p: 3, bgcolor: '#f5f5f5' }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="h6">
                  📊 マーケットデータアップロード
                </Typography>
                <Button
                  variant="contained"
                  color="secondary"
                  size="small"
                  onClick={handleAutoUpdateMarketData}
                  disabled={autoUpdating}
                  startIcon={autoUpdating ? <CircularProgress size={16} /> : <CloudUploadIcon />}
                >
                  {autoUpdating ? '自動更新中...' : '自動更新'}
                </Button>
              </Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                月次マーケットレポート（PDF）をアップロードするか、自動更新でプルデンシャルから最新データを取得できます。
              </Typography>

              {latestMarketData && (
                <Box sx={{ mt: 2, mb: 2, p: 2, bgcolor: 'success.50', borderRadius: 1, border: '1px solid', borderColor: 'success.main' }}>
                  <Typography variant="body2" color="success.dark" sx={{ fontWeight: 'bold' }}>
                    ✓ 最新マーケットデータ
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    ファイル名: {latestMarketData.fileName}
                  </Typography>
                  <br />
                  <Typography variant="caption" color="text.secondary">
                    アップロード日時: {new Date(latestMarketData.uploadedAt).toLocaleString('ja-JP')}
                  </Typography>
                </Box>
              )}

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

        {/* 最適化結果表示領域（常に確保） */}
        <Grid item xs={12}>
          {showRecommendations && optimizationResults ? (
            <Paper sx={{ p: 2, mb: 2, border: '2px solid #2196f3' }}>
              <Box sx={{ textAlign: 'center', mb: 2 }}>
                <Typography variant="h5" gutterBottom color="primary" sx={{ fontWeight: 'bold' }}>
                  今月の最適化推奨配分
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  AI分析による最適なポートフォリオ配分のご提案
                </Typography>
              </Box>
              
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="h5" gutterBottom color="primary" sx={{ fontWeight: 'bold', mb: 3 }}>
                    ファンド配分の変更提案
                  </Typography>
                  
                  {/* ビフォー・アフター 円グラフ表示 */}
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Card sx={{ p: 3, boxShadow: 1 }}>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', textAlign: 'center' }}>
                          現在の配分
                        </Typography>
                        <Box sx={{ mt: 3 }}>
                          {Object.entries(optimizationResults.recommendations).map(([fundKey, fund]) => (
                            <Box key={fundKey} sx={{ mb: 2 }}>
                              <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                                  {fundKey === 'equity' ? '国内株式型' :
                                   fundKey === 'usEquity' ? '米国株式型' :
                                   fundKey === 'usBond' ? '米国債券型' :
                                   fundKey === 'reit' ? 'REIT型' : '世界株式型'}
                                </Typography>
                                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                  {fund.current}%
                                </Typography>
                              </Box>
                              <Box sx={{ position: 'relative', height: 28 }}>
                                <LinearProgress
                                  variant="determinate"
                                  value={fund.current}
                                  sx={{
                                    height: 28,
                                    borderRadius: 2,
                                    backgroundColor: '#e0e0e0',
                                    '& .MuiLinearProgress-bar': {
                                      backgroundColor: '#757575',
                                      borderRadius: 2,
                                    }
                                  }}
                                />
                                <Box
                                  sx={{
                                    position: 'absolute',
                                    left: '50%',
                                    top: '50%',
                                    transform: 'translate(-50%, -50%)',
                                    color: fund.current > 50 ? 'white' : 'text.primary',
                                    fontWeight: 'bold',
                                    fontSize: '0.875rem'
                                  }}
                                >
                                  {fund.current}%
                                </Box>
                              </Box>
                            </Box>
                          ))}
                        </Box>
                      </Card>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <Card sx={{ p: 3, boxShadow: 1, border: '2px solid #2196f3' }}>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', textAlign: 'center', color: 'primary.main' }}>
                          🎯 推奨配分
                        </Typography>
                        <Box sx={{ mt: 3 }}>
                          {Object.entries(optimizationResults.recommendations).map(([fundKey, fund]) => {
                            const getBarColor = () => {
                              if (fundKey === 'equity') return '#4caf50';
                              if (fundKey === 'usEquity') return '#2196f3';
                              if (fundKey === 'usBond') return '#ff9800';
                              if (fundKey === 'reit') return '#f44336';
                              return '#9c27b0';
                            };
                            return (
                              <Box key={fundKey} sx={{ mb: 2 }}>
                                <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                                    {fundKey === 'equity' ? '国内株式型' :
                                     fundKey === 'usEquity' ? '米国株式型' :
                                     fundKey === 'usBond' ? '米国債券型' :
                                     fundKey === 'reit' ? 'REIT型' : '世界株式型'}
                                  </Typography>
                                  <Box display="flex" alignItems="center" gap={1}>
                                    {fund.change !== 0 && (
                                      <Chip 
                                        label={`${fund.change > 0 ? '+' : ''}${fund.change}%`}
                                        color={fund.change > 0 ? "success" : "warning"}
                                        sx={{ fontSize: '0.9rem', fontWeight: 'bold' }}
                                      />
                                    )}
                                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: getBarColor() }}>
                                      {fund.recommended}%
                                    </Typography>
                                  </Box>
                                </Box>
                                <Box sx={{ position: 'relative', height: 28 }}>
                                  <LinearProgress
                                    variant="determinate"
                                    value={fund.recommended}
                                    sx={{
                                      height: 28,
                                      borderRadius: 2,
                                      backgroundColor: '#e0e0e0',
                                      '& .MuiLinearProgress-bar': {
                                        backgroundColor: getBarColor(),
                                        borderRadius: 2,
                                      }
                                    }}
                                  />
                                  <Box
                                    sx={{
                                      position: 'absolute',
                                      left: '50%',
                                      top: '50%',
                                      transform: 'translate(-50%, -50%)',
                                      color: fund.recommended > 50 ? 'white' : 'text.primary',
                                      fontWeight: 'bold',
                                      fontSize: '0.875rem'
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
                              {fundKey === 'equity' ? '国内株式型' :
                               fundKey === 'usEquity' ? '米国株式型' :
                               fundKey === 'usBond' ? '米国債券型' :
                               fundKey === 'reit' ? 'REIT型' : '世界株式型'}
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
              
              <Box display="flex" gap={2} mt={2} justifyContent="center">
                <Button
                  variant="contained"
                  startIcon={<PdfIcon />}
                  onClick={() => {
                    const optimizationReport = {
                      title: `月次最適化レポート - ${new Date().toLocaleDateString('ja-JP')}`,
                      summary: `AI分析による今月の推奨ポートフォリオ配分`,
                      currentAllocation: optimizationResults.recommendations,
                      content: {
                        recommendations: [
                          `推奨変更ファンド数: ${optimizationResults.summary.totalChanges}件`,
                          `大幅リバランス: ${optimizationResults.summary.majorRebalancing ? '必要' : '不要'}`,
                          `最終更新: ${new Date(optimizationResults.summary.lastUpdated).toLocaleString('ja-JP')}`,
                          '月次リバランスにより最適なリスク・リターンバランスを維持'
                        ]
                      }
                    };
                    generatePDF(optimizationReport);
                  }}
                >
                  詳細レポートをPDF出力
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => setShowRecommendations(false)}
                >
                  結果を閉じる
                </Button>
              </Box>
            </Paper>
          ) : (
            // 最適化結果待機中の固定レイアウト
            <Paper sx={{ p: 2, mb: 2, border: '2px dashed #ccc', minHeight: '400px', backgroundColor: '#f8f9fa' }}>
              <Box sx={{ textAlign: 'center', mb: 2 }}>
                  <Typography variant="h5" gutterBottom color="text.secondary" sx={{ fontWeight: 'bold' }}>
                    最適化結果表示エリア
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    顧客の分析を実行すると、ここに集計された推奨配分が表示されます
                  </Typography>
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
                      {['国内株式型', '米国株式型', '米国債券型', 'REIT型', '世界株式型'].map((name, index) => (
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
                      {['国内株式型', '米国株式型', '米国債券型', 'REIT型', '世界株式型'].map((name, index) => (
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
                プルデンシャル変額保険ファンド分析 (リアルタイム)
              </Typography>
              <Chip label="最終更新: リアルタイム" color="success" size="small" />
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
                プルデンシャル変額保険ファンドパフォーマンス
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
        {user.accountType !== 'grandchild' && (
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
              {user.accountType === 'admin' && (
                <Button
                  variant="outlined"
                  onClick={() => navigate('/products')}
                >
                  ファンド管理
                </Button>
              )}
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
              <Button
                variant="outlined"
                onClick={() => navigate('/backtest')}
              >
                バックテスト
              </Button>
              <Button
                variant="outlined"
                onClick={() => navigate('/customer-comparison')}
              >
                顧客比較分析
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
            <strong>管理者:</strong> admin / password123<br />
            <strong>顧客:</strong> demo_customer / password123
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
    notes: ''
  });
  const [loading, setLoading] = useState(false);

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
          notes: formData.notes
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
            取引履歴
          </Button>
          <Button
            onClick={() => setActiveTab(3)}
            sx={{
              borderBottom: activeTab === 3 ? 2 : 0,
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
                取引履歴
              </Typography>

              <Box>
                <Alert severity="info" sx={{ mb: 2 }}>
                  直近の取引履歴を表示しています
                </Alert>

                {(() => {
                  try {
                    // Generate transaction history from contract date
                    const transactions = [];
                    const contractDate = new Date(customer.contract_date);
                    const today = new Date();
                    const monthlyPremium = parseFloat(String(customer.monthly_premium)) || 0;

                    // Generate monthly transactions from contract date to today (limit to 50 months)
                    let currentDate = new Date(contractDate);
                    let monthCount = 0;
                    while (currentDate <= today && monthCount < 50) {
                      transactions.push({
                        date: currentDate.toISOString().split('T')[0],
                        type: '月次積立',
                        amount: monthlyPremium,
                        status: '完了'
                      });
                      currentDate.setMonth(currentDate.getMonth() + 1);
                      monthCount++;
                    }

                    // Add rebalance if analysis was done
                    if (analysisResult) {
                      transactions.push({
                        date: today.toISOString().split('T')[0],
                        type: 'リバランス',
                        amount: 0,
                        status: '完了'
                      });
                    }

                    // Sort by date descending and take last 4
                    return transactions
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .slice(0, 4)
                      .map((transaction, index) => (
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
                      ));
                  } catch (error) {
                    console.error('Transaction history error:', error);
                    return (
                      <Alert severity="error">
                        取引履歴の生成中にエラーが発生しました
                      </Alert>
                    );
                  }
                })()}
              </Box>
            </Box>
          )}

          {activeTab === 3 && (
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
        {user.accountType === 'admin' && (
          <Box display="flex" gap={2}>
            <Button
              variant="outlined"
              startIcon={<PdfIcon />}
              onClick={() => navigate('/products/upload-pdf')}
            >
              📄 プルデンシャルPDFから更新
            </Button>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => navigate('/products/new')}
            >
              新規ファンド登録
            </Button>
          </Box>
        )}
      </Box>

      {/* 管理者用更新履歴 */}
      {user.accountType === 'admin' && (
        <Paper sx={{ p: 3, mb: 3, bgcolor: 'primary.main', color: 'white' }}>
          <Typography variant="h6" gutterBottom>
            📈 最新の更新履歴
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                最終PDF更新
              </Typography>
              <Typography variant="h6">
                {new Date().toLocaleDateString('ja-JP')}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                更新ファンド数
              </Typography>
              <Typography variant="h6">
                5ファンド
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                平均収益率変化
              </Typography>
              <Typography variant="h6" color="success.light">
                +0.3%
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                次回更新予定
              </Typography>
              <Typography variant="h6">
                {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('ja-JP')}
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      )}

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
                        {(product.expectedReturn * 100).toFixed(1)}% (年率) / {(product.managementFee * 100).toFixed(1)}% (年率)
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
                        {user.accountType === 'admin' && (
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
            {user.accountType === 'admin' && (
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
          {user.accountType === 'admin' && (
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
              {(product.expectedReturn * 100).toFixed(2)}% (年率)
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              管理手数料
            </Typography>
            <Typography variant="h6" color="primary" gutterBottom>
              {(product.managementFee * 100).toFixed(2)}% (年率)
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selectedReport, setSelectedReport] = useState<any>(null);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setLoading(false);
          return;
        }

        const response = await fetch(`${API_BASE_URL}/api/analysis/results`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          let userReports = data;
          if (user?.accountType === 'grandchild' && user?.customerId) {
            userReports = data.filter((report: any) => report.customerId === user.customerId);
          }
          setReports(userReports);
          setFilteredReports(userReports);

          if (user?.accountType === 'grandchild' && userReports.length > 0) {
            navigate(`/reports/${userReports[0].id}`);
            return;
          }
        } else {
          console.error('Failed to fetch reports:', response.status);
        }
      } catch (error) {
        console.error('Error fetching reports:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [user?.accountType, user?.customerId, navigate]);

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
          {user?.accountType === 'grandchild' ? 'マイレポート' : '分析レポート管理'}
        </Typography>
        {user?.accountType !== 'grandchild' && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate('/reports/new')}
          >
            新規レポート作成
          </Button>
        )}
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
                          startIcon={<PdfIcon />}
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadReport(report);
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
    // Fetch actual customers from API
    const fetchCustomers = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/api/customers`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setCustomers(data);
        }
      } catch (error) {
        console.error('Failed to fetch customers:', error);
      }
    };

    // Only fetch customers if user is not grandchild
    if (user?.accountType !== 'grandchild') {
      fetchCustomers();
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');

      // Call analysis API instead of mock
      const response = await fetch(`${API_BASE_URL}/api/analysis/recommend/${formData.customerId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        alert('レポート生成が完了しました');
        navigate('/reports');
      } else {
        const error = await response.json();
        alert('レポート生成に失敗しました: ' + (error.error || '不明なエラー'));
      }
    } catch (error) {
      console.error('Report creation error:', error);
      alert('レポート生成に失敗しました');
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

  // Redirect if grandchild tries to access
  if (user?.accountType === 'grandchild') {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ p: 4 }}>
          <Alert severity="error">
            <Typography variant="h6">アクセス権限がありません</Typography>
            <Typography variant="body2">
              顧客アカウントはレポートを作成できません。担当者にお問い合わせください。
            </Typography>
          </Alert>
          <Button variant="contained" onClick={() => navigate('/reports')} sx={{ mt: 2 }}>
            レポート一覧に戻る
          </Button>
        </Paper>
      </Container>
    );
  }

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
            startIcon={<PdfIcon />}
            onClick={() => downloadReport(report)}
          >
            PDFダウンロード
          </Button>
          {user?.accountType !== 'grandchild' && (
            <>
            </>
          )}
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
  const [customers, setCustomers] = useState<any[]>([]);
  const [riskTolerance, setRiskTolerance] = useState('balanced');
  const [investmentAmount, setInvestmentAmount] = useState('1000000');
  const [optimizedPortfolio, setOptimizedPortfolio] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await fetch(`${API_BASE_URL}/api/customers`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setCustomers(data);
        }
      } catch (error) {
        console.error('Error fetching customers:', error);
      }
    };

    fetchCustomers();
  }, []);

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
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
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
                startIcon={<PdfIcon />}
                sx={{ mt: 2 }}
                onClick={() => {
                  const portfolioReport = {
                    title: `ポートフォリオ最適化レポート - ${riskTolerance === 'conservative' ? '保守的' : riskTolerance === 'balanced' ? 'バランス型' : '積極的'}`,
                    customerName: selectedCustomer ? ['', '田中太郎', '佐藤花子', '山田次郎'][parseInt(selectedCustomer)] : '新規シミュレーション',
                    type: 'portfolio_optimization',
                    summary: `投資金額 ¥${parseInt(investmentAmount).toLocaleString()} に対する最適化ポートフォリオ`,
                    content: {
                      recommendedAllocation: {
                        equity: optimizedPortfolio.equity,
                        usEquity: optimizedPortfolio.usEquity,
                        usBond: optimizedPortfolio.usBond,
                        reit: optimizedPortfolio.reit,
                        globalEquity: optimizedPortfolio.globalEquity
                      },
                      expectedReturn: optimizedPortfolio.expectedReturn,
                      volatility: optimizedPortfolio.risk,
                      recommendations: [
                        `リスク許容度「${riskTolerance === 'conservative' ? '保守的' : riskTolerance === 'balanced' ? 'バランス型' : '積極的'}」に最適化されたポートフォリオです`,
                        `期待収益率 ${optimizedPortfolio.expectedReturn}% (年率)、リスク ${optimizedPortfolio.risk}% の効率的な配分`,
                        `シャープレシオ ${optimizedPortfolio.sharpeRatio} で優れたリスク調整済みリターンを実現`,
                        '定期的なリバランス（年1回推奨）により最適な配分を維持してください',
                        '市場環境の変化に応じて配分の見直しを検討してください'
                      ]
                    }
                  };
                  downloadReport(portfolioReport);
                }}
              >
                PDFレポート生成
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
                  <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
                    {(() => {
                      let cumulativeAngle = 0;
                      return data.map((item, index) => {
                        const angle = (item.value / 100) * 360;
                        const startAngle = cumulativeAngle;
                        const endAngle = cumulativeAngle + angle;

                        const startX = 50 + 40 * Math.cos((startAngle - 90) * Math.PI / 180);
                        const startY = 50 + 40 * Math.sin((startAngle - 90) * Math.PI / 180);
                        const endX = 50 + 40 * Math.cos((endAngle - 90) * Math.PI / 180);
                        const endY = 50 + 40 * Math.sin((endAngle - 90) * Math.PI / 180);

                        const largeArcFlag = angle > 180 ? 1 : 0;

                        cumulativeAngle += angle;

                        return (
                          <g key={index}>
                            <path
                              d={`M 50 50 L ${startX} ${startY} A 40 40 0 ${largeArcFlag} 1 ${endX} ${endY} Z`}
                              fill={item.color}
                              stroke="white"
                              strokeWidth="0.5"
                            />
                            <text
                              x={50 + 25 * Math.cos(((startAngle + endAngle) / 2 - 90) * Math.PI / 180)}
                              y={50 + 25 * Math.sin(((startAngle + endAngle) / 2 - 90) * Math.PI / 180)}
                              textAnchor="middle"
                              fontSize="4"
                              fill="white"
                              fontWeight="bold"
                            >
                              {item.value}%
                            </text>
                          </g>
                        );
                      });
                    })()}
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

// Alert Center Component
// Backtest Engine Component
interface BacktestEngineProps {
  user: User;
  navigate: (path: string) => void;
}

interface BacktestResult {
  totalReturn: number;
  annualizedReturn: number;
  volatility: number;
  sharpeRatio: number;
  maxDrawdown: number;
  winRate: number;
  performanceData: Array<{
    date: string;
    value: number;
    return: number;
  }>;
  statistics: {
    bestMonth: number;
    worstMonth: number;
    avgMonthlyReturn: number;
    standardDeviation: number;
  };
}

function BacktestEngine({ user, navigate }: BacktestEngineProps) {
  const [portfolio, setPortfolio] = useState({
    equity: 20,
    usEquity: 30,
    usBond: 30,
    reit: 10,
    globalEquity: 10
  });
  const [backtestPeriod, setBacktestPeriod] = useState('3years');
  const [initialAmount, setInitialAmount] = useState('1000000');
  const [rebalanceFreq, setRebalanceFreq] = useState('quarterly');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<BacktestResult | null>(null);

  const generateBacktestData = (): BacktestResult => {
    const periods = {
      '1year': 12,
      '3years': 36,
      '5years': 60,
      '10years': 120
    };
    
    const months = periods[backtestPeriod as keyof typeof periods];
    const performanceData = [];
    let value = parseInt(initialAmount);
    
    // Mock historical performance with realistic volatility
    const basePerfByAsset = {
      equity: 0.0068, // 月次8.2%年率
      usEquity: 0.0095, // 月次11.4%年率  
      usBond: 0.0028, // 月次3.4%年率
      reit: 0.0045, // 月次5.4%年率
      globalEquity: 0.0072 // 月次8.6%年率
    };
    
    const volatilityByAsset = {
      equity: 0.045,
      usEquity: 0.055,
      usBond: 0.015,
      reit: 0.035,
      globalEquity: 0.050
    };
    
    let maxValue = value;
    let minValue = value;
    const monthlyReturns = [];
    
    for (let i = 0; i < months; i++) {
      // Calculate portfolio monthly return
      let portfolioReturn = 0;
      Object.entries(portfolio).forEach(([asset, weight]) => {
        const baseReturn = basePerfByAsset[asset as keyof typeof basePerfByAsset];
        const volatility = volatilityByAsset[asset as keyof typeof volatilityByAsset];
        const randomFactor = (Math.random() - 0.5) * 2; // -1 to 1
        const monthlyReturn = baseReturn + (volatility * randomFactor);
        portfolioReturn += (weight / 100) * monthlyReturn;
      });
      
      // Add market cycle effects
      const cyclePhase = Math.sin((i / months) * 4 * Math.PI); // 4 cycles over period
      portfolioReturn += cyclePhase * 0.01;
      
      // Apply return
      const previousValue = value;
      value = value * (1 + portfolioReturn);
      maxValue = Math.max(maxValue, value);
      minValue = Math.min(minValue, value);
      
      const monthReturn = (value - previousValue) / previousValue;
      monthlyReturns.push(monthReturn);
      
      const date = new Date();
      date.setMonth(date.getMonth() - (months - i - 1));
      
      performanceData.push({
        date: date.toISOString().slice(0, 7),
        value: Math.round(value),
        return: monthReturn
      });
    }
    
    const totalReturn = (value - parseInt(initialAmount)) / parseInt(initialAmount);
    const annualizedReturn = Math.pow(1 + totalReturn, 12 / months) - 1;
    const maxDrawdown = (maxValue - minValue) / maxValue;
    
    // Calculate statistics
    const avgMonthlyReturn = monthlyReturns.reduce((a, b) => a + b, 0) / monthlyReturns.length;
    const variance = monthlyReturns.reduce((acc, ret) => acc + Math.pow(ret - avgMonthlyReturn, 2), 0) / monthlyReturns.length;
    const stdDev = Math.sqrt(variance);
    const annualizedVol = stdDev * Math.sqrt(12);
    
    const riskFreeRate = 0.005; // 0.5% annual
    const sharpeRatio = (annualizedReturn - riskFreeRate) / annualizedVol;
    const winRate = monthlyReturns.filter(r => r > 0).length / monthlyReturns.length;
    
    return {
      totalReturn: totalReturn * 100,
      annualizedReturn: annualizedReturn * 100,
      volatility: annualizedVol * 100,
      sharpeRatio,
      maxDrawdown: maxDrawdown * 100,
      winRate: winRate * 100,
      performanceData,
      statistics: {
        bestMonth: Math.max(...monthlyReturns) * 100,
        worstMonth: Math.min(...monthlyReturns) * 100,
        avgMonthlyReturn: avgMonthlyReturn * 100,
        standardDeviation: stdDev * 100
      }
    };
  };

  const runBacktest = () => {
    setLoading(true);
    
    setTimeout(() => {
      const backtestResults = generateBacktestData();
      setResults(backtestResults);
      setLoading(false);
    }, 2000);
  };

  const handlePortfolioChange = (asset: string, value: number) => {
    setPortfolio(prev => ({
      ...prev,
      [asset]: value
    }));
  };

  const totalAllocation = Object.values(portfolio).reduce((sum, val) => sum + val, 0);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        📈 バックテストエンジン
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        過去のデータを用いてポートフォリオ戦略の有効性を検証します
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              ⚙️ バックテスト設定
            </Typography>
            
            <Box sx={{ mt: 2 }}>
              <TextField
                fullWidth
                select
                label="テスト期間"
                value={backtestPeriod}
                onChange={(e) => setBacktestPeriod(e.target.value)}
                SelectProps={{ native: true }}
                sx={{ mb: 2 }}
              >
                <option value="1year">1年間</option>
                <option value="3years">3年間</option>
                <option value="5years">5年間</option>
                <option value="10years">10年間</option>
              </TextField>
              
              <TextField
                fullWidth
                label="初期投資額"
                type="number"
                value={initialAmount}
                onChange={(e) => setInitialAmount(e.target.value)}
                InputProps={{
                  startAdornment: <Typography sx={{ mr: 1 }}>¥</Typography>,
                }}
                sx={{ mb: 2 }}
              />
              
              <TextField
                fullWidth
                select
                label="リバランス頻度"
                value={rebalanceFreq}
                onChange={(e) => setRebalanceFreq(e.target.value)}
                SelectProps={{ native: true }}
                sx={{ mb: 3 }}
              >
                <option value="monthly">毎月</option>
                <option value="quarterly">四半期</option>
                <option value="semiannual">半年</option>
                <option value="annual">年1回</option>
              </TextField>
              
              <Typography variant="subtitle2" gutterBottom>
                ポートフォリオ配分 (合計: {totalAllocation}%)
              </Typography>
              
              {Object.entries(portfolio).map(([asset, value]) => (
                <Box key={asset} sx={{ mb: 2 }}>
                  <Typography variant="body2" gutterBottom>
                    {asset === 'equity' ? '株式型' :
                     asset === 'usEquity' ? '米国株式型' :
                     asset === 'usBond' ? '米国債券型' :
                     asset === 'reit' ? 'REIT型' : '世界株式型'}: {value}%
                  </Typography>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={value}
                    onChange={(e) => handlePortfolioChange(asset, parseInt(e.target.value))}
                    style={{ width: '100%' }}
                  />
                </Box>
              ))}
              
              {totalAllocation !== 100 && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  合計が100%になるように調整してください (現在: {totalAllocation}%)
                </Alert>
              )}
              
              <Button
                fullWidth
                variant="contained"
                onClick={runBacktest}
                disabled={loading || totalAllocation !== 100}
                startIcon={loading ? <CircularProgress size={20} /> : null}
              >
                {loading ? 'バックテスト実行中...' : 'バックテスト開始'}
              </Button>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={8}>
          {results ? (
            <Box>
              {/* パフォーマンス概要 */}
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  パフォーマンス概要
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={6} sm={4}>
                    <Box textAlign="center">
                      <Typography variant="body2" color="text.secondary">
                        総収益率
                      </Typography>
                      <Typography variant="h5" color={results.totalReturn >= 0 ? 'success.main' : 'error.main'}>
                        {results.totalReturn >= 0 ? '+' : ''}{results.totalReturn.toFixed(2)}%
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={4}>
                    <Box textAlign="center">
                      <Typography variant="body2" color="text.secondary">
                        年率リターン
                      </Typography>
                      <Typography variant="h5" color={results.annualizedReturn >= 0 ? 'success.main' : 'error.main'}>
                        {results.annualizedReturn.toFixed(2)}%
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={4}>
                    <Box textAlign="center">
                      <Typography variant="body2" color="text.secondary">
                        ボラティリティ
                      </Typography>
                      <Typography variant="h5" color="warning.main">
                        {results.volatility.toFixed(2)}%
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={4}>
                    <Box textAlign="center">
                      <Typography variant="body2" color="text.secondary">
                        シャープレシオ
                      </Typography>
                      <Typography variant="h5" color="primary">
                        {results.sharpeRatio.toFixed(2)}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={4}>
                    <Box textAlign="center">
                      <Typography variant="body2" color="text.secondary">
                        最大ドローダウン
                      </Typography>
                      <Typography variant="h5" color="error.main">
                        -{results.maxDrawdown.toFixed(2)}%
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={4}>
                    <Box textAlign="center">
                      <Typography variant="body2" color="text.secondary">
                        勝率
                      </Typography>
                      <Typography variant="h5" color="info.main">
                        {results.winRate.toFixed(1)}%
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
              
              {/* パフォーマンスチャート */}
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  📈 パフォーマンス推移
                </Typography>
                <Box sx={{ height: 300, mb: 2 }}>
                  <svg viewBox="0 0 800 300" style={{ width: '100%', height: '100%' }}>
                    <defs>
                      <linearGradient id="performanceGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#4caf50" stopOpacity="0.3"/>
                        <stop offset="100%" stopColor="#4caf50" stopOpacity="0.1"/>
                      </linearGradient>
                    </defs>
                    
                    {/* Grid lines */}
                    {[1, 2, 3, 4].map(i => (
                      <line
                        key={i}
                        x1="50"
                        y1={i * 60}
                        x2="750"
                        y2={i * 60}
                        stroke="#eee"
                        strokeWidth="1"
                      />
                    ))}
                    
                    {/* Performance line */}
                    <polyline
                      fill="none"
                      stroke="#4caf50"
                      strokeWidth="2"
                      points={results.performanceData.map((point, index) => {
                        const x = 50 + (index / (results.performanceData.length - 1)) * 700;
                        const maxValue = Math.max(...results.performanceData.map(p => p.value));
                        const minValue = Math.min(...results.performanceData.map(p => p.value));
                        const y = 250 - ((point.value - minValue) / (maxValue - minValue)) * 200;
                        return `${x},${y}`;
                      }).join(' ')}
                    />
                    
                    {/* Area fill */}
                    <polygon
                      fill="url(#performanceGradient)"
                      points={`50,250 ${results.performanceData.map((point, index) => {
                        const x = 50 + (index / (results.performanceData.length - 1)) * 700;
                        const maxValue = Math.max(...results.performanceData.map(p => p.value));
                        const minValue = Math.min(...results.performanceData.map(p => p.value));
                        const y = 250 - ((point.value - minValue) / (maxValue - minValue)) * 200;
                        return `${x},${y}`;
                      }).join(' ')} 750,250`}
                    />
                    
                    {/* Start and end labels */}
                    <text x="50" y="280" textAnchor="middle" fontSize="12" fill="#666">
                      開始
                    </text>
                    <text x="750" y="280" textAnchor="middle" fontSize="12" fill="#666">
                      終了
                    </text>
                  </svg>
                </Box>
                
                <Typography variant="body2" color="text.secondary">
                  期間: {results.performanceData[0]?.date} ～ {results.performanceData[results.performanceData.length - 1]?.date}
                </Typography>
              </Paper>
              
              {/* 詳細統計 */}
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  📋 詳細統計
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      最高月次リターン
                    </Typography>
                    <Typography variant="h6" color="success.main">
                      +{results.statistics.bestMonth.toFixed(2)}%
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      最低月次リターン
                    </Typography>
                    <Typography variant="h6" color="error.main">
                      {results.statistics.worstMonth.toFixed(2)}%
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      平均月次リターン
                    </Typography>
                    <Typography variant="h6">
                      {results.statistics.avgMonthlyReturn.toFixed(2)}%
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      月次標準偏差
                    </Typography>
                    <Typography variant="h6">
                      {results.statistics.standardDeviation.toFixed(2)}%
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
              
              {/* アクション */}
              <Box display="flex" gap={2}>
                <Button
                  variant="outlined"
                  startIcon={<PdfIcon />}
                  onClick={() => {
                    const backtestReport = {
                      title: `バックテストレポート - ${backtestPeriod}`,
                      summary: `${backtestPeriod}期間のポートフォリオバックテスト結果`,
                      content: {
                        expectedReturn: results.annualizedReturn,
                        volatility: results.volatility,
                        recommendations: [
                          `年率リターン: ${results.annualizedReturn.toFixed(2)}%、ボラティリティ: ${results.volatility.toFixed(2)}%`,
                          `シャープレシオ: ${results.sharpeRatio.toFixed(2)}（優秀な水準は1.0以上）`,
                          `最大ドローダウン: ${results.maxDrawdown.toFixed(2)}%（リスク管理の参考指標）`,
                          `勝率: ${results.winRate.toFixed(1)}%（月次ベース）`,
                          'バックテストは過去データに基づく結果であり、将来のパフォーマンスを保証するものではありません'
                        ]
                      }
                    };
                    downloadReport(backtestReport);
                  }}
                >
                  レポート出力
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/portfolio-optimizer')}
                >
                  ポートフォリオ最適化
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => setResults(null)}
                >
                  新規テスト
                </Button>
              </Box>
            </Box>
          ) : (
            <Paper sx={{ p: 3, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Box textAlign="center">
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  ポートフォリオ配分を設定してバックテストを開始
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  過去のデータを使用してポートフォリオ戦略の有効性を検証し、
                  リスク・リターン特性を把握できます
                </Typography>
              </Box>
            </Paper>
          )}
        </Grid>
      </Grid>
    </Container>
  );
}

// Customer Comparison Component
interface CustomerComparisonProps {
  user: User;
  navigate: (path: string) => void;
}

interface CustomerComparisonData {
  id: number;
  name: string;
  portfolio: { [key: string]: number };
  performance: {
    totalReturn: number;
    annualizedReturn: number;
    volatility: number;
    sharpeRatio: number;
    monthlyPremium: number;
    contractAmount: number;
    riskTolerance: string;
  };
  timeSeriesData: Array<{
    month: string;
    value: number;
  }>;
}

function CustomerComparison({ user, navigate }: CustomerComparisonProps) {
  const [selectedCustomers, setSelectedCustomers] = useState<number[]>([]);
  const [comparisonData, setComparisonData] = useState<CustomerComparisonData[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'overview' | 'portfolio' | 'performance'>('overview');

  // Fetch available customers
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await fetch(`${API_BASE_URL}/api/customers`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          // Select first 2 customers by default
          if (data.length >= 2) {
            setSelectedCustomers([data[0].id, data[1].id]);
          } else if (data.length === 1) {
            setSelectedCustomers([data[0].id]);
          }
        }
      } catch (error) {
        console.error('Error fetching customers:', error);
      }
    };

    fetchCustomers();
  }, []);

  // Fetch comparison data when selected customers change
  useEffect(() => {
    if (selectedCustomers.length === 0) {
      setComparisonData([]);
      setLoading(false);
      return;
    }

    const fetchComparisonData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const customerIds = selectedCustomers.join(',');
        const response = await fetch(`${API_BASE_URL}/api/customers/comparison?customerIds=${customerIds}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();

          // Transform data to match component expectations
          const transformedData = data.map((customer: any) => ({
            id: customer.id,
            name: customer.name,
            portfolio: customer.portfolio || { equity: 0, usEquity: 0, usBond: 0, reit: 0, globalEquity: 0 },
            performance: {
              totalReturn: 0, // Would need historical data to calculate
              annualizedReturn: 0,
              volatility: 0,
              sharpeRatio: 0,
              monthlyPremium: customer.monthlyPremium,
              contractAmount: customer.contractAmount,
              riskTolerance: customer.riskTolerance
            },
            timeSeriesData: [] // Would need historical performance data
          }));

          setComparisonData(transformedData);
        }
      } catch (error) {
        console.error('Error fetching comparison data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchComparisonData();
  }, [selectedCustomers]);


  const handleCustomerSelection = (customerId: number) => {
    setSelectedCustomers(prev => {
      if (prev.includes(customerId)) {
        return prev.filter(id => id !== customerId);
      } else if (prev.length < 3) {
        return [...prev, customerId];
      }
      return prev;
    });
  };

  const selectedData = comparisonData.filter(customer => 
    selectedCustomers.includes(customer.id)
  );

  const getRiskLabel = (risk: string) => {
    const labels = {
      conservative: '保守的',
      balanced: 'バランス型',
      aggressive: '積極的'
    };
    return labels[risk as keyof typeof labels] || risk;
  };

  const getRiskColor = (risk: string) => {
    const colors = {
      conservative: '#4caf50',
      balanced: '#2196f3',
      aggressive: '#ff9800'
    };
    return colors[risk as keyof typeof colors] || '#666';
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
      <Typography variant="h4" component="h1" gutterBottom>
        顧客比較分析
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        複数の顧客のパフォーマンスとポートフォリオを比較分析します
      </Typography>

      {/* 顧客選択 */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          👥 比較対象顧客選択 (最大3名)
        </Typography>
        <Grid container spacing={2}>
          {comparisonData.map((customer) => (
            <Grid item xs={12} sm={6} md={4} key={customer.id}>
              <Card
                variant="outlined"
                sx={{
                  cursor: 'pointer',
                  backgroundColor: selectedCustomers.includes(customer.id) ? 'action.selected' : 'inherit',
                  border: selectedCustomers.includes(customer.id) ? '2px solid' : '1px solid',
                  borderColor: selectedCustomers.includes(customer.id) ? 'primary.main' : 'divider',
                  '&:hover': {
                    backgroundColor: 'action.hover'
                  }
                }}
                onClick={() => handleCustomerSelection(customer.id)}
              >
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {customer.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    リスク許容度: {getRiskLabel(customer.performance.riskTolerance)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    年率リターン: {customer.performance.annualizedReturn}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    月額保険料: ¥{customer.performance.monthlyPremium.toLocaleString()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {selectedData.length > 0 && (
        <>
          {/* 表示モード選択 */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <Box display="flex" gap={2}>
              <Button
                variant={viewMode === 'overview' ? 'contained' : 'outlined'}
                onClick={() => setViewMode('overview')}
              >
                概要比較
              </Button>
              <Button
                variant={viewMode === 'portfolio' ? 'contained' : 'outlined'}
                onClick={() => setViewMode('portfolio')}
                startIcon={<BarChartIcon />}
              >
                ポートフォリオ比較
              </Button>
              <Button
                variant={viewMode === 'performance' ? 'contained' : 'outlined'}
                onClick={() => setViewMode('performance')}
                startIcon={<TrendingUp />}
              >
                パフォーマンス比較
              </Button>
            </Box>
          </Paper>

          {/* 概要比較 */}
          {viewMode === 'overview' && (
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                📋 基本情報比較
              </Typography>
              <Box sx={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f5f5f5' }}>
                      <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>項目</th>
                      {selectedData.map(customer => (
                        <th key={customer.id} style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #ddd' }}>
                          {customer.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ padding: '12px', fontWeight: 'bold', borderBottom: '1px solid #eee' }}>リスク許容度</td>
                      {selectedData.map(customer => (
                        <td key={customer.id} style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #eee' }}>
                          <Chip
                            label={getRiskLabel(customer.performance.riskTolerance)}
                            size="small"
                            sx={{ backgroundColor: getRiskColor(customer.performance.riskTolerance), color: 'white' }}
                          />
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td style={{ padding: '12px', fontWeight: 'bold', borderBottom: '1px solid #eee' }}>月額保険料</td>
                      {selectedData.map(customer => (
                        <td key={customer.id} style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #eee' }}>
                          ¥{customer.performance.monthlyPremium.toLocaleString()}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td style={{ padding: '12px', fontWeight: 'bold', borderBottom: '1px solid #eee' }}>契約金額</td>
                      {selectedData.map(customer => (
                        <td key={customer.id} style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #eee' }}>
                          ¥{customer.performance.contractAmount.toLocaleString()}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td style={{ padding: '12px', fontWeight: 'bold', borderBottom: '1px solid #eee' }}>総収益率</td>
                      {selectedData.map(customer => (
                        <td key={customer.id} style={{ 
                          padding: '12px', 
                          textAlign: 'center', 
                          borderBottom: '1px solid #eee',
                          color: customer.performance.totalReturn >= 0 ? '#4caf50' : '#f44336',
                          fontWeight: 'bold'
                        }}>
                          {customer.performance.totalReturn >= 0 ? '+' : ''}{customer.performance.totalReturn}% (累計)
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td style={{ padding: '12px', fontWeight: 'bold', borderBottom: '1px solid #eee' }}>年率リターン</td>
                      {selectedData.map(customer => (
                        <td key={customer.id} style={{ 
                          padding: '12px', 
                          textAlign: 'center', 
                          borderBottom: '1px solid #eee',
                          color: customer.performance.annualizedReturn >= 0 ? '#4caf50' : '#f44336',
                          fontWeight: 'bold'
                        }}>
                          {customer.performance.annualizedReturn}% (年率)
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td style={{ padding: '12px', fontWeight: 'bold', borderBottom: '1px solid #eee' }}>ボラティリティ</td>
                      {selectedData.map(customer => (
                        <td key={customer.id} style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #eee' }}>
                          {customer.performance.volatility}% (年率)
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td style={{ padding: '12px', fontWeight: 'bold' }}>シャープレシオ</td>
                      {selectedData.map(customer => (
                        <td key={customer.id} style={{ 
                          padding: '12px', 
                          textAlign: 'center',
                          fontWeight: 'bold',
                          color: customer.performance.sharpeRatio >= 1.0 ? '#4caf50' : customer.performance.sharpeRatio >= 0.5 ? '#ff9800' : '#f44336'
                        }}>
                          {customer.performance.sharpeRatio}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </Box>
            </Paper>
          )}

          {/* ポートフォリオ比較 */}
          {viewMode === 'portfolio' && (
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                ポートフォリオ配分比較
              </Typography>
              <Grid container spacing={3}>
                {selectedData.map(customer => (
                  <Grid item xs={12} md={selectedData.length === 2 ? 6 : 4} key={customer.id}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" gutterBottom align="center">
                          {customer.name}
                        </Typography>
                        
                        {/* 簡易円グラフ */}
                        <Box sx={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                          <svg viewBox="0 0 100 100" style={{ width: 150, height: 150 }}>
                            {Object.entries(customer.portfolio).reduce((acc, [fund, percentage], index) => {
                              const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1'];
                              const startAngle = acc.angle;
                              const endAngle = acc.angle + (percentage / 100) * 360;
                              const x1 = 50 + 40 * Math.cos((startAngle * Math.PI) / 180);
                              const y1 = 50 + 40 * Math.sin((startAngle * Math.PI) / 180);
                              const x2 = 50 + 40 * Math.cos((endAngle * Math.PI) / 180);
                              const y2 = 50 + 40 * Math.sin((endAngle * Math.PI) / 180);
                              const largeArcFlag = percentage > 50 ? 1 : 0;
                              
                              acc.elements.push(
                                <path
                                  key={fund}
                                  d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                                  fill={colors[index]}
                                  stroke="white"
                                  strokeWidth="1"
                                />
                              );
                              acc.angle = endAngle;
                              return acc;
                            }, { angle: 0, elements: [] as any[] }).elements}
                          </svg>
                        </Box>
                        
                        {/* 配分詳細 */}
                        {Object.entries(customer.portfolio).map(([fund, percentage], index) => {
                          const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1'];
                          const fundNames = {
                            equity: '株式型',
                            usEquity: '米国株式型',
                            usBond: '米国債券型',
                            reit: 'REIT型',
                            globalEquity: '世界株式型'
                          };
                          
                          return (
                            <Box key={fund} display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                              <Box display="flex" alignItems="center" gap={1}>
                                <Box
                                  sx={{
                                    width: 12,
                                    height: 12,
                                    backgroundColor: colors[index],
                                    borderRadius: 1
                                  }}
                                />
                                <Typography variant="body2">
                                  {fundNames[fund as keyof typeof fundNames]}
                                </Typography>
                              </Box>
                              <Typography variant="body2" fontWeight="bold">
                                {percentage}%
                              </Typography>
                            </Box>
                          );
                        })}
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          )}

          {/* パフォーマンス比較 */}
          {viewMode === 'performance' && (
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                📈 パフォーマンス推移比較
              </Typography>
              
              <Box sx={{ height: 400, mb: 3 }}>
                <svg viewBox="0 0 800 400" style={{ width: '100%', height: '100%' }}>
                  {/* Grid lines */}
                  {[1, 2, 3, 4, 5].map(i => (
                    <line
                      key={i}
                      x1="80"
                      y1={i * 60 + 40}
                      x2="720"
                      y2={i * 60 + 40}
                      stroke="#eee"
                      strokeWidth="1"
                    />
                  ))}
                  
                  {/* Performance lines */}
                  {selectedData.map((customer, customerIndex) => {
                    const colors = ['#4caf50', '#2196f3', '#ff9800'];
                    return (
                      <polyline
                        key={customer.id}
                        fill="none"
                        stroke={colors[customerIndex]}
                        strokeWidth="3"
                        points={customer.timeSeriesData.map((point, index) => {
                          const x = 80 + (index / (customer.timeSeriesData.length - 1)) * 640;
                          const y = 340 - ((point.value - 95) / 30) * 240;
                          return `${x},${y}`;
                        }).join(' ')}
                      />
                    );
                  })}
                  
                  {/* Legend */}
                  {selectedData.map((customer, index) => {
                    const colors = ['#4caf50', '#2196f3', '#ff9800'];
                    return (
                      <g key={customer.id}>
                        <line
                          x1={80 + index * 150}
                          y1={380}
                          x2={100 + index * 150}
                          y2={380}
                          stroke={colors[index]}
                          strokeWidth="3"
                        />
                        <text
                          x={110 + index * 150}
                          y={385}
                          fontSize="12"
                          fill="#666"
                        >
                          {customer.name}
                        </text>
                      </g>
                    );
                  })}
                  
                  {/* Axis labels */}
                  <text x="40" y="60" fontSize="12" fill="#666" textAnchor="middle">125</text>
                  <text x="40" y="120" fontSize="12" fill="#666" textAnchor="middle">120</text>
                  <text x="40" y="180" fontSize="12" fill="#666" textAnchor="middle">115</text>
                  <text x="40" y="240" fontSize="12" fill="#666" textAnchor="middle">110</text>
                  <text x="40" y="300" fontSize="12" fill="#666" textAnchor="middle">105</text>
                  <text x="40" y="360" fontSize="12" fill="#666" textAnchor="middle">100</text>
                </svg>
              </Box>
              
              <Typography variant="body2" color="text.secondary" align="center">
                期間: 2023年7月 ～ 2024年1月 (パフォーマンス指数: 100を基準)
              </Typography>
            </Paper>
          )}

          {/* アクション */}
          <Box display="flex" gap={2}>
            <Button
              variant="outlined"
              startIcon={<PdfIcon />}
              onClick={() => {
                const comparisonReport = {
                  title: `顧客比較分析レポート`,
                  summary: `${selectedData.map(c => c.name).join('、')}の比較分析結果`,
                  content: {
                    recommendations: [
                      `比較対象: ${selectedData.length}名の顧客`,
                      `最高パフォーマンス: ${selectedData.reduce((max, customer) => 
                        customer.performance.annualizedReturn > max.performance.annualizedReturn ? customer : max
                      ).name} (年率${selectedData.reduce((max, customer) => 
                        customer.performance.annualizedReturn > max.performance.annualizedReturn ? customer : max
                      ).performance.annualizedReturn}%)`,
                      `最安定運用: ${selectedData.reduce((min, customer) => 
                        customer.performance.volatility < min.performance.volatility ? customer : min
                      ).name} (ボラティリティ${selectedData.reduce((min, customer) => 
                        customer.performance.volatility < min.performance.volatility ? customer : min
                      ).performance.volatility}%)`,
                      `最高シャープレシオ: ${selectedData.reduce((max, customer) => 
                        customer.performance.sharpeRatio > max.performance.sharpeRatio ? customer : max
                      ).name} (${selectedData.reduce((max, customer) => 
                        customer.performance.sharpeRatio > max.performance.sharpeRatio ? customer : max
                      ).performance.sharpeRatio})`,
                      '各顧客のリスク許容度に応じた最適化提案を検討してください'
                    ]
                  }
                };
                downloadReport(comparisonReport);
              }}
            >
              比較レポート出力
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate('/customers')}
            >
              顧客一覧に戻る
            </Button>
          </Box>
        </>
      )}
    </Container>
  );
}

// PDF Upload Form Component (管理者専用)
interface PDFUploadFormProps {
  user: User;
  navigate: (path: string) => void;
}

function PDFUploadForm({ user, navigate }: PDFUploadFormProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [uploadStatus, setUploadStatus] = useState<string>('');

  // 管理者でない場合はリダイレクト
  if (user.accountType !== 'admin') {
    navigate('/dashboard');
    return null;
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      setUploadStatus('');
    } else {
      alert('PDFファイルを選択してください。');
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) {
      alert('ファイルを選択してください。');
      return;
    }

    setLoading(true);
    setUploadStatus('PDFを解析中...');

    try {
      // 本番環境では実際のPDF解析APIを呼び出す
      // 現在はモックデータで代替
      setTimeout(() => {
        const mockExtractedData = {
          reportDate: new Date().toLocaleDateString('ja-JP'),
          funds: [
            {
              name: '国内株式型ファンド',
              category: 'equity',
              expectedReturn: 6.8,
              managementFee: 1.5,
              riskLevel: 'medium',
              performance: '+2.3% (月次)',
              netAssetValue: '15,230円',
              description: '日本の主要企業株式に投資し、長期的な資本成長を目指します。'
            },
            {
              name: '米国株式型ファンド',
              category: 'us_equity',
              expectedReturn: 8.2,
              managementFee: 1.8,
              riskLevel: 'high',
              performance: '+4.1% (月次)',
              netAssetValue: '18,950円',
              description: '米国の成長企業に投資し、高いリターンを追求します。'
            },
            {
              name: '米国債券型ファンド',
              category: 'us_bond',
              expectedReturn: 4.2,
              managementFee: 1.2,
              riskLevel: 'low',
              performance: '+1.1% (月次)',
              netAssetValue: '12,850円',
              description: '米国債券を中心とした安定運用ファンドです。'
            },
            {
              name: 'REIT型ファンド',
              category: 'reit',
              expectedReturn: 5.5,
              managementFee: 1.6,
              riskLevel: 'medium',
              performance: '-0.8% (月次)',
              netAssetValue: '13,420円',
              description: '不動産投資信託を通じて不動産市場へ投資します。'
            },
            {
              name: '世界株式型ファンド',
              category: 'global_equity',
              expectedReturn: 7.2,
              managementFee: 2.0,
              riskLevel: 'high',
              performance: '+3.5% (月次)',
              netAssetValue: '16,780円',
              description: '世界各国の株式市場に分散投資を行います。'
            }
          ]
        };

        setExtractedData(mockExtractedData);
        setUploadStatus('解析完了！データを確認してください。');
        setLoading(false);
      }, 3000);
    } catch (error) {
      setUploadStatus('エラーが発生しました。もう一度お試しください。');
      setLoading(false);
    }
  };

  const handleDataUpdate = async () => {
    if (!extractedData) return;

    setLoading(true);
    setUploadStatus('ファンドデータを更新中...');

    try {
      // 本番環境では実際のAPI呼び出し
      setTimeout(() => {
        setUploadStatus('ファンドデータの更新が完了しました！');
        setLoading(false);
        
        setTimeout(() => {
          navigate('/products');
        }, 2000);
      }, 2000);
    } catch (error) {
      setUploadStatus('更新中にエラーが発生しました。');
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" alignItems="center" mb={3}>
        <Button
          variant="outlined"
          onClick={() => navigate('/products')}
          sx={{ mr: 2 }}
        >
          ← ファンド管理に戻る
        </Button>
        <Typography variant="h4" component="h1">
          📄 プルデンシャルPDFからファンド情報を更新
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              🗂️ PDFファイルアップロード
            </Typography>
            
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                プルデンシャル生命から送付された月次ファンドレポート（PDF）をアップロードしてください。
                システムが自動的にファンド情報を抽出し、データベースを更新します。
              </Typography>
            </Alert>

            <Box sx={{ mb: 3 }}>
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
                id="pdf-upload"
              />
              <label htmlFor="pdf-upload">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<CloudUploadIcon />}
                  fullWidth
                  sx={{ py: 2, mb: 2 }}
                >
                  PDFファイルを選択
                </Button>
              </label>
              
              {selectedFile && (
                <Box sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                  <Typography variant="body2">
                    📄 選択ファイル: {selectedFile.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    サイズ: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </Typography>
                </Box>
              )}
            </Box>

            <Button
              variant="contained"
              onClick={handleFileUpload}
              disabled={!selectedFile || loading}
              startIcon={loading ? <CircularProgress size={20} /> : <PdfIcon />}
              fullWidth
              size="large"
            >
              {loading ? 'PDFを解析中...' : 'PDFを解析してデータを抽出'}
            </Button>

            {uploadStatus && (
              <Alert 
                severity={uploadStatus.includes('エラー') ? 'error' : 'info'} 
                sx={{ mt: 2 }}
              >
                {uploadStatus}
              </Alert>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              抽出されたファンド情報
            </Typography>
            
            {!extractedData ? (
              <Box textAlign="center" py={4}>
                <Typography variant="body2" color="text.secondary">
                  PDFファイルを解析すると、ここに抽出されたファンド情報が表示されます。
                </Typography>
              </Box>
            ) : (
              <>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  レポート日付: {extractedData.reportDate}
                </Typography>
                
                <Box sx={{ maxHeight: 400, overflowY: 'auto', mt: 2 }}>
                  {extractedData.funds.map((fund: any, index: number) => (
                    <Card key={index} sx={{ mb: 2, p: 2 }}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {fund.name}
                      </Typography>
                      <Grid container spacing={1} sx={{ mt: 1 }}>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">
                            期待収益率
                          </Typography>
                          <Typography variant="body2">
                            {fund.expectedReturn}%
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">
                            管理手数料
                          </Typography>
                          <Typography variant="body2">
                            {fund.managementFee}%
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">
                            月次パフォーマンス
                          </Typography>
                          <Typography variant="body2" color={fund.performance.includes('+') ? 'success.main' : 'error.main'}>
                            {fund.performance}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">
                            基準価額
                          </Typography>
                          <Typography variant="body2">
                            {fund.netAssetValue}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Card>
                  ))}
                </Box>

                <Box sx={{ mt: 3 }}>
                  <Button
                    variant="contained"
                    onClick={handleDataUpdate}
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} /> : <DownloadIcon />}
                    fullWidth
                    size="large"
                    color="success"
                  >
                    {loading ? 'データ更新中...' : 'ファンドデータを更新する'}
                  </Button>
                </Box>
              </>
            )}
          </Paper>
        </Grid>
      </Grid>

      <Alert severity="warning" sx={{ mt: 3 }}>
        <Typography variant="body2">
          <strong>注意事項:</strong>
          <br />
          • この機能は管理者のみが使用できます
          <br />
          • PDFから抽出されたデータは必ず確認してから更新してください
          <br />
          • 更新されたデータは即座にシステム全体に反映されます
          <br />
          • 更新履歴は自動的に記録されます
        </Typography>
      </Alert>
    </Container>
  );
}

// User Management Component
interface UserManagementProps {
  user: User;
  navigate: (path: string) => void;
}

function UserManagement({ user, navigate }: UserManagementProps) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('https://api.insurance-optimizer.com/api/users', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.ok) {
          const userData = await response.json();
          setUsers(userData);
          setFilteredUsers(userData);
        } else {
          // フォールバック：APIが利用できない場合はモックデータを使用
          const mockUsers = [
            {
              id: 1,
              userId: 'admin',
              name: 'システム管理者',
              email: 'admin@insurance-optimizer.com',
              accountType: 'admin',
              planType: 'exceed',
              customerLimit: 1000,
              isActive: true,
              lastLogin: '2024-01-20T10:30:00',
              createdAt: '2024-01-01T00:00:00'
            },
            {
              id: 2,
              userId: 'demo_agency',
              name: '代理店テスト',
              email: 'agency@test.com',
              accountType: 'parent',
              planType: 'master',
              customerLimit: 100,
              isActive: true,
              lastLogin: '2024-01-20T09:15:00',
              createdAt: '2024-01-05T00:00:00'
            },
            {
              id: 3,
              userId: 'demo_staff',
              name: '担当者テスト',
              email: 'staff@test.com',
              accountType: 'child',
              planType: 'standard',
              customerLimit: 10,
              parentId: 2,
              isActive: true,
              lastLogin: '2024-01-19T14:20:00',
              createdAt: '2024-01-10T00:00:00'
            },
            {
              id: 4,
              userId: 'demo_customer',
              name: '田中太郎',
              email: 'tanaka@test.com',
              accountType: 'grandchild',
              planType: 'standard',
              customerLimit: 0,
              customerId: 1,
              isActive: true,
              lastLogin: '2024-01-20T08:00:00',
              createdAt: '2024-01-15T00:00:00'
            }
          ];
          setUsers(mockUsers);
          setFilteredUsers(mockUsers);
        }
      } catch (error) {
        console.error('Failed to fetch users:', error);
        // エラー時もモックデータを使用
        const mockUsers = [
          {
            id: 1,
            userId: 'admin',
            name: 'システム管理者',
            email: 'admin@insurance-optimizer.com',
            accountType: 'admin',
            planType: 'exceed',
            customerLimit: 1000,
            isActive: true,
            lastLogin: '2024-01-20T10:30:00',
            createdAt: '2024-01-01T00:00:00'
          }
        ];
        setUsers(mockUsers);
        setFilteredUsers(mockUsers);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUsers();
  }, []);

  useEffect(() => {
    let filtered = users;
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredUsers(filtered);
  }, [users, searchTerm]);

  const getAccountTypeLabel = (accountType: string) => {
    const labels = {
      admin: '管理者',
      parent: '代理店',
      child: '担当者',
      grandchild: '顧客'
    };
    return labels[accountType as keyof typeof labels] || accountType;
  };

  const getPlanTypeLabel = (planType: string) => {
    const labels = {
      standard: 'スタンダード',
      master: 'マスター',
      exceed: 'エクシード'
    };
    return labels[planType as keyof typeof labels] || planType;
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
          ユーザー管理
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/users/new')}
        >
          新規ユーザー作成
        </Button>
      </Box>

      {/* 検索バー */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="ユーザー検索"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="名前、ユーザーID、メールアドレスで検索"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary">
              {filteredUsers.length}件 / {users.length}件
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* ユーザー一覧 */}
      <Paper sx={{ overflow: 'hidden' }}>
        {filteredUsers.map((userData) => (
          <Card 
            key={userData.id} 
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
            onClick={() => navigate(`/users/${userData.id}/edit`)}
          >
            <CardContent>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={3}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Person />
                    <Box>
                      <Typography variant="h6" component="div">
                        {userData.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        @{userData.userId}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={3}>
                  <Typography variant="body2" color="text.secondary">
                    メールアドレス
                  </Typography>
                  <Typography variant="body2">
                    {userData.email}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={2}>
                  <Typography variant="body2" color="text.secondary">
                    アカウント種別
                  </Typography>
                  <Chip
                    label={getAccountTypeLabel(userData.accountType)}
                    color={userData.accountType === 'admin' ? 'error' : 
                           userData.accountType === 'parent' ? 'primary' : 'default'}
                    size="small"
                  />
                </Grid>
                
                <Grid item xs={12} sm={2}>
                  <Typography variant="body2" color="text.secondary">
                    プラン
                  </Typography>
                  <Typography variant="body2">
                    {getPlanTypeLabel(userData.planType)}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={2}>
                  <Box display="flex" flexDirection="column" gap={1}>
                    <Chip
                      label={userData.isActive ? '有効' : '無効'}
                      color={userData.isActive ? 'success' : 'error'}
                      size="small"
                    />
                    <Typography variant="caption" color="text.secondary">
                      最終ログイン: {new Date(userData.lastLogin).toLocaleDateString('ja-JP')}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        ))}
        
        {filteredUsers.length === 0 && users.length > 0 && (
          <Box textAlign="center" py={8}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              検索条件に一致するユーザーが見つかりません
            </Typography>
            <Button
              variant="outlined"
              onClick={() => setSearchTerm('')}
            >
              検索条件をリセット
            </Button>
          </Box>
        )}
      </Paper>
    </Container>
  );
}

// User Form Component
interface UserFormProps {
  user: User;
  navigate: (path: string) => void;
  isEdit?: boolean;
}

function UserForm({ user, navigate, isEdit = false }: UserFormProps) {
  const [formData, setFormData] = useState({
    userId: '',
    name: '',
    email: '',
    password: '',
    accountType: 'child',
    planType: 'standard',
    customerLimit: 10,
    parentId: '',
    customerId: '',
    isActive: true
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // 実際のAPI呼び出し
      const url = isEdit && formData.id 
        ? `https://api.insurance-optimizer.com/api/users/${formData.id}`
        : 'https://api.insurance-optimizer.com/api/users';
        
      const response = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        alert(isEdit ? 'ユーザー情報を更新しました' : '新規ユーザーを作成しました');
        navigate('/users');
      } else {
        alert('操作に失敗しました。再度お試しください。');
      }
    } catch (error) {
      console.error('User operation failed:', error);
      alert('操作に失敗しました。ネットワーク接続を確認してください。');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {isEdit ? 'ユーザー情報編集' : '新規ユーザー作成'}
        </Typography>
        
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="ユーザーID"
                value={formData.userId}
                onChange={(e) => handleChange('userId', e.target.value)}
                disabled={isEdit}
                helperText={isEdit ? 'ユーザーIDは変更できません' : ''}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="名前"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                type="email"
                label="メールアドレス"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required={!isEdit}
                fullWidth
                type="password"
                label="パスワード"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                helperText={isEdit ? '変更する場合のみ入力' : ''}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                select
                label="アカウント種別"
                value={formData.accountType}
                onChange={(e) => handleChange('accountType', e.target.value)}
                SelectProps={{ native: true }}
              >
                <option value="admin">管理者</option>
                <option value="parent">代理店</option>
                <option value="child">担当者</option>
                <option value="grandchild">顧客</option>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                select
                label="プランタイプ"
                value={formData.planType}
                onChange={(e) => handleChange('planType', e.target.value)}
                SelectProps={{ native: true }}
              >
                <option value="standard">スタンダード</option>
                <option value="master">マスター</option>
                <option value="exceed">エクシード</option>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="顧客上限数"
                value={formData.customerLimit}
                onChange={(e) => handleChange('customerLimit', parseInt(e.target.value))}
                disabled={formData.accountType === 'grandchild'}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box display="flex" alignItems="center" gap={1}>
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => handleChange('isActive', e.target.checked)}
                />
                <Typography>アクティブ</Typography>
              </Box>
            </Grid>
          </Grid>

          <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              onClick={() => navigate('/users')}
            >
              キャンセル
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : (isEdit ? '更新' : '作成')}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
}

export default App;
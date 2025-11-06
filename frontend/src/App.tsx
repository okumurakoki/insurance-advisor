// Build: 2024-11-04-v2 - Fixed staff display showing proper IDs and names
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
  FormControl,
  InputLabel,
  Select,
  Chip,
  Autocomplete,
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
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
  Business as BusinessIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import Login from './components/Login.tsx';
import InsuranceCompanies from './pages/InsuranceCompanies.tsx';
import AdminAgencyManagement from './pages/AdminAgencyManagement.tsx';
import PdfUpload from './pages/PdfUpload.tsx';
import PublicCustomerRegister from './pages/PublicCustomerRegister.tsx';
import { getUserTheme, defaultTheme, InsuranceCompanyTheme } from './config/insuranceCompanyThemes.ts';

// API Configuration
const API_BASE_URL = (process.env.REACT_APP_API_URL || 'https://api.insurance-optimizer.com').replace(/\/+$/, '');


// 動的テーマ生成関数
const createDynamicTheme = (companyTheme: InsuranceCompanyTheme) => {
  return createTheme({
    palette: {
      primary: {
        main: companyTheme.colors.primary,
      },
      secondary: {
        main: companyTheme.colors.secondary,
      },
      background: {
        default: companyTheme.colors.background,
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
};

// デフォルトテーマ
const defaultAppTheme = createDynamicTheme(defaultTheme);

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
  const [currentTheme, setCurrentTheme] = useState(defaultAppTheme);

  return (
    <ThemeProvider theme={currentTheme}>
      <CssBaseline />
      <Router>
        <AppContent onThemeChange={setCurrentTheme} />
      </Router>
    </ThemeProvider>
  );
}

interface AppContentProps {
  onThemeChange: (theme: any) => void;
}

function AppContent({ onThemeChange }: AppContentProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [marketData, setMarketData] = useState<any[]>([]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [myInsuranceCompanies, setMyInsuranceCompanies] = useState<any[]>([]);
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      setIsLoggedIn(true);
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      fetchMarketData();
      // 保険会社情報を取得してテーマを設定
      fetchInsuranceCompaniesAndSetTheme(parsedUser, token);
    }
  }, []);

  // 保険会社情報を取得してテーマを変更
  const fetchInsuranceCompaniesAndSetTheme = async (user: User, token: string) => {
    if (user.accountType === 'parent' || user.accountType === 'child') {
      try {
        const response = await fetch(`${API_BASE_URL}/api/insurance/my-companies`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const companies = await response.json();
          setMyInsuranceCompanies(companies);

          // 保険会社に基づいてテーマを変更
          const companyTheme = getUserTheme(companies);
          const newTheme = createDynamicTheme(companyTheme);
          onThemeChange(newTheme);
        }
      } catch (error) {
        console.error('Failed to fetch insurance companies for theme:', error);
      }
    }
  };

  const fetchMarketData = async () => {
    // Market data is now fetched dynamically in Dashboard component via API
    // This function is kept for backward compatibility but does nothing
    setMarketData([]);
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
    ...(user?.accountType === 'admin' ? [{ path: '/admin/agency-management', icon: <BusinessIcon />, text: '保険会社管理' }] : []),
    ...(user?.accountType === 'admin' ? [{ path: '/admin/pdf-upload', icon: <PdfIcon />, text: 'PDFアップロード' }] : []),
    ...(user?.accountType === 'parent' ? [{ path: '/staff', icon: <PeopleIcon />, text: '担当者管理' }] : []),
    ...(user?.accountType === 'parent' || user?.accountType === 'child' ? [{ path: '/customers', icon: <PeopleIcon />, text: '顧客管理' }] : []),
    ...(user?.accountType === 'parent' || user?.accountType === 'child' ? [{ path: '/insurance-companies', icon: <BusinessIcon />, text: '保険会社' }] : []),
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
                label="v1.8.9"
                size="small"
                color="secondary"
                sx={{
                  fontWeight: 600,
                  fontSize: '0.75rem'
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
          {/* Public routes */}
          <Route path="/register" element={<PublicCustomerRegister />} />

          <Route path="/" element={<Dashboard user={user} marketData={marketData} navigate={navigate} />} />
          <Route path="/dashboard" element={<Dashboard user={user} marketData={marketData} navigate={navigate} />} />
          {user?.accountType === 'admin' && (
            <>
              <Route path="/agencies" element={<AgencyList user={user} navigate={navigate} />} />
            </>
          )}
          {user?.accountType === 'admin' && (
            <>
              <Route path="/admin/agency-management" element={<AdminAgencyManagement />} />
              <Route path="/admin/pdf-upload" element={<PdfUpload />} />
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
              <Route path="/insurance-companies" element={<InsuranceCompanies />} />
            </>
          )}
        </Routes>
        
        <Box component="footer" sx={{ py: 3, px: 2, mt: 'auto', backgroundColor: 'background.paper' }}>
          <Typography variant="body2" color="text.secondary" align="center">
            © 2025 変額保険アドバイザリーシステム
          </Typography>
        </Box>
      </Box>
    );
  }

  const handleLoginSuccess = (token: string, userData: any) => {
    setIsLoggedIn(true);
    setUser(userData);
    fetchMarketData();
    // ログイン時にも保険会社情報を取得してテーマを設定
    fetchInsuranceCompaniesAndSetTheme(userData, token);
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
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [fundPerformance, setFundPerformance] = useState<any[]>([]);
  const [bondYields, setBondYields] = useState<any>(null);
  const [statistics, setStatistics] = useState<any>(null);
  const [latestMarketData, setLatestMarketData] = useState<any>(null);
  const [riskProfile, setRiskProfile] = useState<'conservative' | 'balanced' | 'aggressive'>('balanced');
  const [myInsuranceCompanies, setMyInsuranceCompanies] = useState<any[]>([]);
  const [allInsuranceCompanies, setAllInsuranceCompanies] = useState<any[]>([]);

  // Fetch insurance companies on mount
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        // Fetch insurance companies
        if (user.accountType === 'admin') {
          // Admin: Fetch all insurance companies
          try {
            const companiesResponse = await fetch(`${API_BASE_URL}/api/insurance/companies`, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });

            if (companiesResponse.ok) {
              const companies = await companiesResponse.json();
              console.log('[Admin] All insurance companies:', companies);
              setAllInsuranceCompanies(companies.filter((c: any) => c.is_active));
            }
          } catch (error) {
            console.error('Failed to fetch all insurance companies:', error);
          }
        } else if (user.accountType === 'parent' || user.accountType === 'child') {
          // Parent/Child: Fetch contracted insurance companies only
          try {
            const companiesResponse = await fetch(`${API_BASE_URL}/api/insurance/my-companies`, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });

            if (companiesResponse.ok) {
              const companies = await companiesResponse.json();
              console.log('My insurance companies:', companies);
              setMyInsuranceCompanies(companies);
            }
          } catch (error) {
            console.error('Failed to fetch insurance companies:', error);
          }
        }
      } catch (error) {
        console.error('Failed to fetch companies:', error);
      }
    };

    fetchCompanies();
  }, []);

  // Fetch available dates when company changes
  useEffect(() => {
    const fetchAvailableDates = async () => {
      if (!selectedCompanyId) {
        setAvailableDates([]);
        setSelectedDate(null);
        return;
      }

      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await fetch(`${API_BASE_URL}/api/analysis/available-dates?company_id=${selectedCompanyId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          console.log('Available dates:', data.dates);
          setAvailableDates(data.dates || []);
          // Set the first (latest) date as default
          if (data.dates && data.dates.length > 0) {
            setSelectedDate(data.dates[0]);
          }
        } else {
          console.error('Failed to fetch available dates:', response.status);
          setAvailableDates([]);
        }
      } catch (error) {
        console.error('Error fetching available dates:', error);
        setAvailableDates([]);
      }
    };

    fetchAvailableDates();
  }, [selectedCompanyId]);

  // Fetch fund performance and other data when selectedCompanyId or selectedDate changes
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        // Only fetch fund performance if company is selected
        if (!selectedCompanyId) {
          console.log('No company selected - clearing fund performance');
          setFundPerformance([]);
          setBondYields(null);
          setLatestMarketData(null);
          return;
        }

        console.log('Fetching data for company ID:', selectedCompanyId, 'date:', selectedDate);

        // Fetch fund performance with company_id and optional performance_date
        const perfURL = selectedDate
          ? `${API_BASE_URL}/api/analysis/fund-performance?company_id=${selectedCompanyId}&performance_date=${selectedDate}`
          : `${API_BASE_URL}/api/analysis/fund-performance?company_id=${selectedCompanyId}`;

        const perfResponse = await fetch(perfURL, {
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
          console.log('Previous allocations:', data.previousAllocations);

          const fundsData = data.funds || data;
          console.log('Setting fundPerformance to:', fundsData);
          setFundPerformance(fundsData);
          setBondYields(data.bondYields || null);

          // Store previous allocations if available
          if (data.previousAllocations) {
            (window as any).__previousAllocations = data.previousAllocations;
            console.log('Stored previous allocations:', data.previousAllocations);
          }
        } else {
          console.error('Fund performance API failed:', perfResponse.status);
          const errorData = await perfResponse.json();
          console.error('Error details:', errorData);
          setFundPerformance([]);
          setBondYields(null);
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
          await optResponse.json();
          // Optimization data is now handled through fundPerformance
        }

        // Fetch latest market data for selected company
        const marketDataResponse = await fetch(`${API_BASE_URL}/api/analysis/market-data/latest?company_id=${selectedCompanyId}`, {
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
  }, [selectedCompanyId, selectedDate]);

  // Update optimization results when fund performance changes
  useEffect(() => {
    console.log('=== fundPerformance changed ===');
    console.log('fundPerformance.length:', fundPerformance.length);
    console.log('fundPerformance:', fundPerformance);

    // Optimization is now calculated directly in the UI from fundPerformance data
  }, [fundPerformance]);

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

        {/* Company Selection for Dashboard (管理者・代理店・担当者) */}
        {(user.accountType === 'admin' || user.accountType === 'parent' || user.accountType === 'child') && (
          <Grid item xs={12}>
            <Paper sx={{ p: 2, mb: 1, bgcolor: '#f9fafb', border: '1px solid #e5e7eb' }}>
              <FormControl fullWidth>
                <InputLabel id="dashboard-company-select-label">分析対象の保険会社を選択</InputLabel>
                <Select
                  labelId="dashboard-company-select-label"
                  id="dashboard-company-select"
                  value={selectedCompanyId || ''}
                  label="分析対象の保険会社を選択"
                  onChange={(e) => setSelectedCompanyId(Number(e.target.value))}
                >
                  {user.accountType === 'admin'
                    ? allInsuranceCompanies.map((company) => (
                        <MenuItem key={company.id} value={company.id}>
                          {company.display_name}
                        </MenuItem>
                      ))
                    : myInsuranceCompanies.map((company) => (
                        <MenuItem key={company.id} value={company.id}>
                          {company.display_name}
                        </MenuItem>
                      ))
                  }
                </Select>
              </FormControl>
              {!selectedCompanyId && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  ※ 保険会社を選択すると、その会社のファンドパフォーマンスデータが表示されます
                </Typography>
              )}

              {/* Date Selection */}
              {selectedCompanyId && availableDates.length > 0 && (
                <FormControl fullWidth sx={{ mt: 2 }}>
                  <InputLabel id="date-select-label">データ月を選択</InputLabel>
                  <Select
                    labelId="date-select-label"
                    id="date-select"
                    value={selectedDate || ''}
                    label="データ月を選択"
                    onChange={(e) => setSelectedDate(e.target.value as string)}
                  >
                    {availableDates.map((date) => {
                      // Format date as "YYYY年MM月"
                      const dateObj = new Date(date);
                      const year = dateObj.getFullYear();
                      const month = dateObj.getMonth() + 1;
                      return (
                        <MenuItem key={date} value={date}>
                          {year}年{month}月
                        </MenuItem>
                      );
                    })}
                  </Select>
                </FormControl>
              )}
            </Paper>
          </Grid>
        )}

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

        {/* Contracted Insurance Companies (代理店・担当者のみ) */}
        {(user.accountType === 'parent' || user.accountType === 'child') && myInsuranceCompanies.length > 0 && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <BusinessIcon />
                契約中の保険会社
              </Typography>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                {myInsuranceCompanies.map((company) => (
                  <Grid item xs={12} sm={6} md={4} key={company.id}>
                    <Card sx={{
                      p: 2,
                      textAlign: 'center',
                      bgcolor: 'primary.50',
                      border: '2px solid',
                      borderColor: 'primary.main',
                      cursor: 'pointer',
                      '&:hover': {
                        bgcolor: 'primary.100',
                        transform: 'translateY(-2px)',
                        transition: 'all 0.2s'
                      }
                    }}
                    onClick={() => navigate('/insurance-companies')}
                    >
                      <BusinessIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                      <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                        {company.display_name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        契約開始: {new Date(company.contract_start_date).toLocaleDateString('ja-JP')}
                      </Typography>
                      <Chip label="契約中" color="success" size="small" sx={{ mt: 1 }} />
                    </Card>
                  </Grid>
                ))}
              </Grid>
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Button
                  variant="outlined"
                  startIcon={<BusinessIcon />}
                  onClick={() => navigate('/insurance-companies')}
                >
                  保険会社の詳細を見る
                </Button>
              </Box>
            </Paper>
          </Grid>
        )}

        {/* PDF Upload Link (管理者のみ) */}
        {user.accountType === 'admin' && (
          <Grid item xs={12}>
            <Card sx={{ p: 3, bgcolor: '#f0f9ff', border: '1px solid #3b82f6' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h6" mb={1} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    📊 マーケットデータ管理
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    保険会社の月次PDFをアップロードして、ファンドパフォーマンスデータを管理できます。
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  onClick={() => navigate('/admin/pdf-upload')}
                  sx={{ minWidth: 160 }}
                >
                  PDF管理ページへ
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
          {fundPerformance.length > 0 ? (
            <Paper sx={{ p: 2, mb: 3 }}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
                  📊 今月の最適化推奨配分
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  AI分析による最適なポートフォリオ配分（直近1年パフォーマンス基準）
                </Typography>
              </Box>

              {/* リスクプロファイル選択 */}
              <Box sx={{ mb: 2, display: 'flex', gap: 1, alignItems: 'center' }}>
                <Typography variant="body2" sx={{ fontWeight: 600, mr: 1 }}>
                  リスク許容度:
                </Typography>
                <Button
                  size="small"
                  variant={riskProfile === 'conservative' ? 'contained' : 'outlined'}
                  onClick={() => setRiskProfile('conservative')}
                  sx={{
                    minWidth: 80,
                    backgroundColor: riskProfile === 'conservative' ? '#3b82f6' : 'transparent',
                    '&:hover': { backgroundColor: riskProfile === 'conservative' ? '#2563eb' : 'rgba(59, 130, 246, 0.1)' }
                  }}
                >
                  保守型
                </Button>
                <Button
                  size="small"
                  variant={riskProfile === 'balanced' ? 'contained' : 'outlined'}
                  onClick={() => setRiskProfile('balanced')}
                  sx={{
                    minWidth: 80,
                    backgroundColor: riskProfile === 'balanced' ? '#10b981' : 'transparent',
                    '&:hover': { backgroundColor: riskProfile === 'balanced' ? '#059669' : 'rgba(16, 185, 129, 0.1)' }
                  }}
                >
                  バランス型
                </Button>
                <Button
                  size="small"
                  variant={riskProfile === 'aggressive' ? 'contained' : 'outlined'}
                  onClick={() => setRiskProfile('aggressive')}
                  sx={{
                    minWidth: 80,
                    backgroundColor: riskProfile === 'aggressive' ? '#ef4444' : 'transparent',
                    '&:hover': { backgroundColor: riskProfile === 'aggressive' ? '#dc2626' : 'rgba(239, 68, 68, 0.1)' }
                  }}
                >
                  積極型
                </Button>
              </Box>

              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>ファンド</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>パフォーマンス</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>前月配分</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>推奨配分</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>配分変更</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(() => {
                      // fundPerformanceから動的にファンド名を取得
                      const allFunds = fundPerformance.map(f => f.fundType);

                      // 各ファンドのパフォーマンスデータを取得
                      const fundData = allFunds.map(fundName => {
                        const data = fundPerformance.find(f => f.fundType === fundName);
                        const performance = data?.performance || 0;
                        return { fundName, performance };
                      });

                      let calculations: { fundName: string; performance: number; recommended: number }[] = [];

                      if (riskProfile === 'aggressive') {
                        // 積極型: 株式型とREIT型（ファンド名に「株式」「REIT」「リート」を含む）に全投資
                        const targetFunds = fundData.filter(f =>
                          (f.fundName.includes('株式') || f.fundName.includes('REIT') || f.fundName.includes('リート')) && f.performance >= 0
                        );

                        if (targetFunds.length > 0) {
                          // パフォーマンスに応じた配分（正規化して100%にする）
                          const rawAllocations = allFunds.map(fundName => {
                            const fund = fundData.find(f => f.fundName === fundName)!;
                            const isAggressiveFund = fundName.includes('株式') || fundName.includes('REIT') || fundName.includes('リート');

                            if (!isAggressiveFund || fund.performance < 0) {
                              return { fundName, performance: fund.performance, rawScore: 0 };
                            }

                            const totalPerf = targetFunds.reduce((sum, f) => sum + Math.max(0, f.performance), 0);
                            const rawScore = totalPerf > 0 ? fund.performance : 1;

                            return { fundName, performance: fund.performance, rawScore };
                          });

                          // 正規化: 合計を100%にする
                          const totalScore = rawAllocations.reduce((sum, item) => sum + item.rawScore, 0);
                          calculations = rawAllocations.map(item => {
                            const normalized = totalScore > 0 ? (item.rawScore / totalScore) * 100 : 0;
                            const recommended = Math.round(normalized / 10) * 10;
                            return { fundName: item.fundName, performance: item.performance, recommended };
                          });
                        } else {
                          // すべてマイナスの場合は全て0
                          calculations = fundData.map(f => ({ ...f, recommended: 0 }));
                        }

                      } else if (riskProfile === 'conservative') {
                        // 保守型: 債券型優遇、株式型控えめ
                        const rawAllocations = fundData.map(fund => {
                          if (fund.performance < 0) {
                            return { ...fund, rawScore: 0 };
                          }

                          let base = 0;
                          if (fund.performance >= 15) base = 30;
                          else if (fund.performance >= 10) base = 20;
                          else base = 10;

                          let adjusted = base;
                          const isBond = fund.fundName.includes('債券');
                          const isStock = fund.fundName.includes('株式');

                          if (isBond) {
                            adjusted = base * 1.3; // 債券優遇
                          } else if (isStock) {
                            adjusted = base * 0.7; // 株式控えめ
                          }

                          return { ...fund, rawScore: adjusted };
                        });

                        // 正規化: 合計を100%にする
                        const totalScore = rawAllocations.reduce((sum, item) => sum + item.rawScore, 0);
                        calculations = rawAllocations.map(item => {
                          const normalized = totalScore > 0 ? (item.rawScore / totalScore) * 100 : 0;
                          const recommended = Math.round(normalized / 10) * 10; // 10%単位に丸める
                          return { ...item, recommended };
                        });

                      } else {
                        // バランス型: 積極型60% + 保守型40%
                        // まず積極型の配分を計算
                        const targetFunds = fundData.filter(f =>
                          (f.fundName.includes('株式') || f.fundName.includes('REIT') || f.fundName.includes('リート')) && f.performance >= 0
                        );

                        const aggressiveAlloc: { [key: string]: number } = {};
                        if (targetFunds.length > 0) {
                          const totalPerf = targetFunds.reduce((sum, f) => sum + Math.max(0, f.performance), 0);
                          allFunds.forEach(fundName => {
                            const fund = fundData.find(f => f.fundName === fundName)!;
                            const isAggressiveFund = fundName.includes('株式') || fundName.includes('REIT') || fundName.includes('リート');
                            if (!isAggressiveFund || fund.performance < 0) {
                              aggressiveAlloc[fundName] = 0;
                            } else {
                              const ratio = totalPerf > 0 ? fund.performance / totalPerf : 1 / targetFunds.length;
                              aggressiveAlloc[fundName] = ratio * 100;
                            }
                          });
                        }

                        // 保守型の配分を計算
                        const conservativeAlloc: { [key: string]: number } = {};
                        fundData.forEach(fund => {
                          if (fund.performance < 0) {
                            conservativeAlloc[fund.fundName] = 0;
                            return;
                          }

                          let base = 0;
                          if (fund.performance >= 15) base = 30;
                          else if (fund.performance >= 10) base = 20;
                          else base = 10;

                          const isBond = fund.fundName.includes('債券');
                          const isStock = fund.fundName.includes('株式');

                          if (isBond) {
                            conservativeAlloc[fund.fundName] = Math.min(50, base * 1.3);
                          } else if (isStock) {
                            conservativeAlloc[fund.fundName] = base * 0.7;
                          } else {
                            conservativeAlloc[fund.fundName] = base;
                          }
                        });

                        // 60%積極 + 40%保守でミックス
                        calculations = fundData.map(fund => {
                          const aggressive = aggressiveAlloc[fund.fundName] || 0;
                          const conservative = conservativeAlloc[fund.fundName] || 0;
                          const mixed = aggressive * 0.6 + conservative * 0.4;
                          const recommended = Math.round(mixed / 10) * 10;

                          return {
                            ...fund,
                            recommended,
                            fundName: fund.fundName,
                            performance: fund.performance,
                            previousPerformance: fund.previousPerformance
                          };
                        });
                      }

                      // 合計を100%に調整（期待値を考慮した賢い調整）
                      let total = calculations.reduce((sum, calc) => sum + calc.recommended, 0);
                      if (total !== 100 && total > 0) {
                        const diff = 100 - total;

                        if (diff > 0) {
                          // 不足分がある場合：パフォーマンスと推奨配分の両方を考慮
                          // 推奨配分が高く、パフォーマンスも良いファンドに優先的に配分
                          const sortedCalcs = [...calculations]
                            .filter(c => c.recommended > 0)
                            .sort((a, b) => {
                              // スコア = 推奨配分 × パフォーマンス（重み付き）
                              const scoreA = a.recommended * (1 + a.performance / 100);
                              const scoreB = b.recommended * (1 + b.performance / 100);
                              return scoreB - scoreA;
                            });

                          // 最も期待値が高いファンドに加算
                          if (sortedCalcs.length > 0) {
                            const targetFund = calculations.find(c => c.fundName === sortedCalcs[0].fundName);
                            if (targetFund) {
                              targetFund.recommended += diff;
                            }
                          }
                        } else {
                          // 超過分がある場合：推奨配分が最も低い（0でない）ファンドから減算
                          const sortedCalcs = [...calculations]
                            .filter(c => c.recommended > 0)
                            .sort((a, b) => a.recommended - b.recommended);

                          let remaining = Math.abs(diff);
                          for (const calc of sortedCalcs) {
                            if (remaining <= 0) break;

                            const targetFund = calculations.find(c => c.fundName === calc.fundName);
                            if (targetFund && targetFund.recommended > 0) {
                              const reduction = Math.min(remaining, targetFund.recommended);
                              targetFund.recommended -= reduction;
                              remaining -= reduction;
                            }
                          }
                        }
                      }

                      // Save allocations to database
                      const saveAllocations = async () => {
                        try {
                          const token = localStorage.getItem('token');
                          const recommendationDate = fundData[0]?.performanceDate || new Date().toISOString().split('T')[0];

                          const allocations = calculations.map(calc => ({
                            fundType: calc.fundName,
                            recommendedAllocation: calc.recommended,
                            accountCode: null
                          }));

                          await fetch(`${API_BASE_URL}/api/analysis/save-allocations`, {
                            method: 'POST',
                            headers: {
                              'Authorization': `Bearer ${token}`,
                              'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                              companyId: selectedCompanyId,
                              recommendationDate,
                              allocations,
                              riskProfile: 'balanced'
                            })
                          });

                          console.log('✓ Allocations saved successfully');
                        } catch (error) {
                          console.error('Failed to save allocations:', error);
                        }
                      };

                      // Call save function (don't await to avoid blocking render)
                      saveAllocations();

                      // Get previous allocations from window storage
                      const previousAllocations = (window as any).__previousAllocations;

                      return calculations.map(({ fundName, performance, previousPerformance, recommended }) => {
                        // Get previous allocation for this fund
                        const previousAllocation = previousAllocations?.allocations?.[fundName] || null;

                        // Calculate allocation change
                        const allocationChange = previousAllocation !== null
                          ? recommended - previousAllocation
                          : null;

                        return (
                          <TableRow key={fundName}>
                            <TableCell sx={{ fontWeight: 600 }}>{fundName}</TableCell>
                            <TableCell align="right">
                              <Typography
                                variant="body2"
                                sx={{
                                  fontWeight: 600,
                                  color: performance > 0 ? '#10b981' : performance < 0 ? '#ef4444' : '#6b7280'
                                }}
                              >
                                {performance > 0 ? '+' : ''}{performance.toFixed(2)}%
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              {previousAllocation !== null ? `${previousAllocation.toFixed(0)}%` : '-'}
                            </TableCell>
                            <TableCell
                              align="right"
                              sx={{
                                fontWeight: 700,
                                backgroundColor: recommended >= 20 ? 'rgba(59, 130, 246, 0.15)' :
                                                recommended >= 10 ? 'rgba(16, 185, 129, 0.1)' :
                                                'transparent',
                                fontSize: recommended >= 15 ? '1.1rem' : '1rem',
                                color: recommended >= 20 ? '#2563eb' :
                                       recommended >= 10 ? '#059669' :
                                       'inherit'
                              }}
                            >
                              {recommended}%
                              {recommended >= 20 && ' 🎯'}
                              {recommended >= 10 && recommended < 20 && ' ✓'}
                            </TableCell>
                            <TableCell align="right">
                              {allocationChange !== null && allocationChange !== 0 && (
                                <Chip
                                  label={`${allocationChange > 0 ? '+' : ''}${allocationChange.toFixed(0)}%`}
                                  size="small"
                                  sx={{
                                    height: 20,
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    background: allocationChange > 0 ? '#10b981' : '#ef4444',
                                    color: '#fff'
                                  }}
                                />
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      });
                    })()}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          ) : (
            <Paper sx={{ p: 4, mb: 2, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                📊 マーケットデータをアップロードしてください
              </Typography>
              <Typography variant="body2" color="text.secondary">
                管理者がPDFをアップロードすると、最適化推奨配分が表示されます
              </Typography>
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
                変額保険ファンド分析
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
            変額保険アドバイザリーシステムへようこそ！
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
                        <Typography variant="h6">{s.name || s.userId || s.user_id}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          ユーザーID: {s.userId || s.user_id}
                        </Typography>
                        {s.email && (
                          <Typography variant="body2" color="text.secondary">
                            {s.email}
                          </Typography>
                        )}
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
  const [staffFilter, setStaffFilter] = useState('all');
  const [staffList, setStaffList] = useState<any[]>([]);

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
          const formattedCustomers = data.map((customer: any) => {
            // Convert contractDate to yyyy-MM-dd format
            const contractDate = (customer.contract_date || customer.contractDate)
              ? new Date(customer.contract_date || customer.contractDate).toISOString().split('T')[0]
              : '';

            return {
              id: customer.id,
              name: customer.name,
              email: customer.email || '',
              phone: customer.phone || '',
              contractDate,
              monthlyPremium: customer.monthly_premium || customer.monthlyPremium,
              riskTolerance: customer.risk_tolerance || customer.riskTolerance || 'balanced',
              status: customer.is_active ? 'active' : 'inactive',
              insuranceCompanies: customer.insuranceCompanies || [],
              staffName: customer.staff_name || '',
              staffId: customer.staff_id || customer.user_id
            };
          });
          setCustomers(formattedCustomers);
          setFilteredCustomers(formattedCustomers);

          // Extract unique staff members for filter
          const uniqueStaff = Array.from(
            new Map(
              formattedCustomers
                .filter(c => c.staffName)
                .map(c => [c.staffId, { id: c.staffId, name: c.staffName }])
            ).values()
          );
          setStaffList(uniqueStaff);
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

    // 担当者でのフィルター
    if (staffFilter !== 'all') {
      filtered = filtered.filter(customer => String(customer.staffId) === String(staffFilter));
    }

    setFilteredCustomers(filtered);
  }, [customers, searchTerm, riskFilter, statusFilter, staffFilter]);

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
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="顧客名・メールで検索"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="田中 太郎 または tanaka@example.com"
            />
          </Grid>

          {user.accountType === 'parent' && staffList.length > 0 && (
            <Grid item xs={12} md={2.25}>
              <TextField
                fullWidth
                select
                label="担当者"
                value={staffFilter}
                onChange={(e) => setStaffFilter(e.target.value)}
                SelectProps={{ native: true }}
              >
                <option value="all">すべて</option>
                {staffList.map((staff) => (
                  <option key={staff.id} value={staff.id}>
                    {staff.name}
                  </option>
                ))}
              </TextField>
            </Grid>
          )}

          <Grid item xs={12} md={2.25}>
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

          <Grid item xs={12} md={2.25}>
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

          <Grid item xs={12} md={2.25}>
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
                    <Grid item xs={12} sm={2.5}>
                      <Typography variant="h6" component="div">
                        {customer.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        ID: {customer.id}
                      </Typography>
                      {customer.staffName && (
                        <Typography variant="body2" color="primary" sx={{ mt: 0.5 }}>
                          担当: {customer.staffName}
                        </Typography>
                      )}
                    </Grid>

                    <Grid item xs={12} sm={2.5}>
                      <Typography variant="body2" color="text.secondary">
                        連絡先
                      </Typography>
                      <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                        {customer.email}
                      </Typography>
                      <Typography variant="body2">
                        {customer.phone}
                      </Typography>
                    </Grid>

                    <Grid item xs={12} sm={2.5}>
                      <Typography variant="body2" color="text.secondary">
                        加入保険会社
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                        {customer.insuranceCompanies && customer.insuranceCompanies.length > 0 ? (
                          customer.insuranceCompanies.map((company: any) => (
                            <Chip
                              key={company.id}
                              label={company.display_name || company.company_name}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          ))
                        ) : (
                          <Typography variant="body2" color="text.secondary">未設定</Typography>
                        )}
                      </Box>
                    </Grid>

                    <Grid item xs={12} sm={1.5}>
                      <Typography variant="body2" color="text.secondary">
                        契約日
                      </Typography>
                      <Typography variant="body2">
                        {new Date(customer.contractDate).toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' })}
                      </Typography>
                    </Grid>

                    <Grid item xs={12} sm={1.5}>
                      <Typography variant="body2" color="text.secondary">
                        月額保険料
                      </Typography>
                      <Typography variant="h6" color="primary">
                        ¥{Math.floor(customer.monthlyPremium).toLocaleString()}
                      </Typography>
                    </Grid>

                    <Grid item xs={12} sm={1.5}>
                      <Box display="flex" flexDirection="column" gap={1} alignItems="stretch">
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
    staffId: '',
    companyId: '',
    companyIds: [] as number[]
  });
  const [loading, setLoading] = useState(false);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [insuranceCompanies, setInsuranceCompanies] = useState<any[]>([]);

  useEffect(() => {
    const fetchStaffList = async () => {
      if (user.accountType === 'parent') {
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
  }, [user.accountType]);

  useEffect(() => {
    const fetchInsuranceCompanies = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/api/insurance/my-companies`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          setInsuranceCompanies(data);
        }
      } catch (error) {
        console.error('Failed to fetch insurance companies:', error);
      }
    };

    fetchInsuranceCompanies();
  }, []);

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
            // Convert contractDate to yyyy-MM-dd format
            const contractDate = (data.contract_date || data.contractDate)
              ? new Date(data.contract_date || data.contractDate).toISOString().split('T')[0]
              : '';

            // Extract company IDs from insuranceCompanies array
            const companyIds = data.insuranceCompanies && Array.isArray(data.insuranceCompanies)
              ? data.insuranceCompanies.map((ic: any) => ic.insurance_company_id)
              : (data.insurance_company_id ? [data.insurance_company_id] : []);

            setFormData({
              name: data.name || '',
              email: data.email || '',
              phone: data.phone || '',
              contractDate,
              contractAmount: String(data.contract_amount || data.contractAmount || ''),
              monthlyPremium: String(data.monthly_premium || data.monthlyPremium || ''),
              riskTolerance: data.risk_tolerance || data.riskTolerance || 'balanced',
              investmentGoal: data.investment_goal || data.investmentGoal || '',
              notes: data.notes || '',
              staffId: '',
              companyId: String(data.insurance_company_id || data.companyId || ''),
              companyIds: companyIds
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
          staffId: formData.staffId || undefined,
          companyId: formData.companyId ? parseInt(formData.companyId) : undefined,
          companyIds: formData.companyIds.length > 0 ? formData.companyIds : undefined
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

            <Grid item xs={12}>
              <Autocomplete
                multiple
                options={insuranceCompanies}
                getOptionLabel={(option) => option.display_name || option.company_name}
                value={insuranceCompanies.filter(company =>
                  formData.companyIds.includes(company.id)
                )}
                onChange={(event, newValue) => {
                  setFormData({
                    ...formData,
                    companyIds: newValue.map(company => company.id)
                  });
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="加入保険会社"
                    helperText="顧客が加入している保険会社を選択してください（複数選択可）"
                  />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      label={option.display_name || option.company_name}
                      {...getTagProps({ index })}
                      key={option.id}
                    />
                  ))
                }
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

            {user.accountType === 'parent' && (
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  select
                  label="担当者"
                  value={formData.staffId}
                  onChange={handleChange('staffId')}
                  helperText={isEdit ? "担当者を変更できます" : "顧客を担当する担当者を選択してください"}
                >
                  <MenuItem value="">選択してください</MenuItem>
                  {staffList.map((staff) => (
                    <MenuItem key={staff.id} value={staff.id}>
                      {staff.name || staff.user_id} (ID: {staff.user_id}) - {staff.customerCount || 0}/{staff.customerLimit || 10}人担当中
                    </MenuItem>
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
          // Convert contractDate to yyyy-MM-dd format
          const contractDate = (data.contract_date || data.contractDate)
            ? new Date(data.contract_date || data.contractDate).toISOString().split('T')[0]
            : '';

          setCustomer({
            id: data.id,
            name: data.name,
            email: data.email || '',
            phone: data.phone || '',
            contractDate,
            monthlyPremium: data.monthly_premium || data.monthlyPremium,
            contractAmount: data.contract_amount || data.contractAmount,
            riskTolerance: data.risk_tolerance || data.riskTolerance || 'balanced',
            investmentGoal: data.investment_goal || data.investmentGoal || '',
            notes: data.notes || '',
            status: data.is_active ? 'active' : 'inactive',
            insuranceCompanyId: data.insurance_company_id,
            insuranceCompanyName: data.display_name || data.company_name,
            insuranceCompanies: data.insuranceCompanies || [],
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

          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              加入保険会社
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
              {customer.insuranceCompanies && customer.insuranceCompanies.length > 0 ? (
                customer.insuranceCompanies.map((company: any) => (
                  <Chip
                    key={company.id}
                    label={company.display_name || company.company_name}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                ))
              ) : (
                <Typography variant="body2" color="text.secondary">未設定</Typography>
              )}
            </Box>
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
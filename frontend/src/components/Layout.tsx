import React from 'react';
import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Divider,
} from '@mui/material';
import {
  AccountCircle,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Assessment as AssessmentIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import packageJson from '../../package.json';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleClose();
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" component="div">
              変額保険アドバイザリーシステム
            </Typography>
            <Typography variant="caption" component="div" sx={{ opacity: 0.8 }}>
              v{packageJson.version}
            </Typography>
          </Box>
          
          <Button
            color="inherit"
            startIcon={<DashboardIcon />}
            onClick={() => navigate('/dashboard')}
          >
            ダッシュボード
          </Button>
          
          <Button
            color="inherit"
            startIcon={<PeopleIcon />}
            onClick={() => navigate('/customers')}
          >
            顧客管理
          </Button>
          
          {user?.accountType === 'parent' && (
            <Button
              color="inherit"
              startIcon={<AssessmentIcon />}
              onClick={() => navigate('/reports')}
            >
              レポート
            </Button>
          )}
          
          <IconButton
            size="large"
            aria-label="account of current user"
            aria-controls="menu-appbar"
            aria-haspopup="true"
            onClick={handleMenu}
            color="inherit"
          >
            <AccountCircle />
          </IconButton>
          
          <Menu
            id="menu-appbar"
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={Boolean(anchorEl)}
            onClose={handleClose}
          >
            <MenuItem disabled>
              <Typography variant="body2">
                {user?.userId} ({getAccountTypeLabel(user?.accountType || '')})
              </Typography>
            </MenuItem>
            <Divider />
            <MenuItem onClick={() => { navigate('/profile'); handleClose(); }}>
              プロフィール
            </MenuItem>
            <MenuItem onClick={() => { navigate('/settings'); handleClose(); }}>
              設定
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <LogoutIcon sx={{ mr: 1 }} fontSize="small" />
              ログアウト
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      
      <Box component="main" sx={{ flexGrow: 1, bgcolor: 'background.default' }}>
        {children}
      </Box>
      
      <Box component="footer" sx={{ py: 3, px: 2, mt: 'auto', backgroundColor: 'background.paper' }}>
        <Typography variant="body2" color="text.secondary" align="center">
          © 2024 変額保険アドバイザリーシステム
        </Typography>
      </Box>
    </Box>
  );
};

const getAccountTypeLabel = (type: string) => {
  const labels = {
    parent: '代理店',
    child: '生保担当者',
    grandchild: '顧客',
  };
  return labels[type as keyof typeof labels] || type;
};

export default Layout;
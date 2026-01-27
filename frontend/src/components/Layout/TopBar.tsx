/**
 * TopBar Component
 * 簡略化されたヘッダー（モバイル用メニュートグル、パンくずリスト、ユーザーメニュー）
 */

import React from 'react';
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  Breadcrumbs,
  Link,
  Chip,
  Menu,
  MenuItem,
  Divider,
  useTheme,
  useMediaQuery,
  Badge,
  Avatar,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  AccountCircle,
  Logout as LogoutIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { saasColors } from '../../theme/saasTheme';
import { getAccountTypeLabel, AccountType } from '../../config/navigationConfig';

interface User {
  id: number;
  userId: string;
  accountType: AccountType;
}

interface TopBarProps {
  user: User;
  onMenuClick: () => void;
  onLogout: () => void;
  pageTitle?: string;
}

// パスからパンくずリストを生成
const getBreadcrumbs = (pathname: string): { label: string; path: string }[] => {
  const pathMap: Record<string, string> = {
    '/dashboard': 'ダッシュボード',
    '/customers': '顧客管理',
    '/customers/new': '新規顧客',
    '/staff': '担当者管理',
    '/insurance-companies': '保険会社',
    '/simulation': 'シミュレーション',
    '/agencies': '代理店管理',
    '/admin/agency-management': '保険会社管理',
    '/admin/pdf-upload': 'PDFアップロード',
    '/settings': '設定',
  };

  const parts = pathname.split('/').filter(Boolean);
  const breadcrumbs: { label: string; path: string }[] = [];

  let currentPath = '';
  for (const part of parts) {
    currentPath += `/${part}`;
    const label = pathMap[currentPath];
    if (label) {
      breadcrumbs.push({ label, path: currentPath });
    }
  }

  return breadcrumbs;
};

const TopBar: React.FC<TopBarProps> = ({
  user,
  onMenuClick,
  onLogout,
  pageTitle,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [notificationAnchor, setNotificationAnchor] = React.useState<null | HTMLElement>(null);

  const breadcrumbs = getBreadcrumbs(location.pathname);
  const currentPageTitle = pageTitle || breadcrumbs[breadcrumbs.length - 1]?.label || 'ダッシュボード';

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationAnchor(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setNotificationAnchor(null);
  };

  const handleSettings = () => {
    navigate('/settings');
    handleUserMenuClose();
  };

  const handleLogout = () => {
    handleUserMenuClose();
    onLogout();
  };

  const getInitials = (userId: string): string => {
    return userId.substring(0, 2).toUpperCase();
  };

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        backgroundColor: saasColors.background.paper,
        borderBottom: `1px solid ${saasColors.border}`,
      }}
    >
      <Toolbar sx={{ minHeight: { xs: 56, sm: 64 } }}>
        {/* Mobile menu button */}
        {isMobile && (
          <IconButton
            edge="start"
            onClick={onMenuClick}
            sx={{ mr: 1, color: saasColors.text.primary }}
          >
            <MenuIcon />
          </IconButton>
        )}

        {/* Page title / Breadcrumbs */}
        <Box sx={{ flex: 1 }}>
          {isMobile ? (
            <Typography
              variant="h6"
              sx={{
                color: saasColors.text.primary,
                fontWeight: 600,
              }}
            >
              {currentPageTitle}
            </Typography>
          ) : (
            <>
              {breadcrumbs.length > 1 ? (
                <Breadcrumbs
                  aria-label="breadcrumb"
                  sx={{
                    '& .MuiBreadcrumbs-separator': {
                      color: saasColors.text.secondary,
                    },
                  }}
                >
                  {breadcrumbs.slice(0, -1).map((crumb) => (
                    <Link
                      key={crumb.path}
                      component="button"
                      variant="body2"
                      onClick={() => navigate(crumb.path)}
                      sx={{
                        color: saasColors.text.secondary,
                        textDecoration: 'none',
                        cursor: 'pointer',
                        '&:hover': {
                          color: saasColors.primary,
                          textDecoration: 'underline',
                        },
                      }}
                    >
                      {crumb.label}
                    </Link>
                  ))}
                  <Typography
                    variant="body2"
                    sx={{
                      color: saasColors.text.primary,
                      fontWeight: 600,
                    }}
                  >
                    {currentPageTitle}
                  </Typography>
                </Breadcrumbs>
              ) : (
                <Typography
                  variant="h6"
                  sx={{
                    color: saasColors.text.primary,
                    fontWeight: 600,
                  }}
                >
                  {currentPageTitle}
                </Typography>
              )}
            </>
          )}
        </Box>

        {/* Version chip (desktop only) */}
        {!isMobile && (
          <Chip
            label="v1.8.9"
            size="small"
            sx={{
              mr: 2,
              backgroundColor: saasColors.primary,
              color: saasColors.text.inverse,
              fontWeight: 600,
              fontSize: '11px',
              height: 24,
            }}
          />
        )}

        {/* Notifications */}
        <IconButton
          onClick={handleNotificationOpen}
          sx={{ color: saasColors.text.secondary }}
        >
          <Badge badgeContent={0} color="error">
            <NotificationsIcon />
          </Badge>
        </IconButton>
        <Menu
          anchorEl={notificationAnchor}
          open={Boolean(notificationAnchor)}
          onClose={handleNotificationClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          PaperProps={{
            sx: { width: 320, maxHeight: 400 },
          }}
        >
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              通知はありません
            </Typography>
          </Box>
        </Menu>

        {/* User menu */}
        <IconButton
          onClick={handleUserMenuOpen}
          sx={{ ml: 1 }}
        >
          <Avatar
            sx={{
              width: 32,
              height: 32,
              fontSize: '12px',
              backgroundColor: saasColors.primary,
            }}
          >
            {getInitials(user.userId)}
          </Avatar>
        </IconButton>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleUserMenuClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
        >
          <Box sx={{ px: 2, py: 1 }}>
            <Typography variant="body2" fontWeight={600}>
              {user.userId}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {getAccountTypeLabel(user.accountType)}
            </Typography>
          </Box>
          <Divider />
          <MenuItem onClick={handleSettings}>
            <SettingsIcon fontSize="small" sx={{ mr: 1.5 }} />
            設定
          </MenuItem>
          <MenuItem onClick={handleLogout}>
            <LogoutIcon fontSize="small" sx={{ mr: 1.5 }} />
            ログアウト
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default TopBar;

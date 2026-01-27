/**
 * MainLayout Component
 * サイドバー + メインコンテンツのフレックスレイアウト
 */

import React, { useState } from 'react';
import { Box, useTheme, useMediaQuery } from '@mui/material';
import { Sidebar, SIDEBAR_WIDTH, SIDEBAR_COLLAPSED_WIDTH } from '../Sidebar';
import TopBar from './TopBar';
import { saasColors } from '../../theme/saasTheme';
import { AccountType } from '../../config/navigationConfig';

interface User {
  id: number;
  userId: string;
  accountType: AccountType;
  planType?: string;
}

interface MainLayoutProps {
  user: User;
  onLogout: () => void;
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({
  user,
  onLogout,
  children,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleSidebarCollapse = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const sidebarWidth = isMobile
    ? 0
    : sidebarCollapsed
    ? SIDEBAR_COLLAPSED_WIDTH
    : SIDEBAR_WIDTH;

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        backgroundColor: saasColors.background.default,
      }}
    >
      {/* Sidebar */}
      <Sidebar
        user={user}
        open={mobileOpen}
        collapsed={sidebarCollapsed}
        onClose={handleDrawerToggle}
        onToggleCollapse={handleSidebarCollapse}
        onLogout={onLogout}
      />

      {/* Main content area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          width: { md: `calc(100% - ${sidebarWidth}px)` },
          ml: { md: 0 },
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        }}
      >
        {/* Top bar */}
        <TopBar
          user={user}
          onMenuClick={handleDrawerToggle}
          onLogout={onLogout}
        />

        {/* Page content */}
        <Box
          sx={{
            flex: 1,
            p: { xs: 2, sm: 3 },
            overflow: 'auto',
          }}
        >
          {children}
        </Box>

        {/* Footer */}
        <Box
          component="footer"
          sx={{
            py: 2,
            px: 3,
            textAlign: 'center',
            borderTop: `1px solid ${saasColors.border}`,
            backgroundColor: saasColors.background.paper,
          }}
        >
          <Box
            component="span"
            sx={{
              fontSize: '12px',
              color: saasColors.text.secondary,
            }}
          >
            &copy; 2025 変額保険アドバイザリーシステム
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default MainLayout;

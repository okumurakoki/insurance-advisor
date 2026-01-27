/**
 * Sidebar Component
 * メインサイドバーコンポーネント
 * デスクトップ: 固定表示
 * モバイル: ドロワー表示
 */

import React from 'react';
import {
  Box,
  Drawer,
  List,
  Divider,
  useTheme,
  useMediaQuery,
  IconButton,
} from '@mui/material';
import { ChevronRight as ChevronRightIcon } from '@mui/icons-material';
import SidebarHeader from './SidebarHeader';
import SidebarNavItem from './SidebarNavItem';
import SidebarUserInfo from './SidebarUserInfo';
import { saasColors } from '../../theme/saasTheme';
import {
  getNavigationSections,
  AccountType,
} from '../../config/navigationConfig';

// サイドバーの幅
export const SIDEBAR_WIDTH = 280;
export const SIDEBAR_COLLAPSED_WIDTH = 72;

interface User {
  id: number;
  userId: string;
  accountType: AccountType;
  planType?: string;
}

interface SidebarProps {
  user: User;
  open: boolean;
  collapsed: boolean;
  onClose: () => void;
  onToggleCollapse: () => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  user,
  open,
  collapsed,
  onClose,
  onToggleCollapse,
  onLogout,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const sections = getNavigationSections(user.accountType);

  const drawerWidth = collapsed && !isMobile ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH;

  const sidebarContent = (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: saasColors.background.sidebar,
      }}
    >
      {/* Header */}
      <SidebarHeader
        collapsed={collapsed && !isMobile}
        onToggle={onToggleCollapse}
        showToggle={!isMobile}
      />

      {/* Navigation */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          py: 1,
          '&::-webkit-scrollbar': {
            width: 4,
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            borderRadius: 2,
          },
        }}
      >
        {sections.map((section, sectionIndex) => (
          <React.Fragment key={section.id}>
            <List component="nav" disablePadding>
              {section.items.map((item) => (
                <SidebarNavItem
                  key={item.id}
                  path={item.path}
                  label={item.label}
                  icon={item.icon}
                  collapsed={collapsed && !isMobile}
                  badge={item.badge}
                  onClick={isMobile ? onClose : undefined}
                />
              ))}
            </List>
            {sectionIndex < sections.length - 1 && (
              <Divider
                sx={{
                  my: 1,
                  mx: 2,
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                }}
              />
            )}
          </React.Fragment>
        ))}
      </Box>

      {/* User Info */}
      <SidebarUserInfo
        user={user}
        collapsed={collapsed && !isMobile}
        onLogout={onLogout}
      />

      {/* Collapse toggle button for collapsed state */}
      {collapsed && !isMobile && (
        <Box
          sx={{
            p: 1,
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <IconButton
            onClick={onToggleCollapse}
            size="small"
            sx={{
              color: 'rgba(255, 255, 255, 0.7)',
              '&:hover': {
                color: saasColors.text.inverse,
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              },
            }}
          >
            <ChevronRightIcon fontSize="small" />
          </IconButton>
        </Box>
      )}
    </Box>
  );

  // Mobile: Temporary drawer
  if (isMobile) {
    return (
      <Drawer
        variant="temporary"
        open={open}
        onClose={onClose}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: SIDEBAR_WIDTH,
            backgroundColor: saasColors.background.sidebar,
            borderRight: 'none',
          },
        }}
      >
        {sidebarContent}
      </Drawer>
    );
  }

  // Desktop: Permanent drawer
  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          backgroundColor: saasColors.background.sidebar,
          borderRight: 'none',
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        },
      }}
    >
      {sidebarContent}
    </Drawer>
  );
};

export default Sidebar;

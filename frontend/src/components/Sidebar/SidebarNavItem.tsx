/**
 * SidebarNavItem Component
 * サイドバーのナビゲーションアイテム
 */

import React from 'react';
import {
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Badge,
  alpha,
} from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import { saasColors } from '../../theme/saasTheme';

interface SidebarNavItemProps {
  path: string;
  label: string;
  icon: React.ReactNode;
  collapsed?: boolean;
  badge?: number;
  onClick?: () => void;
}

const SidebarNavItem: React.FC<SidebarNavItemProps> = ({
  path,
  label,
  icon,
  collapsed = false,
  badge,
  onClick,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isActive = location.pathname === path || location.pathname.startsWith(`${path}/`);

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
    navigate(path);
  };

  const button = (
    <ListItemButton
      onClick={handleClick}
      selected={isActive}
      sx={{
        minHeight: 44,
        borderRadius: 1,
        mx: 1,
        my: 0.5,
        px: collapsed ? 1.5 : 2,
        justifyContent: collapsed ? 'center' : 'flex-start',
        color: isActive ? saasColors.text.inverse : 'rgba(255, 255, 255, 0.7)',
        backgroundColor: isActive
          ? saasColors.background.sidebarActive
          : 'transparent',
        '&:hover': {
          backgroundColor: isActive
            ? saasColors.background.sidebarActive
            : saasColors.background.sidebarHover,
          color: saasColors.text.inverse,
        },
        '& .MuiListItemIcon-root': {
          color: isActive ? saasColors.text.inverse : 'rgba(255, 255, 255, 0.7)',
          minWidth: collapsed ? 0 : 40,
          mr: collapsed ? 0 : 2,
          justifyContent: 'center',
        },
        '&:hover .MuiListItemIcon-root': {
          color: saasColors.text.inverse,
        },
        transition: 'all 0.2s ease-in-out',
      }}
    >
      <ListItemIcon>
        {badge ? (
          <Badge
            badgeContent={badge}
            color="secondary"
            sx={{
              '& .MuiBadge-badge': {
                fontSize: '10px',
                height: 18,
                minWidth: 18,
              },
            }}
          >
            {icon}
          </Badge>
        ) : (
          icon
        )}
      </ListItemIcon>
      {!collapsed && (
        <ListItemText
          primary={label}
          primaryTypographyProps={{
            fontSize: '14px',
            fontWeight: isActive ? 600 : 400,
          }}
        />
      )}
    </ListItemButton>
  );

  if (collapsed) {
    return (
      <Tooltip title={label} placement="right" arrow>
        {button}
      </Tooltip>
    );
  }

  return button;
};

export default SidebarNavItem;

/**
 * SidebarUserInfo Component
 * サイドバーのユーザー情報セクション
 */

import React from 'react';
import {
  Box,
  Typography,
  Avatar,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  Tooltip,
} from '@mui/material';
import {
  Logout as LogoutIcon,
  Settings as SettingsIcon,
  Person as PersonIcon,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { saasColors } from '../../theme/saasTheme';
import { getAccountTypeLabel, AccountType } from '../../config/navigationConfig';

interface User {
  id: number;
  userId: string;
  accountType: AccountType;
  planType?: string;
}

interface SidebarUserInfoProps {
  user: User;
  collapsed?: boolean;
  onLogout: () => void;
}

const SidebarUserInfo: React.FC<SidebarUserInfoProps> = ({
  user,
  collapsed = false,
  onLogout,
}) => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleSettings = () => {
    navigate('/settings');
    handleMenuClose();
  };

  const handleLogout = () => {
    handleMenuClose();
    onLogout();
  };

  const getInitials = (userId: string): string => {
    return userId.substring(0, 2).toUpperCase();
  };

  if (collapsed) {
    return (
      <Box
        sx={{
          p: 1,
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <Tooltip title={`${user.userId} (${getAccountTypeLabel(user.accountType)})`} placement="right">
          <IconButton
            onClick={handleMenuOpen}
            sx={{
              width: '100%',
              borderRadius: 1,
              color: 'rgba(255, 255, 255, 0.7)',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              },
            }}
          >
            <Avatar
              sx={{
                width: 32,
                height: 32,
                fontSize: '12px',
                backgroundColor: saasColors.secondary,
              }}
            >
              {getInitials(user.userId)}
            </Avatar>
          </IconButton>
        </Tooltip>
        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleMenuClose}
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
        >
          <MenuItem disabled>
            <Typography variant="body2">
              {user.userId}
            </Typography>
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleSettings}>
            <SettingsIcon fontSize="small" sx={{ mr: 1 }} />
            設定
          </MenuItem>
          <MenuItem onClick={handleLogout}>
            <LogoutIcon fontSize="small" sx={{ mr: 1 }} />
            ログアウト
          </MenuItem>
        </Menu>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        p: 2,
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
        }}
      >
        <Avatar
          sx={{
            width: 40,
            height: 40,
            fontSize: '14px',
            backgroundColor: saasColors.secondary,
          }}
        >
          {getInitials(user.userId)}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="body2"
            sx={{
              color: saasColors.text.inverse,
              fontWeight: 600,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {user.userId}
          </Typography>
          <Chip
            label={getAccountTypeLabel(user.accountType)}
            size="small"
            sx={{
              height: 20,
              fontSize: '10px',
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              color: 'rgba(255, 255, 255, 0.9)',
              mt: 0.5,
            }}
          />
        </Box>
        <IconButton
          onClick={handleMenuOpen}
          size="small"
          sx={{
            color: 'rgba(255, 255, 255, 0.7)',
            '&:hover': {
              color: saasColors.text.inverse,
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
            },
          }}
        >
          <MoreVertIcon fontSize="small" />
        </IconButton>
      </Box>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
      >
        <MenuItem onClick={handleSettings}>
          <SettingsIcon fontSize="small" sx={{ mr: 1 }} />
          設定
        </MenuItem>
        <MenuItem onClick={handleLogout}>
          <LogoutIcon fontSize="small" sx={{ mr: 1 }} />
          ログアウト
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default SidebarUserInfo;

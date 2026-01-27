/**
 * SidebarHeader Component
 * サイドバーのヘッダー部分（ロゴ・アプリ名・折りたたみボタン）
 */

import React from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import {
  ChevronLeft as ChevronLeftIcon,
  AccountBalance as AccountBalanceIcon,
} from '@mui/icons-material';
import { saasColors } from '../../theme/saasTheme';

interface SidebarHeaderProps {
  collapsed: boolean;
  onToggle: () => void;
  showToggle?: boolean;
}

const SidebarHeader: React.FC<SidebarHeaderProps> = ({
  collapsed,
  onToggle,
  showToggle = true,
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        p: 2,
        minHeight: 64,
        borderBottom: `1px solid rgba(255, 255, 255, 0.1)`,
      }}
    >
      {!collapsed && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 1,
              backgroundColor: saasColors.secondary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AccountBalanceIcon sx={{ color: 'white', fontSize: 22 }} />
          </Box>
          <Box>
            <Typography
              variant="subtitle1"
              sx={{
                color: saasColors.text.inverse,
                fontWeight: 700,
                fontSize: '14px',
                lineHeight: 1.2,
              }}
            >
              変額保険
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '11px',
              }}
            >
              アドバイザー
            </Typography>
          </Box>
        </Box>
      )}

      {collapsed && (
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: 1,
            backgroundColor: saasColors.secondary,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <AccountBalanceIcon sx={{ color: 'white', fontSize: 22 }} />
        </Box>
      )}

      {showToggle && !collapsed && (
        <IconButton
          onClick={onToggle}
          size="small"
          sx={{
            color: 'rgba(255, 255, 255, 0.7)',
            '&:hover': {
              color: saasColors.text.inverse,
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
            },
          }}
        >
          <ChevronLeftIcon fontSize="small" />
        </IconButton>
      )}
    </Box>
  );
};

export default SidebarHeader;

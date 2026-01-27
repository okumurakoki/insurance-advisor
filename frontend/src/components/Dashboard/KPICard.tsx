/**
 * KPICard Component
 * ダッシュボード用のKPI表示カード
 */

import React from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  Chip,
  Avatar,
  useTheme,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
} from '@mui/icons-material';
import { saasColors, saasTypography } from '../../theme/saasTheme';

export interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'flat';
    label?: string;
  };
  icon: React.ReactNode;
  iconBgColor?: string;
  valueColor?: string;
  onClick?: () => void;
  loading?: boolean;
}

const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  subtitle,
  trend,
  icon,
  iconBgColor = saasColors.primary,
  valueColor = saasColors.text.primary,
  onClick,
  loading = false,
}) => {
  const theme = useTheme();

  const getTrendIcon = () => {
    if (!trend) return null;
    switch (trend.direction) {
      case 'up':
        return <TrendingUpIcon fontSize="small" />;
      case 'down':
        return <TrendingDownIcon fontSize="small" />;
      default:
        return <TrendingFlatIcon fontSize="small" />;
    }
  };

  const getTrendColor = () => {
    if (!trend) return saasColors.text.secondary;
    switch (trend.direction) {
      case 'up':
        return saasColors.success;
      case 'down':
        return saasColors.error;
      default:
        return saasColors.text.secondary;
    }
  };

  return (
    <Card
      sx={{
        height: '100%',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease-in-out',
        '&:hover': onClick
          ? {
              transform: 'translateY(-2px)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            }
          : {},
      }}
      onClick={onClick}
    >
      <CardContent sx={{ p: 3 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            mb: 2,
          }}
        >
          <Typography
            variant="body2"
            sx={{
              color: saasColors.text.secondary,
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              fontSize: '12px',
            }}
          >
            {title}
          </Typography>
          <Avatar
            sx={{
              width: 44,
              height: 44,
              backgroundColor: iconBgColor,
              '& .MuiSvgIcon-root': {
                fontSize: 24,
                color: saasColors.text.inverse,
              },
            }}
          >
            {icon}
          </Avatar>
        </Box>

        <Box sx={{ mb: 1 }}>
          <Typography
            sx={{
              ...saasTypography.numberMedium,
              color: valueColor,
              lineHeight: 1.2,
            }}
          >
            {loading ? '-' : value}
          </Typography>
        </Box>

        {(subtitle || trend) && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              flexWrap: 'wrap',
            }}
          >
            {subtitle && (
              <Typography
                variant="caption"
                sx={{
                  color: saasColors.text.secondary,
                }}
              >
                {subtitle}
              </Typography>
            )}
            {trend && (
              <Chip
                icon={getTrendIcon() || undefined}
                label={`${trend.value > 0 ? '+' : ''}${trend.value}%${
                  trend.label ? ` ${trend.label}` : ''
                }`}
                size="small"
                sx={{
                  height: 22,
                  fontSize: '11px',
                  fontWeight: 600,
                  backgroundColor: `${getTrendColor()}15`,
                  color: getTrendColor(),
                  '& .MuiChip-icon': {
                    color: getTrendColor(),
                    marginLeft: '4px',
                  },
                }}
              />
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default KPICard;

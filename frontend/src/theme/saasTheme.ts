/**
 * SaaS Dashboard テーマ設定
 * プロフェッショナルなSaaSダッシュボードデザインのカラーパレットとタイポグラフィ
 */

import { createTheme, Theme, ThemeOptions } from '@mui/material/styles';
import { InsuranceCompanyTheme } from '../config/insuranceCompanyThemes';

// SaaS カラーパレット（ビジネスライク・落ち着いた配色）
export const saasColors = {
  primary: '#1E3A5F',       // ヘッダー、メインボタン（ダークネイビー）
  secondary: '#4A6FA5',     // CTAボタン、編集アクション（落ち着いたブルー）
  accent: '#5B8C85',        // ハイライト、達成状態（ティールグリーン）
  success: '#3D8B6E',       // 正の数値、完了（落ち着いたグリーン）
  warning: '#C4953A',       // 警告（落ち着いたゴールド）
  error: '#C45C5C',         // 負の数値、エラー（落ち着いたレッド）
  info: '#4A7CB5',          // 情報（落ち着いたブルー）
  background: {
    default: '#F8F9FA',     // メイン背景（やや明るいグレー）
    paper: '#FFFFFF',       // カード背景
    sidebar: '#1E3A5F',     // サイドバー背景
    sidebarHover: '#2A4A73', // サイドバーホバー
    sidebarActive: '#3A5A83', // サイドバーアクティブ
  },
  border: '#DEE2E6',        // ボーダー
  divider: '#DEE2E6',       // 区切り線
  text: {
    primary: '#2D3748',     // メインテキスト（やや柔らかい黒）
    secondary: '#6C757D',   // サブテキスト
    disabled: '#ADB5BD',    // 無効テキスト
    inverse: '#FFFFFF',     // 反転テキスト（サイドバー等）
  },
};

// タイポグラフィ設定
export const saasTypography = {
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
  h1: {
    fontSize: '24px',
    fontWeight: 700,
    lineHeight: 1.3,
  },
  h2: {
    fontSize: '18px',
    fontWeight: 700,
    lineHeight: 1.4,
  },
  h3: {
    fontSize: '16px',
    fontWeight: 600,
    lineHeight: 1.4,
  },
  h4: {
    fontSize: '14px',
    fontWeight: 600,
    lineHeight: 1.5,
  },
  h5: {
    fontSize: '13px',
    fontWeight: 600,
    lineHeight: 1.5,
  },
  h6: {
    fontSize: '12px',
    fontWeight: 600,
    lineHeight: 1.5,
  },
  body1: {
    fontSize: '14px',
    fontWeight: 400,
    lineHeight: 1.6,
  },
  body2: {
    fontSize: '13px',
    fontWeight: 400,
    lineHeight: 1.6,
  },
  caption: {
    fontSize: '12px',
    fontWeight: 400,
    lineHeight: 1.5,
  },
  button: {
    fontSize: '14px',
    fontWeight: 500,
    textTransform: 'none' as const,
  },
  // カスタム: 大きな数字用（KPIカード）
  numberLarge: {
    fontSize: '48px',
    fontWeight: 700,
    lineHeight: 1.1,
  },
  numberMedium: {
    fontSize: '28px',
    fontWeight: 700,
    lineHeight: 1.2,
  },
};

// コンポーネントスタイルオーバーライド
const componentOverrides: ThemeOptions['components'] = {
  MuiCssBaseline: {
    styleOverrides: {
      body: {
        backgroundColor: saasColors.background.default,
      },
    },
  },
  MuiAppBar: {
    styleOverrides: {
      root: {
        backgroundColor: saasColors.primary,
        boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
      },
    },
  },
  MuiDrawer: {
    styleOverrides: {
      paper: {
        backgroundColor: saasColors.background.sidebar,
        borderRight: 'none',
      },
    },
  },
  MuiButton: {
    styleOverrides: {
      root: {
        borderRadius: 8,
        textTransform: 'none',
        fontWeight: 500,
        padding: '8px 16px',
      },
      contained: {
        boxShadow: 'none',
        '&:hover': {
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        },
      },
      containedPrimary: {
        backgroundColor: saasColors.primary,
        '&:hover': {
          backgroundColor: '#2A4A73',
        },
      },
      containedSecondary: {
        backgroundColor: saasColors.secondary,
        '&:hover': {
          backgroundColor: '#3D5A8A',
        },
      },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: 12,
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        border: `1px solid ${saasColors.border}`,
      },
    },
  },
  MuiPaper: {
    styleOverrides: {
      root: {
        backgroundImage: 'none',
      },
      rounded: {
        borderRadius: 12,
      },
    },
  },
  MuiTableCell: {
    styleOverrides: {
      root: {
        borderBottom: `1px solid ${saasColors.border}`,
        padding: '12px 16px',
      },
      head: {
        backgroundColor: saasColors.background.default,
        fontWeight: 600,
        color: saasColors.text.primary,
      },
    },
  },
  MuiTableRow: {
    styleOverrides: {
      root: {
        '&:hover': {
          backgroundColor: 'rgba(0, 0, 0, 0.02)',
        },
      },
    },
  },
  MuiChip: {
    styleOverrides: {
      root: {
        borderRadius: 6,
        fontWeight: 500,
      },
    },
  },
  MuiTextField: {
    styleOverrides: {
      root: {
        '& .MuiOutlinedInput-root': {
          borderRadius: 8,
          '& fieldset': {
            borderColor: saasColors.border,
          },
          '&:hover fieldset': {
            borderColor: saasColors.primary,
          },
          '&.Mui-focused fieldset': {
            borderColor: saasColors.primary,
          },
        },
      },
    },
  },
  MuiListItemButton: {
    styleOverrides: {
      root: {
        borderRadius: 8,
        margin: '2px 8px',
        '&:hover': {
          backgroundColor: saasColors.background.sidebarHover,
        },
        '&.Mui-selected': {
          backgroundColor: saasColors.background.sidebarActive,
          '&:hover': {
            backgroundColor: saasColors.background.sidebarActive,
          },
        },
      },
    },
  },
  MuiListItemIcon: {
    styleOverrides: {
      root: {
        minWidth: 40,
        color: 'inherit',
      },
    },
  },
  MuiAvatar: {
    styleOverrides: {
      root: {
        backgroundColor: saasColors.primary,
        color: saasColors.text.inverse,
      },
    },
  },
  MuiAlert: {
    styleOverrides: {
      root: {
        borderRadius: 8,
      },
      standardSuccess: {
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        color: saasColors.success,
      },
      standardError: {
        backgroundColor: 'rgba(244, 67, 54, 0.1)',
        color: saasColors.error,
      },
      standardWarning: {
        backgroundColor: 'rgba(255, 193, 7, 0.1)',
        color: saasColors.warning,
      },
      standardInfo: {
        backgroundColor: 'rgba(33, 150, 243, 0.1)',
        color: saasColors.info,
      },
    },
  },
  MuiTabs: {
    styleOverrides: {
      indicator: {
        height: 3,
        borderRadius: '3px 3px 0 0',
      },
    },
  },
  MuiTab: {
    styleOverrides: {
      root: {
        textTransform: 'none',
        fontWeight: 500,
        fontSize: '14px',
        minHeight: 48,
      },
    },
  },
  MuiBreadcrumbs: {
    styleOverrides: {
      root: {
        '& .MuiTypography-root': {
          fontSize: '14px',
        },
      },
    },
  },
};

/**
 * SaaSテーマを作成
 * @param companyTheme オプションで保険会社テーマを渡すとアクセントカラーを適用
 */
export const createSaasTheme = (companyTheme?: InsuranceCompanyTheme): Theme => {
  // 保険会社テーマがある場合はアクセントカラーのみ適用（将来の拡張用）
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const accentColor = companyTheme?.colors.accent || saasColors.accent;

  return createTheme({
    palette: {
      primary: {
        main: saasColors.primary,
        light: '#3A5A83',
        dark: '#152B45',
        contrastText: '#FFFFFF',
      },
      secondary: {
        main: saasColors.secondary,
        light: '#FF8A5C',
        dark: '#CC5529',
        contrastText: '#FFFFFF',
      },
      success: {
        main: saasColors.success,
        light: '#81C784',
        dark: '#388E3C',
      },
      warning: {
        main: saasColors.warning,
        light: '#FFD54F',
        dark: '#FFA000',
      },
      error: {
        main: saasColors.error,
        light: '#E57373',
        dark: '#D32F2F',
      },
      info: {
        main: saasColors.info,
        light: '#64B5F6',
        dark: '#1976D2',
      },
      background: {
        default: saasColors.background.default,
        paper: saasColors.background.paper,
      },
      text: {
        primary: saasColors.text.primary,
        secondary: saasColors.text.secondary,
        disabled: saasColors.text.disabled,
      },
      divider: saasColors.divider,
    },
    typography: {
      fontFamily: saasTypography.fontFamily,
      h1: saasTypography.h1,
      h2: saasTypography.h2,
      h3: saasTypography.h3,
      h4: saasTypography.h4,
      h5: saasTypography.h5,
      h6: saasTypography.h6,
      body1: saasTypography.body1,
      body2: saasTypography.body2,
      caption: saasTypography.caption,
      button: saasTypography.button,
    },
    shape: {
      borderRadius: 8,
    },
    shadows: [
      'none',
      '0 1px 2px rgba(0,0,0,0.05)',
      '0 1px 3px rgba(0,0,0,0.08)',
      '0 2px 4px rgba(0,0,0,0.1)',
      '0 2px 6px rgba(0,0,0,0.1)',
      '0 3px 8px rgba(0,0,0,0.12)',
      '0 4px 10px rgba(0,0,0,0.12)',
      '0 5px 12px rgba(0,0,0,0.14)',
      '0 6px 14px rgba(0,0,0,0.14)',
      '0 7px 16px rgba(0,0,0,0.16)',
      '0 8px 18px rgba(0,0,0,0.16)',
      '0 9px 20px rgba(0,0,0,0.18)',
      '0 10px 22px rgba(0,0,0,0.18)',
      '0 11px 24px rgba(0,0,0,0.2)',
      '0 12px 26px rgba(0,0,0,0.2)',
      '0 13px 28px rgba(0,0,0,0.22)',
      '0 14px 30px rgba(0,0,0,0.22)',
      '0 15px 32px rgba(0,0,0,0.24)',
      '0 16px 34px rgba(0,0,0,0.24)',
      '0 17px 36px rgba(0,0,0,0.26)',
      '0 18px 38px rgba(0,0,0,0.26)',
      '0 19px 40px rgba(0,0,0,0.28)',
      '0 20px 42px rgba(0,0,0,0.28)',
      '0 21px 44px rgba(0,0,0,0.3)',
      '0 22px 46px rgba(0,0,0,0.3)',
    ],
    components: componentOverrides,
  });
};

// デフォルトのSaaSテーマ
export const saasTheme = createSaasTheme();

// カスタムテーマ拡張型
declare module '@mui/material/styles' {
  interface TypographyVariants {
    numberLarge: React.CSSProperties;
    numberMedium: React.CSSProperties;
  }

  interface TypographyVariantsOptions {
    numberLarge?: React.CSSProperties;
    numberMedium?: React.CSSProperties;
  }
}

declare module '@mui/material/Typography' {
  interface TypographyPropsVariantOverrides {
    numberLarge: true;
    numberMedium: true;
  }
}

export default saasTheme;

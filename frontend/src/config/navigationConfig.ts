/**
 * ナビゲーション設定
 * ロールベースのナビゲーション項目を定義
 */

import React from 'react';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Business as BusinessIcon,
  TrendingUp,
  PictureAsPdf as PdfIcon,
  PersonAdd as PersonAddIcon,
  AccountBalance as AccountBalanceIcon,
} from '@mui/icons-material';

export type AccountType = 'admin' | 'parent' | 'child' | 'grandchild';

export interface NavigationItem {
  id: string;
  path: string;
  label: string;
  icon: React.ReactElement;
  roles: AccountType[];
  dividerAfter?: boolean;
  badge?: number;
}

export interface NavigationSection {
  id: string;
  title?: string;
  items: NavigationItem[];
}

/**
 * ナビゲーション項目の定義
 */
export const navigationItems: NavigationItem[] = [
  // ダッシュボード - 全ユーザー
  {
    id: 'dashboard',
    path: '/dashboard',
    label: 'ダッシュボード',
    icon: React.createElement(DashboardIcon),
    roles: ['admin', 'parent', 'child', 'grandchild'],
  },
  // 顧客管理 - parent, child
  {
    id: 'customers',
    path: '/customers',
    label: '顧客管理',
    icon: React.createElement(PeopleIcon),
    roles: ['parent', 'child'],
  },
  // 担当者管理 - parent only
  {
    id: 'staff',
    path: '/staff',
    label: '担当者管理',
    icon: React.createElement(PersonAddIcon),
    roles: ['parent'],
  },
  // 保険会社 - parent, child
  {
    id: 'insurance-companies',
    path: '/insurance-companies',
    label: '保険会社',
    icon: React.createElement(BusinessIcon),
    roles: ['parent', 'child'],
  },
  // シミュレーション - parent, child
  {
    id: 'simulation',
    path: '/simulation',
    label: 'シミュレーション',
    icon: React.createElement(TrendingUp),
    roles: ['parent', 'child'],
    dividerAfter: true,
  },
  // 代理店管理 - admin only
  {
    id: 'agencies',
    path: '/agencies',
    label: '代理店管理',
    icon: React.createElement(AccountBalanceIcon),
    roles: ['admin'],
  },
  // 保険会社管理 - admin only
  {
    id: 'agency-management',
    path: '/admin/agency-management',
    label: '保険会社管理',
    icon: React.createElement(BusinessIcon),
    roles: ['admin'],
  },
  // PDFアップロード - admin only
  {
    id: 'pdf-upload',
    path: '/admin/pdf-upload',
    label: 'PDFアップロード',
    icon: React.createElement(PdfIcon),
    roles: ['admin'],
  },
];

/**
 * ロールに基づいてナビゲーション項目をフィルタリング
 */
export const getNavigationItemsByRole = (role: AccountType): NavigationItem[] => {
  return navigationItems.filter(item => item.roles.includes(role));
};

/**
 * セクション分けされたナビゲーション
 */
export const getNavigationSections = (role: AccountType): NavigationSection[] => {
  const items = getNavigationItemsByRole(role);
  const sections: NavigationSection[] = [];
  let currentSection: NavigationSection = { id: 'main', items: [] };

  items.forEach((item, index) => {
    currentSection.items.push(item);

    if (item.dividerAfter && index < items.length - 1) {
      sections.push(currentSection);
      currentSection = { id: `section-${sections.length + 1}`, items: [] };
    }
  });

  if (currentSection.items.length > 0) {
    sections.push(currentSection);
  }

  return sections;
};

/**
 * アカウントタイプのラベル
 */
export const accountTypeLabels: Record<AccountType, string> = {
  admin: '管理者',
  parent: '代理店',
  child: '生保担当者',
  grandchild: '顧客',
};

/**
 * アカウントタイプからラベルを取得
 */
export const getAccountTypeLabel = (type: AccountType | string): string => {
  return accountTypeLabels[type as AccountType] || type;
};

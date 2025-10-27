/**
 * 保険会社別のテーマ設定
 * 各保険会社のブランドカラー、ロゴ、表示名などを管理
 */

export interface InsuranceCompanyTheme {
  code: string;
  name: string;
  displayName: string;
  anonymizedName: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
  };
  logo?: string;
  description: string;
}

export const insuranceCompanyThemes: Record<string, InsuranceCompanyTheme> = {
  PRUDENTIAL_LIFE: {
    code: 'PRUDENTIAL_LIFE',
    name: 'プルデンシャル生命保険株式会社',
    displayName: 'プルデンシャル生命',
    anonymizedName: 'P社',
    colors: {
      primary: '#003B5C',      // プルデンシャルブルー（紺）
      secondary: '#00A3E0',    // ライトブルー
      accent: '#FF6B35',       // アクセントカラー
      background: '#F8FAFC',   // 背景
    },
    description: '世界最大級の金融サービス企業プルデンシャル・ファイナンシャルの一員',
  },
  AXA_LIFE: {
    code: 'AXA_LIFE',
    name: 'アクサ生命保険株式会社',
    displayName: 'アクサ生命',
    anonymizedName: 'A社',
    colors: {
      primary: '#00008F',      // AXAブルー
      secondary: '#FF1721',    // AXAレッド
      accent: '#00D4FF',       // アクセントブルー
      background: '#F8FAFC',   // 背景
    },
    description: '世界No.1の保険ブランド、AXAグループの日本法人',
  },
  SONY_LIFE: {
    code: 'SONY_LIFE',
    name: 'ソニー生命保険株式会社',
    displayName: 'ソニー生命',
    anonymizedName: 'S社',
    colors: {
      primary: '#0066CC',      // ソニーブルー
      secondary: '#FF9900',    // オレンジ
      accent: '#00CC99',       // アクセントグリーン
      background: '#F8FAFC',   // 背景
    },
    description: 'ソニーグループの生命保険会社、オーダーメイドの保障設計',
  },
};

/**
 * 保険会社コードからテーマを取得
 */
export const getInsuranceCompanyTheme = (companyCode: string): InsuranceCompanyTheme | null => {
  return insuranceCompanyThemes[companyCode] || null;
};

/**
 * デフォルトテーマ（保険会社が指定されていない場合）
 */
export const defaultTheme: InsuranceCompanyTheme = {
  code: 'DEFAULT',
  name: '変額保険アドバイザー',
  displayName: '変額保険アドバイザー',
  anonymizedName: '保険会社',
  colors: {
    primary: '#1976d2',      // Material-UI デフォルトブルー
    secondary: '#dc004e',    // Material-UI デフォルトピンク
    accent: '#f50057',       // アクセントピンク
    background: '#F8FAFC',   // 背景
  },
  description: '変額保険の資産運用をサポートするアドバイザーシステム',
};

/**
 * ユーザーの契約保険会社からテーマを決定
 * 複数ある場合は最初の1つを使用
 */
export const getUserTheme = (insuranceCompanies: any[]): InsuranceCompanyTheme => {
  if (!insuranceCompanies || insuranceCompanies.length === 0) {
    return defaultTheme;
  }

  const firstCompany = insuranceCompanies[0];
  const theme = getInsuranceCompanyTheme(firstCompany.company_code);

  return theme || defaultTheme;
};

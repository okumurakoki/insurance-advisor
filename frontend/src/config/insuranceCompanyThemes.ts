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
  SONY_LIFE_SOVANI: {
    code: 'SONY_LIFE_SOVANI',
    name: 'ソニー生命保険株式会社',
    displayName: 'ソニー生命 SOVANI',
    anonymizedName: 'S社',
    colors: {
      primary: '#0066CC',      // ソニーブルー
      secondary: '#FF9900',    // オレンジ
      accent: '#00CC99',       // アクセントグリーン
      background: '#F8FAFC',   // 背景
    },
    description: 'ソニー生命の変額個人年金保険 SOVANI',
  },
  SONY_LIFE_ANNUITY: {
    code: 'SONY_LIFE_ANNUITY',
    name: 'ソニー生命保険株式会社',
    displayName: 'ソニー生命 個人年金',
    anonymizedName: 'S社',
    colors: {
      primary: '#0066CC',      // ソニーブルー
      secondary: '#FF9900',    // オレンジ
      accent: '#00CC99',       // アクセントグリーン
      background: '#F8FAFC',   // 背景
    },
    description: 'ソニー生命の変額個人年金保険（無告知型）22',
  },
  SOMPO_HIMAWARI_LIFE: {
    code: 'SOMPO_HIMAWARI_LIFE',
    name: 'SOMPOひまわり生命保険株式会社',
    displayName: 'SOMPOひまわり生命',
    anonymizedName: 'H社',
    colors: {
      primary: '#E85A00',      // ひまわりオレンジ
      secondary: '#003366',    // SOMPOネイビー
      accent: '#FFB300',       // イエローアクセント
      background: '#FFF9F0',   // 暖かい背景
    },
    description: 'SOMPOグループの生命保険会社、健康応援企業',
  },
  HANASAKU_LIFE: {
    code: 'HANASAKU_LIFE',
    name: 'はなさく生命保険株式会社',
    displayName: 'はなさく生命',
    anonymizedName: 'N社',
    colors: {
      primary: '#E91E63',      // ピンク（花のイメージ）
      secondary: '#4CAF50',    // グリーン（自然のイメージ）
      accent: '#FF9800',       // オレンジアクセント
      background: '#FFF5F8',   // 暖かいピンク背景
    },
    description: '日本生命グループの生命保険会社、はなさく変額保険',
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

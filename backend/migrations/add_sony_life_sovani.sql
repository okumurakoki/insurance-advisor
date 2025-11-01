-- ソニー生命のSOVANI版を追加
-- 現在のSONY_LIFEはバリアブル・ライフ版として継続使用

-- SONY_LIFEの表示名を更新してバリアブル・ライフ版であることを明示
UPDATE insurance_companies
SET
    display_name = 'S社 (バリアブル・ライフ版)',
    company_name = 'ソニー生命保険株式会社 - バリアブル・ライフ',
    updated_at = CURRENT_TIMESTAMP
WHERE company_code = 'SONY_LIFE';

-- SOVANI版を新規追加
INSERT INTO insurance_companies (
    company_code,
    company_name,
    company_name_en,
    display_name,
    is_active,
    created_at,
    updated_at
) VALUES (
    'SONY_LIFE_SOVANI',
    'ソニー生命保険株式会社 - SOVANI',
    'Sony Life Insurance - SOVANI',
    'S社 (SOVANI版)',
    TRUE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT (company_code) DO UPDATE
SET
    company_name = EXCLUDED.company_name,
    company_name_en = EXCLUDED.company_name_en,
    display_name = EXCLUDED.display_name,
    is_active = EXCLUDED.is_active,
    updated_at = CURRENT_TIMESTAMP;

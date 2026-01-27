-- 新しい保険会社の追加 (2025年1月)
-- SOMPOひまわり生命、はなさく生命、ソニー生命（個人年金）

-- SOMPOひまわり生命
INSERT INTO insurance_companies (company_code, company_name, display_name, created_at)
SELECT 'SOMPO_HIMAWARI_LIFE', 'SOMPOひまわり生命保険株式会社', 'SOMPOひまわり生命', NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM insurance_companies WHERE company_code = 'SOMPO_HIMAWARI_LIFE'
);

-- はなさく生命
INSERT INTO insurance_companies (company_code, company_name, display_name, created_at)
SELECT 'HANASAKU_LIFE', 'はなさく生命保険株式会社', 'はなさく生命', NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM insurance_companies WHERE company_code = 'HANASAKU_LIFE'
);

-- ソニー生命（個人年金） - SONY_LIFE_ANNUITYが存在しない場合のみ追加
INSERT INTO insurance_companies (company_code, company_name, display_name, created_at)
SELECT 'SONY_LIFE_ANNUITY', 'ソニー生命保険株式会社（変額個人年金）', 'ソニー生命（個人年金）', NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM insurance_companies WHERE company_code = 'SONY_LIFE_ANNUITY'
);

-- 確認クエリ
SELECT id, company_code, company_name, display_name, created_at
FROM insurance_companies
ORDER BY id;

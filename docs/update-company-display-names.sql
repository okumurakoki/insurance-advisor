-- Update Insurance Companies with Display Names
-- Version: 1.2.0
-- Description: Add display names for anonymization

-- Drop existing view first
DROP VIEW IF EXISTS v_agency_companies;

ALTER TABLE insurance_companies
ADD COLUMN IF NOT EXISTS display_name VARCHAR(50);

-- Update display names
UPDATE insurance_companies 
SET display_name = 'P社' 
WHERE company_code = 'PRUDENTIAL_LIFE';

UPDATE insurance_companies 
SET display_name = 'A社' 
WHERE company_code = 'AXA_LIFE';

UPDATE insurance_companies 
SET display_name = 'S社' 
WHERE company_code = 'SONY_LIFE';

-- Update the view to include display names
CREATE OR REPLACE VIEW v_agency_companies AS
SELECT
    aic.id,
    aic.user_id,
    u.user_id as agency_user_id,
    u.account_type,
    aic.company_id,
    ic.company_code,
    ic.company_name,
    ic.company_name_en,
    ic.display_name,
    aic.contract_start_date,
    aic.contract_end_date,
    aic.is_active,
    aic.notes,
    aic.created_at,
    aic.updated_at
FROM agency_insurance_companies aic
JOIN users u ON aic.user_id = u.id
JOIN insurance_companies ic ON aic.company_id = ic.id;

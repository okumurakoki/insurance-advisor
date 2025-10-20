-- マーケットデータの詳細を確認
SELECT
    id,
    source_file,
    data_date,
    created_at,
    uploaded_by,
    data_content
FROM market_data
ORDER BY created_at DESC
LIMIT 1;

-- fundPerformanceの存在確認
SELECT
    id,
    source_file,
    data_content->>'fileName' as file_name,
    data_content->>'parsedSuccessfully' as parsed,
    CASE
        WHEN data_content->'fundPerformance' IS NOT NULL THEN 'YES'
        ELSE 'NO'
    END as has_fund_performance,
    CASE
        WHEN data_content->'allPerformanceData' IS NOT NULL THEN 'YES'
        ELSE 'NO'
    END as has_all_performance,
    CASE
        WHEN data_content->'bondYields' IS NOT NULL THEN 'YES'
        ELSE 'NO'
    END as has_bond_yields,
    data_content->'fundPerformance' as fund_performance_data
FROM market_data
ORDER BY created_at DESC
LIMIT 1;

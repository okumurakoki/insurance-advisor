-- market_dataテーブルのスキーマを確認
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'market_data'
ORDER BY ordinal_position;

-- data_contentの実際の型を確認
SELECT
    id,
    pg_typeof(data_content) as data_content_type,
    data_content::text as content_preview
FROM market_data
ORDER BY created_at DESC
LIMIT 1;

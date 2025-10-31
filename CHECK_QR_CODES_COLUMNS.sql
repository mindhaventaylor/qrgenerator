-- Check what columns actually exist in qr_codes table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'qr_codes'
ORDER BY ordinal_position;


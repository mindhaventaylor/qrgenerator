-- SQL Script to Check and Configure Edge Function Settings
-- Note: Supabase Edge Function JWT settings are managed via config.json or dashboard
-- This SQL helps verify the function exists and check related configurations

-- 1. Verify the function can access qr_scans table
-- Check RLS policies on qr_scans table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'qr_scans';

-- 2. Check if service_role can insert (should be allowed)
SELECT 
    'RLS is enabled: ' || (SELECT COUNT(*) FROM pg_tables WHERE tablename = 'qr_scans' AND rowsecurity = true)::text as rls_status;

-- 3. Test inserting a scan record (replace with actual UUID)
-- Uncomment and run with a test QR code ID:
/*
INSERT INTO qr_scans (qr_code_id, scanned_at, user_agent)
VALUES ('00000000-0000-0000-0000-000000000000'::uuid, NOW(), 'test-agent')
ON CONFLICT DO NOTHING;
*/

-- 4. Check function secrets are set (this won't show values, just confirms they exist)
-- Note: Edge Function secrets are managed in Supabase Dashboard, not via SQL

-- 5. Verify qr_codes table structure
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'qr_codes'
ORDER BY ordinal_position;

-- 6. Check qr_scans table structure
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'qr_scans'
ORDER BY ordinal_position;

-- 7. Verify foreign key relationship
SELECT
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'qr_scans';


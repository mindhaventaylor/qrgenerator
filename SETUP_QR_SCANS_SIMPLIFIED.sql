-- Simple setup for qr_scans table
-- This table should already exist from migration 1761876403_enable_rls_and_policies.sql

-- Just verify and refresh schema cache if table exists
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'qr_scans'
    ) THEN
        NOTIFY pgrst, 'reload schema';
        RAISE NOTICE 'qr_scans table exists and schema cache refreshed';
    ELSE
        RAISE EXCEPTION 'qr_scans table does not exist. Please run the migration first.';
    END IF;
END $$;

-- Show current policies
SELECT schemaname, tablename, policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'qr_scans'
ORDER BY policyname;


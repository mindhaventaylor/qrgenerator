-- Fix qr_codes table - add missing columns if needed

-- Add customization column if missing
ALTER TABLE qr_codes 
ADD COLUMN IF NOT EXISTS customization JSONB DEFAULT '{}'::jsonb;

-- Add other potentially missing columns
ALTER TABLE qr_codes 
ADD COLUMN IF NOT EXISTS is_dynamic BOOLEAN DEFAULT TRUE;

ALTER TABLE qr_codes 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

ALTER TABLE qr_codes 
ADD COLUMN IF NOT EXISTS scan_count INTEGER DEFAULT 0;

ALTER TABLE qr_codes 
ADD COLUMN IF NOT EXISTS unique_scan_count INTEGER DEFAULT 0;

-- Verify all columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'qr_codes'
ORDER BY ordinal_position;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';


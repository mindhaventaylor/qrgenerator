-- Add is_tracked column to qr_codes table
ALTER TABLE qr_codes
ADD COLUMN IF NOT EXISTS is_tracked BOOLEAN DEFAULT TRUE;

-- Set all existing QR codes as tracked (backward compatibility)
UPDATE qr_codes
SET is_tracked = TRUE
WHERE is_tracked IS NULL;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';

-- Verify the column was added
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'qr_codes' 
AND column_name = 'is_tracked';


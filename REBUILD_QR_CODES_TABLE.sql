-- Rebuild qr_codes table with complete schema
-- WARNING: This will delete all QR code data!

-- Drop the table and recreate it properly
DROP TABLE IF EXISTS qr_codes CASCADE;

-- Recreate qr_codes table with all columns
CREATE TABLE qr_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    folder_id UUID,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN (
        'website',
        'pdf',
        'images',
        'video',
        'wifi',
        'menu',
        'business',
        'vcard',
        'mp3',
        'apps',
        'links',
        'coupon',
        'facebook',
        'instagram',
        'social',
        'whatsapp'
    )),
    content JSONB NOT NULL,
    qr_image_url TEXT,
    customization JSONB DEFAULT '{}'::jsonb,
    is_dynamic BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    scan_count INTEGER DEFAULT 0,
    unique_scan_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Re-enable RLS
ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;

-- Recreate RLS policies
CREATE POLICY "Users can view own qr codes" ON qr_codes
  FOR SELECT USING (auth.uid() = user_id OR auth.role() IN ('anon', 'service_role'));

CREATE POLICY "Users can insert own qr codes" ON qr_codes
  FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.role() IN ('anon', 'service_role'));

CREATE POLICY "Users can update own qr codes" ON qr_codes
  FOR UPDATE USING (auth.uid() = user_id OR auth.role() IN ('anon', 'service_role'));

CREATE POLICY "Users can delete own qr codes" ON qr_codes
  FOR DELETE USING (auth.uid() = user_id OR auth.role() IN ('anon', 'service_role'));

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';

-- Verify the table was created
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'qr_codes'
ORDER BY ordinal_position;


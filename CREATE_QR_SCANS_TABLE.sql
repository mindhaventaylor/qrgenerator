-- Create qr_scans table if it doesn't exist
CREATE TABLE IF NOT EXISTS qr_scans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    qr_code_id UUID NOT NULL,
    scanned_at TIMESTAMPTZ DEFAULT NOW(),
    country TEXT,
    city TEXT,
    operating_system TEXT,
    device_type TEXT,
    browser TEXT,
    ip_address TEXT,
    user_agent TEXT
);

-- Add foreign key constraint
ALTER TABLE qr_scans
ADD CONSTRAINT fk_qr_scans_qr_code_id
FOREIGN KEY (qr_code_id) REFERENCES qr_codes(id) ON DELETE CASCADE;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_qr_scans_qr_code_id ON qr_scans(qr_code_id);
CREATE INDEX IF NOT EXISTS idx_qr_scans_scanned_at ON qr_scans(scanned_at);

-- Enable Row Level Security
ALTER TABLE qr_scans ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own QR scan data" ON qr_scans
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM qr_codes
      WHERE qr_codes.id = qr_scans.qr_code_id
      AND qr_codes.user_id = auth.uid()
    )
  );

-- Allow anyone to insert scans (track-scan function needs this)
CREATE POLICY "Anyone can insert scans" ON qr_scans
  FOR INSERT TO anon
  WITH CHECK (true);

-- Allow authenticated users to insert scans  
CREATE POLICY "Authenticated users can insert scans" ON qr_scans
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';

-- Verify the table was created
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'qr_scans'
ORDER BY ordinal_position;


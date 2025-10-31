-- Create the qr-images storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'qr-images',
  'qr-images',
  true,
  5242880,  -- 5MB limit
  ARRAY['image/png', 'image/jpeg', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies (allow authenticated users to upload)
CREATE POLICY "Users can upload their own QR images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'qr-images');

CREATE POLICY "Users can view public QR images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'qr-images');

CREATE POLICY "Users can update own QR images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'qr-images');

CREATE POLICY "Users can delete own QR images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'qr-images');


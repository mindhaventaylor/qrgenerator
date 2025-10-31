-- Drop and recreate storage policies for qr-images bucket
-- This ensures they work correctly

DROP POLICY IF EXISTS "Users can upload their own QR images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view public QR images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own QR images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own QR images" ON storage.objects;

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

-- Verify the bucket exists
SELECT id, name, public 
FROM storage.buckets 
WHERE id = 'qr-images';

-- Check the policies were created
SELECT policyname, cmd 
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects'
AND policyname LIKE '%qr-images%';


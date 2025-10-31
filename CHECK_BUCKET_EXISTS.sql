-- Check if bucket exists
SELECT id, name, public, created_at
FROM storage.buckets
WHERE id = 'qr-images';

-- Check policies
SELECT policyname
FROM pg_policies
WHERE schemaname = 'storage' 
AND tablename = 'objects'
AND policyname LIKE '%qr-images%';


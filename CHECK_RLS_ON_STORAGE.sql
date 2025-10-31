-- Check if RLS is enabled on storage.objects table
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'storage'
AND tablename = 'objects';


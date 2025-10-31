-- Check if subscriptions table exists and show its columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'subscriptions'
ORDER BY ordinal_position;

-- Also check if table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'subscriptions';


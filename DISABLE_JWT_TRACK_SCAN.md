# How to Disable JWT Verification for track-scan Function

The `supabase.functions.config.json` file should work, but if it's not taking effect, here are alternative methods:

## Method 1: Redeploy Function with Config File (Recommended)

The config file `supabase/functions/track-scan/supabase.functions.config.json` with `"verify_jwt": false` should work, but you need to **redeploy** the function after adding/changing it.

### Via Supabase Dashboard:
1. Go to Supabase Dashboard → Edge Functions
2. Click on `track-scan` function
3. Click **Deploy** (or **Edit** then **Deploy**)
4. The config file should be picked up automatically

### Via Supabase CLI:
```bash
supabase functions deploy track-scan --no-verify-jwt
```

## Method 2: Disable JWT via Supabase Dashboard

1. Go to Supabase Dashboard → **Edge Functions**
2. Find the `track-scan` function
3. Click on it to open details
4. Look for **Settings** or **Configuration** tab
5. Find **JWT Verification** option
6. Toggle it to **OFF** or **Disable**
7. Save changes

## Method 3: Use Supabase CLI Flag

Deploy with the `--no-verify-jwt` flag:

```bash
supabase functions deploy track-scan --project-ref YOUR_PROJECT_REF --no-verify-jwt
```

## Method 4: Check Function Configuration in Database

Run this SQL in Supabase SQL Editor to check function metadata:

```sql
-- Check if function exists and get its configuration
SELECT 
    name,
    definition,
    language
FROM pg_proc 
WHERE proname LIKE '%track%scan%';

-- Note: Edge Function JWT settings are not stored in PostgreSQL
-- They are managed by Supabase's edge function runtime
```

## Verify It's Working

After disabling JWT, test the function:

```bash
curl -X GET "https://YOUR_PROJECT_REF.supabase.co/functions/v1/track-scan?id=TEST_QR_CODE_ID"
```

If JWT is properly disabled, you should get a response (even if it's an error about missing QR code ID).

## Check Function Logs

1. Go to Supabase Dashboard → Edge Functions → `track-scan`
2. Click **Logs** tab
3. Look for the detailed error logs we just added
4. The logs will show:
   - Function invocation details
   - Environment variable status
   - Database response details
   - Full error stack traces

## Troubleshooting

### Config file not working?

1. **Check file location**: Must be at `supabase/functions/track-scan/supabase.functions.config.json`
2. **Check file format**: Must be valid JSON
3. **Redeploy**: Config changes require redeployment
4. **Check Dashboard**: Supabase Dashboard should show JWT verification status

### Still getting authentication errors?

The enhanced logging will show:
- Whether environment variables are set
- Database response details
- Specific error messages

Check the logs in Supabase Dashboard after the next scan attempt.


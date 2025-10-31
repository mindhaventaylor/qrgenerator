# Fix "Failed to send a request to the Edge Function" Error

## Quick Fix Checklist

### 1. ✅ Verify Supabase Project URL Matches

Your Supabase project is: `pstoxizwwgbpwrcdknto.supabase.co`

Check your `.env` file has:
```
VITE_SUPABASE_URL=https://pstoxizwwgbpwrcdknto.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_for_this_project
```

**Important:** Make sure the URL matches your actual Supabase project!

### 2. ✅ Check User is Authenticated

The Edge Function needs an authenticated user. Make sure:
- User is logged in before clicking "Subscribe"
- The Supabase client has the user's session token

### 3. ✅ Verify Function is Deployed and Active

1. Go to: https://app.supabase.com/project/pstoxizwwgbpwrcdknto/functions
2. Verify `create-checkout` function exists and is **Active**
3. Click on it to see details and logs

### 4. ✅ Check Function Logs

1. Go to Edge Functions → `create-checkout` → **Logs** tab
2. Try to subscribe again
3. Check what errors appear in the logs

### 5. ✅ Verify Secrets are Set

1. Go to Edge Functions → **Manage secrets**
2. Verify `STRIPE_SECRET_KEY` is set with your key
3. No extra spaces or quotes around the value

### 6. ✅ Test Function Directly

Test the function with curl to see if it works:

```bash
curl -X POST https://pstoxizwwgbpwrcdknto.supabase.co/functions/v1/create-checkout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{"userId": "test-user-id", "amount": 500}'
```

Replace `YOUR_ANON_KEY` with your actual Supabase anon key.

If this works, the issue is with the frontend call.

## Common Causes

### Cause 1: Wrong Supabase Project URL
- **Symptom:** Function not found
- **Fix:** Update `.env` with correct `VITE_SUPABASE_URL`

### Cause 2: User Not Authenticated
- **Symptom:** 401 Unauthorized
- **Fix:** Make sure user is logged in before subscribing

### Cause 3: Function Not Deployed
- **Symptom:** 404 Not Found
- **Fix:** Deploy the function in Supabase Dashboard

### Cause 4: Network/CORS Issue
- **Symptom:** Network error in browser console
- **Fix:** Check browser console for specific CORS error

### Cause 5: Missing Anon Key
- **Symptom:** Authentication errors
- **Fix:** Verify `VITE_SUPABASE_ANON_KEY` is set correctly

## Debug Steps

1. **Open Browser Console (F12)**
   - Go to Console tab
   - Try to subscribe
   - Look for error messages

2. **Check Network Tab**
   - Open DevTools → Network tab
   - Try to subscribe
   - Find the request to `create-checkout`
   - Click on it to see:
     - Request URL (should match your project)
     - Request headers
     - Response status and body

3. **Verify Supabase Client**
   - In browser console, type: `supabase.auth.getSession()`
   - Should return a session with user data
   - If null, user needs to log in

## Expected Request Format

The function should receive:
```json
{
  "userId": "user-uuid-here",
  "amount": 500
}
```

And respond with:
```json
{
  "sessionId": "cs_test_..."
}
```

## Still Not Working?

1. Check the exact error message in browser console
2. Check Supabase Edge Function logs
3. Verify all environment variables are correct
4. Make sure you're using the same Supabase project URL everywhere


# Testing Google OAuth Login

## Step 1: Check Supabase Configuration

### Verify Google Provider Settings
1. Go to: https://app.supabase.com/project/pstoxizwwgbpwrcdknto/auth/providers
2. Click on **Google** provider
3. Verify:
   - ✅ **Enabled**: Toggle is ON
   - ✅ **Client ID**: Your Google OAuth Client ID is set
   - ✅ **Client Secret**: Your Google OAuth Secret is set

### Verify URL Configuration
1. Go to: https://app.supabase.com/project/pstoxizwwgbpwrcdknto/auth/url-configuration
2. Check:
   - **Site URL**: `https://qrgenerator-liart.vercel.app`
   - **Redirect URLs**: Should include:
     ```
     https://qrgenerator-liart.vercel.app/**
     https://qrgenerator-liart.vercel.app/auth/callback
     https://qrgenerator-liart.vercel.app/
     ```

## Step 2: Check Google Cloud Console

1. Go to: https://console.cloud.google.com/
2. Navigate to: **APIs & Services** → **Credentials**
3. Click on your OAuth client
4. Verify **Authorized redirect URIs** includes:
   ```
   https://pstoxizwwgbpwrcdknto.supabase.co/auth/v1/callback
   ```

## Step 3: Test the Flow

### Local Testing (Development)
1. Start dev server: `cd qr-generator && npm run dev`
2. Open browser console (F12)
3. Go to: http://localhost:5173/login
4. Click **"Continue with Google"**
5. Watch console for:
   - `OAuth callback triggered`
   - `Session data: { hasSession: ..., hasUser: ... }`
   - Any error messages

### Production Testing
1. Go to: https://qrgenerator-liart.vercel.app/login
2. Open browser console (F12)
3. Click **"Continue with Google"**
4. Watch console for logs

## Step 4: Debug Common Issues

### Issue: "Redirect URI mismatch"
**Cause**: Google OAuth client doesn't have the Supabase redirect URI

**Fix**: Add to Google Cloud Console:
```
https://pstoxizwwgbpwrcdknto.supabase.co/auth/v1/callback
```

### Issue: Redirects to Supabase then nothing happens
**Cause**: Supabase redirect URLs not configured correctly

**Fix**: Add to Supabase URL Configuration:
```
https://qrgenerator-liart.vercel.app/auth/callback
```

### Issue: Shows callback page but never redirects to dashboard
**Cause**: Session not being created properly

**Check**:
1. Look at browser console logs
2. Check Network tab for `/auth/callback` request
3. Check localStorage/sessionStorage for Supabase session

### Issue: "No session found" error
**Cause**: Token exchange failed or redirect URL mismatch

**Fix**:
1. Verify Supabase redirect URL matches exactly
2. Check that Google OAuth client has correct redirect URI
3. Try clearing browser cookies and localStorage

## Step 5: Manual Verification

### Check Browser Storage
After attempting login, check:
1. Open DevTools (F12)
2. Go to **Application** tab (Chrome) or **Storage** tab (Firefox)
3. Look under **Local Storage** → `http://localhost:5173` (or your URL)
4. Check for keys starting with `sb-`

### Check Network Requests
1. Open DevTools (F12)
2. Go to **Network** tab
3. Filter by "supabase"
4. Look for:
   - `/auth/v1/callback?code=...`
   - `/auth/v1/token?grant_type=...`

## Expected Flow

1. Click "Continue with Google"
2. Redirected to Google sign-in page
3. Select Google account
4. Redirected to: `https://pstoxizwwgbpwrcdknto.supabase.co/auth/v1/callback?code=...`
5. Supabase processes code
6. Redirects to: `https://qrgenerator-liart.vercel.app/auth/callback#access_token=...`
7. App processes callback
8. Redirects to: `/dashboard`

## Still Not Working?

Check these common mistakes:
1. ❌ Wrong domain in Supabase redirect URLs (typo in domain)
2. ❌ Google OAuth client uses wrong project/environment
3. ❌ Browser blocking third-party cookies
4. ❌ Using HTTP instead of HTTPS (Google requires HTTPS)
5. ❌ OAuth consent screen not configured in Google Cloud


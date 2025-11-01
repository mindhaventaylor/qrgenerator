# Quick Google OAuth Setup

## Step 1: Google Cloud Console

1. Go to: https://console.cloud.google.com/
2. Create/select project → **APIs & Services** → **Credentials**
3. Click **Create Credentials** → **OAuth client ID**
4. Configure OAuth consent screen (if first time):
   - App name: `QR Generator AI`
   - Support email: Your email
   - Click **Save**
5. Create OAuth client:
   - Type: **Web application**
   - Name: `QR Generator Web Client`
   - **Authorized redirect URIs**: 
     ```
     https://pstoxizwwgbpwrcdknto.supabase.co/auth/v1/callback
     ```
   - Click **Create**
6. **Copy Client ID and Client Secret**

## Step 2: Configure Supabase

1. Go to: https://app.supabase.com/project/pstoxizwwgbpwrcdknto/auth/providers
2. Click **Google** provider
3. Toggle **Enable Google provider**
4. Paste:
   - **Client ID**: (from Google Cloud Console)
   - **Client Secret**: (from Google Cloud Console)
5. Click **Save**

## Step 3: Configure Redirect URLs

1. Go to: https://app.supabase.com/project/pstoxizwwgbpwrcdknto/auth/url-configuration
2. Ensure **Site URL**: `https://qrgenerator-liart.vercel.app`
3. Add to **Redirect URLs**:
   ```
   https://qrgenerator-liart.vercel.app/**
   https://qrgenerator-liart.vercel.app/auth/callback
   ```
4. Click **Save**

## Done! 

Test at: https://qrgenerator-liart.vercel.app/login

Click "Continue with Google" to test.


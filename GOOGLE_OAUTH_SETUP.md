# Google OAuth Setup Guide

Follow these steps to enable Google login for your QR Generator AI application.

## Step 1: Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google+ API**:
   - Go to **APIs & Services** → **Library**
   - Search for "Google+ API"
   - Click **Enable**

## Step 2: Create OAuth Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. If prompted, configure the OAuth consent screen:
   - **User Type**: External
   - **App name**: QR Generator AI
   - **User support email**: Your email
   - **Developer contact email**: Your email
   - Click **Save and Continue**
   - Add scopes: `email`, `profile`
   - Add test users (optional during development)
   - Click **Save and Continue**

4. Configure OAuth client:
   - **Application type**: Web application
   - **Name**: QR Generator AI Web Client
   - **Authorized redirect URIs**: 
     ```
     https://pstoxizwwgbpwrcdknto.supabase.co/auth/v1/callback
     ```
   - Click **Create**

5. **IMPORTANT**: Copy your **Client ID** and **Client Secret**

## Step 3: Configure in Supabase

1. Go to your Supabase project: https://app.supabase.com/project/pstoxizwwgbpwrcdknto
2. Navigate to **Authentication** → **Providers**
3. Find **Google** and enable it
4. Enter your credentials:
   - **Client ID**: (paste from Google Cloud Console)
   - **Client Secret**: (paste from Google Cloud Console)
5. **Redirect URL**: Already configured
6. Click **Save**

## Step 4: Configure Redirect URLs in Supabase

Go to **Authentication** → **URL Configuration** and ensure:

- **Site URL**: `https://qrgenerator-liart.vercel.app`
- **Redirect URLs**: Add these URLs:
  ```
  https://qrgenerator-liart.vercel.app/**
  https://qrgenerator-liart.vercel.app/auth/callback
  https://qrgenerator-liart.vercel.app/login
  https://qrgenerator-liart.vercel.app/dashboard
  https://qrgenerator-liart.vercel.app/
  ```

## Step 5: Test Google Login

1. Go to your app: https://qrgenerator-liart.vercel.app/login
2. Click **"Continue with Google"**
3. Sign in with your Google account
4. You should be redirected back to the dashboard

## Troubleshooting

### Error: "redirect_uri_mismatch"
- Make sure the redirect URI in Google Cloud Console exactly matches: `https://pstoxizwwgbpwrcdknto.supabase.co/auth/v1/callback`
- Make sure Supabase has the correct Site URL configured

### Error: "Access blocked: This app's request is invalid"
- Check your OAuth consent screen configuration
- Make sure you've added test users if the app is in testing mode

### User not being created in database
- Check that your `handle_new_user()` trigger is working
- Verify RLS policies allow user creation

### Redirect after login not working
- Check that `/auth/callback` route is configured in your app
- Verify the redirect URL in Supabase matches your domain

## Security Notes

- Keep your Client Secret secure
- Never commit credentials to version control
- Use environment variables in production
- Regularly rotate your OAuth credentials


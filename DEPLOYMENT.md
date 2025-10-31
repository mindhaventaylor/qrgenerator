# Deployment Guide: Vercel + Supabase

This guide will help you deploy the QR Generator application to Vercel and configure Supabase.

## Prerequisites

1. A GitHub account (or GitLab/Bitbucket)
2. A Vercel account (sign up at [vercel.com](https://vercel.com))
3. A Supabase account and project (sign up at [supabase.com](https://supabase.com))

## Step 1: Prepare Your Repository

1. Make sure your code is committed and pushed to a Git repository (GitHub, GitLab, or Bitbucket)
2. The project structure should have `qr-generator` as the root directory containing `package.json`

## Step 2: Set Up Supabase

### 2.1 Create a Supabase Project (if you haven't already)

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Click "New Project"
3. Fill in your project details:
   - **Name**: Your project name
   - **Database Password**: Choose a strong password (save it!)
   - **Region**: Choose closest to your users
4. Wait for the project to be created (~2 minutes)

### 2.2 Get Your Supabase Credentials

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (this is your `VITE_SUPABASE_URL`)
   - **anon/public key** (this is your `VITE_SUPABASE_ANON_KEY`)

### 2.3 Set Up Database Tables

1. Go to **SQL Editor** in your Supabase dashboard
2. Run the SQL scripts from the `supabase/tables/` directory in order:
   - `profiles.sql`
   - `qr_codes.sql`
   - `qr_scans.sql`
   - `folders.sql`
   - `subscriptions.sql`
   - `payments.sql`
3. Apply migrations from `supabase/migrations/`:
   - `1761876403_enable_rls_and_policies.sql`

### 2.4 Set Up Storage Bucket

The application uses Supabase Edge Functions. You have two options:

**Option A: Use Edge Functions (Recommended)**
1. Go to **Edge Functions** in Supabase dashboard
2. Deploy each function from `supabase/functions/`:
   - `create-admin-user`
   - `create-bucket-qr-images-temp`
   - `generate-qr`
   - `track-scan`
3. For each function, set environment variables:
   - `SUPABASE_URL`: Your project URL
   - `SUPABASE_SERVICE_ROLE_KEY`: Found in Settings → API → service_role key (keep this secret!)

**Option B: Manual Setup**
1. Go to **Storage** in Supabase dashboard
2. Create a bucket named `qr-images`
3. Make it **public**
4. Set allowed MIME types: `image/png`, `image/jpeg`, `image/svg+xml`
5. Set file size limit: 5MB

### 2.5 Configure Authentication

1. Go to **Authentication** → **Providers** in Supabase dashboard
2. Enable **Email** provider
3. Configure email templates if needed
4. If using Google OAuth, enable **Google** provider and add your OAuth credentials

### 2.6 Set Up Row Level Security (RLS)

The migration file `1761876403_enable_rls_and_policies.sql` should have set up RLS policies. Verify:
1. Go to **Table Editor** in Supabase
2. Check that RLS is enabled on all tables
3. Verify policies are in place

## Step 3: Deploy to Vercel

### 3.1 Connect Your Repository

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **Add New...** → **Project**
3. Import your Git repository
4. Select the repository containing this project

### 3.2 Configure Build Settings

Vercel should auto-detect Vite, but verify these settings:

- **Framework Preset**: Vite
- **Root Directory**: `qr-generator` (if your repo root is one level up)
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### 3.3 Add Environment Variables

In Vercel project settings, go to **Settings** → **Environment Variables** and add:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Important**: 
- Add these for **Production**, **Preview**, and **Development** environments
- Replace `your-project` and `your-anon-key-here` with your actual Supabase values

### 3.4 Deploy

1. Click **Deploy**
2. Wait for the build to complete (~2-3 minutes)
3. Your site will be live at `your-project.vercel.app`

## Step 4: Post-Deployment Configuration

### 4.1 Update Supabase Site URL

1. In Supabase dashboard, go to **Authentication** → **URL Configuration**
2. Add your Vercel URL to **Site URL**: `https://your-project.vercel.app`
3. Add to **Redirect URLs**: 
   - `https://your-project.vercel.app/**`
   - `https://your-project.vercel.app/auth/callback`

### 4.2 Configure CORS (if needed)

If you're making API calls from the frontend, Supabase should handle CORS automatically. If you encounter issues:

1. Go to **Settings** → **API** in Supabase
2. Verify CORS settings allow your Vercel domain

### 4.3 Test Your Deployment

1. Visit your Vercel URL
2. Test user signup/login
3. Test QR code creation
4. Check browser console for any errors

## Step 5: Custom Domain (Optional)

1. In Vercel project settings, go to **Settings** → **Domains**
2. Add your custom domain
3. Follow DNS configuration instructions
4. Update Supabase **Site URL** and **Redirect URLs** with your custom domain

## Troubleshooting

### Build Fails

- Check build logs in Vercel dashboard
- Verify `package.json` has correct build script
- Ensure all dependencies are listed in `package.json`

### Environment Variables Not Working

- Make sure variables start with `VITE_` (required for Vite)
- Restart deployment after adding variables
- Check browser console for errors

### Supabase Connection Issues

- Verify environment variables are set correctly in Vercel
- Check Supabase project is active
- Verify RLS policies allow necessary operations
- Check Supabase logs for API errors

### Authentication Not Working

- Verify Site URL is set correctly in Supabase
- Check Redirect URLs include your Vercel domain
- Ensure OAuth providers are configured if using social login

## Local Development

For local development:

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Update `.env` with your Supabase credentials

3. Run the development server:
   ```bash
   npm run dev
   ```

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)


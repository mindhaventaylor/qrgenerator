# Quick Start: Deploy to Vercel

## Before You Deploy

### 1. Set Up Supabase Environment Variables in Vercel

Go to your Vercel project → **Settings** → **Environment Variables** and add:

```
VITE_SUPABASE_URL=https://yjmfghmcrleysafgrmeb.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqbWZnaG1jcmxleXNhZmdybWViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4NjU3MDgsImV4cCI6MjA3NzQ0MTcwOH0.ZGy7WEaJbNKjZNlyqSeNpUuh56hKoqES21UyHKV-4v8
```

**Or use your own Supabase project:**
1. Get values from: https://app.supabase.com/project/YOUR_PROJECT/settings/api
2. Replace with your Project URL and anon key

### 2. Configure Supabase Authentication

In Supabase Dashboard → **Authentication** → **URL Configuration**:

- **Site URL**: `https://your-vercel-app.vercel.app`
- **Redirect URLs**: Add `https://your-vercel-app.vercel.app/**`

### 3. Deploy to Vercel

#### Option A: Using Vercel CLI
```bash
npm i -g vercel
cd qr-generator
vercel
```

#### Option B: Using GitHub/GitLab
1. Push your code to GitHub/GitLab
2. Go to [vercel.com](https://vercel.com)
3. Click **Add New Project**
4. Import your repository
5. Set **Root Directory** to `qr-generator` (if needed)
6. Add environment variables (from step 1)
7. Click **Deploy**

### 4. Build Configuration (Auto-detected)

Vercel will auto-detect:
- Framework: Vite
- Build Command: `npm run build`
- Output Directory: `dist`

If auto-detection fails, manually set these in project settings.

## After Deployment

1. Update Supabase Site URL with your Vercel URL
2. Test authentication flow
3. Test QR code creation
4. Check Vercel logs if issues occur

## Files Created

- ✅ `vercel.json` - Vercel configuration
- ✅ `.env.example` - Environment variable template
- ✅ `.gitignore` - Git ignore rules
- ✅ `src/lib/supabase.ts` - Updated to use env variables

For detailed instructions, see `DEPLOYMENT.md` in the root directory.


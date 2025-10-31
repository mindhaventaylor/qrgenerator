# CRITICAL FIX: Supabase Project URL Mismatch

## The Problem

Your Edge Function is deployed at:
- **Function URL:** `https://pstoxizwwgbpwrcdknto.supabase.co/functions/v1/create-checkout`

But your `.env` file is pointing to:
- **Current URL:** `https://yjmfghmcrleysafgrmeb.supabase.co`

**These are different Supabase projects!** That's why the function call is failing.

## Solution

### Option 1: Update .env to Match Function (Recommended if function is already deployed)

Update your `.env` file in `qr-generator/.env`:

```
VITE_SUPABASE_URL=https://pstoxizwwgbpwrcdknto.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_for_pstoxizwwgbpwrcdknto_project
```

**To get the correct anon key:**
1. Go to: https://app.supabase.com/project/pstoxizwwgbpwrcdknto/settings/api
2. Copy the **anon/public** key
3. Update `.env` file

### Option 2: Deploy Function to the Other Project

If you want to keep using `yjmfghmcrleysafgrmeb`:
1. Deploy the `create-checkout` function to that project
2. Keep your current `.env` settings

## Steps to Fix (Option 1 - Recommended)

1. **Get the anon key for pstoxizwwgbpwrcdknto:**
   - Go to: https://app.supabase.com/project/pstoxizwwgbpwrcdknto/settings/api
   - Copy the **Project URL** and **anon public** key

2. **Update .env file:**
   ```bash
   cd qr-generator
   # Edit .env file
   ```
   
   Change to:
   ```
   VITE_SUPABASE_URL=https://pstoxizwwgbpwrcdknto.supabase.co
   VITE_SUPABASE_ANON_KEY=<paste_the_anon_key_here>
   ```

3. **Restart your dev server:**
   ```bash
   # Stop current server (Ctrl+C)
   npm run dev
   ```

4. **Test again:**
   - Try subscribing
   - Should now connect to the correct project

## Verify Both Projects Are Set Up

Make sure BOTH projects have:

### For `pstoxizwwgbpwrcdknto` (where function is deployed):
- ✅ `create-checkout` function deployed
- ✅ `STRIPE_SECRET_KEY` secret set
- ✅ Database tables exist (if using this project's database)

### For `yjmfghmcrleysafgrmeb` (current .env):
- ✅ Database tables exist
- ✅ Storage bucket `qr-images` exists
- ✅ Users and authentication set up

## Which Project to Use?

**Recommended:** Use `pstoxizwwgbpwrcdknto` since that's where your function is deployed.

1. Update `.env` to point to `pstoxizwwgbpwrcdknto`
2. Make sure that project has:
   - All database tables
   - Storage bucket
   - Authentication configured

Then everything will work together!


# Create Storage Bucket via Dashboard

The SQL method isn't working. Create it via Dashboard:

## Steps:

1. Go to: https://app.supabase.com/project/pstoxizwwgbpwrcdknto/storage/buckets

2. Click **"New bucket"**

3. Fill in:
   - **Name**: `qr-images`
   - **Public bucket**: ✅ Enabled (check this box)
   - **File size limit**: `5242880` (5MB) - optional
   - **Allowed MIME types**: `image/png`, `image/jpeg`, `image/svg+xml` - optional

4. Click **"Create bucket"**

5. Done! The bucket will be created with public access.

## Then Test Storage:

Try uploading a QR code image - it should work now.

---

**Note:** This is a separate issue from the Stripe webhook subscriptions. Have you already run `RECREATE_SUBSCRIPTIONS_TABLE.sql` to fix the subscription table? That's still the main issue preventing webhooks from creating subscriptions.


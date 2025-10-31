# QR Code Generation Setup

The QR code generation functionality is now implemented client-side and should work without requiring Supabase Edge Functions to be deployed.

## How It Works

1. **Client-side generation**: QR codes are generated using the external API `api.qrserver.com`
2. **Storage upload**: Generated QR images are uploaded to Supabase Storage
3. **Database save**: QR code metadata is saved to the `qr_codes` table

## Required Setup

### 1. Create Supabase Storage Bucket

You need to create a storage bucket named `qr-images` in your Supabase project:

**Option A: Via Supabase Dashboard**
1. Go to your Supabase project: https://app.supabase.com
2. Navigate to **Storage** in the left sidebar
3. Click **New bucket**
4. Set:
   - **Name**: `qr-images`
   - **Public bucket**: ✅ Enabled (check this box)
   - **File size limit**: 5MB (or as needed)
   - **Allowed MIME types**: `image/png`, `image/jpeg`, `image/svg+xml` (optional, can leave blank)
5. Click **Create bucket**

**Option B: Via SQL**
Run this SQL in the Supabase SQL Editor:

```sql
-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('qr-images', 'qr-images', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies (allow authenticated users to upload)
CREATE POLICY "Users can upload their own QR images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'qr-images');

CREATE POLICY "Users can view public QR images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'qr-images');
```

### 2. Verify Database Table

Make sure the `qr_codes` table exists. Run the SQL from `supabase/tables/qr_codes.sql` if you haven't already.

### 3. Test QR Code Generation

1. Log in to your application
2. Go to **Create QR Code**
3. Select a QR code type (e.g., "Website")
4. Fill in the required information
5. Click **Generate QR Code**

## Troubleshooting

### Error: "Failed to upload QR code image"
- **Cause**: Storage bucket `qr-images` doesn't exist or isn't public
- **Fix**: Create the bucket following steps above

### Error: "Failed to save QR code"
- **Cause**: Database table `qr_codes` doesn't exist or RLS policies are blocking
- **Fix**: 
  1. Create the table using `supabase/tables/qr_codes.sql`
  2. Check RLS policies in Supabase Dashboard → Authentication → Policies

### QR code not appearing after creation
- **Cause**: Storage bucket permissions or CORS issues
- **Fix**: 
  1. Verify bucket is public
  2. Check browser console for CORS errors
  3. Verify storage policies allow public read access

### Error: "QR code content is empty"
- **Cause**: Required fields not filled in
- **Fix**: Make sure all required fields for the selected QR type are completed

## Supported QR Code Types

- ✅ **Website**: Direct URL links
- ✅ **vCard**: Digital business cards
- ✅ **WiFi**: Network connection info
- ✅ **WhatsApp**: Direct message links
- ✅ **Facebook**: Page/profile links
- ✅ **Instagram**: Profile links
- ✅ **Links**: Multiple link lists

## Next Steps (Optional Enhancements)

1. **Add more QR types**: Extend `buildQRData()` in `src/lib/qrGenerator.ts`
2. **Custom styling**: Implement QR code customization (colors, logos, frames)
3. **Client-side QR library**: Replace external API with `qrcode` npm package for offline support
4. **Preview before save**: Show QR code preview in Step 2 before generating


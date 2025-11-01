/**
 * Client-side QR code generation utility
 * Generates QR codes using external API and uploads to Supabase Storage
 */

import { supabase } from './supabase';

export interface QRContent {
  url?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  ssid?: string;
  password?: string;
  encryption?: string;
  message?: string;
  pageId?: string;
  username?: string;
  links?: Array<{ url: string; title: string }>;
  [key: string]: any;
}

/**
 * Builds QR code data string based on type and content
 */
export function buildQRData(type: string, content: QRContent, qrCodeId?: string): string {
  // If QR code ID is provided, use tracking URL
  if (qrCodeId) {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://pstoxizwwgbpwrcdknto.supabase.co";
    return `${supabaseUrl}/functions/v1/track-scan?id=${qrCodeId}`;
  }

  // Otherwise, return direct URL (for backward compatibility or non-tracked codes)
  switch (type) {
    case 'website':
      return content.url || '';
    
    case 'vcard':
      return `BEGIN:VCARD\nVERSION:3.0\nFN:${content.firstName || ''} ${content.lastName || ''}\nTEL:${content.phone || ''}\nEMAIL:${content.email || ''}\nEND:VCARD`;
    
    case 'wifi':
      return `WIFI:T:${content.encryption || 'WPA'};S:${content.ssid || ''};P:${content.password || ''};;`;
    
    case 'whatsapp':
      const message = content.message ? `?text=${encodeURIComponent(content.message)}` : '';
      return `https://wa.me/${content.phone || ''}${message}`;
    
    case 'facebook':
      return `https://facebook.com/${content.pageId || ''}`;
    
    case 'instagram':
      return `https://instagram.com/${content.username?.replace('@', '') || ''}`;
    
    case 'links':
      return content.links?.[0]?.url || '';
    
    default:
      return JSON.stringify(content);
  }
}

/**
 * Generates QR code image using external API
 */
export async function generateQRImage(qrData: string, size: number = 500): Promise<Blob> {
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(qrData)}&format=png`;
  
  try {
    const response = await fetch(qrApiUrl);
    if (!response.ok) {
      throw new Error('Failed to generate QR code image');
    }
    return await response.blob();
  } catch (error) {
    console.error('QR generation error:', error);
    throw new Error('Failed to generate QR code. Please try again.');
  }
}

/**
 * Uploads QR code image to Supabase Storage and returns public URL
 */
export async function uploadQRImage(imageBlob: Blob, userId: string): Promise<string> {
  const timestamp = Date.now();
  const fileName = `${timestamp}.png`;
  const filePath = `${userId}/${fileName}`;

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from('qr-images')
    .upload(filePath, imageBlob, {
      contentType: 'image/png',
      upsert: true
    });

  if (error) {
    console.error('Upload error:', error);
    
    // Provide more specific error messages
    if (error.message?.includes('The resource already exists')) {
      // Try to get the existing file URL
      const { data: { publicUrl } } = supabase.storage
        .from('qr-images')
        .getPublicUrl(filePath);
      return publicUrl;
    }
    
    if (error.message?.includes('new row violates row-level security')) {
      throw new Error('Storage permission denied. Please check RLS policies for the qr-images bucket allow authenticated users to upload.');
    }
    
    throw new Error(`Failed to upload QR code image: ${error.message}. Please ensure the "qr-images" storage bucket exists and is public.`);
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('qr-images')
    .getPublicUrl(filePath);

  return publicUrl;
}

/**
 * Creates a QR code record in the database
 */
export async function saveQRCodeToDatabase(
  userId: string,
  name: string,
  type: string,
  content: QRContent,
  qrImageUrl: string,
  folderId?: string,
  customization?: any,
  isTracked: boolean = true
): Promise<any> {
  const { data, error } = await supabase
    .from('qr_codes')
    .insert({
      user_id: userId,
      name: name || `${type} QR Code`,
      type,
      content,
      qr_image_url: qrImageUrl,
      customization: customization || {},
      folder_id: folderId || null,
      is_dynamic: true,
      is_active: true,
      is_tracked: isTracked,
      scan_count: 0,
      unique_scan_count: 0
    })
    .select()
    .single();

  if (error) {
    console.error('Database error:', error);
    throw new Error(`Failed to save QR code: ${error.message}`);
  }

  return data;
}

/**
 * Complete QR code generation workflow
 */
export async function createQRCode(
  userId: string,
  name: string,
  type: string,
  content: QRContent,
  folderId?: string,
  customization?: any,
  enableTracking: boolean = true
): Promise<{ qrCode: any; imageUrl: string }> {
  try {
    // 1. First, create a placeholder image URL (we'll regenerate QR after getting ID)
    const placeholderImageUrl = 'placeholder';

    // 2. Save to database first to get the QR code ID
    const qrCode = await saveQRCodeToDatabase(userId, name, type, content, placeholderImageUrl, folderId, customization, enableTracking);

    // 3. Build QR data string with or without tracking URL
    const qrData = enableTracking ? buildQRData(type, content, qrCode.id) : buildQRData(type, content);
    
    if (!qrData) {
      throw new Error('QR code content is empty. Please fill in all required fields.');
    }

    // 4. Generate QR code image with tracking URL
    const imageBlob = await generateQRImage(qrData);

    // 5. Upload to Supabase Storage
    const imageUrl = await uploadQRImage(imageBlob, userId);

    // 6. Update the database with the actual image URL
    const { error: updateError } = await supabase
      .from('qr_codes')
      .update({ qr_image_url: imageUrl })
      .eq('id', qrCode.id);

    if (updateError) {
      console.error('Error updating QR code image:', updateError);
      throw updateError;
    }

    return { qrCode, imageUrl };
  } catch (error: any) {
    console.error('Create QR code error:', error);
    throw error;
  }
}


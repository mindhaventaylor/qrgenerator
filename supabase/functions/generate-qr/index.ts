Deno.serve(async (req) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
        'Access-Control-Max-Age': '86400',
        'Access-Control-Allow-Credentials': 'false'
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: corsHeaders });
    }

    try {
        const { 
            qrCodeId,
            name,
            type, 
            content, 
            customization,
            folderId 
        } = await req.json();

        if (!type || !content) {
            throw new Error('Type and content are required');
        }

        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
        }

        // Get user from auth header
        const authHeader = req.headers.get('authorization');
        if (!authHeader) {
            throw new Error('No authorization header');
        }

        const token = authHeader.replace('Bearer ', '');

        // Verify token and get user
        const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'apikey': serviceRoleKey
            }
        });

        if (!userResponse.ok) {
            throw new Error('Invalid token');
        }

        const userData = await userResponse.json();
        const userId = userData.id;

        // Prepare QR code data based on type
        let qrData = '';
        
        switch (type) {
            case 'website':
                qrData = content.url || '';
                break;
            case 'vcard':
                qrData = `BEGIN:VCARD\nVERSION:3.0\nFN:${content.firstName} ${content.lastName}\nTEL:${content.phone}\nEMAIL:${content.email}\nEND:VCARD`;
                break;
            case 'wifi':
                qrData = `WIFI:T:${content.encryption};S:${content.ssid};P:${content.password};;`;
                break;
            case 'whatsapp':
                qrData = `https://wa.me/${content.phone}?text=${encodeURIComponent(content.message || '')}`;
                break;
            case 'facebook':
                qrData = `https://facebook.com/${content.pageId}`;
                break;
            case 'instagram':
                qrData = `https://instagram.com/${content.username}`;
                break;
            case 'links':
                qrData = content.links?.[0]?.url || '';
                break;
            default:
                qrData = JSON.stringify(content);
        }

        // Generate QR code using free API
        const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(qrData)}&format=png`;
        
        // Fetch QR code image
        const qrImageResponse = await fetch(qrApiUrl);
        
        if (!qrImageResponse.ok) {
            throw new Error('Failed to generate QR code');
        }

        const qrImageBlob = await qrImageResponse.arrayBuffer();
        const qrImageData = new Uint8Array(qrImageBlob);

        // Upload to Supabase Storage
        const timestamp = Date.now();
        const storagePath = `${userId}/${timestamp}.png`;

        const uploadResponse = await fetch(`${supabaseUrl}/storage/v1/object/qr-images/${storagePath}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'Content-Type': 'image/png',
                'x-upsert': 'true'
            },
            body: qrImageData
        });

        if (!uploadResponse.ok) {
            const errorText = await uploadResponse.text();
            throw new Error(`Upload failed: ${errorText}`);
        }

        // Get public URL
        const publicUrl = `${supabaseUrl}/storage/v1/object/public/qr-images/${storagePath}`;

        // Save or update QR code in database
        let qrCodeResponse;
        
        if (qrCodeId) {
            // Update existing QR code
            qrCodeResponse = await fetch(`${supabaseUrl}/rest/v1/qr_codes?id=eq.${qrCodeId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify({
                    name,
                    type,
                    content,
                    qr_image_url: publicUrl,
                    customization: customization || {},
                    folder_id: folderId || null,
                    updated_at: new Date().toISOString()
                })
            });
        } else {
            // Create new QR code
            qrCodeResponse = await fetch(`${supabaseUrl}/rest/v1/qr_codes`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify({
                    user_id: userId,
                    name: name || `${type} QR Code`,
                    type,
                    content,
                    qr_image_url: publicUrl,
                    customization: customization || {},
                    folder_id: folderId || null,
                    is_dynamic: true,
                    is_active: true
                })
            });
        }

        if (!qrCodeResponse.ok) {
            const errorText = await qrCodeResponse.text();
            throw new Error(`Database operation failed: ${errorText}`);
        }

        const qrCodeData = await qrCodeResponse.json();

        return new Response(JSON.stringify({
            data: {
                qrCode: Array.isArray(qrCodeData) ? qrCodeData[0] : qrCodeData,
                imageUrl: publicUrl
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('QR code generation error:', error);

        const errorResponse = {
            error: {
                code: 'QR_GENERATION_FAILED',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

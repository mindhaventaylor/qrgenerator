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
        const { qrCodeId, scanData } = await req.json();

        if (!qrCodeId) {
            throw new Error('QR code ID is required');
        }

        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
        }

        // Extract scan information
        const userAgent = scanData?.userAgent || req.headers.get('user-agent') || '';
        const ipAddress = scanData?.ipAddress || req.headers.get('x-forwarded-for') || '';

        // Parse user agent for device info
        const isMobile = /Mobile|Android|iPhone/i.test(userAgent);
        const deviceType = isMobile ? 'mobile' : 'desktop';
        
        let browser = 'Unknown';
        if (userAgent.includes('Chrome')) browser = 'Chrome';
        else if (userAgent.includes('Safari')) browser = 'Safari';
        else if (userAgent.includes('Firefox')) browser = 'Firefox';
        else if (userAgent.includes('Edge')) browser = 'Edge';
        
        let os = 'Unknown';
        if (userAgent.includes('Windows')) os = 'Windows';
        else if (userAgent.includes('Mac')) os = 'MacOS';
        else if (userAgent.includes('Linux')) os = 'Linux';
        else if (userAgent.includes('Android')) os = 'Android';
        else if (userAgent.includes('iOS') || userAgent.includes('iPhone')) os = 'iOS';

        // Insert scan record
        const scanResponse = await fetch(`${supabaseUrl}/rest/v1/qr_scans`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify({
                qr_code_id: qrCodeId,
                country: scanData?.country || null,
                city: scanData?.city || null,
                operating_system: os,
                device_type: deviceType,
                browser: browser,
                ip_address: ipAddress,
                user_agent: userAgent
            })
        });

        if (!scanResponse.ok) {
            const errorText = await scanResponse.text();
            throw new Error(`Failed to record scan: ${errorText}`);
        }

        // Update scan counts on qr_codes table
        const updateResponse = await fetch(`${supabaseUrl}/rest/v1/qr_codes?id=eq.${qrCodeId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                scan_count: scanData?.incrementCount || 1
            })
        });

        // Get QR code content for redirect
        const qrCodeResponse = await fetch(`${supabaseUrl}/rest/v1/qr_codes?id=eq.${qrCodeId}&select=*`, {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey
            }
        });

        let redirectUrl = '/';
        
        if (qrCodeResponse.ok) {
            const qrData = await qrCodeResponse.json();
            if (qrData && qrData.length > 0) {
                const qrCode = qrData[0];
                
                // Extract redirect URL based on type
                if (qrCode.type === 'website' && qrCode.content?.url) {
                    redirectUrl = qrCode.content.url;
                } else if (qrCode.type === 'whatsapp' && qrCode.content?.phone) {
                    redirectUrl = `https://wa.me/${qrCode.content.phone}`;
                } else if (qrCode.type === 'facebook' && qrCode.content?.pageId) {
                    redirectUrl = `https://facebook.com/${qrCode.content.pageId}`;
                } else if (qrCode.type === 'instagram' && qrCode.content?.username) {
                    redirectUrl = `https://instagram.com/${qrCode.content.username}`;
                }
            }
        }

        return new Response(JSON.stringify({
            data: {
                success: true,
                redirectUrl
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Scan tracking error:', error);

        const errorResponse = {
            error: {
                code: 'SCAN_TRACKING_FAILED',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

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
        console.log('Track-scan function called:', req.method, req.url);
        
        // Get QR code ID from query parameter or JSON body
        const url = new URL(req.url);
        const qrCodeIdParam = url.searchParams.get('id');
        
        let qrCodeId, scanData;
        if (req.method === 'POST') {
            const body = await req.json();
            qrCodeId = body.qrCodeId;
            scanData = body.scanData;
        } else {
            qrCodeId = qrCodeIdParam;
            scanData = {};
        }

        console.log('QR Code ID:', qrCodeId);

        if (!qrCodeId) {
            throw new Error('QR code ID is required');
        }

        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
        }
        
        console.log('Environment variables check:', {
            hasServiceKey: !!serviceRoleKey,
            supabaseUrl: supabaseUrl
        });

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
        console.log('Attempting to insert scan record for QR code:', qrCodeId);
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

        console.log('Scan insert response status:', scanResponse.status);
        if (!scanResponse.ok) {
            const errorText = await scanResponse.text();
            console.error('Failed to insert scan:', errorText);
            throw new Error(`Failed to record scan: ${errorText}`);
        }
        console.log('Scan record inserted successfully');

        // Update scan counts on qr_codes table
        // First, get the current scan count
        const getCountResponse = await fetch(`${supabaseUrl}/rest/v1/qr_codes?id=eq.${qrCodeId}&select=scan_count`, {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey
            }
        });

        let newScanCount = 1;
        if (getCountResponse.ok) {
            const countData = await getCountResponse.json();
            if (countData && countData.length > 0) {
                const currentCount = countData[0].scan_count || 0;
                newScanCount = currentCount + 1;
            }
        }

        // Now update with the incremented count
        const updateResponse = await fetch(`${supabaseUrl}/rest/v1/qr_codes?id=eq.${qrCodeId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                scan_count: newScanCount
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
            console.log('QR code data retrieved:', JSON.stringify(qrData));
            
            if (qrData && qrData.length > 0) {
                const qrCode = qrData[0];
                console.log('QR code type:', qrCode.type, 'Content:', JSON.stringify(qrCode.content));
                
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
        } else {
            console.log('Failed to get QR code data, status:', qrCodeResponse.status);
        }
        
        console.log('Redirect URL:', redirectUrl);

        // Return HTTP redirect for GET requests (QR code scans)
        if (req.method === 'GET') {
            return Response.redirect(redirectUrl, 302);
        }

        // Return JSON for POST requests (API calls)
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

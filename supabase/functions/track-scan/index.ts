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
        console.log('=== TRACK-SCAN FUNCTION CALLED ===');
        console.log('Method:', req.method);
        console.log('URL:', req.url);
        
        try {
            const headersObj = Object.fromEntries(req.headers.entries());
            console.log('Headers:', JSON.stringify(headersObj));
        } catch (e) {
            console.warn('Could not log headers:', e);
        }
        
        // Get QR code ID from query parameter or JSON body
        let qrCodeId: string | null = null;
        let scanData: any = {};
        
        try {
            const url = new URL(req.url);
            const qrCodeIdParam = url.searchParams.get('id');
            
            if (req.method === 'POST') {
                try {
                    const body = await req.json();
                    qrCodeId = body.qrCodeId || body.id;
                    scanData = body.scanData || {};
                } catch (e) {
                    console.error('Failed to parse POST body:', e);
                    throw new Error('Invalid request body');
                }
            } else {
                qrCodeId = qrCodeIdParam;
                scanData = {};
            }
        } catch (urlError: any) {
            console.error('Error parsing URL:', urlError);
            return new Response(
                JSON.stringify({ error: { message: 'Invalid request URL', details: urlError.message } }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        console.log('QR Code ID:', qrCodeId);

        if (!qrCodeId) {
            console.error('QR code ID is missing');
            return new Response(
                JSON.stringify({ error: { message: 'QR code ID is required' } }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Get environment variables with fallbacks
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SERVICE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL') || Deno.env.get('NEXT_PUBLIC_SUPABASE_URL');
        
        console.log('Environment variables check:', {
            hasServiceKey: !!serviceRoleKey,
            serviceKeyLength: serviceRoleKey?.length || 0,
            supabaseUrl: supabaseUrl || 'NOT SET',
            allEnvKeys: Object.keys(Deno.env.toObject()).filter(k => k.includes('SUPABASE'))
        });

        if (!serviceRoleKey) {
            console.error('SUPABASE_SERVICE_ROLE_KEY is missing');
            return new Response(
                JSON.stringify({ 
                    error: { 
                        message: 'Server configuration error. SUPABASE_SERVICE_ROLE_KEY not set.',
                        code: 'CONFIG_ERROR'
                    } 
                }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        if (!supabaseUrl) {
            console.error('SUPABASE_URL is missing');
            return new Response(
                JSON.stringify({ 
                    error: { 
                        message: 'Server configuration error. SUPABASE_URL not set.',
                        code: 'CONFIG_ERROR'
                    } 
                }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // First, verify the QR code exists
        const verifyQRResponse = await fetch(`${supabaseUrl}/rest/v1/qr_codes?id=eq.${qrCodeId}&select=id,is_active`, {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey
            }
        });

        if (!verifyQRResponse.ok) {
            throw new Error(`Failed to verify QR code: ${verifyQRResponse.status}`);
        }

        const qrVerification = await verifyQRResponse.json();
        if (!qrVerification || qrVerification.length === 0) {
            throw new Error('QR code not found');
        }

        if (!qrVerification[0].is_active) {
            console.warn('QR code is not active, but continuing with scan tracking');
        }

        console.log('QR code verified:', qrVerification[0].id);

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

        // Get QR code data FIRST to determine type before tracking
        // This allows us to still redirect even if tracking fails
        const qrCodeResponse = await fetch(`${supabaseUrl}/rest/v1/qr_codes?id=eq.${qrCodeId}&select=*`, {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey
            }
        });

        let qrCode: any = null;
        let redirectUrl = '/';
        
        if (qrCodeResponse.ok) {
            const qrData = await qrCodeResponse.json();
            console.log('QR code data retrieved, count:', qrData?.length || 0);
            
            if (qrData && qrData.length > 0) {
                qrCode = qrData[0];
                console.log('QR code type:', qrCode.type);
                console.log('QR code content keys:', Object.keys(qrCode.content || {}));
            }
        } else {
            console.warn('Failed to get QR code data, status:', qrCodeResponse.status);
        }

        // Insert scan record
        console.log('=== ATTEMPTING TO INSERT SCAN RECORD ===');
        console.log('QR Code ID:', qrCodeId);
        console.log('QR Code Type:', qrCode?.type || 'unknown');
        console.log('Supabase URL:', supabaseUrl);
        console.log('Service Role Key present:', !!serviceRoleKey);
        
        const scanPayload = {
            qr_code_id: qrCodeId,
            country: scanData?.country || null,
            city: scanData?.city || null,
            operating_system: os,
            device_type: deviceType,
            browser: browser,
            ip_address: ipAddress,
            user_agent: userAgent
        };
        
        console.log('Scan payload:', JSON.stringify(scanPayload, null, 2));
        console.log('Request URL:', `${supabaseUrl}/rest/v1/qr_scans`);
        
        let scanInsertSucceeded = false;
        try {
            const scanResponse = await fetch(`${supabaseUrl}/rest/v1/qr_scans`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify(scanPayload)
            });

            console.log('=== SCAN INSERT RESPONSE ===');
            console.log('Status:', scanResponse.status);
            console.log('Status Text:', scanResponse.statusText);
            
            if (!scanResponse.ok) {
                const errorText = await scanResponse.text();
                console.error('=== SCAN INSERT FAILED ===');
                console.error('Status Code:', scanResponse.status);
                console.error('Status Text:', scanResponse.statusText);
                console.error('Error Response Body:', errorText);
                
                // For production, don't throw - just log and continue with redirect
                // The user should still be able to access the PDF even if tracking fails
                console.warn('Scan tracking failed, but continuing with redirect...');
            } else {
                const scanResult = await scanResponse.json();
                console.log('=== SCAN INSERT SUCCESS ===');
                console.log('Scan Record:', JSON.stringify(scanResult, null, 2));
                scanInsertSucceeded = true;
            }
        } catch (scanError: any) {
            console.error('=== SCAN INSERT EXCEPTION ===');
            console.error('Error:', scanError.message);
            console.error('Stack:', scanError.stack);
            // Don't throw - continue with redirect even if tracking fails
            console.warn('Scan tracking failed with exception, but continuing with redirect...');
        }

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
        
        if (!updateResponse.ok) {
            const errorText = await updateResponse.text();
            console.warn('Failed to update scan count:', errorText);
            // Don't throw - scan was recorded, count update is optional
        } else {
            console.log('Scan count updated successfully');
        }

        // Extract redirect URL based on type (use already fetched qrCode)
        if (qrCode) {
            const type = qrCode.type;
            const content = qrCode.content || {};
            
            console.log('=== BUILDING REDIRECT URL ===');
            console.log('Type:', type);
            console.log('Content:', JSON.stringify(content, null, 2));
            
            switch (type) {
                case 'website':
                    redirectUrl = content.url || '/';
                    break;
                
                case 'pdf':
                    // PDF can be in url, pdfUrl, or embedded in content
                    redirectUrl = content.url || content.pdfUrl || '/';
                    console.log('PDF redirect URL:', redirectUrl);
                    console.log('PDF content:', JSON.stringify(content, null, 2));
                    
                    // Validate PDF URL
                    if (redirectUrl && redirectUrl !== '/' && !redirectUrl.startsWith('http')) {
                        console.warn('Invalid PDF URL format:', redirectUrl);
                        redirectUrl = '/';
                    }
                    break;
                    
                case 'images':
                    redirectUrl = content.url || content.imageUrl || content.images?.[0]?.url || '/';
                    break;
                
                case 'video':
                    redirectUrl = content.url || content.videoUrl || '/';
                    break;
                
                case 'mp3':
                    redirectUrl = content.url || content.audioUrl || '/';
                    break;
                
                case 'menu':
                    redirectUrl = content.url || content.menuUrl || '/';
                    break;
                
                case 'whatsapp':
                    if (content.phone) {
                        const phone = (content.phone || '').replace(/[^\d+]/g, '');
                        const message = content.message ? `?text=${encodeURIComponent(content.message)}` : '';
                        redirectUrl = `https://wa.me/${phone}${message}`;
                    }
                    break;
                
                case 'facebook':
                    if (content.pageId) {
                        const fbId = (content.pageId || '').replace(/^https?:\/\/(www\.)?(facebook\.com|fb\.com)\//, '').replace(/\/$/, '');
                        redirectUrl = `https://facebook.com/${fbId}`;
                    }
                    break;
                
                case 'instagram':
                    if (content.username) {
                        const igUsername = (content.username || '').replace('@', '').replace(/^https?:\/\/(www\.)?instagram\.com\//, '').replace(/\/$/, '');
                        redirectUrl = `https://instagram.com/${igUsername}`;
                    }
                    break;
                
                case 'social':
                    redirectUrl = content.url || content.facebookUrl || content.instagramUrl || content.twitterUrl || '/';
                    break;
                
                case 'links':
                    redirectUrl = content.links?.[0]?.url || content.url || '/';
                    break;
                
                case 'apps':
                    const appStore = content.store || 'ios';
                    const appId = content.appId || '';
                    if (appId) {
                        if (appStore === 'ios') {
                            redirectUrl = `https://apps.apple.com/app/id${appId}`;
                        } else {
                            redirectUrl = `https://play.google.com/store/apps/details?id=${appId}`;
                        }
                    }
                    break;
                
                case 'coupon':
                    redirectUrl = content.url || content.code || content.text || '/';
                    break;
                
                case 'vcard':
                    // For vCard, create a data URI that browsers can handle
                    const vcardName = `${content.firstName || ''} ${content.lastName || ''}`.trim();
                    const vcardLines = [
                        'BEGIN:VCARD',
                        'VERSION:3.0',
                        `FN:${vcardName}`,
                        content.phone ? `TEL:${content.phone}` : '',
                        content.email ? `EMAIL:${content.email}` : '',
                        content.company ? `ORG:${content.company}` : '',
                        content.website ? `URL:${content.website}` : '',
                        content.address ? `ADR:;;${content.address};;;;` : '',
                        'END:VCARD'
                    ].filter(line => line);
                    // Use data URI for vCard - browsers will download or open in contacts app
                    redirectUrl = `data:text/vcard;charset=utf-8,${encodeURIComponent(vcardLines.join('\n'))}`;
                    break;
                
                case 'wifi':
                    // For WiFi, create a data URI
                    const wifiData = `WIFI:T:${content.encryption || 'WPA'};S:${content.ssid || ''};P:${content.password || ''};;`;
                    redirectUrl = `data:text/plain;charset=utf-8,${encodeURIComponent(wifiData)}`;
                    break;
                
                case 'business':
                    redirectUrl = content.url || content.website || (content.phone ? `tel:${content.phone}` : '/');
                    break;
                
                default:
                    redirectUrl = content.url || '/';
            }
            
            console.log('Final redirect URL for type:', type, '=', redirectUrl);
        } else {
            console.warn('QR code not found or could not be retrieved');
            redirectUrl = '/';
        }
        
        console.log('=== FINAL REDIRECT URL ===');
        console.log('Redirect URL:', redirectUrl);

        // Helper function to convert relative URLs to absolute
        function makeAbsoluteUrl(url: string, baseUrl: string = 'https://generatecodeqr.com'): string {
            if (!url || url === '/') {
                return baseUrl;
            }
            // If already absolute, return as-is
            if (url.startsWith('http://') || url.startsWith('https://')) {
                return url;
            }
            // If starts with /, append to base
            if (url.startsWith('/')) {
                return `${baseUrl}${url}`;
            }
            // Otherwise, treat as relative path
            return `${baseUrl}/${url}`;
        }

        // Get origin from request for absolute URL
        const origin = req.headers.get('origin') || 
                       req.headers.get('referer')?.split('/').slice(0, 3).join('/') || 
                       'https://generatecodeqr.com';

        // Return HTTP redirect for GET requests (QR code scans)
        if (req.method === 'GET') {
            // For data URIs (vCard, WiFi), return HTML page that handles them
            if (redirectUrl.startsWith('data:')) {
                const isVCard = redirectUrl.includes('text/vcard');
                const isWiFi = redirectUrl.includes('text/plain');
                
                return new Response(
                    `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Opening...</title>
</head>
<body>
    <script>
        const dataUri = ${JSON.stringify(redirectUrl)};
        
        // For vCard, trigger download/contact app
        if (${isVCard}) {
            const link = document.createElement('a');
            link.href = dataUri;
            link.download = 'contact.vcf';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
        // For WiFi, show info or try to connect
        else if (${isWiFi}) {
            alert('WiFi connection information received. Your device should prompt you to connect.');
        }
        // Fallback: navigate after a delay
        setTimeout(() => {
            window.location.href = '/';
        }, 1000);
    </script>
    <p>Opening...</p>
</body>
</html>`,
                    {
                        headers: { ...corsHeaders, 'Content-Type': 'text/html' },
                        status: 200
                    }
                );
            }
            // For regular URLs, use redirect (must be absolute)
            const absoluteUrl = makeAbsoluteUrl(redirectUrl, origin);
            console.log('Converting to absolute URL:', redirectUrl, '->', absoluteUrl);
            return Response.redirect(absoluteUrl, 302);
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

    } catch (error: any) {
        console.error('=== SCAN TRACKING ERROR ===');
        console.error('Error name:', error?.name || 'Unknown');
        console.error('Error message:', error?.message || String(error));
        console.error('Error stack:', error?.stack || 'No stack trace');
        console.error('Error type:', typeof error);
        
        try {
            console.error('Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
        } catch (e) {
            console.error('Could not stringify error:', e);
        }
        
        // Log all environment variables status (without values)
        try {
            console.log('Environment check:', {
                hasServiceRoleKey: !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
                hasSupabaseUrl: !!Deno.env.get('SUPABASE_URL'),
                serviceRoleKeyLength: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')?.length || 0,
                supabaseUrl: Deno.env.get('SUPABASE_URL') || 'NOT SET'
            });
        } catch (e) {
            console.error('Could not check environment:', e);
        }

        // For GET requests (QR scans), still try to redirect even if tracking fails
        if (req.method === 'GET') {
            // Try to get QR code and redirect anyway
            try {
                const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SERVICE_KEY');
                const supabaseUrl = Deno.env.get('SUPABASE_URL') || Deno.env.get('NEXT_PUBLIC_SUPABASE_URL');
                
                let qrCodeId: string | null = null;
                try {
                    const url = new URL(req.url);
                    qrCodeId = url.searchParams.get('id');
                } catch (e) {
                    console.error('Could not parse URL for fallback:', e);
                }
                
                console.log('Attempting fallback redirect for QR code:', qrCodeId);
                
                if (serviceRoleKey && supabaseUrl && qrCodeId) {
                    try {
                        const qrCodeResponse = await fetch(`${supabaseUrl}/rest/v1/qr_codes?id=eq.${qrCodeId}&select=type,content`, {
                            headers: {
                                'Authorization': `Bearer ${serviceRoleKey}`,
                                'apikey': serviceRoleKey
                            }
                        });
                        
                        if (qrCodeResponse.ok) {
                            const qrData = await qrCodeResponse.json();
                            if (qrData && qrData.length > 0) {
                                const qrCode = qrData[0];
                                const content = qrCode.content || {};
                                let redirectUrl = '/';
                                
                                // Quick redirect URL extraction
                                if (content.url) {
                                    redirectUrl = content.url;
                                } else if (qrCode.type === 'website') {
                                    redirectUrl = content.url || '/';
                                } else if (qrCode.type === 'pdf') {
                                    redirectUrl = content.url || content.pdfUrl || '/';
                                } else if (qrCode.type === 'images') {
                                    redirectUrl = content.url || content.imageUrl || '/';
                                } else if (qrCode.type === 'video') {
                                    redirectUrl = content.url || content.videoUrl || '/';
                                } else if (qrCode.type === 'mp3') {
                                    redirectUrl = content.url || content.audioUrl || '/';
                                }
                                
                                console.log('Fallback redirect URL:', redirectUrl);
                                
                                if (redirectUrl && redirectUrl !== '/') {
                                    // Get origin for absolute URL
                                    const fallbackOrigin = req.headers.get('origin') || 
                                                         req.headers.get('referer')?.split('/').slice(0, 3).join('/') || 
                                                         'https://generatecodeqr.com';
                                    
                                    // Make absolute URL
                                    let absoluteRedirectUrl = redirectUrl;
                                    if (!absoluteRedirectUrl.startsWith('http://') && !absoluteRedirectUrl.startsWith('https://')) {
                                        if (absoluteRedirectUrl.startsWith('/')) {
                                            absoluteRedirectUrl = `${fallbackOrigin}${absoluteRedirectUrl}`;
                                        } else {
                                            absoluteRedirectUrl = `${fallbackOrigin}/${absoluteRedirectUrl}`;
                                        }
                                    }
                                    
                                    console.log('Fallback absolute URL:', absoluteRedirectUrl);
                                    return Response.redirect(absoluteRedirectUrl, 302);
                                }
                            }
                        }
                    } catch (fetchError: any) {
                        console.error('Fallback fetch error:', fetchError?.message || fetchError);
                    }
                }
            } catch (redirectError: any) {
                console.error('Failed to redirect after tracking error:', redirectError?.message || redirectError);
            }
            
            // Final fallback: redirect to home (must be absolute URL)
            console.log('Using final fallback redirect to home');
            try {
                const fallbackOrigin = req.headers.get('origin') || 
                                     req.headers.get('referer')?.split('/').slice(0, 3).join('/') || 
                                     'https://generatecodeqr.com';
                const homeUrl = fallbackOrigin;
                console.log('Redirecting to home:', homeUrl);
                return Response.redirect(homeUrl, 302);
            } catch (redirectErr: any) {
                console.error('Final fallback redirect failed:', redirectErr);
                // If even redirect fails, return error
                return new Response(
                    JSON.stringify({ 
                        error: { 
                            code: 'SCAN_TRACKING_FAILED',
                            message: error?.message || 'Unknown error occurred'
                        } 
                    }),
                    { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                );
            }
        }

        // For POST requests, return error JSON
        const errorResponse = {
            error: {
                code: 'SCAN_TRACKING_FAILED',
                message: error?.message || 'Unknown error occurred',
                details: error?.stack || String(error)
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

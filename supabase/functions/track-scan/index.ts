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
                    // vCard QR codes should show a custom page, not download
                    // We'll handle this specially in the response section
                    redirectUrl = 'VCARD_PAGE'; // Special marker
                    break;
                
                case 'wifi':
                    // For WiFi, create a data URI
                    const wifiData = `WIFI:T:${content.encryption || 'WPA'};S:${content.ssid || ''};P:${content.password || ''};;`;
                    redirectUrl = `data:text/plain;charset=utf-8,${encodeURIComponent(wifiData)}`;
                    break;
                
                case 'business':
                    // Business QR codes should show a custom page, not redirect
                    // We'll handle this specially in the response section
                    redirectUrl = 'BUSINESS_PAGE'; // Special marker
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
            // Handle custom pages for vCard and Business - redirect to frontend
            if (redirectUrl === 'VCARD_PAGE' && qrCode) {
                // Redirect to frontend vCard page
                const frontendUrl = `${origin}/vcard/${qrCodeId}`;
                console.log('Redirecting vCard to frontend:', frontendUrl);
                return Response.redirect(frontendUrl, 302);
            }
            
            if (redirectUrl === 'BUSINESS_PAGE' && qrCode) {
                // Redirect to frontend business page
                const frontendUrl = `${origin}/business/${qrCodeId}`;
                console.log('Redirecting business to frontend:', frontendUrl);
                return Response.redirect(frontendUrl, 302);
            }
            
            // OLD HTML CODE REMOVED - now redirecting to frontend pages
            
            // For data URIs (WiFi), return HTML page that handles them
            if (redirectUrl.startsWith('data:')) {
                const isWiFi = redirectUrl.includes('text/plain');
                
                return new Response(
                    `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WiFi Connection</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .container {
            background: white;
            border-radius: 16px;
            padding: 32px;
            max-width: 400px;
            width: 100%;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        .wifi-icon {
            width: 64px;
            height: 64px;
            margin: 0 auto 24px;
            display: block;
        }
        h1 {
            text-align: center;
            color: #333;
            margin-bottom: 8px;
            font-size: 24px;
        }
        .subtitle {
            text-align: center;
            color: #666;
            margin-bottom: 32px;
            font-size: 14px;
        }
        .info-box {
            background: #f8f9fa;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 20px;
        }
        .info-row {
            margin-bottom: 16px;
        }
        .info-row:last-child {
            margin-bottom: 0;
        }
        .label {
            font-size: 12px;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
        }
        .value {
            font-size: 18px;
            color: #333;
            font-weight: 600;
            word-break: break-all;
        }
        .password-value {
            font-family: monospace;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        .copy-btn {
            background: #667eea;
            color: white;
            border: none;
            padding: 6px 12px;
            border-radius: 6px;
            font-size: 12px;
            cursor: pointer;
            margin-left: 8px;
        }
        .copy-btn:hover {
            background: #5568d3;
        }
        .copy-btn:active {
            transform: scale(0.95);
        }
        .note {
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 12px;
            border-radius: 6px;
            font-size: 13px;
            color: #856404;
            margin-top: 20px;
        }
        .back-btn {
            display: block;
            width: 100%;
            background: #667eea;
            color: white;
            border: none;
            padding: 14px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            margin-top: 20px;
            text-decoration: none;
            text-align: center;
        }
        .back-btn:hover {
            background: #5568d3;
        }
    </style>
</head>
<body>
    <div class="container">
        <svg class="wifi-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M5 12.55a11 11 0 0 1 14.08 0"></path>
            <path d="M1.42 9a16 16 0 0 1 21.16 0"></path>
            <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
            <line x1="12" y1="20" x2="12.01" y2="20"></line>
        </svg>
        <h1>WiFi Network</h1>
        <p class="subtitle">Connection Details</p>
        <div class="info-box" id="wifiInfo">
            <p style="text-align: center; color: #666;">Loading WiFi information...</p>
        </div>
        <div class="note">
            <strong>Note:</strong> Please connect to this network manually using the details above. Your device should prompt you to connect.
        </div>
        <a href="/" class="back-btn">Go Back</a>
    </div>
    <script>
        const dataUri = ${JSON.stringify(redirectUrl)};
        
        // For WiFi, display info nicely
        if (${isWiFi}) {
            try {
                // Extract WiFi info from data URI
                const wifiData = decodeURIComponent(dataUri.split(',')[1]);
                const wifiMatch = wifiData.match(/WIFI:T:([^;]+);S:([^;]+);P:([^;]+)/);
                
                if (wifiMatch) {
                    const encryption = wifiMatch[1] || 'WPA';
                    const ssid = wifiMatch[2] || '';
                    const password = wifiMatch[3] || '';
                    
                    // Display WiFi info
                    const infoBox = document.getElementById('wifiInfo');
                    infoBox.innerHTML = \`
                        <div class="info-row">
                            <div class="label">Network Name (SSID)</div>
                            <div class="value" id="ssidValue">\${ssid}</div>
                        </div>
                        <div class="info-row">
                            <div class="label">Password</div>
                            <div class="value password-value">
                                <span id="passwordValue">\${password}</span>
                                <button class="copy-btn" onclick="copyPassword()">Copy</button>
                            </div>
                        </div>
                        <div class="info-row">
                            <div class="label">Security Type</div>
                            <div class="value">\${encryption}</div>
                        </div>
                    \`;
                    
                    // Copy password function
                    window.copyPassword = function() {
                        navigator.clipboard.writeText('\${password.replace(/'/g, "\\\\'")}').then(() => {
                            const btn = event.target;
                            btn.textContent = 'Copied!';
                            setTimeout(() => {
                                btn.textContent = 'Copy';
                            }, 2000);
                        }).catch(() => {
                            // Fallback for older browsers
                            const textarea = document.createElement('textarea');
                            textarea.value = '\${password.replace(/'/g, "\\\\'")}';
                            document.body.appendChild(textarea);
                            textarea.select();
                            document.execCommand('copy');
                            document.body.removeChild(textarea);
                            const btn = event.target;
                            btn.textContent = 'Copied!';
                            setTimeout(() => {
                                btn.textContent = 'Copy';
                            }, 2000);
                        });
                    };
                    
                    // Try to trigger WiFi connection on mobile devices
                    setTimeout(() => {
                        if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
                            // iOS - show instructions
                            console.log('iOS detected - manual connection required');
                        } else if (/Android/i.test(navigator.userAgent)) {
                            // Try Android WiFi intent (may not work due to security)
                            try {
                                window.location.href = 'android-app://settings.wifi';
                            } catch (e) {
                                console.log('Could not open WiFi settings');
                            }
                        }
                    }, 500);
                } else {
                    document.getElementById('wifiInfo').innerHTML = '<p style="text-align: center; color: #d32f2f;">Could not parse WiFi information.</p>';
                }
            } catch (error) {
                document.getElementById('wifiInfo').innerHTML = '<p style="text-align: center; color: #d32f2f;">Error loading WiFi information.</p>';
                console.error('WiFi parse error:', error);
            }
        }
    </script>
</body>
</html>`,
                    {
                        headers: { ...corsHeaders, 'Content-Type': 'text/html' },
                        status: 200
                    }
                );
            }
            
            // For regular URLs, redirect to the absolute URL
            const absoluteRedirectUrl = makeAbsoluteUrl(redirectUrl, origin);
            console.log('Redirecting to:', absoluteRedirectUrl);
            return Response.redirect(absoluteRedirectUrl, 302);
        }
        
        // For POST requests, return JSON response
        return new Response(
            JSON.stringify({ 
                success: true, 
                scanRecorded: scanInsertSucceeded,
                message: 'Scan tracked successfully'
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    } catch (error: any) {
        console.error('=== TRACK-SCAN FUNCTION ERROR ===');
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        console.error('Full error:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
        
        const errorResponse = {
            error: {
                message: error.message || 'An unexpected error occurred',
                code: error.code || 'UNKNOWN_ERROR',
                details: error.stack || ''
            }
        };
        
        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

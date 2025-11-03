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
            // Handle custom pages for vCard and Business
            if (redirectUrl === 'VCARD_PAGE' && qrCode) {
                const vcardContent = qrCode.content || {};
                const vcardName = `${vcardContent.firstName || ''} ${vcardContent.lastName || ''}`.trim() || 'Contact';
                
                return new Response(
                    `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${vcardName} - Contact Card</title>
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
            max-width: 500px;
            width: 100%;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        .avatar {
            width: 120px;
            height: 120px;
            border-radius: 50%;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 24px;
            color: white;
            font-size: 48px;
            font-weight: 600;
            text-transform: uppercase;
        }
        h1 {
            text-align: center;
            color: #333;
            margin-bottom: 8px;
            font-size: 28px;
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
            display: flex;
            align-items: flex-start;
        }
        .info-row:last-child {
            margin-bottom: 0;
        }
        .info-icon {
            width: 40px;
            height: 40px;
            border-radius: 8px;
            background: #667eea;
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 12px;
            flex-shrink: 0;
        }
        .info-content {
            flex: 1;
        }
        .label {
            font-size: 12px;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
        }
        .value {
            font-size: 16px;
            color: #333;
            font-weight: 500;
            word-break: break-all;
        }
        .value a {
            color: #667eea;
            text-decoration: none;
        }
        .value a:hover {
            text-decoration: underline;
        }
        .actions {
            display: flex;
            gap: 12px;
            margin-top: 24px;
        }
        .action-btn {
            flex: 1;
            padding: 12px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            text-decoration: none;
            text-align: center;
            transition: transform 0.2s;
            border: none;
        }
        .action-btn:active {
            transform: scale(0.95);
        }
        .btn-primary {
            background: #667eea;
            color: white;
        }
        .btn-primary:hover {
            background: #5568d3;
        }
        .btn-secondary {
            background: #f8f9fa;
            color: #333;
            border: 1px solid #e0e0e0;
        }
        .btn-secondary:hover {
            background: #e9ecef;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="avatar">${(vcardContent.firstName?.[0] || '').toUpperCase()}${(vcardContent.lastName?.[0] || '').toUpperCase()}</div>
        <h1>${vcardName}</h1>
        <p class="subtitle">Contact Information</p>
        <div class="info-box">
            ${vcardContent.phone ? `
            <div class="info-row">
                <div class="info-icon">📞</div>
                <div class="info-content">
                    <div class="label">Phone</div>
                    <div class="value"><a href="tel:${vcardContent.phone}">${vcardContent.phone}</a></div>
                </div>
            </div>
            ` : ''}
            ${vcardContent.email ? `
            <div class="info-row">
                <div class="info-icon">✉️</div>
                <div class="info-content">
                    <div class="label">Email</div>
                    <div class="value"><a href="mailto:${vcardContent.email}">${vcardContent.email}</a></div>
                </div>
            </div>
            ` : ''}
            ${vcardContent.company ? `
            <div class="info-row">
                <div class="info-icon">🏢</div>
                <div class="info-content">
                    <div class="label">Company</div>
                    <div class="value">${vcardContent.company}</div>
                </div>
            </div>
            ` : ''}
            ${vcardContent.website ? `
            <div class="info-row">
                <div class="info-icon">🌐</div>
                <div class="info-content">
                    <div class="label">Website</div>
                    <div class="value"><a href="${vcardContent.website}" target="_blank" rel="noopener noreferrer">${vcardContent.website}</a></div>
                </div>
            </div>
            ` : ''}
            ${vcardContent.address ? `
            <div class="info-row">
                <div class="info-icon">📍</div>
                <div class="info-content">
                    <div class="label">Address</div>
                    <div class="value">${vcardContent.address}</div>
                </div>
            </div>
            ` : ''}
        </div>
        <div class="actions">
            <button class="action-btn btn-primary" onclick="downloadVCard()">Save to Contacts</button>
            <a href="/" class="action-btn btn-secondary">Go Back</a>
        </div>
    </div>
    <script>
        function downloadVCard() {
            const vcard = \`BEGIN:VCARD
VERSION:3.0
FN:${vcardName}
${vcardContent.phone ? 'TEL:' + vcardContent.phone : ''}
${vcardContent.email ? 'EMAIL:' + vcardContent.email : ''}
${vcardContent.company ? 'ORG:' + vcardContent.company : ''}
${vcardContent.website ? 'URL:' + vcardContent.website : ''}
${vcardContent.address ? 'ADR:;;' + vcardContent.address + ';;;;' : ''}
END:VCARD\`;
            const blob = new Blob([vcard], { type: 'text/vcard' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = '${vcardName.replace(/[^a-z0-9]/gi, '_')}.vcf';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
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
            
            if (redirectUrl === 'BUSINESS_PAGE' && qrCode) {
                const businessContent = qrCode.content || {};
                const businessName = businessContent.businessName || 'Business';
                
                return new Response(
                    `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${businessName}</title>
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
            max-width: 500px;
            width: 100%;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        .logo {
            width: 120px;
            height: 120px;
            border-radius: 50%;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 24px;
            color: white;
            font-size: 48px;
            font-weight: 600;
            text-transform: uppercase;
        }
        h1 {
            text-align: center;
            color: #333;
            margin-bottom: 8px;
            font-size: 28px;
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
            display: flex;
            align-items: flex-start;
        }
        .info-row:last-child {
            margin-bottom: 0;
        }
        .info-icon {
            width: 40px;
            height: 40px;
            border-radius: 8px;
            background: #667eea;
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 12px;
            flex-shrink: 0;
        }
        .info-content {
            flex: 1;
        }
        .label {
            font-size: 12px;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
        }
        .value {
            font-size: 16px;
            color: #333;
            font-weight: 500;
            word-break: break-all;
        }
        .value a {
            color: #667eea;
            text-decoration: none;
        }
        .value a:hover {
            text-decoration: underline;
        }
        .actions {
            display: flex;
            gap: 12px;
            margin-top: 24px;
        }
        .action-btn {
            flex: 1;
            padding: 12px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            text-decoration: none;
            text-align: center;
            transition: transform 0.2s;
        }
        .action-btn:active {
            transform: scale(0.95);
        }
        .btn-primary {
            background: #667eea;
            color: white;
        }
        .btn-primary:hover {
            background: #5568d3;
        }
        .btn-secondary {
            background: #f8f9fa;
            color: #333;
            border: 1px solid #e0e0e0;
        }
        .btn-secondary:hover {
            background: #e9ecef;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">${businessName.substring(0, 2).toUpperCase()}</div>
        <h1>${businessName}</h1>
        <p class="subtitle">Business Information</p>
        <div class="info-box">
            ${businessContent.website || businessContent.url ? `
            <div class="info-row">
                <div class="info-icon">🌐</div>
                <div class="info-content">
                    <div class="label">Website</div>
                    <div class="value"><a href="${businessContent.website || businessContent.url}" target="_blank" rel="noopener noreferrer">${businessContent.website || businessContent.url}</a></div>
                </div>
            </div>
            ` : ''}
            ${businessContent.phone ? `
            <div class="info-row">
                <div class="info-icon">📞</div>
                <div class="info-content">
                    <div class="label">Phone</div>
                    <div class="value"><a href="tel:${businessContent.phone}">${businessContent.phone}</a></div>
                </div>
            </div>
            ` : ''}
            ${businessContent.email ? `
            <div class="info-row">
                <div class="info-icon">✉️</div>
                <div class="info-content">
                    <div class="label">Email</div>
                    <div class="value"><a href="mailto:${businessContent.email}">${businessContent.email}</a></div>
                </div>
            </div>
            ` : ''}
            ${businessContent.address ? `
            <div class="info-row">
                <div class="info-icon">📍</div>
                <div class="info-content">
                    <div class="label">Address</div>
                    <div class="value">${businessContent.address}</div>
                </div>
            </div>
            ` : ''}
        </div>
        <div class="actions">
            ${businessContent.website || businessContent.url ? `<a href="${businessContent.website || businessContent.url}" target="_blank" rel="noopener noreferrer" class="action-btn btn-primary">Visit Website</a>` : ''}
            <a href="/" class="action-btn btn-secondary">Go Back</a>
        </div>
    </div>
</body>
</html>`,
                    {
                        headers: { ...corsHeaders, 'Content-Type': 'text/html' },
                        status: 200
                    }
                );
            }
            
            // For data URIs (WiFi), return HTML page that handles them
            if (redirectUrl.startsWith('data:')) {
                const isVCard = redirectUrl.includes('text/vcard');
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
            font-size: 13px;n
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
        
        // For vCard, trigger download/contact app
        if (${isVCard}) {
            const link = document.createElement('a');
            link.href = dataUri;
            link.download = 'contact.vcf';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
        // For WiFi, display info nicely
        else if (${isWiFi}) {
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

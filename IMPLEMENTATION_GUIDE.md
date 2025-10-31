# Implementation Guide: Missing Features

## 1. STRIPE INTEGRATION

### Step 1: Install Dependencies
```bash
cd /workspace/qr-generator
pnpm add stripe @stripe/stripe-js
```

### Step 2: Create Stripe Checkout Edge Function

Create `/workspace/supabase/functions/create-checkout/index.ts`:

```typescript
import Stripe from 'https://esm.sh/stripe@14.5.0';

Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { priceId, userId } = await req.json();
    
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    const stripe = new Stripe(stripeKey!, { apiVersion: '2023-10-16' });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${req.headers.get('origin')}/billing?success=true`,
      cancel_url: `${req.headers.get('origin')}/billing?canceled=true`,
      client_reference_id: userId,
    });

    return new Response(JSON.stringify({ sessionId: session.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
```

### Step 3: Update BillingPage.tsx

Add to `/workspace/qr-generator/src/pages/BillingPage.tsx`:

```typescript
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe('pk_test_YOUR_PUBLISHABLE_KEY');

async function handleSubscribe(priceId: string) {
  const stripe = await stripePromise;
  
  const { data, error } = await supabase.functions.invoke('create-checkout', {
    body: { priceId, userId: user?.id }
  });

  if (error) {
    console.error('Error:', error);
    return;
  }

  await stripe?.redirectToCheckout({ sessionId: data.sessionId });
}
```

### Step 4: Add Stripe Environment Variables
Ask user for:
- STRIPE_SECRET_KEY
- STRIPE_PUBLISHABLE_KEY

---

## 2. QR CODE CUSTOMIZATION

### Step 1: Install QR Generation Library
```bash
cd /workspace/qr-generator
pnpm add qrcode
```

### Step 2: Update generate-qr Edge Function

Replace the QR API call in `/workspace/supabase/functions/generate-qr/index.ts`:

```typescript
// Instead of using qrserver.com API, use a proper QR library
// This requires installing dependencies in the edge function

// For now, enhance the API call:
const { foregroundColor = '000000', backgroundColor = 'ffffff', logo } = customization || {};

const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(qrData)}&format=png&color=${foregroundColor}&bgcolor=${backgroundColor}`;

// TODO: Implement logo overlay and frames
// This requires image processing library
```

### Step 3: Update CreateQRPage.tsx

Add customization step:

```typescript
// Add Step 3: Design
const [customization, setCustomization] = useState({
  foregroundColor: '#000000',
  backgroundColor: '#ffffff',
  logo: null,
  frame: 'none'
});

// Add color pickers in Step 3
<input 
  type="color" 
  value={customization.foregroundColor}
  onChange={(e) => setCustomization({...customization, foregroundColor: e.target.value})}
/>
```

---

## 3. MULTI-FORMAT EXPORT

### Step 1: Install Image Conversion Library
```bash
cd /workspace/qr-generator
pnpm add html-to-image
```

### Step 2: Add Export Functions

Add to Dashboard or QR detail page:

```typescript
import { toPng, toSvg, toJpeg } from 'html-to-image';

async function downloadQR(qrCodeUrl: string, format: 'png' | 'svg' | 'jpg') {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.src = qrCodeUrl;
  
  await img.decode();
  
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d');
  ctx?.drawImage(img, 0, 0);

  let dataUrl;
  if (format === 'png') {
    dataUrl = canvas.toDataURL('image/png');
  } else if (format === 'jpg') {
    dataUrl = canvas.toDataURL('image/jpeg', 0.95);
  } else if (format === 'svg') {
    // For SVG, need to regenerate with SVG library
    dataUrl = await toSvg(canvas);
  }

  const link = document.createElement('a');
  link.download = `qr-code.${format}`;
  link.href = dataUrl;
  link.click();
}
```

### Step 3: Add Export Buttons

```typescript
<div className="flex space-x-2">
  <button onClick={() => downloadQR(qr.qr_image_url, 'png')}>PNG</button>
  <button onClick={() => downloadQR(qr.qr_image_url, 'jpg')}>JPG</button>
  <button onClick={() => downloadQR(qr.qr_image_url, 'svg')}>SVG</button>
</div>
```

---

## 4. TWO-FACTOR AUTHENTICATION (2FA)

### Step 1: Enable in Supabase Dashboard
- Go to Authentication > Settings
- Enable "Phone" provider
- Configure SMS provider (Twilio, etc.)

### Step 2: Add 2FA Setup Page

Create `/workspace/qr-generator/src/pages/Setup2FA.tsx`:

```typescript
import { useState } from 'react';
import { supabase } from '../lib/supabase';

export function Setup2FAPage() {
  const [phone, setPhone] = useState('');
  
  async function enable2FA() {
    const { data, error } = await supabase.auth.updateUser({
      phone: phone
    });
    
    if (!error) {
      // Send verification code
      await supabase.auth.signInWithOtp({ phone });
    }
  }
  
  return (
    <div>
      <input 
        type="tel"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="+1234567890"
      />
      <button onClick={enable2FA}>Enable 2FA</button>
    </div>
  );
}
```

### Step 3: Update Login Flow

In LoginPage.tsx, add OTP verification step after password.

---

## 5. MULTI-LANGUAGE SUPPORT

### Step 1: Install i18n Library
```bash
cd /workspace/qr-generator
pnpm add react-i18next i18next
```

### Step 2: Create Translation Files

Create `/workspace/qr-generator/src/locales/en.json`:
```json
{
  "nav": {
    "home": "Home",
    "login": "Log In",
    "signup": "Sign Up"
  },
  "hero": {
    "title": "Try The Best QR Code Generator",
    "subtitle": "Create dynamic QR codes with advanced analytics"
  }
}
```

Create `/workspace/qr-generator/src/locales/es.json` with Spanish translations.

### Step 3: Configure i18n

Create `/workspace/qr-generator/src/i18n.ts`:

```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import es from './locales/es.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      es: { translation: es }
    },
    lng: 'en',
    fallbackLng: 'en',
    interpolation: { escapeValue: false }
  });

export default i18n;
```

### Step 4: Use Translations

```typescript
import { useTranslation } from 'react-i18next';

function HomePage() {
  const { t } = useTranslation();
  
  return <h1>{t('hero.title')}</h1>;
}
```

---

## DEPLOYMENT CHECKLIST

- [ ] Build completes successfully
- [ ] All pages load without errors
- [ ] Authentication works (signup, login, logout)
- [ ] QR codes can be created
- [ ] QR codes are stored in Supabase
- [ ] Dashboard displays QR codes
- [ ] Analytics records scans
- [ ] Stripe checkout works (if implemented)
- [ ] Customization options work (if implemented)
- [ ] Multi-format export works (if implemented)
- [ ] Mobile responsive design verified
- [ ] Performance tested (Lighthouse score > 80)

---

## TESTING URLS

After deployment, test these critical paths:

1. `https://your-domain.com/` - Landing page
2. `https://your-domain.com/signup` - New user registration
3. `https://your-domain.com/login` - User login
4. `https://your-domain.com/dashboard` - Protected dashboard
5. `https://your-domain.com/create-qr` - QR creation
6. `https://your-domain.com/analytics` - Analytics view
7. `https://your-domain.com/billing` - Subscription plans
8. `https://your-domain.com/faq` - FAQ page

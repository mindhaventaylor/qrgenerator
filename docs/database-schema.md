# QR Code Generator - Database Schema

## Tables Overview

### 1. profiles
Extends auth.users with additional user information

```sql
- id (uuid, primary key, references auth.users)
- email (text)
- first_name (text)
- last_name (text)
- phone (text, optional)
- account_type (text: 'company' or 'private')
- company_name (text, optional)
- tax_id (text, optional)
- address (text, optional)
- postal_code (text, optional)
- country (text, optional)
- language (text, default 'en')
- google_analytics_id (text, optional)
- created_at (timestamp)
- updated_at (timestamp)
```

### 2. subscriptions
User subscription management

```sql
- id (uuid, primary key)
- user_id (uuid, references profiles)
- plan_type (text: 'monthly', 'quarterly', 'annually')
- status (text: 'active', 'trial', 'expired', 'cancelled')
- trial_end_date (timestamp, nullable)
- current_period_start (timestamp)
- current_period_end (timestamp)
- cancel_at_period_end (boolean, default false)
- created_at (timestamp)
- updated_at (timestamp)
```

### 3. payments
Payment transaction history

```sql
- id (uuid, primary key)
- user_id (uuid, references profiles)
- subscription_id (uuid, references subscriptions)
- amount (decimal)
- currency (text, default 'USD')
- payment_method (text: 'card', 'google_pay')
- status (text: 'pending', 'completed', 'failed')
- invoice_url (text, nullable)
- created_at (timestamp)
```

### 4. folders
Organize QR codes into folders

```sql
- id (uuid, primary key)
- user_id (uuid, references profiles)
- name (text)
- created_at (timestamp)
- updated_at (timestamp)
```

### 5. qr_codes
Main QR code data

```sql
- id (uuid, primary key)
- user_id (uuid, references profiles)
- folder_id (uuid, references folders, nullable)
- name (text)
- type (text: 'website', 'pdf', 'images', 'video', 'wifi', 'menu', 'business', 'vcard', 'mp3', 'apps', 'links', 'coupon', 'facebook', 'instagram', 'social', 'whatsapp')
- content (jsonb) -- Stores type-specific data
- qr_image_url (text) -- URL to generated QR code image
- customization (jsonb) -- Colors, logo, frame settings
- is_dynamic (boolean, default true)
- is_active (boolean, default true)
- scan_count (integer, default 0)
- unique_scan_count (integer, default 0)
- created_at (timestamp)
- updated_at (timestamp)
```

### 6. qr_scans
Analytics and scan tracking

```sql
- id (uuid, primary key)
- qr_code_id (uuid, references qr_codes)
- scanned_at (timestamp)
- country (text, nullable)
- city (text, nullable)
- operating_system (text, nullable)
- device_type (text, nullable)
- browser (text, nullable)
- ip_address (text, nullable)
- user_agent (text, nullable)
```

## Row Level Security (RLS) Policies

All tables will have RLS enabled with policies:
- Users can only access their own data
- Allow both 'anon' and 'service_role' for edge function operations

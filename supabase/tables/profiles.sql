CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    account_type TEXT DEFAULT 'private',
    company_name TEXT,
    tax_id TEXT,
    address TEXT,
    postal_code TEXT,
    country TEXT,
    language TEXT DEFAULT 'en',
    google_analytics_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
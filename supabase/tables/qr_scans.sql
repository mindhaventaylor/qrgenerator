CREATE TABLE qr_scans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    qr_code_id UUID NOT NULL,
    scanned_at TIMESTAMPTZ DEFAULT NOW(),
    country TEXT,
    city TEXT,
    operating_system TEXT,
    device_type TEXT,
    browser TEXT,
    ip_address TEXT,
    user_agent TEXT
);
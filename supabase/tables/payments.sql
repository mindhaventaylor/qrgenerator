CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    subscription_id UUID,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    payment_method TEXT CHECK (payment_method IN ('card',
    'google_pay')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending',
    'completed',
    'failed')),
    invoice_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
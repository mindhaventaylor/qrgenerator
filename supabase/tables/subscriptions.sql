CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    plan_type TEXT NOT NULL CHECK (plan_type IN ('monthly',
    'quarterly',
    'annually')),
    status TEXT NOT NULL DEFAULT 'trial' CHECK (status IN ('active',
    'trial',
    'expired',
    'cancelled')),
    trial_end_date TIMESTAMPTZ,
    current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    current_period_end TIMESTAMPTZ NOT NULL,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
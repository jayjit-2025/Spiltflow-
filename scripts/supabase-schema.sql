-- ============================================================================
-- SplitFlow Supabase PostgreSQL Database Schema & Migration Script
-- ============================================================================
-- Execute this SQL in your Supabase Dashboard -> SQL Editor (or via CLI)
-- ============================================================================

-- 1. Create Assets Table
CREATE TABLE IF NOT EXISTS public.assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id TEXT NOT NULL UNIQUE,
    owner_address TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Create Contributors Table
CREATE TABLE IF NOT EXISTS public.contributors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id TEXT NOT NULL REFERENCES public.assets(asset_id) ON DELETE CASCADE,
    address TEXT NOT NULL,
    share_bps INTEGER NOT NULL CHECK (share_bps > 0 AND share_bps <= 10000),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Create Transactions Table
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tx_hash TEXT NOT NULL UNIQUE,
    asset_id TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('REGISTRATION', 'DISTRIBUTION')),
    payer_address TEXT NOT NULL,
    amount_xlm TEXT NOT NULL DEFAULT '0',
    status TEXT NOT NULL DEFAULT 'CONFIRMED' CHECK (status IN ('PROCESSING', 'CONFIRMED', 'FAILED')),
    timestamp BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Create User Feedback Table
CREATE TABLE IF NOT EXISTS public.user_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    wallet_address TEXT,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    feedback TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security (RLS) & Public Policies
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contributors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read/write on assets" ON public.assets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write on contributors" ON public.contributors FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write on transactions" ON public.transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write on user_feedback" ON public.user_feedback FOR ALL USING (true) WITH CHECK (true);

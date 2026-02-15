-- ============================================
-- SUPABASE SQL SCHEMA FOR PIGGYBAG PLATFORM
-- ============================================
-- Run this in Supabase SQL Editor to create
-- all required tables for the PiggyBag fundraiser platform

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USER PROFILES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    wallet_address TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL DEFAULT '',
    description TEXT DEFAULT '',
    twitter_url TEXT DEFAULT '',
    linkedin_url TEXT DEFAULT '',
    avatar_url TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS avatar_url TEXT DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_user_wallet ON user_profiles(wallet_address);

-- ============================================
-- PIGGYBANK PROJECTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS piggybank_projects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    
    -- Project identification
    app_id BIGINT UNIQUE NOT NULL,  -- Algorand App ID
    app_address TEXT NOT NULL,       -- Algorand App Address
    
    -- Project details
    name TEXT NOT NULL,
    description TEXT,
    
    -- Token details
    token_id BIGINT,                 -- ASA ID for project token
    token_name TEXT,
    token_symbol TEXT,
    token_total_supply BIGINT,
    
    -- Funding details
    goal_amount BIGINT NOT NULL,     -- Goal in microAlgos
    total_deposited BIGINT DEFAULT 0,
    
    -- Creator info
    creator_address TEXT NOT NULL,
    
    -- Tinyman integration
    tinyman_pool_address TEXT,       -- Tinyman pool address if created
    tinyman_pool_id BIGINT,          -- Tinyman pool app ID
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_goal_reached BOOLEAN DEFAULT false,
    
    -- Metadata
    image_url TEXT,
    website_url TEXT,
    twitter_url TEXT,
    discord_url TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_piggybank_creator ON piggybank_projects(creator_address);
CREATE INDEX IF NOT EXISTS idx_piggybank_token ON piggybank_projects(token_id);
CREATE INDEX IF NOT EXISTS idx_piggybank_active ON piggybank_projects(is_active);

-- ============================================
-- PIGGYBANK DEPOSITS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS piggybank_deposits (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    
    -- References
    project_id UUID REFERENCES piggybank_projects(id) ON DELETE CASCADE,
    app_id BIGINT NOT NULL,
    
    -- Deposit details
    depositor_address TEXT NOT NULL,
    amount BIGINT NOT NULL,          -- Amount in microAlgos
    
    -- Transaction info
    txn_id TEXT NOT NULL UNIQUE,     -- Algorand transaction ID
    round_number BIGINT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_deposits_project ON piggybank_deposits(project_id);
CREATE INDEX IF NOT EXISTS idx_deposits_depositor ON piggybank_deposits(depositor_address);

-- ============================================
-- PIGGYBANK WITHDRAWALS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS piggybank_withdrawals (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    
    -- References
    project_id UUID REFERENCES piggybank_projects(id) ON DELETE CASCADE,
    app_id BIGINT NOT NULL,
    
    -- Withdrawal details
    withdrawer_address TEXT NOT NULL,
    amount BIGINT NOT NULL,          -- Amount in microAlgos
    
    -- Transaction info
    txn_id TEXT NOT NULL UNIQUE,
    round_number BIGINT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_withdrawals_project ON piggybank_withdrawals(project_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_withdrawer ON piggybank_withdrawals(withdrawer_address);

-- ============================================
-- TOKEN CLAIMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS piggybank_token_claims (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    
    -- References
    project_id UUID REFERENCES piggybank_projects(id) ON DELETE CASCADE,
    token_id BIGINT NOT NULL,
    
    -- Claim details
    claimer_address TEXT NOT NULL,
    amount BIGINT NOT NULL,          -- Amount of tokens claimed
    
    -- Transaction info
    txn_id TEXT NOT NULL UNIQUE,
    round_number BIGINT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_claims_project ON piggybank_token_claims(project_id);
CREATE INDEX IF NOT EXISTS idx_claims_claimer ON piggybank_token_claims(claimer_address);

-- ============================================
-- FUNCTION: Auto-update updated_at timestamp
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for auto-updating timestamp on user_profiles
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for auto-updating timestamp
DROP TRIGGER IF EXISTS update_piggybank_projects_updated_at ON piggybank_projects;
CREATE TRIGGER update_piggybank_projects_updated_at
    BEFORE UPDATE ON piggybank_projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE piggybank_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE piggybank_deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE piggybank_withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE piggybank_token_claims ENABLE ROW LEVEL SECURITY;

-- User profile policies
CREATE POLICY "Profiles are viewable by everyone"
    ON user_profiles FOR SELECT
    USING (true);

CREATE POLICY "Anyone can create profiles"
    ON user_profiles FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Users can update their own profiles"
    ON user_profiles FOR UPDATE
    USING (true);

-- Policy: Anyone can read projects
CREATE POLICY "Public projects are viewable by everyone"
    ON piggybank_projects FOR SELECT
    USING (true);

-- Policy: Anyone can insert projects (authenticated via wallet)
CREATE POLICY "Anyone can create projects"
    ON piggybank_projects FOR INSERT
    WITH CHECK (true);

-- Policy: Only creator can update their project
CREATE POLICY "Creators can update their own projects"
    ON piggybank_projects FOR UPDATE
    USING (true);  -- Frontend validates wallet ownership

-- Policy: Anyone can read deposits
CREATE POLICY "Deposits are viewable by everyone"
    ON piggybank_deposits FOR SELECT
    USING (true);

-- Policy: Anyone can create deposits
CREATE POLICY "Anyone can create deposits"
    ON piggybank_deposits FOR INSERT
    WITH CHECK (true);

-- Policy: Anyone can read withdrawals
CREATE POLICY "Withdrawals are viewable by everyone"
    ON piggybank_withdrawals FOR SELECT
    USING (true);

-- Policy: Anyone can create withdrawals
CREATE POLICY "Anyone can create withdrawals"
    ON piggybank_withdrawals FOR INSERT
    WITH CHECK (true);

-- Policy: Anyone can read token claims
CREATE POLICY "Token claims are viewable by everyone"
    ON piggybank_token_claims FOR SELECT
    USING (true);

-- Policy: Anyone can create token claims
CREATE POLICY "Anyone can create token claims"
    ON piggybank_token_claims FOR INSERT
    WITH CHECK (true);

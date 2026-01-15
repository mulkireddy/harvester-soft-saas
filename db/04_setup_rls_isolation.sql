-- ==============================================================================
-- MIGRATION: DATA ISOLATION & RLS
-- ==============================================================================
-- This script secures your data so users can ONLY see their own records.
-- RUN THIS IN SUPABASE DASHBOARD > SQL EDITOR.
-- ==============================================================================

-- 1. Add 'user_id' column to all tables
-- We default it to auth.uid() so new rows automatically belong to the creator.
ALTER TABLE farmers ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
ALTER TABLE machines ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();

-- 2. Quick Fix for CURRENT Data (Optional)
-- If you want to claim ALL existing data for yourself, uncomment and replace YOUR_UUID
-- You can find your UUID in Auth > Users
-- UPDATE farmers SET user_id = 'YOUR_UUID_HERE' WHERE user_id IS NULL;
-- UPDATE jobs SET user_id = 'YOUR_UUID_HERE' WHERE user_id IS NULL;
-- UPDATE expenses SET user_id = 'YOUR_UUID_HERE' WHERE user_id IS NULL;

-- 3. Enable RLS (Row Level Security)
ALTER TABLE farmers ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE machines ENABLE ROW LEVEL SECURITY;

-- 4. Create Security Policies
-- (We drop first to avoid "policy exists" errors if you re-run)

-- FARMERS
DROP POLICY IF EXISTS "Farmers: Owners only" ON farmers;
CREATE POLICY "Farmers: Owners only" ON farmers
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- JOBS
DROP POLICY IF EXISTS "Jobs: Owners only" ON jobs;
CREATE POLICY "Jobs: Owners only" ON jobs
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- EXPENSES
DROP POLICY IF EXISTS "Expenses: Owners only" ON expenses;
CREATE POLICY "Expenses: Owners only" ON expenses
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- MACHINES
DROP POLICY IF EXISTS "Machines: Owners only" ON machines;
CREATE POLICY "Machines: Owners only" ON machines
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Done! Now User A cannot see User B's data.

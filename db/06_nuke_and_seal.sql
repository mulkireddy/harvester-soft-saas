-- ==============================================================================
-- FIX: FINAL SECURITY SEAL (Nuke all variations)
-- ==============================================================================
-- We found policies with different names (e.g. "Enable all access for expenses").
-- This script explicitly targets them.
-- ==============================================================================

-- EXPENSES
DROP POLICY IF EXISTS "Enable all access" ON expenses;
DROP POLICY IF EXISTS "Enable all access for expenses" ON expenses;
DROP POLICY IF EXISTS "Public access" ON expenses;
DROP POLICY IF EXISTS "Enable read access for all users" ON expenses;

-- MACHINES
DROP POLICY IF EXISTS "Enable access for all users" ON machines;
DROP POLICY IF EXISTS "Enable all access" ON machines;
DROP POLICY IF EXISTS "Public access" ON machines;

-- FARMERS
DROP POLICY IF EXISTS "Enable all access for farmers" ON farmers;
DROP POLICY IF EXISTS "Enable access for all users" ON farmers;
DROP POLICY IF EXISTS "Enable read access for all users" ON farmers;

-- JOBS
DROP POLICY IF EXISTS "Enable all access for jobs" ON jobs;
DROP POLICY IF EXISTS "Enable access for all users" ON jobs;
DROP POLICY IF EXISTS "Enable read access for all users" ON jobs;

-- RE-APPLY OWNER POLICIES (Safety Check)
-- Note: 'create policy if not exists' isn't standard in older PG, so we drop then create.

DROP POLICY IF EXISTS "Farmers: Owners only" ON farmers;
CREATE POLICY "Farmers: Owners only" ON farmers USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Jobs: Owners only" ON jobs;
CREATE POLICY "Jobs: Owners only" ON jobs USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Expenses: Owners only" ON expenses;
CREATE POLICY "Expenses: Owners only" ON expenses USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Machines: Owners only" ON machines;
CREATE POLICY "Machines: Owners only" ON machines USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Force RLS Check
ALTER TABLE farmers ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE machines ENABLE ROW LEVEL SECURITY;

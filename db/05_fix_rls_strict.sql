DROP POLICY IF EXISTS "Enable read access for all users" ON farmers;
DROP POLICY IF EXISTS "Enable insert access for all users" ON farmers;
DROP POLICY IF EXISTS "Enable update access for all users" ON farmers;
DROP POLICY IF EXISTS "Enable delete access for all users" ON farmers;
DROP POLICY IF EXISTS "Enable all access" ON farmers;

DROP POLICY IF EXISTS "Enable read access for all users" ON jobs;
DROP POLICY IF EXISTS "Enable insert access for all users" ON jobs;
DROP POLICY IF EXISTS "Enable update access for all users" ON jobs;
DROP POLICY IF EXISTS "Enable delete access for all users" ON jobs;
DROP POLICY IF EXISTS "Enable all access" ON jobs;

DROP POLICY IF EXISTS "Enable read access for all users" ON expenses;
DROP POLICY IF EXISTS "Enable insert access for all users" ON expenses;
DROP POLICY IF EXISTS "Enable update access for all users" ON expenses;
DROP POLICY IF EXISTS "Enable delete access for all users" ON expenses;
DROP POLICY IF EXISTS "Enable all access" ON expenses;

DROP POLICY IF EXISTS "Enable read access for all users" ON machines;
DROP POLICY IF EXISTS "Enable insert access for all users" ON machines;
DROP POLICY IF EXISTS "Enable update access for all users" ON machines;
DROP POLICY IF EXISTS "Enable delete access for all users" ON machines;
DROP POLICY IF EXISTS "Enable all access" ON machines;

DROP POLICY IF EXISTS "Farmers: Owners only" ON farmers;
CREATE POLICY "Farmers: Owners only" ON farmers USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Jobs: Owners only" ON jobs;
CREATE POLICY "Jobs: Owners only" ON jobs USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Expenses: Owners only" ON expenses;
CREATE POLICY "Expenses: Owners only" ON expenses USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Machines: Owners only" ON machines;
CREATE POLICY "Machines: Owners only" ON machines USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE farmers ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE machines ENABLE ROW LEVEL SECURITY;

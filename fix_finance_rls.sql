
-- Drop existing policies to ensure a clean slate
DROP POLICY IF EXISTS "Enable read access for all users" ON system_settings;
DROP POLICY IF EXISTS "Enable update for admins only" ON system_settings;
DROP POLICY IF EXISTS "Enable insert for admins only" ON system_settings;
DROP POLICY IF EXISTS "Enable all access for admins" ON system_settings;

DROP POLICY IF EXISTS "Enable all access for admins" ON fines;
DROP POLICY IF EXISTS "Enable read own fines" ON fines;

-- System Settings Policies
-- Allow everyone to read
CREATE POLICY "Enable read access for all users" ON system_settings FOR SELECT USING (true);

-- Allow admins to do EVERYTHING (Insert, Update, Delete)
-- IMPORTANT: 'FOR ALL' covers all operations.
-- USING covers SELECT, UPDATE, DELETE.
-- WITH CHECK covers INSERT, UPDATE.
CREATE POLICY "Enable all access for admins" ON system_settings FOR ALL 
USING (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
)
WITH CHECK (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- Fines Policies
-- Allow admins to do everything
CREATE POLICY "Enable all access for admins" ON fines FOR ALL 
USING (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
)
WITH CHECK (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- Allow users to read their own fines
CREATE POLICY "Enable read own fines" ON fines FOR SELECT 
USING (
  user_id = auth.uid()
);

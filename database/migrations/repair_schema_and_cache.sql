-- DEFINITIVE REPAIR SCRIPT
-- RUN THIS IN SUPABASE SQL EDITOR

BEGIN;

-- 1. Ensure 'checked_in_at' column exists in appointments
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'checked_in_at') THEN
        ALTER TABLE public.appointments ADD COLUMN checked_in_at TIMESTAMPTZ DEFAULT NULL;
    END IF;
END $$;

-- 2. Fix Audit Logs Foreign Key (Drop and Recreate to be sure)
ALTER TABLE public.audit_logs DROP CONSTRAINT IF EXISTS audit_logs_admin_id_fkey;

ALTER TABLE public.audit_logs 
    ADD CONSTRAINT audit_logs_admin_id_fkey 
    FOREIGN KEY (admin_id) 
    REFERENCES public.profiles(id);

-- 3. Grant permissions again to be safe
GRANT SELECT, INSERT, UPDATE, DELETE ON public.audit_logs TO postgres, service_role;
GRANT SELECT, INSERT ON public.audit_logs TO authenticated; -- authenticated users (admins) need insert
GRANT SELECT ON public.audit_logs TO anon;

-- 4. Fix Check-in Permissions for Guarita/Admin
DROP POLICY IF EXISTS "Guarita Checkin Update" ON public.appointments;
CREATE POLICY "Guarita Checkin Update" ON public.appointments
    FOR UPDATE
    USING (auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin', 'guarita')))
    WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin', 'guarita')));

COMMIT;

-- 5. CRITICAL: Force Schema Cache Reload
NOTIFY pgrst, 'reload schema';

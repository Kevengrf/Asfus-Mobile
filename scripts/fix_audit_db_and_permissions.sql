-- 1. Fix Audit Logs FK to point to profiles (enables the join in frontend)
BEGIN;

ALTER TABLE public.audit_logs DROP CONSTRAINT IF EXISTS audit_logs_admin_id_fkey;
ALTER TABLE public.audit_logs 
    ADD CONSTRAINT audit_logs_admin_id_fkey 
    FOREIGN KEY (admin_id) 
    REFERENCES public.profiles(id);

COMMIT;

-- 2. Ensure Guarita Check-in Permissions (RLS)
-- Allow Guarita/Admin to update appointments (specifically for check-in)
DROP POLICY IF EXISTS "Guarita can update check-in status" ON public.appointments;

CREATE POLICY "Guarita can update check-in status" ON public.appointments
    FOR UPDATE
    USING (
        auth.uid() IN (
            SELECT id FROM profiles WHERE role IN ('admin', 'guarita')
        )
    )
    WITH CHECK (
        auth.uid() IN (
            SELECT id FROM profiles WHERE role IN ('admin', 'guarita')
        )
    );

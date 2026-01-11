-- Force fix for Audit Logs Relationship
BEGIN;

-- 1. Drop existing constraints to be clean
ALTER TABLE public.audit_logs DROP CONSTRAINT IF EXISTS audit_logs_admin_id_fkey;

-- 2. Re-add the Foreign Key explicitly pointing to public.profiles(id)
ALTER TABLE public.audit_logs 
    ADD CONSTRAINT audit_logs_admin_id_fkey 
    FOREIGN KEY (admin_id) 
    REFERENCES public.profiles(id);

-- 3. Ensure permissions are correct (Grant references just in case)
GRANT REFERENCES ON public.profiles TO public; -- or specifically to the role, usually public is fine for references if auth

COMMIT;

-- 4. FORCE PostgREST Schema Cache Reload
-- This is often necessary after altering relationships
NOTIFY pgrst, 'reload schema';

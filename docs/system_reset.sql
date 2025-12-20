-- SYSTEM RESET SCRIPT
--
-- INSTRUCTIONS:
-- Run this in Supabase SQL Editor to reset the system for a fresh start.
--
-- ACTIONS:
-- 1. Deletes ALL appointments.
-- 2. Deletes ALL user logins (auth.users) EXCEPT Admins.
-- 3. SAFETY: Ensures 'profiles' are NOT deleted when 'auth.users' are deleted.

-- 1. Safety: Drop the foreign key constraint that forces Cascade Delete on profiles
--    This ensures that when we delete the Auth User, the Profile stays alive.
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- 2. Clear all appointments
TRUNCATE TABLE public.appointments;

-- 3. Reset Logins (Delete Auth Users for non-admins)
--    We filter by ID present in profiles where role is NOT 'admin'.
--    This prevents locking yourself out.
DELETE FROM auth.users 
WHERE id IN (
    SELECT id FROM public.profiles WHERE role != 'admin'
);

-- 4. Optional: Reset Profile status to 'pendente' to look fresh?
--    Included for completeness.
UPDATE public.profiles 
SET status = 'pendente' 
WHERE role != 'admin';

-- NOTE: We do NOT re-add the Foreign Key constraint immediately.
-- The "Imported User" architecture relies on profiles existing without Auth users.

-- EMERGENCY FIX: Infinite Recursion (Error 500)
-- The previous policies caused an infinite loop:
-- 1. App asks for Appointment -> DB checks Policy -> Policy asks for Profile Role
-- 2. DB asks for Profile -> DB checks Profile Policy -> Profile Policy asks for Profile Role (AGAIN) -> LOOP

-- Solution: Break the loop by making Profiles readable by everyone (or at least authenticated users) without conditions.
-- This stops the DB from checking "Are you admin?" just to let you read "Are you admin?".

-- 1. Reset Profiles RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop ALL potential conflicting policies to be safe
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Guarita can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Guarita can view all profiles" ON public.profiles; -- duplicate check
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Authenticated can view all profiles" ON public.profiles;

-- Create ONE simple policy that allows reading without recursion
CREATE POLICY "Authenticated can view all profiles" 
ON public.profiles FOR SELECT 
TO authenticated 
USING (true);

-- 2. Reset Appointments RLS (just to ensure 'guarita' works with the new profile access)
DROP POLICY IF EXISTS "Guarita can view all appointments" ON public.appointments;
CREATE POLICY "Guarita can view all appointments"
ON public.appointments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'guarita'
  )
);

-- 3. Reset Guests RLS
DROP POLICY IF EXISTS "Guarita can view all guests" ON public.appointment_guests;
CREATE POLICY "Guarita can view all guests"
ON public.appointment_guests FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'guarita'
  )
);

NOTIFY pgrst, 'reload config';

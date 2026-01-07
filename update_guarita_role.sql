-- 1. Update profiles table to allow 'guarita' role
-- We need to drop the existing check constraint and add a new one
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('admin', 'user', 'guarita'));

-- 2. RLS Policies for Guarita User
-- Guarita needs to READ everything related to appointments, guests, and profiles to verify identity.

-- Profiles: Allow Guarita to view all profiles
DROP POLICY IF EXISTS "Guarita can view all profiles" ON public.profiles;
CREATE POLICY "Guarita can view all profiles"
ON public.profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'guarita'
  )
);

-- Appointments: Allow Guarita to view all appointments
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

-- Appointment Guests: Allow Guarita to view all guests
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

-- Refresh schema cache
NOTIFY pgrst, 'reload config';

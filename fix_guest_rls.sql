-- Allow Admins to view ALL appointment guests
-- This fixes the issue where guests are not visible in the Admin Dashboard

DROP POLICY IF EXISTS "Admins can view all appointment guests" ON public.appointment_guests;

CREATE POLICY "Admins can view all appointment guests"
ON public.appointment_guests FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Ensure RLS is enabled
ALTER TABLE public.appointment_guests ENABLE ROW LEVEL SECURITY;

-- Reload schema cache
NOTIFY pgrst, 'reload config';

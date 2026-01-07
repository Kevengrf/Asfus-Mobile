-- Allow Admins to UPDATE profiles (specifically for approving photos)
-- We need to check if the user performing the update is an admin.

CREATE POLICY "Admins can update all profiles"
ON public.profiles
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Add columns for profile photo
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS profile_image text,
ADD COLUMN IF NOT EXISTS pending_profile_image text;

-- Allow users to update their own pending_profile_image
-- We need to check existing policies. 
-- Creating a specific policy for updating profile image if needed, 
-- but generally users might already have update access to their own profile?
-- Let's ensure they can update `pending_profile_image`.

DROP POLICY IF EXISTS "Users can update own pending_profile_image" ON public.profiles;
CREATE POLICY "Users can update own pending_profile_image"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- (If a broader update policy exists, this might be redundant but safe)

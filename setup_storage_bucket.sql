-- Create a new private bucket 'profiles'
INSERT INTO storage.buckets (id, name, public)
VALUES ('profiles', 'profiles', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Allow public read of all images in 'profiles' bucket
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'profiles' );

-- Policy: Allow authenticated users to upload to their own folder: profiles/{user_id}/*
DROP POLICY IF EXISTS "User Upload" ON storage.objects;
CREATE POLICY "User Upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profiles' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow users to update/delete their own files
DROP POLICY IF EXISTS "User Update" ON storage.objects;
CREATE POLICY "User Update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profiles' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "User Delete" ON storage.objects;
CREATE POLICY "User Delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'profiles' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

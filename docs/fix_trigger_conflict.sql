-- Fix Trigger Conflict for First Access
--
-- Problem:
-- The 'handle_new_user' trigger causes a Primary Key violation when creating an Auth User
-- for a Profile that already exists (e.g., imported associates).
--
-- Solution:
-- Update the function to use ON CONFLICT DO UPDATE (or NOTHING).
--
-- INSTRUCTIONS:
-- Run this script in the Supabase Dashboard > SQL Editor.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nome_completo, role, status)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'nome_completo',
    COALESCE(new.raw_user_meta_data->>'role', 'user'), -- Use role from metadata or default
    COALESCE(new.raw_user_meta_data->>'status', 'pendente') -- Use status from metadata or default
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email, -- Sync email from Auth to Profile
    -- We preserve other existing profile data (matricula, etc.)
    updated_at = now();
  RETURN new;
END;
$$;

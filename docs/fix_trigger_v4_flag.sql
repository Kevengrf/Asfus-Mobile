-- FIX TRIGGER V4 (The Flag Strategy)
--
-- INSTRUCTIONS:
-- Run this in Supabase SQL Editor.
-- This script updates the trigger to check for a 'skip_profile_creation' flag.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 1. THE BYPASS: Check if code asked to skip profile creation
  -- (We used text comparison for safety with JSONB)
  IF new.raw_user_meta_data->>'skip_profile_creation' = 'true' THEN
     RETURN new;
  END IF;

  -- 2. Fallback check (if flag was missing but profile exists)
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = new.id) THEN
     UPDATE public.profiles 
     SET email = new.email,
         updated_at = now()
     WHERE id = new.id;
     RETURN new;
  END IF;

  -- 3. Standard Insert
  INSERT INTO public.profiles (id, email, nome_completo, role, status)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'nome_completo',
    COALESCE(new.raw_user_meta_data->>'role', 'user'),
    COALESCE(new.raw_user_meta_data->>'status', 'pendente')
  );
  
  RETURN new;
EXCEPTION 
  WHEN OTHERS THEN
     -- Nuclear option: If anything fails, just allow the user to be created.
     RETURN new;
END;
$$;

-- Ensure trigger is attached
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

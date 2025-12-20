-- FIX TRIGGER V3 (Exception Handling)
--
-- This script uses a TRY/CATCH approach. It tries to insert the profile.
-- If it fails (ID exists, Email exists, etc.), it ignores the error and allows the User creation to succeed.
--
-- INSTRUCTIONS:
-- Run in Supabase SQL Editor.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  BEGIN
    INSERT INTO public.profiles (id, email, nome_completo, role, status)
    VALUES (
      new.id,
      new.email,
      new.raw_user_meta_data->>'nome_completo',
      COALESCE(new.raw_user_meta_data->>'role', 'user'),
      COALESCE(new.raw_user_meta_data->>'status', 'pendente')
    );
  EXCEPTION 
    WHEN unique_violation THEN
      -- Profile already exists (ID conflict) OR Email/CPF conflict.
      -- We ignore the error so auth.users entry can be created successfully.
      RETURN new;
    WHEN OTHERS THEN
      -- Log unexpected errors but ensure we don't block user creation
      RAISE WARNING 'Unexpected error in handle_new_user: %', SQLERRM;
      RETURN new;
  END;
  
  RETURN new;
END;
$$;

-- Re-attach trigger (just in case)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

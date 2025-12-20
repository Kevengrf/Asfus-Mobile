-- FORCE FIX TRIGGERS
--
-- INSTRUCTIONS:
-- Run this script in the Supabase Dashboard > SQL Editor.
-- It will attempt to drop known potential triggers and re-create the correct one.

-- 1. Drop potential conflicting triggers (names commonly used)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_user_created ON auth.users;
DROP TRIGGER IF EXISTS handle_new_user_trigger ON auth.users;
DROP TRIGGER IF EXISTS tr_handle_new_user ON auth.users;

-- 2. Update the function to be safe (idempotent)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if profile exists
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = new.id) THEN
     -- If exists, sync email and STOP (do not try to insert again)
     UPDATE public.profiles 
     SET email = new.email,
         updated_at = now()
     WHERE id = new.id;
     
     RETURN new;
  END IF;

  -- If does not exist, insert normally
  INSERT INTO public.profiles (id, email, nome_completo, role, status)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'nome_completo',
    COALESCE(new.raw_user_meta_data->>'role', 'user'),
    COALESCE(new.raw_user_meta_data->>'status', 'pendente')
  );
  
  RETURN new;
END;
$$;

-- 3. Re-create the trigger
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

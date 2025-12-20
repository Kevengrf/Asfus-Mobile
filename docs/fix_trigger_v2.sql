-- FIX TRIGGER V2
--
-- INSTRUCTIONS:
-- 1. Go to Supabase Dashboard > Database > Triggers.
-- 2. DELETE the existing trigger on 'auth.users' (usually named 'on_auth_user_created' or similar).
-- 3. Run this script in the SQL Editor.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 1. Check if profile already exists (by ID)
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = new.id) THEN
     -- 2. If it exists, just ensure email is synced and STOP.
     UPDATE public.profiles 
     SET email = new.email,
         updated_at = now()
     WHERE id = new.id;
     
     RETURN new;
  END IF;

  -- 3. If not exists, create the profile normally
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

-- 4. Re-create the trigger using the standard name
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

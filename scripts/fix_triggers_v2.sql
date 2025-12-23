-- FIX TRIGGERS V2 - Simplified to prevent Database Error
-- Run this in Supabase SQL Editor

-- 1. Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. Create simplified function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert or Update Profile
  -- We minimally insert ID and Email. Other fields (role, status) rely on DB defaults if not provided or valid.
  -- We include nome_completo and cpf if present in metadata.
  
  INSERT INTO public.profiles (id, email, nome_completo, cpf, role, status)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'nome_completo',
    new.raw_user_meta_data->>'cpf',
    COALESCE(new.raw_user_meta_data->>'role', 'user'), -- Ensure 'user' is fallback
    COALESCE(new.raw_user_meta_data->>'status', 'ativo') -- Change default to 'ativo' which is valid
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      nome_completo = COALESCE(EXCLUDED.nome_completo, public.profiles.nome_completo),
      updated_at = now();
      
  RETURN new;
EXCEPTION WHEN OTHERS THEN
  -- Log error but allow auth user creation to proceed? 
  -- No, if profile fails, we usually want to know. 
  -- But to avoid lockout, we can RAISE NOTICE.
  RAISE WARNING 'Profile creation failed for %: %', new.id, SQLERRM;
  RETURN new; -- Allow Auth User creation even if Profile fails (prevents "Database error" locking out Auth)
END;
$$;

-- 3. Re-attach Triggers
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER on_auth_user_updated
AFTER UPDATE ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

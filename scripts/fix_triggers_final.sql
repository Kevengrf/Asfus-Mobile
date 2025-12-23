-- FINAL FIX FOR TRIGGERS
-- Attempt to fix "Database error loading user" by cleaning up all triggers

-- 1. Drop ALL known potential triggers on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_user_created ON auth.users;
DROP TRIGGER IF EXISTS handle_new_user_trigger ON auth.users;
DROP TRIGGER IF EXISTS tr_handle_new_user ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users; -- Potential hidden update trigger

-- 2. Create a robust function that handles both INSERT and UPDATE
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- We only care about ensuring a profile exists.
  
  -- Check if profile exists
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = new.id) THEN
     -- Sync email if changed (useful for updates)
     IF new.email IS DISTINCT FROM old.email THEN
        UPDATE public.profiles 
        SET email = new.email,
            updated_at = now()
        WHERE id = new.id;
     END IF;
     
     RETURN new;
  END IF;

  -- If we get here, profile does NOT exist.
  -- Only create profile if this is an INSERT or if somehow we missed it.
  -- Using ON CONFLICT just in case of race conditions
  INSERT INTO public.profiles (id, email, nome_completo, role, status)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'nome_completo',
    COALESCE(new.raw_user_meta_data->>'role', 'user'),
    COALESCE(new.raw_user_meta_data->>'status', 'pendente')
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      updated_at = now();
  
  RETURN new;
END;
$$;

-- 3. Create Trigger for INSERT (Standard)
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Create Trigger for UPDATE (Sync email changes) - Optional but good practice
CREATE TRIGGER on_auth_user_updated
AFTER UPDATE ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

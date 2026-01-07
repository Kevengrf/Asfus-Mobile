-- 1. Ensure the 'guarita' role is allowed (just in case)
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('admin', 'user', 'guarita'));

-- 2. Find the user in auth.users and Insert/Update the profile
-- This grabs the ID from the authentication system and ensures a profile exists with the correct role.

INSERT INTO public.profiles (id, email, role, status, nome_completo)
SELECT id, email, 'guarita', 'ativo', 'Portaria Principal'
FROM auth.users
WHERE email = 'portaria@asfus.com.br'
ON CONFLICT (id) DO UPDATE
SET 
  role = 'guarita',
  status = 'ativo',
  nome_completo = COALESCE(public.profiles.nome_completo, 'Portaria Principal');

-- 3. Confirm the result
SELECT * FROM public.profiles WHERE email = 'portaria@asfus.com.br';

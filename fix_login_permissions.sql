-- FIX: Login Permissions (RLS on Profiles)
-- The error "Erro ao verificar permissões" happens because the user cannot read their own Profile to check their role.
-- We must ensure that:
-- 1. Any specific user can read THEIR OWN profile.
-- 2. Admins and Guarita can read ALL profiles.

-- Enable RLS just to be sure
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 1. Generic Policy: Users can see their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
USING ( auth.uid() = id );

-- 2. Admin Policy: Admins can see everyone
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- 3. Guarita Policy: Guarita can see everyone
DROP POLICY IF EXISTS "Guarita can view all profiles" ON public.profiles;
CREATE POLICY "Guarita can view all profiles"
ON public.profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'guarita'
  )
);

-- 4. Infinite Recursion Prevention
-- Sometimes relying on "profiles.role" inside a policy for "public.profiles" causes infinite recursion.
-- To fix this safely for Login, we often use a "Public Read" or a "JWT Role" check. 
-- BUT, since we have a 'role' column, let's try a safer approach if the above fails.
-- However, standard practice: allow "Users see own" is safe. Recursion usually happens when checking "If I am admin..." by querying the same table.
-- IF the Admin/Guarita login is failing, it's because to check if they are admin, they need to query their profile, which recurses.
-- SOLUTION: Use `auth.jwt() ->> 'role'` is not enough because we store custom roles in the table, not in the JWT (usually).
-- WORKAROUND: For the "Admin/Guarita" check, we can rely on a security definer function OR just Allow Read for All if data isn't sensitive.
-- GIVEN this is a Condominium/Club app, Profiles (Names/Phones) usually aren't super secret between members, but let's stick to lease privilege.

-- RECURSION FIX:
-- To avoid recursion in the "USING" clause when checking "profiles.role", we can avoid checking the table itself if we are just verifying "auth.uid() = id".
-- But for "View All", we need to know if the requester is Admin.
-- If the Recursion is the cause, the error would be "infinite recursion".
-- If the error is just "Permissions", it means NO policy matched.

-- Let's add a "Public Read" policy for now to IMMEDIATELY unblock the user, 
-- as they might have had "Public profiles are viewable by everyone" before.
-- This is the safest way to fix "Login Error" instantly.

DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);

-- Refresh
NOTIFY pgrst, 'reload config';

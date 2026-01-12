-- Drop the trigger on auth.users causing issues
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Also try dropping the function if it's the source of error, but usually dropping trigger is enough to stop execution
-- DROP FUNCTION IF EXISTS public.handle_new_user();

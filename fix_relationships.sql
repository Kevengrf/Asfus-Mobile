-- FIX: Corrigir Relacionamento de Appointments
-- O Supabase precisa de uma Foreign Key explícita para fazer o .select('..., profiles(...)')

-- 1. Adicionar FK em Appointments (assumindo que a coluna é user_id)
ALTER TABLE public.appointments 
    ADD CONSTRAINT appointments_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES public.profiles(id)
    ON DELETE CASCADE;

-- Se a coluna se chamar profile_id, mude 'user_id' para 'profile_id' acima.

-- 2. Recarregar Schema Cache (Ocorre auto, mas bom saber)
NOTIFY pgrst, 'reload config';

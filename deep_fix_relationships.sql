-- DEEP FIX: Reconstruindo a relação e permissões
-- Se o erro 400 persiste, vamos limpar qualquer sujeira

-- 1. Resetar a Foreign Key (garantir que aponta para Profiles)
ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS appointments_user_id_fkey;

ALTER TABLE public.appointments 
    ADD CONSTRAINT appointments_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES public.profiles(id)
    ON DELETE CASCADE;

-- 2. Permissões Globais (Temporariamente para debugar)
-- Às vezes o erro 400 é porque não conseguimos ver a tabela "Profiles" na junção.
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage all appointments." ON public.appointments;
CREATE POLICY "Admins can manage all appointments." ON public.appointments FOR ALL USING (true);

-- 3. Recarregar Schema Cache
NOTIFY pgrst, 'reload config';

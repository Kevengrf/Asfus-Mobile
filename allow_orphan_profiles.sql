-- PERMITIR PERFIS SEM USUÁRIO (ORPHANS)
-- Execute este script no SQL Editor para remover a trava que exige um usuário para cada perfil.

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- (Opcional) Recriar a constraint sem "NOT VALID" se quiser verificar depois, mas para migração é melhor sem.
-- ALTER TABLE public.profiles ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) NOT VALID;

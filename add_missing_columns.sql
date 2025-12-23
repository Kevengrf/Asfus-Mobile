-- ADICIONAR COLUNAS FALTANTES NA TABELA PROFILES
-- Execute este script no SQL Editor do Supabase

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS codtipo text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS chapa text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS dt_nasc date;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS sexo text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS dependentes jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS nome_dependente text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS sexo_dependente text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS grauparentesco_dependente text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS data_nascimento_dependente date;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS password_changed_at timestamp with time zone;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS user_id uuid;

COMMENT ON COLUMN public.profiles.dependentes IS 'Lista de dependentes em formato JSON';

-- FIX: Adicionar colunas faltantes na tabela Appointments
-- O código do frontend espera 'type', 'house_number', 'start_date', 'end_date', mas o banco só tinha 'booking_date'.

ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS "type" text, -- 'casa', 'camp', etc
ADD COLUMN IF NOT EXISTS "house_number" text, -- Pode ser numero ou letra
ADD COLUMN IF NOT EXISTS "start_date" date,
ADD COLUMN IF NOT EXISTS "end_date" date;

-- Opcional: Copiar booking_date para start_date se estiver vazio, para não ficar null
UPDATE public.appointments SET start_date = booking_date WHERE start_date IS NULL;
UPDATE public.appointments SET end_date = booking_date WHERE end_date IS NULL;

-- Recarregar cache
NOTIFY pgrst, 'reload config';

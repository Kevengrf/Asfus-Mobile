-- FIX: Make booking_date nullable
-- The frontend now uses start_date and end_date, so booking_date is no longer mandatory.

ALTER TABLE public.appointments 
ALTER COLUMN booking_date DROP NOT NULL;

-- Recarregar cache do Schema
NOTIFY pgrst, 'reload config';

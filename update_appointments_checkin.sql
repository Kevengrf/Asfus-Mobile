-- Add checked_in_at column to appointments table if it doesn't exist
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMPTZ DEFAULT NULL;

-- Comment on column
COMMENT ON COLUMN public.appointments.checked_in_at IS 'Timestamp when the associate checked in at the gatehouse';

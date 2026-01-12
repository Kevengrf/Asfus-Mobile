-- Add is_lottery column
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS is_lottery BOOLEAN DEFAULT FALSE;

-- Update status check constraint if it exists (assuming it might be a check constraint)
-- First, try to drop the constraint if it exists (common naming convention)
ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS appointments_status_check;

-- Add new check constraint including 'em_sorteio'
ALTER TABLE public.appointments ADD CONSTRAINT appointments_status_check 
    CHECK (status IN ('pendente', 'aprovado', 'rejeitado', 'em_sorteio'));

-- If status is an ENUM type, we need to alter usage
-- This block handles if it is an enum named 'status_agendamento' or similar
-- However, standard practice often uses text with check constraints or just text.
-- The above CHECK constraint is the safest generic approach for text columns.

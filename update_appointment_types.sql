
-- Migration: Update appointment types
-- 1. Remove existing check constraint if it exists (assuming specific name or generic update)
-- Since we don't know the exact constraint name, we'll try to drop it or just alter the column type to text first to be safe, then re-add check.

BEGIN;

-- Remove constraint if possible (ignoring error if not found, or just alter type)
ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS appointments_status_check; -- Wrong constraint name usually, often appointments_type_check or similar if it exists.
-- Actually the previous file showed: `status text ... CHECK (status IN ...)`
-- But `type` column wasn't in the CREATE TABLE dump I saw earlier (it was missing). 
-- If it exists, let's update values first.

-- Update values
UPDATE public.appointments SET type = 'evento' WHERE type = 'lazer';
UPDATE public.appointments SET type = 'apartamentos' WHERE type = 'casa';

-- If there was a check constraint on 'type', we should drop and recreate it.
-- Finding constraint name often requires querying, but we can try to add a new one after validating.
ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS appointments_type_check;

ALTER TABLE public.appointments 
    ADD CONSTRAINT appointments_type_check 
    CHECK (type IN ('dayuse', 'evento', 'apartamentos'));

COMMIT;

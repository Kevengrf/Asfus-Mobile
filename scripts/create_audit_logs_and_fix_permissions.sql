-- Create audit_logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    action TEXT NOT NULL,
    admin_id UUID REFERENCES auth.users(id),
    target TEXT,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can do everything
CREATE POLICY "Admins can view and insert audit logs" ON public.audit_logs
    FOR ALL
    USING (
        auth.uid() IN (
            SELECT id FROM profiles WHERE role = 'admin'
        )
    );

-- Fix for Guarita Check-in (Update permission on appointments)
-- Ensure 'guarita' role (or users with guarita profile) can update appointments
-- Specifically for check-in, we need to allow updating 'checked_in_at'

-- Assuming RLS is enabled on appointments
-- Add policy for Guarita to update specific columns or rows
CREATE POLICY "Guarita can update check-in status" ON public.appointments
    FOR UPDATE
    USING (
        auth.uid() IN (
            SELECT id FROM profiles WHERE role IN ('admin', 'guarita')
        )
    )
    WITH CHECK (
        auth.uid() IN (
            SELECT id FROM profiles WHERE role IN ('admin', 'guarita')
        )
    );

-- Also ensure they can Select (probably already exists, but good to ensure)
CREATE POLICY "Guarita can view appointments" ON public.appointments
    FOR SELECT
    USING (
        auth.uid() IN (
            SELECT id FROM profiles WHERE role IN ('admin', 'guarita')
        )
    );

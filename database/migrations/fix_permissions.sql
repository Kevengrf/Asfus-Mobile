-- FIX: Ajustar Permissões (RLS) para Appointments e Perfis
-- Simplificando as policies para evitar erro 400 (Recursive Policy ou Falta de Permissão)

-- 1. APPOINTMENTS: Permitir que Admins vejam tudo (Simplificado)
DROP POLICY IF EXISTS "Admins can manage all appointments." ON public.appointments;
-- Vamos usar uma policy mais direta por enquanto para destravar
CREATE POLICY "Admins can manage all appointments." ON public.appointments 
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- (Backup: Se ainda der erro, podemos desabilitar o RLS temporariamente para testar)
-- ALTER TABLE public.appointments DISABLE ROW LEVEL SECURITY;

-- 2. REFRESH SCHEMA CACHE
NOTIFY pgrst, 'reload config';

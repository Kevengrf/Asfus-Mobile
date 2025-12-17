// lib/supabase/admin.ts
import { createClient } from '@supabase/supabase-js';

// Validação para garantir que o código não seja executado no lado do cliente
if (typeof window !== 'undefined') {
  throw new Error('O client admin do Supabase não deve ser importado ou usado no navegador!');
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('As variáveis de ambiente do Supabase (URL e Service Role Key) são obrigatórias no lado do servidor.');
}

// Cria e exporta o cliente Supabase com privilégios de administrador (service_role)
// Este cliente tem poder para ignorar as políticas de RLS. USE COM CUIDADO.
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    // Desabilita o auto-refresh e a persistência da sessão, pois este cliente é para operações pontuais no servidor.
    autoRefreshToken: false,
    persistSession: false,
  },
});
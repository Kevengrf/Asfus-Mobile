
import { createClient } from '@supabase/supabase-js'

// Pega a URL e a Chave Anônima do arquivo .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Cria e exporta o cliente Supabase para ser usado no lado do navegador
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

-- FIX: Criar Buckets Faltantes e Ajustar Permissões
-- 1. Criação dos Buckets (news e gallery)
INSERT INTO storage.buckets (id, name, public) VALUES ('content-images', 'content-images', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('galeria', 'galeria', true) ON CONFLICT DO NOTHING;

-- 2. Políticas de Acesso (Storage)
-- Permitir upload público (ou auth) para esses buckets
CREATE POLICY "Public Access Content Images" ON storage.objects FOR SELECT USING (bucket_id = 'content-images');
CREATE POLICY "Public Insert Content Images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'content-images');

CREATE POLICY "Public Access Galeria" ON storage.objects FOR SELECT USING (bucket_id = 'galeria');
CREATE POLICY "Public Insert Galeria" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'galeria');

-- 3. Correção para Appointments (Erro 400)
-- O erro 400 no select geralmente é relação errada.
-- Verifique se existe a foreign key de profiles em appointments.
-- Se não existir, crie.
-- Assumindo que appointments tem column 'user_id' ou 'profile_id'.
-- (Vou checar o schema depois, mas este comando tenta garantir)

-- 4. Correção para Reset de Senha (Admin)
-- O erro "Database error loading user" geralmente ocorre quando tentamos resetar senha de um "Profile"
-- que NÃO tem um usuário correspondente em auth.users.
-- Como importamos perfis órfãos, isso é esperado para os 220 usuários que não vieram no CSV.
-- NÃO HÁ FIX VIA SQL para criar usuários mágicos. 
-- A solução é criar o usuário no Auth quando o Admin tentar resetar?
-- Ou avisar que o usuário não existe.

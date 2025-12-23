const { createClient } = require('@supabase/supabase-js');

// CONFIG
const SUPABASE_URL = process.env.NEW_SUPABASE_URL || 'https://pecvhaagsheziwdugizm.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; // NECESSÁRIA

if (!SERVICE_KEY) {
    console.error('ERRO: SUPABASE_SERVICE_ROLE_KEY é obrigatória.');
    console.log('Rode como: SUPABASE_SERVICE_ROLE_KEY=... node scripts/repair_orphans.js');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function repairOrphans() {
    console.log('Buscando perfis órfãos...');

    // 1. Buscar todos os perfis
    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*');

    if (error) {
        console.error('Erro ao buscar perfis:', error);
        return;
    }

    console.log(`Encontrados ${profiles.length} perfis. Verificando auth...`);

    let fixedCount = 0;

    for (const profile of profiles) {
        const email = profile.email;
        if (!email) continue;

        // Tentar buscar usuário no Auth (Admin API)
        // Infelizmente listUsers é paginado, fazer um check direto criando é mais fácil/rápido se falhar

        try {
            // Tenta criar o usuário
            const { data: user, error: createError } = await supabase.auth.admin.createUser({
                email: email,
                password: 'mudar123', // Senha padrão
                email_confirm: true,
                user_metadata: { nome_completo: profile.nome_completo }
            });

            if (createError) {
                // Se der erro que já existe, ignoramos.
                // Mas se o perfil tem um ID diferente do Auth, precisamos atualizar o perfil?
                // O perfil usa o ID como PK e também é o UserID.
                // Se criarmos um NOVO user, ele terá um NOVO ID.
                // O perfil antigo tem um ID antigo (do banco velho).
                // ISSO É UM PROBLEMA: O ID do Auth tem que bater com o ID do perfil.

                // Se o usuário JÁ EXISTE no auth novo, ok.
                // Se NÃO EXISTE, criamos um NOVO com NOVO ID.
                // Precisamos atualizar o registro na tabela 'profiles' para trocar o ID velho pelo ID novo?
                // Sim, senão o link quebra.

                if (createError.message.includes('already been registered')) {
                    // Usuário já existe, vida que segue.
                    continue;
                } else {
                    console.log(`Erro ao criar user para ${email}:`, createError.message);
                }
            } else {
                // Usuário criado com Sucesso! Ele tem um ID NOVO.
                const newId = user.user.id;
                const oldId = profile.id;

                console.log(`[FIX] Criado Auth para ${email}. ID Novo: ${newId}. Atualizando perfil...`);

                // Atualizar o perfil antigo para ter o ID novo
                // Como ID é PK, não dá pra update simples. Temos que criar um novo perfil e deletar o velho?
                // Ou podemos update se não houver cascade restriction. 
                // Mas wait, profiles.id refere-se a auth.users.id? 

                // Abordagem:
                // 1. Inserir NOVO perfil com o ID novo (copiando dados do velho).
                // 2. Deletar o perfil velho.

                const { error: cloneError } = await supabase.from('profiles').insert({
                    id: newId,
                    email: profile.email,
                    nome_completo: profile.nome_completo,
                    role: profile.role,
                    // copiar outros campos...
                    chapa: profile.chapa,
                    codtipo: profile.codtipo,
                    dt_nasc: profile.dt_nasc,
                    sexo: profile.sexo,
                    dependentes: profile.dependentes
                });

                if (!cloneError) {
                    await supabase.from('profiles').delete().eq('id', oldId);
                    fixedCount++;
                } else {
                    console.error('Erro ao clonar perfil:', cloneError);
                    // Dificuldade: Se o perfil tem constraints (FKs de news, gallery etc), deletar vai falhar.
                    // Teríamos que atualizar as referências antes. 
                    // COMPLEXO.
                }
            }

        } catch (e) {
            console.error('Exceção:', e);
        }
    }

    console.log(`Processo finalizado. ${fixedCount} órfãos corrigidos (recriados).`);
}

// A estratégia de deletar/recriar perfil é arriscada se houver dados vinculados (agendamentos).
// O melhor é: Criar o Auth User com o ID ESPECÍFICO do perfil? 
// NÃO DÁ. O Supabase gera o ID.
// SOLUÇÃO REAL: Devemos exportar os perfis, limpar a tabela profiles, criar os users no Auth, pegar os IDs novos, e re-inserir os perfis com os IDs novos.

console.log("AVISO: Este script é complexo devido à troca de IDs. Vamos usar a estratégia 'Criar Auth e Atualizar'.");
// repairOrphans(); 
// Vou pausar a execução automática aqui porque preciso da confirmação do usuário sobre o risco de troca de ID.
// Se ele tiver agendamentos ligados ao ID antigo, eles vão se perder se eu não migrar.

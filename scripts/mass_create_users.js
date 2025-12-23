const { createClient } = require('@supabase/supabase-js');

// CONFIG
const SUPABASE_URL = process.env.NEW_SUPABASE_URL || 'https://pecvhaagsheziwdugizm.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_KEY) {
    console.error('ERRO: SUPABASE_SERVICE_ROLE_KEY é obrigatória.');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

function formatCpf(cpf) {
    if (!cpf) return null;
    return cpf.replace(/\D/g, '');
}

function generatePassword(cpfClean) {
    if (!cpfClean || cpfClean.length < 6) return 'asfus@123456';
    return `asfus@${cpfClean.substring(0, 6)}`;
}

async function getAllUsers() {
    let allUsers = [];
    let page = 1;
    const perPage = 50; // Supabase page limit

    while (true) {
        const { data: { users }, error } = await supabase.auth.admin.listUsers({ page, perPage });
        if (error || !users || users.length === 0) break;
        allUsers = allUsers.concat(users);
        page++;
        if (users.length < perPage) break;
    }
    return allUsers;
}

// Map cache
let usersMap = new Map();

async function refreshUserCache() {
    const users = await getAllUsers();
    usersMap = new Map(users.map(u => [u.email, u.id]));
    console.log(`[CACHE] ${usersMap.size} usuários carregados.`);
}

async function massCreate() {
    console.log('--- Iniciando Criação e Migração (Lógica Robusta) ---');

    // 1. Buscar perfis que AINDA têm IDs antigos (não-UUID ou apenas checar todos)
    // UUIDs são strings. Vamos processar todos.
    const { data: profiles, error } = await supabase.from('profiles').select('*');
    if (error) {
        console.error('Erro ao buscar perfis:', error);
        return;
    }

    console.log(`Processando ${profiles.length} perfis...`);
    let fixedCount = 0;

    for (const profile of profiles) {
        const cpfRaw = profile.cpf || profile.chapa;
        const cpfClean = formatCpf(cpfRaw);

        if (!cpfClean && !profile.email) {
            console.log(`[SKIP] Perfil ${profile.nome_completo} sem CPF e sem Email.`);
            continue;
        }

        // PREFERÊNCIA: Email já existente > Gerado pelo CPF
        let emailLogin = profile.email;
        if (!emailLogin) {
            emailLogin = `${cpfClean}@asfus.com.br`;
        }

        // Normalizar email para busca no cache
        emailLogin = emailLogin.toLowerCase().trim();

        const password = generatePassword(cpfClean);
        const oldProfileId = profile.id;

        try {
            let newAuthId = null;

            // 1. Criar ou Recuperar Usuário Auth
            const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
                email: emailLogin,
                password: password,
                email_confirm: true,
                user_metadata: { nome_completo: profile.nome_completo, cpf: cpfClean }
            });

            if (createError) {
                if (createError.message.includes('already been registered')) {
                    // Já existe, buscar ID no cache
                    newAuthId = usersMap.get(emailLogin);
                    if (!newAuthId) {
                        // Talvez criado agora? Tentar refresh parcial?
                        // Não, se já existia deveria estar no cache.
                        console.log(`  [ERRO] User ${emailLogin} existe mas não achei no cache.`);
                        continue;
                    }
                    console.log(`  [INFO] User ${emailLogin} já existia (ID: ${newAuthId}). Tentando migrar...`);
                } else {
                    console.log(`  [ERRO Auth] ${createError.message}`);
                    continue;
                }
            } else {
                newAuthId = newUser.user.id;
                console.log(`> Criado Auth para ${profile.nome_completo} (ID: ${newAuthId})`);
            }

            // Se o ID do perfil JÁ É o newAuthId, então já foi migrado.
            if (oldProfileId === newAuthId) {
                console.log(`  [SKIP] Perfil já migrado.`);
                continue;
            }

            // === A CIRURGIA ===
            // 2. Inserir clone com CPF Temporário
            const tempCpf = `TEMP_${cpfClean}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

            // Removemos 'id' do spread para garantir que usamos o newAuthId
            const { id, ...profileData } = profile;

            const { error: cloneError } = await supabase.from('profiles').insert({
                ...profileData,
                id: newAuthId,
                email: emailLogin,
                cpf: tempCpf
            });

            if (cloneError) {
                // Se der erro de PK, talvez já tenhamos inserido o profile mas falhou depois?
                if (cloneError.message.includes('duplicate key value') && cloneError.message.includes('pkey')) {
                    console.log('  [INFO] Perfil clone já existia. Continuando migração...');
                } else {
                    console.error(`  [ERRO Clone] ${cloneError.message}`);
                    continue; // Aborta para este user
                }
            }

            // 3. Mover Dependências
            // Appointments
            const { error: appError } = await supabase.from('appointments')
                .update({ user_id: newAuthId })
                .eq('user_id', oldProfileId);

            if (appError) console.error('  [ERRO Appts]', appError.message);

            // 4. Deletar Perfil Antigo
            const { error: delError } = await supabase.from('profiles').delete().eq('id', oldProfileId);

            if (delError) {
                console.error(`  [ERRO Delete Old] ${delError.message}`);
                // Se não deletar, não podemos renomear o CPF do novo. Travou.
                continue;
            }

            // 5. Restaurar CPF
            const { error: restoreError } = await supabase.from('profiles')
                .update({ cpf: cpfRaw }) // Volta o CPF original
                .eq('id', newAuthId);

            if (restoreError) {
                console.error(`  [ERRO Restore CPF] ${restoreError.message} (CPF ficou como temp: ${tempCpf})`);
            } else {
                console.log(`  [SUCESSO] Migração Completa para ${profile.nome_completo}`);
                fixedCount++;
            }

        } catch (e) {
            console.error(`  [EXCEPTION]`, e);
        }
    }
    console.log(`\nFinalizado. ${fixedCount} perfis migrados.`);
}

massCreate();

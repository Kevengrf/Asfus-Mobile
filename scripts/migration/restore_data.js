
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// ATENÇÃO: Configure estas variáveis com os dados do NOVO PROJETO
// Você pode passar via linha de comando ou editar aqui.
const NEW_SUPABASE_URL = process.env.NEW_SUPABASE_URL || 'EDIT_ME_OR_SET_ENV_VAR';
const NEW_SUPABASE_KEY = process.env.NEW_SUPABASE_KEY || 'EDIT_ME_OR_SET_ENV_VAR'; // Service Role Key é preferida para ignorar RLS

if (NEW_SUPABASE_URL.includes('EDIT_ME') || NEW_SUPABASE_KEY.includes('EDIT_ME')) {
    console.error('ERRO: Configure NEW_SUPABASE_URL e NEW_SUPABASE_KEY no script ou variáveis de ambiente.');
    console.log('Uso: NEW_SUPABASE_URL=... NEW_SUPABASE_KEY=... node scripts/migration/restore_data.js');
    process.exit(1);
}

const supabase = createClient(NEW_SUPABASE_URL, NEW_SUPABASE_KEY);

const BACKUP_DIR = path.resolve(__dirname, '../../backup_data');

// Ordem de restauração importa por causa das chaves estrangeiras
// profiles deve vir primeiro porque appointments depende dele.
const RESTORE_ORDER = [
    'profiles',
    'news',
    'gallery',
    'partners',
    'board_members',
    'events',
    'appointments'
];

async function restoreTable(tableName) {
    const filePath = path.join(BACKUP_DIR, `${tableName}.json`);

    if (!fs.existsSync(filePath)) {
        console.log(`Arquivo de backup para ${tableName} não encontrado. Pulando.`);
        return;
    }

    console.log(`Restaurando tabela ${tableName}...`);
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(fileContent);

    if (data.length === 0) {
        console.log(`Sem dados para inserir em ${tableName}.`);
        return;
    }

    // Supabase permite insert em batch
    const { error } = await supabase
        .from(tableName)
        .upsert(data, { onConflict: 'id' }); // Usar upsert para evitar erros de duplicidade se rodar mais de uma vez

    if (error) {
        console.error(`Erro ao inserir em ${tableName}:`, error.message);
    } else {
        console.log(`Sucesso! ${data.length} registros inseridos/atualizados em ${tableName}.`);
    }
}

async function runRestore() {
    console.log(`Lendo backups de: ${BACKUP_DIR}`);
    console.log(`Destino: ${NEW_SUPABASE_URL}`);

    for (const table of RESTORE_ORDER) {
        await restoreTable(table);
    }

    console.log('Restauração concluída.');
}

runRestore();

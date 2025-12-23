
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Carrega variáveis de ambiente do arquivo .env.local se não estiverem definidas
// Nota: Em um script simples, podemos ler o arquivo manualmente ou contar que o usuário defina as vars.
// Vamos assumir que o usuário vai editar este arquivo com as chaves ou vamos ler do .env.local de forma simples.

// Função simples para ler .env.local
function loadEnv() {
    try {
        const envPath = path.resolve(__dirname, '../../.env.local');
        const envFile = fs.readFileSync(envPath, 'utf8');
        const envVars = {};
        envFile.split('\n').forEach(line => {
            const parts = line.split('=');
            if (parts.length >= 2) {
                const key = parts[0].trim();
                const value = parts.slice(1).join('=').trim();
                if (key && !key.startsWith('#')) {
                    process.env[key] = value;
                }
            }
        });
        console.log('Variáveis de ambiente carregadas de .env.local');
    } catch (e) {
        console.log('Não foi possível ler .env.local, assumindo que as variáveis já estão definidas ou edite o script.');
    }
}

loadEnv();

// CONFIGURAÇÃO - EDITAR AQUI SE NECESSÁRIO
const OLD_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const OLD_SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!OLD_SUPABASE_URL || !OLD_SUPABASE_KEY) {
    console.error('ERRO: As variáveis NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY (ou ANON) são necessárias.');
    process.exit(1);
}

const supabase = createClient(OLD_SUPABASE_URL, OLD_SUPABASE_KEY);

const TABLES_TO_BACKUP = [
    'profiles',
    'news',
    'gallery',
    'partners',
    'board_members',
    'events',
    'appointments'
];

const BACKUP_DIR = path.resolve(__dirname, '../../backup_data');

if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR);
}

async function backupTable(tableName) {
    console.log(`Baixando dados da tabela: ${tableName}...`);

    const { data, error } = await supabase
        .from(tableName)
        .select('*');

    if (error) {
        console.error(`Erro ao baixar ${tableName}:`, error.message);
        return;
    }

    if (!data || data.length === 0) {
        console.log(`Tabela ${tableName} está vazia.`);
        return;
    }

    const filePath = path.join(BACKUP_DIR, `${tableName}.json`);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`Salvo ${data.length} registros em ${path.basename(filePath)}`);
}

async function runBackup() {
    console.log('Iniciando backup...');
    for (const table of TABLES_TO_BACKUP) {
        await backupTable(table);
    }
    console.log('Backup concluído! Verifique a pasta "backup_data".');
}

runBackup();

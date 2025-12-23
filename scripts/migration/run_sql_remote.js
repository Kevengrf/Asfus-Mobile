const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Connection string passed via env var or hardcoded for this run
const CONNECTION_STRING = process.env.DB_CONNECTION_STRING;

if (!CONNECTION_STRING) {
    console.error('ERRO: DB_CONNECTION_STRING é obrigatória.');
    process.exit(1);
}

async function runSqlFile(filePath) {
    console.log(`Lendo arquivo SQL: ${path.basename(filePath)}...`);
    const sql = fs.readFileSync(filePath, 'utf8');

    const client = new Client({
        connectionString: CONNECTION_STRING,
        ssl: { rejectUnauthorized: false } // Required for Supabase connection
    });

    try {
        await client.connect();
        console.log('Conectado ao banco de dados Postgres.');

        console.log('Executando SQL...');
        await client.query(sql);
        console.log('SQL executado com sucesso!');

    } catch (err) {
        console.error('Erro ao executar SQL:', err);
    } finally {
        await client.end();
    }
}

async function main() {
    const fullSchemaPath = path.resolve(__dirname, '../../full_schema.sql');
    const authUsersPath = path.resolve(__dirname, '../../import_auth_users.sql');

    console.log('--- 1. Migrando Schema (Estrutura) ---');
    if (fs.existsSync(fullSchemaPath)) {
        await runSqlFile(fullSchemaPath);
    } else {
        console.error('full_schema.sql não encontrado.');
    }

    console.log('\n--- 2. Migrando Usuários (Auth) ---');
    if (fs.existsSync(authUsersPath)) {
        await runSqlFile(authUsersPath);
    } else {
        console.error('import_auth_users.sql não encontrado.');
    }
}

main();

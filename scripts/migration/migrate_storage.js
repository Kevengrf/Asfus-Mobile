
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const https = require('https');

// Carrega variáveis de ambiente
function loadEnv() {
    try {
        const envPath = path.resolve(__dirname, '../../.env.local');
        const envFile = fs.readFileSync(envPath, 'utf8');
        envFile.split('\n').forEach(line => {
            const parts = line.split('=');
            if (parts.length >= 2) {
                const key = parts[0].trim();
                const value = parts.slice(1).join('=').trim();
                if (key && !key.startsWith('#') && !process.env[key]) {
                    process.env[key] = value;
                }
            }
        });
    } catch (e) {
        console.log('Não foi possível ler .env.local.');
    }
}
loadEnv();

// CONFIGURAÇÃO
const OLD_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const OLD_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const NEW_URL = process.env.NEW_SUPABASE_URL;
const NEW_KEY = process.env.NEW_SUPABASE_KEY;

// Buckets para migrar (Adicione seus buckets aqui)
const BUCKETS = ['avatars', 'images', 'documents']; // Exemplo, ajuste conforme seu projeto

const DOWNLOAD_DIR = path.resolve(__dirname, '../../backup_storage');

if (!OLD_URL || !OLD_KEY) {
    console.error('ERRO: Defina variáveis do projeto antigo no .env.local ou environment.');
    process.exit(1);
}

const oldSupabase = createClient(OLD_URL, OLD_KEY);
const newSupabase = NEW_URL && NEW_KEY ? createClient(NEW_URL, NEW_KEY) : null;

if (!fs.existsSync(DOWNLOAD_DIR)) fs.mkdirSync(DOWNLOAD_DIR);

async function downloadFile(url, destPath) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(destPath);
        https.get(url, (response) => {
            response.pipe(file);
            file.on('finish', () => {
                file.close(resolve);
            });
        }).on('error', (err) => {
            fs.unlink(destPath, () => { }); // Delete falha
            reject(err);
        });
    });
}

async function migrateBucket(bucketName) {
    console.log(`\nProcessando bucket: ${bucketName}...`);

    // Lista arquivos do bucket antigo
    const { data: files, error } = await oldSupabase
        .storage
        .from(bucketName)
        .list('', { limit: 100, offset: 0 }); // Ajustar para paginação se tiver muitos arquivos

    if (error) {
        console.error(`Erro ao listar bucket ${bucketName} (pode não existir):`, error.message);
        return;
    }

    if (!files || files.length === 0) {
        console.log(`Bucket ${bucketName} vazio.`);
        return;
    }

    const bucketDir = path.join(DOWNLOAD_DIR, bucketName);
    if (!fs.existsSync(bucketDir)) fs.mkdirSync(bucketDir);

    for (const file of files) {
        if (file.name === '.emptyFolderPlaceholder') continue; // Ignora placeholder

        console.log(`  - Arquivo: ${file.name}`);

        // 1. Download
        const { data: { publicUrl } } = oldSupabase.storage.from(bucketName).getPublicUrl(file.name);
        const localPath = path.join(bucketDir, file.name);

        try {
            await downloadFile(publicUrl, localPath);
            // console.log(`    Baixado para ${localPath}`);
        } catch (e) {
            console.error(`    Erro ao baixar ${file.name}:`, e.message);
            continue;
        }

        // 2. Upload para o novo (se configurado)
        if (newSupabase) {
            // Ler arquivo
            const fileBuffer = fs.readFileSync(localPath);
            const { error: uploadError } = await newSupabase
                .storage
                .from(bucketName)
                .upload(file.name, fileBuffer, {
                    upsert: true,
                    contentType: file.metadata?.mimetype
                });

            if (uploadError) {
                console.error(`    Erro ao subir ${file.name}:`, uploadError.message);
            } else {
                console.log(`    Ok -> Enviado para novo Supabase`);
            }
        }
    }
}

async function runStorageMigration() {
    console.log('Iniciando migração de storage...');
    if (!newSupabase) {
        console.log('AVISO: Novo Supabase não configurado. Script fará apenas DOWNLOAD.');
        console.log('Para upload, configure NEW_SUPABASE_URL e NEW_SUPABASE_KEY.');
    }

    for (const bucket of BUCKETS) {
        await migrateBucket(bucket);
    }
    console.log('\nMigração de storage concluída.');
}

runStorageMigration();

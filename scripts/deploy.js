const { NodeSSH } = require('node-ssh');
const path = require('path');
const { execSync } = require('child_process');

const ssh = new NodeSSH();

// CONFIG
const config = {
    host: process.env.VPS_IP || '72.61.43.72',
    username: process.env.VPS_USER || 'root',
    password: process.env.VPS_PASS
};

const TARGET_DIR = '/var/www/asfus-mobile';

async function deploy() {
    if (!config.password) {
        console.error('ERRO: Senha não configurada.');
        process.exit(1);
    }

    console.log('--- 1. Build Local ---');
    try {
        execSync('npm run build', { stdio: 'inherit' });
    } catch (e) {
        console.error('Erro no build local.');
        process.exit(1);
    }

    console.log(`\n--- 2. Conectando ao VPS (${config.host}) ---`);
    try {
        await ssh.connect(config);

        console.log('\n--- 3. Enviando Arquivos ---');

        // Clean target directory to prevent corruption
        await ssh.execCommand(`rm -rf ${TARGET_DIR}/*`);

        // Upload Standalone (Core)
        await ssh.putDirectory(
            path.resolve(__dirname, '../.next/standalone'),
            TARGET_DIR,
            { recursive: true, concurrency: 10 }
        );

        // Upload Static (Assets)
        await ssh.putDirectory(
            path.resolve(__dirname, '../.next/static'),
            `${TARGET_DIR}/.next/static`,
            { recursive: true, concurrency: 10 }
        );

        // Upload Public (Images/Fonts)
        await ssh.putDirectory(
            path.resolve(__dirname, '../public'),
            `${TARGET_DIR}/public`,
            { recursive: true, concurrency: 10 }
        );

        // Upload .env.local
        console.log('--- Uploading .env.local ---');
        await ssh.putFile(
            path.resolve(__dirname, '../.env.local'),
            `${TARGET_DIR}/.env.local`
        );

        console.log('\n--- 4. Reiniciando Servidor ---');
        await ssh.execCommand(`cd ${TARGET_DIR} && pm2 reload asfus-mobile || pm2 start server.js --name asfus-mobile`);
        await ssh.execCommand('pm2 save');

        console.log('\n✅ DEPLOY FINALIZADO COM SUCESSO!');
        console.log(`Acesse: https://asfus.com.br`);

    } catch (e) {
        console.error('Erro:', e);
    } finally {
        ssh.dispose();
    }
}

deploy();

const { NodeSSH } = require('node-ssh');
const path = require('path');
const { execSync } = require('child_process');

const ssh = new NodeSSH();

// CONFIG
const config = {
    host: process.env.VPS_IP || '72.61.43.72',
    username: process.env.VPS_USER || 'root',
    password: process.env.VPS_PASS || "V'GJS/kMRzqySHMPAJ2s"
};

const TARGET_DIR = '/var/www/asfus-mobile';

async function deployNuclear() {
    console.log('☢️ INICIANDO DEPLOY NUCLEAR ☢️');
    console.log('Este processo irá deletar a instância PM2 antiga e recriar do zero.');

    console.log('\n--- 1. Build Local ---');
    try {
        execSync('npm run build', { stdio: 'inherit' });
    } catch (e) {
        console.error('Erro no build local.');
        process.exit(1);
    }

    console.log('\n--- 2. Empacotando (Tar) ---');
    try {
        const bundleDir = path.resolve(__dirname, '../.deploy_bundle');
        execSync(`rm -rf ${bundleDir}`);
        execSync(`mkdir -p ${bundleDir}`);

        // Copy standalone
        execSync(`cp -R ${path.resolve(__dirname, '../.next/standalone/')}/. ${bundleDir}/`); // Copy contents

        // Copy static
        execSync(`mkdir -p ${bundleDir}/.next/static`);
        execSync(`cp -R ${path.resolve(__dirname, '../.next/static/')}/. ${bundleDir}/.next/static/`);

        // Copy public
        execSync(`cp -R ${path.resolve(__dirname, '../public')} ${bundleDir}/`);

        // Copy .env.local
        execSync(`cp ${path.resolve(__dirname, '../.env.local')} ${bundleDir}/`);

        // Create Tarball
        execSync(`tar -czf deploy.tar.gz -C ${bundleDir} .`);
        console.log('Archive created: deploy.tar.gz');

    } catch (e) {
        console.error('Erro ao empacotar:', e);
        process.exit(1);
    }

    console.log(`\n--- 3. Conectando ao VPS (${config.host}) ---`);
    try {
        await ssh.connect(config);

        console.log('\n--- 4. Enviando Arquivos ---');
        await ssh.putFile('deploy.tar.gz', '/tmp/deploy.tar.gz');
        console.log('Upload concluído.');

        // Clean and Extract
        await ssh.execCommand(`rm -rf ${TARGET_DIR}`);
        await ssh.execCommand(`mkdir -p ${TARGET_DIR}`);
        await ssh.execCommand(`tar -xzf /tmp/deploy.tar.gz -C ${TARGET_DIR}`);
        console.log('Extração concluída.');

        // Cleanup remote tmp
        await ssh.execCommand('rm /tmp/deploy.tar.gz');

        console.log('\n--- 5. NUCLEAR RESTART (Delete & Start) ---');

        // Stop and Delete existing process
        console.log('Deletando processo antigo...');
        await ssh.execCommand('pm2 delete asfus-mobile');

        // Start new process explicitly
        console.log('Iniciando novo processo...');
        const startCmd = `cd ${TARGET_DIR} && pm2 start server.js --name asfus-mobile --update-env`;
        const result = await ssh.execCommand(startCmd);

        console.log('STDOUT:', result.stdout);
        console.log('STDERR:', result.stderr);

        await ssh.execCommand('pm2 save');

        console.log('\n✅ DEPLOY NUCLEAR FINALIZADO COM SUCESSO!');
        console.log(`Acesse: https://asfus.com.br`);

    } catch (e) {
        console.error('Erro:', e);
    } finally {
        ssh.dispose();
        execSync('rm deploy.tar.gz');
        execSync(`rm -rf ${path.resolve(__dirname, '../.deploy_bundle')}`);
    }
}

deployNuclear();

const { NodeSSH } = require('node-ssh');
const path = require('path');
const { execSync } = require('child_process');

const ssh = new NodeSSH();

// CONFIG
const config = {
    host: process.env.VPS_IP || '72.61.43.72',
    username: process.env.VPS_USER || 'root',
    password: process.env.VPS_PASS || 'Asfus@suape123'
};

const TARGET_DIR = '/var/www/asfus-mobile';

async function deploy() {
    console.log('--- 1. Build Local ---');
    try {
        execSync('npm run build', { stdio: 'inherit' });
    } catch (e) {
        console.error('Erro no build local.');
        process.exit(1);
    }

    console.log('\n--- 2. Empacotando (Tar) ---');
    try {
        // Create a temp dir for the bundle
        const bundleDir = path.resolve(__dirname, '../.deploy_bundle');
        execSync(`rm -rf ${bundleDir}`);
        execSync(`mkdir -p ${bundleDir}`);

        // Copy standalone
        execSync(`cp -R ${path.resolve(__dirname, '../.next/standalone/')} ${bundleDir}/`); // Copy the folder itself then move contents or just copy contents with dot
        // Better:
        execSync(`cp -R ${path.resolve(__dirname, '../.next/standalone/')}/. ${bundleDir}/`);

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

        console.log('\n--- 4. Enviando e Extraindo ---');

        // Upload Tar
        await ssh.putFile('deploy.tar.gz', '/tmp/deploy.tar.gz');
        console.log('Upload concluído.');

        // Clean and Extract
        await ssh.execCommand(`rm -rf ${TARGET_DIR}`);
        await ssh.execCommand(`mkdir -p ${TARGET_DIR}`);
        await ssh.execCommand(`tar -xzf /tmp/deploy.tar.gz -C ${TARGET_DIR}`);
        console.log('Extração concluída.');

        // Cleanup remote tmp
        await ssh.execCommand('rm /tmp/deploy.tar.gz');

        console.log('\n--- 5. Reiniciando Servidor ---');
        await ssh.execCommand(`cd ${TARGET_DIR} && pm2 reload asfus-mobile || pm2 start server.js --name asfus-mobile`);
        await ssh.execCommand('pm2 save');

        console.log('\n✅ DEPLOY FINALIZADO COM SUCESSO! (via Tarball)');
        console.log(`Acesse: https://asfus.com.br`);

    } catch (e) {
        console.error('Erro:', e);
    } finally {
        ssh.dispose();
        // Cleanup local
        execSync('rm deploy.tar.gz');
        execSync(`rm -rf ${path.resolve(__dirname, '../.deploy_bundle')}`);
    }
}

deploy();

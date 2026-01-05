const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

// CONFIG
const config = {
    host: process.env.VPS_IP || '72.61.43.72',
    username: process.env.VPS_USER || 'root',
    password: process.env.VPS_PASS || 'Asfus@suape123'
};

const REMOTE_DIR = '/var/www/asfus-mobile';
const REPO_URL = 'https://github.com/Kevengrf/Asfus-Mobile.git';

async function deployGit() {
    console.log(`\n--- Conectando ao VPS (${config.host}) ---`);
    console.log(`--- Diretorio Alvo: ${REMOTE_DIR} ---`);

    try {
        await ssh.connect(config);
        console.log('✅ Conectado!');

        // 1. Git Setup/Pull
        console.log('\n--- 1. Setting up Git / Pulling ---');

        // Check if is git repo
        const checkGit = await ssh.execCommand(`cd ${REMOTE_DIR} && git status`);

        if (checkGit.stderr && checkGit.stderr.includes('not a git repository')) {
            console.log('⚠ Não é um repositório Git. Iniciando...');
            // Initialize and Force Pull
            // Save .env.local/production.local if exists? Or assume it's ignored.
            // .env.local is usually ignored.
            await ssh.execCommand(`cd ${REMOTE_DIR} && git init`);
            await ssh.execCommand(`cd ${REMOTE_DIR} && git remote add origin ${REPO_URL}`);
            await ssh.execCommand(`cd ${REMOTE_DIR} && git fetch --all`);
            // Force reset to match main
            const reset = await ssh.execCommand(`cd ${REMOTE_DIR} && git reset --hard origin/main`);
            console.log('Reset Output:', reset.stdout || reset.stderr);
        } else {
            // Just pull
            console.log('Repositório detectado. Sincronizando...');
            // Ensure safe directory
            await ssh.execCommand(`git config --global --add safe.directory ${REMOTE_DIR}`);

            // Robust Flow:
            // Debug
            const remote = await ssh.execCommand(`cd ${REMOTE_DIR} && git remote -v`);
            console.log('Remote:', remote.stdout);

            // 1. Fetch
            console.log('Fetching...');
            const fetch = await ssh.execCommand(`cd ${REMOTE_DIR} && git fetch origin`);
            console.log('Fetch Output:', fetch.stdout || fetch.stderr);

            // 2. Checkout or Reset
            // Prepare main branch
            const checkout = await ssh.execCommand(`cd ${REMOTE_DIR} && (git checkout main || git checkout -b main origin/main)`);
            console.log('Checkout:', checkout.stdout || checkout.stderr);

            // 3. Pull/Reset
            const pull = await ssh.execCommand(`cd ${REMOTE_DIR} && git reset --hard origin/main`);
            console.log('Reset/Pull:', pull.stdout || pull.stderr);
        }

        // 2. Install Dependencies
        console.log('\n--- 2. Installing Dependencies ---');
        const npmInstall = await ssh.execCommand(`cd ${REMOTE_DIR} && npm install --legacy-peer-deps`);
        console.log(npmInstall.stdout || npmInstall.stderr);

        // 3. Build
        console.log('\n--- 3. Building ---');
        const npmBuild = await ssh.execCommand(`cd ${REMOTE_DIR} && npm run build`);
        console.log(npmBuild.stdout || npmBuild.stderr);

        // 4. Restart PM2
        console.log('\n--- 4. Restarting PM2 ---');
        const pm2Restart = await ssh.execCommand(`cd ${REMOTE_DIR} && pm2 reload asfus-mobile || pm2 start npm --name "asfus-mobile" -- start`);
        // Changed to 'npm start' or 'next start' since server.js might not exist in standalone sometimes if not configured?
        // But usually 'npm start' works for production if build is done.
        // Wait, standard is `npm start`.
        console.log(pm2Restart.stdout || pm2Restart.stderr);

        console.log('\n✅ DEPLOY FINALIZADO!');

    } catch (e) {
        console.error('❌ Erro:', e);
    } finally {
        ssh.dispose();
    }
}

deployGit();

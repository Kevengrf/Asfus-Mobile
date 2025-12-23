const { NodeSSH } = require('node-ssh');

const ssh = new NodeSSH();

// CONFIG
const config = {
    host: process.env.VPS_IP || '72.61.43.72',
    username: process.env.VPS_USER || 'root',
    password: process.env.VPS_PASS
};

async function diagnose() {
    if (!config.password) {
        console.error('ERRO: Senha não configurada (defina VPS_PASS).');
        process.exit(1);
    }

    console.log(`\n--- Conectando ao VPS (${config.host}) ---`);
    try {
        await ssh.connect(config);

        console.log('\n--- 1. Checking Nginx Status ---');
        const nginxStatus = await ssh.execCommand('systemctl status nginx --no-pager');
        console.log(nginxStatus.stdout || nginxStatus.stderr);

        console.log('\n--- 2. Checking Nginx Configuration ---');
        const nginxConfig = await ssh.execCommand('nginx -t');
        console.log(nginxConfig.stdout || nginxConfig.stderr);

        console.log('\n--- 3. Checking Certbot Certificates ---');
        const certbotStatus = await ssh.execCommand('certbot certificates');
        console.log(certbotStatus.stdout || certbotStatus.stderr);

        console.log('\n--- 4. Checking PM2 Proceses ---');
        const pm2Status = await ssh.execCommand('pm2 list');
        console.log(pm2Status.stdout || pm2Status.stderr);

        console.log('\n--- 5. Checking Local Curl (HTTP) ---');
        const curlHttp = await ssh.execCommand('curl -I http://localhost:3000');
        console.log(curlHttp.stdout || curlHttp.stderr);

    } catch (e) {
        console.error('Erro:', e);
    } finally {
        ssh.dispose();
    }
}

diagnose();

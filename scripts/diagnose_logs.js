const { NodeSSH } = require('node-ssh');

const ssh = new NodeSSH();

// CONFIG
const config = {
    host: process.env.VPS_IP || '72.61.43.72',
    username: process.env.VPS_USER || 'root',
    password: process.env.VPS_PASS
};

async function checkLogs() {
    if (!config.password) {
        console.error('ERRO: Senha não configurada (defina VPS_PASS).');
        process.exit(1);
    }

    console.log(`\n--- Conectando ao VPS (${config.host}) ---`);
    try {
        await ssh.connect(config);

        console.log('\n--- PM2 Logs (Last 50 lines) ---');
        // Retrieve logs for the app
        const logs = await ssh.execCommand('pm2 logs asfus-mobile --lines 50 --nostream');
        console.log(logs.stdout || logs.stderr);

        console.log('\n--- Check if port 3000 is listening ---');
        const netstat = await ssh.execCommand('netstat -tulpn | grep 3000');
        console.log(netstat.stdout || netstat.stderr);

        // Try curl again in case it was just slow to start
        console.log('\n--- Retry Curl ---');
        const curl = await ssh.execCommand('curl -I http://localhost:3000');
        console.log(curl.stdout || curl.stderr);

    } catch (e) {
        console.error('Erro:', e);
    } finally {
        ssh.dispose();
    }
}

checkLogs();

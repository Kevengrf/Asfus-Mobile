const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

// CONFIG
const config = {
    host: process.env.VPS_IP || '72.61.43.72',
    username: process.env.VPS_USER || 'root',
    password: process.env.VPS_PASS
};

async function checkEnv() {
    if (!config.password) {
        console.error('VPS_PASS required');
        process.exit(1);
    }
    try {
        await ssh.connect(config);
        console.log('Connected to VPS.');

        console.log('--- Checking for .env files ---');
        const result = await ssh.execCommand('ls -la /var/www/asfus-mobile');
        console.log(result.stdout);
        console.log('-------------------------------');

        // Also check if public folder has content
        console.log('--- Checking public folder ---');
        const publicCheck = await ssh.execCommand('ls -la /var/www/asfus-mobile/public');
        console.log(publicCheck.stdout);

    } catch (e) {
        console.error('Error:', e);
    } finally {
        ssh.dispose();
    }
}

checkEnv();

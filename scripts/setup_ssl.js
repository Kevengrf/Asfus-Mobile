const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

// CONFIG
const config = {
    host: process.env.VPS_IP || '72.61.43.72',
    username: process.env.VPS_USER || 'root',
    password: process.env.VPS_PASS
};

async function setupSSL() {
    if (!config.password) {
        console.error('VPS_PASS required');
        process.exit(1);
    }

    try {
        await ssh.connect(config);
        console.log('Connected to VPS.');

        console.log('--- 1. Updating Nginx Defaults for Domain ---');
        // We need to set the server_name so Certbot knows which block to update
        // We escape $ variables so the shell doesn't expand them to empty strings.
        const nginxConfig = `
server {
    listen 80 default_server;
    listen [::]:80 default_server;

    server_name asfus.com.br www.asfus.com.br;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \\$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \\$host;
        proxy_cache_bypass \\$http_upgrade;
        
        proxy_buffering off;
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
    }
}
`;
        await ssh.execCommand(`echo "${nginxConfig}" > /etc/nginx/sites-available/default`);

        // Test nginx config before restarting
        console.log('Testing Nginx config...');
        const test = await ssh.execCommand('nginx -t');
        console.log(test.stdout || test.stderr);

        await ssh.execCommand('systemctl restart nginx');

        console.log('--- 2. Installing Certbot ---');
        await ssh.execCommand('apt-get update');
        await ssh.execCommand('apt-get install -y certbot python3-certbot-nginx');

        console.log('--- 3. Running Certbot ---');
        // Run certbot non-interactively
        const email = 'kevenwilliam2015@gmail.com';
        const cmd = `certbot --nginx -d asfus.com.br -d www.asfus.com.br --non-interactive --agree-tos -m ${email} --redirect`;

        console.log(`Executing: ${cmd}`);
        const result = await ssh.execCommand(cmd);
        console.log(result.stdout);
        console.log(result.stderr);

        if (result.stdout.includes('Congratulations') || result.stderr.includes('Congratulations')) {
            console.log('\n✅ SSL Certificate Installed Successfully!');
        } else {
            console.log('\n⚠️  Check output for potential Certbot errors.');
        }

    } catch (e) {
        console.error('Error:', e);
    } finally {
        ssh.dispose();
    }
}

setupSSL();

const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

// CONFIG
const config = {
    host: process.env.VPS_IP || '72.61.43.72',
    username: process.env.VPS_USER || 'root',
    password: process.env.VPS_PASS
};

async function setupNginx() {
    if (!config.password) {
        console.error('VPS_PASS required');
        process.exit(1);
    }

    try {
        await ssh.connect(config);
        console.log('Connected to VPS.');

        console.log('--- Installing Nginx ---');
        await ssh.execCommand('apt-get update && apt-get install -y nginx');

        console.log('--- Configuring Firewall (UFW) ---');
        await ssh.execCommand('ufw allow "Nginx Full"');
        await ssh.execCommand('ufw allow OpenSSH');
        // await ssh.execCommand('ufw enable'); // Risky to enable blindly if not already enabled, might lock out if SSH rule fails. Hostinger usually has firewall disabled or managed externally.

        console.log('--- Configuring Nginx Proxy ---');
        const nginxConfig = `
server {
    listen 80 default_server;
    listen [::]:80 default_server;

    server_name _;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # Buffer fix for Next.js streaming
        proxy_buffering off;
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
    }

    # Static files caching (Optional but good practice)
    location /_next/static {
        proxy_pass http://localhost:3000;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header Host $host;
    }
}
`;
        // Write config
        await ssh.execCommand(`echo "${nginxConfig}" > /etc/nginx/sites-available/default`);

        // Restart Nginx
        console.log('--- Restarting Nginx ---');
        await ssh.execCommand('systemctl restart nginx');

        console.log('Nginx setup complete. Check http://' + config.host);

    } catch (e) {
        console.error('Error:', e);
    } finally {
        ssh.dispose();
    }
}

setupNginx();

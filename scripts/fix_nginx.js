const { NodeSSH } = require('node-ssh');
const fs = require('fs');
const path = require('path');

const ssh = new NodeSSH();
const config = {
    host: process.env.VPS_IP || '72.61.43.72',
    username: process.env.VPS_USER || 'root',
    password: process.env.VPS_PASS
};

const NGINX_CONF = `
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    
    server_name asfus.com.br www.asfus.com.br _;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;

        proxy_buffering off;
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
    }

    location /_next/static {
        proxy_pass http://localhost:3000;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header Host $host;
    }
}
`;

async function fixNginx() {
    if (!config.password) {
        console.error('VPS_PASS missing');
        process.exit(1);
    }

    try {
        await ssh.connect(config);
        console.log('Connected.');

        // Write config locally first to avoid shell quoting issues
        const localPath = path.resolve(__dirname, 'temp_nginx.conf');
        fs.writeFileSync(localPath, NGINX_CONF);

        console.log('Uploading clean Nginx config...');
        await ssh.putFile(localPath, '/etc/nginx/sites-available/default');

        console.log('Testing Nginx config...');
        const test = await ssh.execCommand('nginx -t');
        console.log(test.stdout);
        console.log(test.stderr);

        if (test.stderr.includes('successful')) {
            console.log('Reloading Nginx...');
            await ssh.execCommand('systemctl reload nginx');
            console.log('✅ Nginx Fixed.');

            // Cleanup local
            fs.unlinkSync(localPath);

            console.log('Now re-running SSL setup...');
            const certCmd = `certbot --nginx -d asfus.com.br -d www.asfus.com.br --non-interactive --agree-tos -m kevenwilliam2015@gmail.com --redirect`;
            const certResult = await ssh.execCommand(certCmd);
            console.log(certResult.stdout);
            console.log(certResult.stderr);

            if (certResult.stdout.includes('Congratulations')) {
                console.log('✅ SSL Installed.');
            }
        } else {
            console.error('❌ Config still invalid.');
        }

    } catch (e) {
        console.error('Error:', e);
    } finally {
        ssh.dispose();
    }
}

fixNginx();

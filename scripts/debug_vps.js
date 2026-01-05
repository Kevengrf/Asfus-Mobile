const { NodeSSH } = require('node-ssh');
const fs = require('fs');
const path = require('path');

const ssh = new NodeSSH();

const config = {
    host: process.env.VPS_IP || '72.61.43.72',
    username: process.env.VPS_USER || 'root',
    password: process.env.VPS_PASS || 'Asfus@suape123'
};

async function debug() {
    console.log('--- Connecting to VPS ---');
    try {
        await ssh.connect(config);

        console.log('\n--- Checking BUILD_ID ---');
        const remoteBuildId = await ssh.execCommand('cat /var/www/asfus-mobile/.next/BUILD_ID');
        console.log('Remote BUILD_ID:', remoteBuildId.stdout.trim());

        try {
            const localBuildId = fs.readFileSync(path.join(__dirname, '../.next/BUILD_ID'), 'utf8');
            console.log('Local BUILD_ID: ', localBuildId.trim());
        } catch (e) { console.log('Local BUILD_ID not found (cwd?)'); }


        console.log('\n--- Directory Listing (.next/server/app) ---');
        const dirList = await ssh.execCommand('ls -la /var/www/asfus-mobile/.next/server/app');
        console.log(dirList.stdout || dirList.stderr);

        console.log('\n--- Checking for /videos route files ---');
        const videosCheck = await ssh.execCommand('ls -la /var/www/asfus-mobile/.next/server/app/videos');
        console.log(videosCheck.stdout || videosCheck.stderr);

    } catch (e) {
        console.error('Error:', e);
    } finally {
        ssh.dispose();
    }
}

debug();

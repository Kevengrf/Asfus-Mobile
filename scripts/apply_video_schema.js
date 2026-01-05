const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function applySql() {
    console.log('--- Applying Video Schema SQL ---');

    // Try to find a connection string
    const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.SUPABASE_DB_URL;

    if (!connectionString) {
        console.error('Error: No database connection string found in .env.local (DATABASE_URL, POSTGRES_URL, or SUPABASE_DB_URL).');
        console.log('Available keys:', Object.keys(process.env).filter(k => k.includes('URL') || k.includes('DB')));
        process.exit(1);
    }

    const client = new Client({
        connectionString: connectionString,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        await client.connect();
        console.log('Connected to database.');

        const sqlPath = path.join(__dirname, '../video_schema.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Executing SQL from video_schema.sql...');
        await client.query(sql);
        console.log('✅ SQL applied successfully.');

    } catch (err) {
        console.error('Error applying SQL:', err);
    } finally {
        await client.end();
    }
}

applySql();

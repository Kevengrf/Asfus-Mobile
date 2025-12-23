const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Error: ENV variables missing.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function cleanupAdmin() {
    console.log('--- Cleanup admin@asfus.com.br ---');

    const TARGET_EMAIL = 'admin@asfus.com.br';

    // 1. Delete Profile with this email
    console.log(`Deleting potential orphan profile: ${TARGET_EMAIL}`);
    const { count, error: delError } = await supabase
        .from('profiles')
        .delete({ count: 'exact' })
        .eq('email', TARGET_EMAIL);

    if (delError) {
        console.error(`Delete Error: ${delError.message}`);
    } else {
        console.log(`Deleted ${count} orphan profiles.`);
    }
}

cleanupAdmin();

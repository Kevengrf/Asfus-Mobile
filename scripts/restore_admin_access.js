const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Error: ENV variables missing.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function restoreAdmin() {
    const TARGET_EMAIL = 'admin@asfus.com.br';
    console.log(`--- Restoring Admin Access for: ${TARGET_EMAIL} ---`);

    // 1. Find User
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) {
        console.error('List Error:', listError);
        return;
    }

    const user = users.find(u => u.email === TARGET_EMAIL);

    if (!user) {
        console.error('CRITICAL: Admin user not found! Did you change the email?');
        // Fallback: search by CPF just in case
        // const TARGET_CPF = '29028981420'; ...
        return;
    }

    console.log(`Found ID: ${user.id}`);

    // 2. Update Profile to 'admin'
    console.log('Updating Profile role to admin...');
    const { error: profileError } = await supabase
        .from('profiles')
        .update({ role: 'admin', status: 'ativo' })
        .eq('id', user.id);

    if (profileError) console.error('Profile Update Error:', profileError);
    else console.log('✅ Profile role restored.');

    // 3. Update Auth Metadata to 'admin'
    console.log('Updating Auth Metadata to admin...');
    const { error: authError } = await supabase.auth.admin.updateUserById(user.id, {
        user_metadata: { role: 'admin' }
    });

    if (authError) console.error('Auth Metadata Update Error:', authError);
    else console.log('✅ Auth metadata restored.');

    console.log('\nSuccess! You can login again.');
}

restoreAdmin();

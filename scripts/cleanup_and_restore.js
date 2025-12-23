const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Error: ENV variables missing.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function cleanupAndRestore() {
    console.log('--- Cleanup Orphan Profile & Restore ---');

    const TARGET_CPF = '29028981420';
    const NEW_EMAIL = 'mcrikarte@gmail.com';
    const PASSWORD = 'asfus@290289';

    // 1. Delete Orphan Profile
    console.log(`Deleting potential orphan profile: ${NEW_EMAIL}`);
    const { count, error: delError } = await supabase
        .from('profiles')
        .delete({ count: 'exact' })
        .eq('email', NEW_EMAIL);

    if (delError) {
        console.error(`Delete Error: ${delError.message}`);
    } else {
        console.log(`Deleted ${count} orphan profiles.`);
    }

    // 2. Find target profile
    const { data: profiles } = await supabase.from('profiles').select('*').eq('cpf', TARGET_CPF);
    if (!profiles || profiles.length === 0) {
        console.error('Target profile (CPF) not found!');
        return;
    }
    const profile = profiles[0];
    console.log(`Target profile to rename: ${profile.email} (${profile.id})`);

    // 3. Update Auth User
    console.log(`Updating Auth User ${profile.id}...`);
    const { data: user, error: updateError } = await supabase.auth.admin.updateUserById(profile.id, {
        email: NEW_EMAIL,
        password: PASSWORD,
        user_metadata: { ...profile.metadata, role: 'admin' },
        email_confirm: true
    });

    if (updateError) {
        console.error(`Update FAILED: ${updateError.message}`);
    } else {
        console.log('✅ Auth User updated successfully.');

        // 4. Update Profile (Trigger might have done it, but safe to ensure)
        const { error: pError } = await supabase.from('profiles').update({ email: NEW_EMAIL, role: 'admin' }).eq('id', profile.id);
        if (!pError) console.log('✅ Profile updated/verified.');
    }
}

cleanupAndRestore();

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
    console.log('--- Restoring mcrikarte@gmail.com ---');

    const TARGET_CPF = '29028981420';
    const NEW_EMAIL = 'mcrikarte@gmail.com';
    const PASSWORD = 'asfus@290289';

    // 1. Find the user by CPF in profiles
    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('cpf', TARGET_CPF);

    if (error || !profiles || profiles.length === 0) {
        console.error('Profile with CPF not found!');
        return;
    }

    const profile = profiles[0];
    console.log(`Found profile: ${profile.email} (${profile.id})`);

    // 2. Update Auth User Email and Password
    const { data: user, error: updateError } = await supabase.auth.admin.updateUserById(profile.id, {
        email: NEW_EMAIL,
        password: PASSWORD,
        user_metadata: { ...profile.metadata, role: 'admin' },
        email_confirm: true
    });

    if (updateError) {
        console.error(`Error updating Auth User: ${updateError.message}`);
        return;
    }
    console.log('Auth User updated successfully.');

    // 3. Update Profile Email and Role
    const { error: profileError } = await supabase
        .from('profiles')
        .update({
            email: NEW_EMAIL,
            role: 'admin'
        })
        .eq('id', profile.id);

    if (profileError) {
        console.error(`Error updating Profile: ${profileError.message}`);
    } else {
        console.log('Profile updated successfully.');
    }

    console.log(`\n✅ RESTORED: ${NEW_EMAIL} / ${PASSWORD}`);
}

restoreAdmin();

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Error: ENV variables missing.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function restoreFallback() {
    console.log('--- Restore Fallback Admin ---');

    // We will use the existing admin (currently 29028981420@asfus.com.br) 
    // and rename it to admin@asfus.com.br

    const TARGET_CPF = '29028981420';
    const NEW_EMAIL = 'admin@asfus.com.br';
    const PASSWORD = 'DefaultAdmin@2025';

    // 1. Find target profile
    const { data: profiles } = await supabase.from('profiles').select('*').eq('cpf', TARGET_CPF);
    if (!profiles || profiles.length === 0) {
        console.error('Target profile (CPF) not found!');
        return;
    }
    const profile = profiles[0];
    console.log(`Target profile: ${profile.email} (${profile.id})`);

    // 2. Update Auth User
    console.log(`Updating Auth User ${profile.id} to ${NEW_EMAIL}...`);
    const { data: user, error: updateError } = await supabase.auth.admin.updateUserById(profile.id, {
        email: NEW_EMAIL,
        password: PASSWORD,
        user_metadata: { ...profile.metadata, role: 'admin' },
        email_confirm: true
    });

    if (updateError) {
        console.error(`Update FAILED: ${updateError.message}`);
        return;
    }
    console.log('✅ Auth User updated successfully.');

    // 3. Update Profile
    const { error: pError } = await supabase.from('profiles').update({ email: NEW_EMAIL, role: 'admin' }).eq('id', profile.id);
    if (pError) {
        console.error(`Profile Update Failed: ${pError.message}`);
    } else {
        console.log('✅ Profile updated.');
    }

    console.log(`\nCREDENTIALS: ${NEW_EMAIL} / ${PASSWORD}`);
}

restoreFallback();

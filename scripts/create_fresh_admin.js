const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Error: ENV variables missing.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createFreshAdmin() {
    console.log('--- Creating FRESH Admin ---');

    const TARGET_CPF = '29028981420';
    const NEW_EMAIL = 'admin@asfus.com.br';
    const PASSWORD = 'DefaultAdmin@2025';

    // 1. Fetch old profile to preserve data
    const { data: profiles } = await supabase.from('profiles').select('*').eq('cpf', TARGET_CPF);
    const oldProfile = profiles?.[0];

    console.log(`Old Profile: ${oldProfile?.email} (${oldProfile?.id})`);

    // 2. Create NEW Auth User
    console.log(`Creating new user: ${NEW_EMAIL}...`);
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: NEW_EMAIL,
        password: PASSWORD,
        email_confirm: true,
        user_metadata: {
            nome_completo: oldProfile?.nome_completo || 'Administrador',
            cpf: TARGET_CPF, // Reuse CPF? might conflict if Profile has unique CPF
            role: 'admin'
        }
    });

    if (createError) {
        console.error(`Create FAILED: ${createError.message}`);
        return;
    }
    console.log(`Created New User ID: ${newUser.user.id}`);

    // 3. Handle Potential Profile Conflict (Unique CPF)
    // If profiles.cpf is unique, the trigger might have failed to insert the new profile?
    // Or if insertion succeeded, we now have two profiles with same CPF?
    // Let's check.
    const { data: newProfileCheck } = await supabase.from('profiles').select('*').eq('id', newUser.user.id);

    if (!newProfileCheck || newProfileCheck.length === 0) {
        console.log('New Profile NOT found (likely trigger failed due to CPF constraint).');
        // We need to fix the new profile manually.
        // First, delete the OLD profile to free up CPF (and OLD User).
        console.log('Deleting OLD User/Profile...');
        if (oldProfile) {
            await supabase.auth.admin.deleteUser(oldProfile.id);
            // Profile cascade? Maybe. verify.
            await supabase.from('profiles').delete().eq('id', oldProfile.id);
        }

        // NOW insert the new profile manually
        console.log('Inserting New Profile manually...');
        const { error: insError } = await supabase.from('profiles').insert({
            id: newUser.user.id,
            email: NEW_EMAIL,
            role: 'admin',
            cpf: TARGET_CPF,
            nome_completo: oldProfile?.nome_completo || 'Administrador',
            status: 'aprovado'
        });
        if (insError) console.error(`Insert Profile Error: ${insError.message}`);
        else console.log('✅ New Profile Inserted.');
    } else {
        console.log('New Profile created automatically.');
        // Update role
        await supabase.from('profiles').update({ role: 'admin' }).eq('id', newUser.user.id);
        // Delete old user
        if (oldProfile) {
            console.log('Deleting OLD User...');
            await supabase.auth.admin.deleteUser(oldProfile.id);
        }
    }

    console.log(`\nSUCCESS: Admin available at ${NEW_EMAIL} / ${PASSWORD}`);
}

createFreshAdmin();

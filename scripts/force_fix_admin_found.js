const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Error: ENV variables missing.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function forceFixAdmin() {
    const TARGET_ID = 'c7881583-0ae6-4e89-9a86-eb41f0709c44';
    const NEW_PASSWORD = 'DefaultAdmin@2025';
    const TARGET_CPF = '29028981420'; // Keeping same CPF as intended

    console.log(`--- Forcing Fix for Admin ID: ${TARGET_ID} ---`);

    // 1. Update Auth User Password & Metadata
    console.log('Updating Auth User...');
    const { error: authError } = await supabase.auth.admin.updateUserById(TARGET_ID, {
        password: NEW_PASSWORD,
        user_metadata: {
            nome_completo: 'Administrador',
            cpf: TARGET_CPF,
            role: 'admin',
            status: 'ativo'
        },
        email_confirm: true
    });

    if (authError) {
        console.error(`Auth Update Error: ${authError.message}`);
        return;
    }
    console.log('✅ Auth User Updated (Password set).');

    // 2. Fix Profile
    console.log('Upserting Profile...');
    const { error: profError } = await supabase.from('profiles').upsert({
        id: TARGET_ID,
        email: 'admin@asfus.com.br',
        role: 'admin',
        status: 'ativo',
        cpf: TARGET_CPF,
        nome_completo: 'Administrador'
    });

    if (profError) {
        console.error(`Profile Upsert Error: ${profError.message}`);

        // If conflict on CPF with another profile?
        if (profError.message.includes('cpf')) {
            console.log('CPF Conflict. Finding and removing older profile...');
            const { data: cpfProfiles } = await supabase.from('profiles').select('*').eq('cpf', TARGET_CPF);
            if (cpfProfiles && cpfProfiles.length > 0) {
                for (const p of cpfProfiles) {
                    if (p.id !== TARGET_ID) {
                        console.log(`Deleting conflicting profile: ${p.id}`);
                        await supabase.from('profiles').delete().eq('id', p.id);
                    }
                }
                // Retry upsert
                console.log('Retrying Profile Upsert...');
                await supabase.from('profiles').upsert({
                    id: TARGET_ID,
                    email: 'admin@asfus.com.br',
                    role: 'admin',
                    status: 'ativo',
                    cpf: TARGET_CPF,
                    nome_completo: 'Administrador'
                });
            }
        }
    } else {
        console.log('✅ Profile Upserted.');
    }

    console.log(`\nSUCCESS: Admin User Ready.\nEmail: admin@asfus.com.br\nPassword: ${NEW_PASSWORD}`);
}

forceFixAdmin();

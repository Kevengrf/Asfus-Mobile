const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function restoreName() {
    const TARGET_CPF = '29028981420';
    const REAL_NAME = 'MANOEL CICERO RICARTE DE MOURA';

    console.log(`Restoring name for CPF ${TARGET_CPF} to "${REAL_NAME}"...`);

    const { data: profiles } = await supabase.from('profiles').select('*').eq('cpf', TARGET_CPF);

    if (!profiles || profiles.length === 0) {
        console.error('No profile found with this CPF.');
        return;
    }

    const profile = profiles[0];
    console.log(`Found profile: ${profile.nome_completo} (${profile.id})`);

    const { error } = await supabase
        .from('profiles')
        .update({ nome_completo: REAL_NAME })
        .eq('id', profile.id);

    if (error) {
        console.error('Error updating name:', error);
    } else {
        console.log('✅ Profile name updated successfully.');

        // Also update Auth Metadata
        const { error: authError } = await supabase.auth.admin.updateUserById(profile.id, {
            user_metadata: { nome_completo: REAL_NAME }
        });

        if (authError) console.error('Error updating Auth metadata:', authError);
        else console.log('✅ Auth metadata updated.');
    }
}

restoreName();

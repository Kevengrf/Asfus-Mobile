const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// CONSTANTS
const FINAL_EMAIL = '29028981420@asfus.com.br';
const TARGET_CPF = '29028981420';
const HARDCODED_TARGET_ID = '9d8f3fe9-918e-4265-9f93-a5f9b4022d3a';
const BAD_EMAILS = ['mcrikarte@gmail.com', 'mcrikarte+mobile@gmail.com'];

async function finalFixMcrikarte() {
    console.log(`Final Fix: Migrating mcrikarte to ${FINAL_EMAIL} (ID: ${HARDCODED_TARGET_ID})`);

    const finalId = HARDCODED_TARGET_ID;

    // 1. Find Source Data (Profile)
    let sourceProfile = null;
    const { data: profiles } = await supabase.from('profiles').select('*').in('email', BAD_EMAILS);

    if (profiles && profiles.length > 0) {
        sourceProfile = profiles[0];
        console.log(`Found source profile: ${sourceProfile.email} (${sourceProfile.id})`);
    } else {
        const { data: profilesCpf } = await supabase.from('profiles').select('*').eq('cpf', TARGET_CPF);
        if (profilesCpf && profilesCpf.length > 0) {
            sourceProfile = profilesCpf[0];
            console.log(`Found source profile by CPF: ${sourceProfile.email} (${sourceProfile.id})`);
        }
    }

    if (!sourceProfile) {
        console.log('No source profile found. Checking target profile...');
        const { data: tp } = await supabase.from('profiles').select('*').eq('id', finalId).single();
        if (tp) {
            console.log('Target user already has profile.');
            sourceProfile = tp;
        } else {
            console.log('Need default profile.');
            sourceProfile = {
                nome_completo: 'MANOEL CICERO RICARTE DE MOURA',
                cpf: TARGET_CPF,
                role: 'user',
                status: 'ativo'
            };
        }
    }

    // 2. Ensure Profile Exists for Target ID
    const { data: targetProfile, error: tpError } = await supabase.from('profiles').select('*').eq('id', finalId).single();

    if (!targetProfile) {
        console.log('Creating profile for target...');
        const newProfile = { ...sourceProfile };
        newProfile.id = finalId;
        newProfile.email = FINAL_EMAIL;
        newProfile.cpf = TARGET_CPF;
        delete newProfile.created_at;

        const { error: insertError } = await supabase.from('profiles').insert(newProfile);
        if (insertError) console.error('Insert profile error:', insertError);
    } else {
        console.log('Target profile already exists. Updating metadata...');
        await supabase.from('profiles').update({
            cpf: TARGET_CPF,
            nome_completo: sourceProfile.nome_completo || 'MANOEL CICERO RICARTE DE MOURA',
            email: FINAL_EMAIL
        }).eq('id', finalId);
    }

    // 3. Migrate Appointments from OLD IDs
    const oldIdsToMigrate = [];
    if (sourceProfile && sourceProfile.id !== finalId) oldIdsToMigrate.push(sourceProfile.id);

    // Helper to find other bad IDs
    // Since we bypass listing users, we rely on profiles.
    for (const badEmail of BAD_EMAILS) {
        const { data: bp } = await supabase.from('profiles').select('id').eq('email', badEmail);
        if (bp) {
            bp.forEach(p => {
                if (p.id !== finalId && !oldIdsToMigrate.includes(p.id)) oldIdsToMigrate.push(p.id);
            });
        }
    }

    console.log('Migrating appointments from IDs:', oldIdsToMigrate);

    for (const oldId of oldIdsToMigrate) {
        const { error: moveError } = await supabase
            .from('appointments')
            .update({ user_id: finalId })
            .eq('user_id', oldId);

        if (moveError) console.error(`Error migrating from ${oldId}:`, moveError);

        // 4. Delete Old Profile/User
        console.log(`Deleting old data for ${oldId}...`);
        await supabase.auth.admin.deleteUser(oldId);
        await supabase.from('profiles').delete().eq('id', oldId);
    }

    console.log(`SUCCESS: User migrated to ${FINAL_EMAIL}`);
}

finalFixMcrikarte();

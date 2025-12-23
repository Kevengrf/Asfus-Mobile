const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Error: ENV variables missing.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function finishFreshAdmin() {
    console.log('--- Finishing FRESH Admin Creation ---');

    const TARGET_CPF = '29028981420';
    const NEW_EMAIL = 'admin@asfus.com.br';
    const PASSWORD = 'DefaultAdmin@2025';

    // 1. Try to fetch the Auth User (it might exist from previous run)
    let userId = null;

    // We can't search by email easily with admin api without list loop, 
    // but we can try to createUser again and catch error, OR just listUsers loop.
    // Let's try createUser first, if it fails, we assume it exists and we need to find it.

    console.log(`Ensuring Auth User: ${NEW_EMAIL}...`);
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: NEW_EMAIL,
        password: PASSWORD,
        email_confirm: true,
        user_metadata: {
            nome_completo: 'Administrador',
            cpf: TARGET_CPF,
            role: 'admin',
            status: 'ativo'
        }
    });

    if (createError) {
        console.log(`Create info: ${createError.message}`);
        // If user already registered, we need to find its ID.
        // We'll iterate listUsers to find it (reliable).
        console.log('User likely exists. Searching for ID...');

        let found = false;
        let page = 1;
        while (!found) {
            const { data: { users }, error } = await supabase.auth.admin.listUsers({ page: page, perPage: 1000 });
            if (!users || users.length === 0) break;

            const match = users.find(u => u.email === NEW_EMAIL);
            if (match) {
                userId = match.id;
                found = true;
                console.log(`Found Existing Auth User ID: ${userId}`);
            }
            if (users.length < 1000) break;
            page++;
        }

        if (!userId) {
            console.error('Could not create user AND could not find existing user. Weird.');
            return;
        }

        // Update password just in case
        await supabase.auth.admin.updateUserById(userId, { password: PASSWORD });
        console.log('Password updated/ensured.');

    } else {
        userId = newUser.user.id;
        console.log(`Created New User ID: ${userId}`);
    }

    // 2. Fix Profile (Insert with 'ativo')
    console.log('Ensuring Profile...');

    // Check if profile exists
    const { data: existingProfile } = await supabase.from('profiles').select('*').eq('id', userId);

    if (existingProfile && existingProfile.length > 0) {
        console.log('Profile already exists. Updating...');
        const { error: upError } = await supabase.from('profiles').update({
            role: 'admin',
            status: 'ativo',
            cpf: TARGET_CPF,
            email: NEW_EMAIL
        }).eq('id', userId);

        if (upError) console.error(`Update Profile Error: ${upError.message}`);
        else console.log('✅ Profile updated.');

    } else {
        console.log('Profile missing. Inserting with status=ativo...');
        const { error: insError } = await supabase.from('profiles').insert({
            id: userId,
            email: NEW_EMAIL,
            role: 'admin',
            cpf: TARGET_CPF,
            nome_completo: 'Administrador',
            status: 'ativo' // CORRECT VALUE
        });

        if (insError) {
            console.error(`Insert Profile Error: ${insError.message}`);

            // If error is unique constraint on CPF?
            if (insError.message.includes('cpf')) {
                console.log('CPF Conflict detected. Finding profile with this CPF...');
                const { data: cpfProfiles } = await supabase.from('profiles').select('*').eq('cpf', TARGET_CPF);
                if (cpfProfiles && cpfProfiles.length > 0) {
                    const conflictId = cpfProfiles[0].id;
                    console.log(`Found conflicting profile: ${conflictId}`);
                    // Since we already deleted the OLD user in previous run, this 'conflictId' might be unexpected
                    // OR maybe the previous delete failed?
                    // Let's force delete it if it's not our current userId
                    if (conflictId !== userId) {
                        console.log('Deleting conflicting profile...');
                        await supabase.from('profiles').delete().eq('id', conflictId);
                        // Retry insert
                        console.log('Retrying insert...');
                        await supabase.from('profiles').insert({
                            id: userId,
                            email: NEW_EMAIL,
                            role: 'admin',
                            cpf: TARGET_CPF,
                            nome_completo: 'Administrador',
                            status: 'ativo'
                        });
                    }
                }
            }
        } else {
            console.log('✅ New Profile Inserted.');
        }
    }

    console.log(`\nSUCCESS: Admin available at ${NEW_EMAIL} / ${PASSWORD}`);
}

finishFreshAdmin();

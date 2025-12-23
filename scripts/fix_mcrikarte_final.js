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
const FINAL_EMAIL = '29028981420@asfus.com.br'.toLowerCase();
const TARGET_CPF = '29028981420';
const BAD_EMAILS = ['mcrikarte@gmail.com', 'mcrikarte+mobile@gmail.com'];

async function fetchAllUsers() {
    let allUsers = [];
    let page = 1;
    let keepGoing = true;
    const perPage = 100; // Use max page size logic? 50 is safe default.

    process.stdout.write("Fetching all users...");
    while (keepGoing) {
        const { data: { users }, error } = await supabase.auth.admin.listUsers({ page: page, perPage: perPage });
        if (error) {
            console.error("Error listing users:", error);
            break;
        }
        if (!users || users.length === 0) {
            keepGoing = false;
        } else {
            allUsers = [...allUsers, ...users];
            process.stdout.write(".");
            if (users.length < perPage) keepGoing = false; // End of list
            page++;
        }
    }
    console.log(`\nLoaded ${allUsers.length} total users.`);
    return allUsers;
}

async function finalFixMcrikarte() {
    console.log(`Final Fix: Migrating mcrikarte to ${FINAL_EMAIL}`);

    // 1. Fetch ALL users to find match
    const allUsers = await fetchAllUsers();
    const targetAuthUser = allUsers.find(u => u.email && u.email.toLowerCase() === FINAL_EMAIL);

    if (targetAuthUser) {
        console.log(`FOUND existing target user: ${targetAuthUser.email} (ID: ${targetAuthUser.id})`);
    } else {
        console.log('Target user NOT found in list. Will attempt creation.');
    }

    // 2. Find Source Data (Profile)
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
        if (targetAuthUser) {
            console.log('No source profile found, but target user exists. Checking target profile...');
            const { data: tp } = await supabase.from('profiles').select('*').eq('id', targetAuthUser.id).single();
            if (tp) {
                console.log('Target user already has profile.');
                sourceProfile = tp;
            } else {
                console.log('Target user exists but no profile. Creating default...');
                sourceProfile = {
                    nome_completo: 'MANOEL CICERO RICARTE DE MOURA',
                    cpf: TARGET_CPF,
                    role: 'user',
                    status: 'ativo'
                };
            }
        } else {
            console.error('CRITICAL: No source profile found and no target user. Creating fresh...');
            sourceProfile = {
                nome_completo: 'MANOEL CICERO RICARTE DE MOURA',
                cpf: TARGET_CPF,
                role: 'user',
                status: 'ativo'
            };
        }
    }

    // 3. Create or Update Target User
    const cleanCpf = TARGET_CPF.replace(/\D/g, '');
    const cpfPrefix = cleanCpf.substring(0, 6);
    const password = `asfus@${cpfPrefix}`;

    let finalId = null;

    if (targetAuthUser) {
        console.log(`Updating password for ${targetAuthUser.id}...`);
        finalId = targetAuthUser.id;
        const { error: updateError } = await supabase.auth.admin.updateUserById(finalId, { password: password, email_confirm: true });
        if (updateError) console.error('Error updating password:', updateError);
    } else {
        console.log(`Creating Target User ${FINAL_EMAIL}...`);
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
            email: FINAL_EMAIL,
            password: password,
            email_confirm: true,
            user_metadata: { cpf: TARGET_CPF, nome_completo: sourceProfile.nome_completo }
        });

        if (createError) {
            console.error('Error creating user:', createError);
            // If collision happens here despite list check, it's a "ghost" user?
            return;
        }
        finalId = newUser.user.id;
    }

    console.log(`Target ID: ${finalId}`);

    // 4. Ensure Profile Exists for Target ID
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
        await supabase.from('profiles').update({ cpf: TARGET_CPF, nome_completo: sourceProfile.nome_completo }).eq('id', finalId);
    }

    // 5. Migrate Appointments from OLD IDs
    const oldIdsToMigrate = [];
    if (sourceProfile && sourceProfile.id !== finalId) oldIdsToMigrate.push(sourceProfile.id);

    for (const badEmail of BAD_EMAILS) {
        // Find user ID for bad email from our list
        const badUser = allUsers.find(u => u.email && u.email.toLowerCase() === badEmail.toLowerCase());
        if (badUser && badUser.id !== finalId && !oldIdsToMigrate.includes(badUser.id)) {
            oldIdsToMigrate.push(badUser.id);
        }
        // Also check profile by email just in case detached
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

        // 6. Delete Old Profile/User
        console.log(`Deleting old data for ${oldId}...`);
        await supabase.auth.admin.deleteUser(oldId);
        await supabase.from('profiles').delete().eq('id', oldId);
    }

    console.log(`SUCCESS: User migrated to ${FINAL_EMAIL}`);
}

finalFixMcrikarte();

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fetchAllUsers() {
    let allUsers = [];
    let page = 1;
    let keepGoing = true;
    const perPage = 50;

    console.log("Fetching all auth users to map...");
    while (keepGoing) {
        const { data: { users }, error } = await supabase.auth.admin.listUsers({
            page: page,
            perPage: perPage
        });
        if (error) {
            console.error("Error listing users:", error);
            return [];
        }
        allUsers = [...allUsers, ...users];
        if (users.length < perPage) keepGoing = false;
        page++;
    }
    console.log(`Loaded ${allUsers.length} total users.`);
    return allUsers; // Array of user objects
}

async function fixOrphans() {
    console.log('Starting ROBUST orphan repair...');

    // 1. Load All Auth Users
    const allAuthUsers = await fetchAllUsers();
    const emailToAuthId = new Map();
    allAuthUsers.forEach(u => {
        if (u.email) emailToAuthId.set(u.email.toLowerCase(), u.id);
    });

    // 2. Load All Profiles
    const { data: profiles, error: fetchError } = await supabase
        .from('profiles')
        .select('*');

    if (fetchError) {
        console.error('Error fetching profiles:', fetchError);
        return;
    }
    console.log(`Checking ${profiles.length} profiles...`);

    let fixedCount = 0;
    let skippedCount = 0;
    let healthyCount = 0;

    for (const profile of profiles) {
        const { id: profileId, email: rawEmail, cpf, nome_completo } = profile;

        if (!rawEmail) {
            console.warn(`Skipping profile ${profileId}: No email.`);
            continue;
        }
        const email = rawEmail.toLowerCase();

        // STATUS CHECK
        const authId = emailToAuthId.get(email);

        if (authId === profileId) {
            // Perfect match
            healthyCount++;
            continue;
        }

        // Determine target Auth ID
        let targetAuthId = authId;
        let isNewUser = false;

        if (!targetAuthId) {
            // Need to create user
            console.log(`Orphan (No Auth): ${email}. Creating...`);

            const cleanCpf = cpf ? cpf.replace(/\D/g, '') : '000000';
            const cpfPrefix = cleanCpf.length >= 6 ? cleanCpf.substring(0, 6) : '000000';
            const password = `asfus@${cpfPrefix}`;

            const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
                email: email,
                password: password,
                email_confirm: true,
                user_metadata: { cpf: cpf, nome_completo: nome_completo }
            });

            if (createError) {
                console.error(`  Failed to create user ${email}:`, createError.message);
                skippedCount++;
                continue;
            }
            targetAuthId = newUser.user.id;
            isNewUser = true;
        } else {
            console.log(`Mismatch: ${email} Profile ID (${profileId}) != Auth ID (${targetAuthId}). Migrating Profile...`);
            // We probably also want to reset their password if we found them but they might be broken?
            // Let's reset password just in case if we can identify them by CPF
            if (cpf) {
                const cleanCpf = cpf.replace(/\D/g, '');
                const cpfPrefix = cleanCpf.length >= 6 ? cleanCpf.substring(0, 6) : '000000';
                const password = `asfus@${cpfPrefix}`;
                await supabase.auth.admin.updateUserById(targetAuthId, { password: password });
                console.log(`  (Password reset for mismatched user)`);
            }
        }

        // AUTH ID is now 'targetAuthId'. PROFILE ID is 'profileId'.
        // They are different. We must move Profile data to 'targetAuthId'.

        // A. Rename Old Profile to release constraints
        // Unique cols: email, cpf, matricula
        const tempSuffix = `_del_${Math.floor(Math.random() * 100000)}`;
        const updatePayload = { email: `${email}${tempSuffix}` };
        if (cpf) updatePayload.cpf = `${cpf}${tempSuffix}`;
        if (profile.matricula) updatePayload.matricula = `${profile.matricula}${tempSuffix}`;

        const { error: renameError } = await supabase
            .from('profiles')
            .update(updatePayload)
            .eq('id', profileId);

        if (renameError) {
            console.error(`  Failed to rename old profile ${profileId}:`, renameError.message);
            skippedCount++;
            continue;
        }

        // B. Insert New Profile
        const newProfile = { ...profile };
        newProfile.id = targetAuthId;
        delete newProfile.created_at;
        // Use original clean values

        // Check if profile already exists for targetAuthId? (Should not if 1:1, but maybe partial migration left trash?)
        // If insert fails, we might need to update instead?
        // Let's try upsert? No, insert to be safe.

        const { error: insertProfileError } = await supabase
            .from('profiles')
            .insert(newProfile);

        if (insertProfileError) {
            console.error(`  Failed to insert new profile:`, insertProfileError.message);
            // Try to revert rename?
            await supabase.from('profiles').update({ ...profile }).eq('id', profileId);
            skippedCount++;
            continue;
        }

        // C. Migrate Appointments
        const { error: updateAppsError } = await supabase
            .from('appointments')
            .update({ user_id: targetAuthId })
            .eq('user_id', profileId);

        if (updateAppsError) console.error(`  Apps migration error:`, updateAppsError.message);

        // D. Delete Old Profile
        const { error: deleteProfileError } = await supabase
            .from('profiles')
            .delete()
            .eq('id', profileId);

        if (deleteProfileError) {
            console.error(`  Failed to delete old profile:`, deleteProfileError.message);
        } else {
            console.log(`  Fix Success: ${email}`);
            fixedCount++;
        }
    }

    console.log('------------------------------------------------');
    console.log(`Summary:`);
    console.log(`Healthy: ${healthyCount}`);
    console.log(`Fixed (Created/Migrated): ${fixedCount}`);
    console.log(`Skipped/Failed: ${skippedCount}`);
}

fixOrphans();

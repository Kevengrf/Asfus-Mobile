const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Error: ENV variables missing.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function forceRestoreAdmin() {
    console.log('--- Force Restoring mcrikarte@gmail.com ---');

    const TARGET_CPF = '29028981420';
    const NEW_EMAIL = 'mcrikarte@gmail.com';
    const PASSWORD = 'asfus@290289';

    // 1. Check if NEW_EMAIL already exists in Auth (causing conflict)
    // We cannot search by email directly with admin API easily without fetching usually?
    // Actually listUsers accepts generic search query? No.
    // We can try to get user by email? No, only id.
    // Wait, we can't get ID by email?
    // We can try to Create it, if it fails, it exists.
    // OR we can listUsers with query/filter? No.
    // We have to iterate or just "try delete". But delete requires ID.
    // Actually, we can use listUsers() with page size sufficient? Or just iterate.

    // Better strategy:
    // Update the Profile-linked user. If it fails, assume conflict.
    // If conflict, we need to find the conflicting user ID.
    // How? We iterate listUsers.

    let confusingUser = null;
    let page = 1;
    let keepLooking = true;

    while (keepLooking) {
        const { data: { users }, error } = await supabase.auth.admin.listUsers({ page: page, perPage: 1000 });
        if (!users || users.length === 0) break;

        const found = users.find(u => u.email === NEW_EMAIL);
        if (found) {
            confusingUser = found;
            break;
        }
        if (users.length < 1000) keepLooking = false;
        page++;
    }

    if (confusingUser) {
        console.log(`Found conflicting Auth user: ${confusingUser.id} (${confusingUser.email})`);

        // Check if this conflicting user IS the profile user
        // Find profile user first
        const { data: profiles } = await supabase.from('profiles').select('id, email').eq('cpf', TARGET_CPF);
        const profileId = profiles?.[0]?.id;

        if (confusingUser.id === profileId) {
            console.log('The conflicting user IS correct profile user. Just need to update password/metadata?');
            // If email matches, we don't need to rename.
        } else {
            console.log('Deleting conflicting zombie user...');
            const { error: delError } = await supabase.auth.admin.deleteUser(confusingUser.id);
            if (delError) console.error('Delete failed:', delError);
            else console.log('Zombie deleted.');
        }
    } else {
        console.log('No conflicting Auth user found.');
    }

    // 2. Find the user by CPF in profiles (The one we want to be mcrikarte)
    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('cpf', TARGET_CPF);

    if (error || !profiles || profiles.length === 0) {
        console.error('Profile with CPF not found!');
        return;
    }

    const profile = profiles[0];
    console.log(`Target profile to rename: ${profile.email} (${profile.id})`);

    // 3. Update Auth User Email and Password
    const { data: user, error: updateError } = await supabase.auth.admin.updateUserById(profile.id, {
        email: NEW_EMAIL,
        password: PASSWORD,
        user_metadata: { ...profile.metadata, role: 'admin' },
        email_confirm: true
    });

    if (updateError) {
        console.error(`Error updating Auth User: ${updateError.message}`);
        // If error is still there, maybe we couldn't delete the other one?
        return;
    }
    console.log('Auth User updated successfully.');

    // 4. Update Profile Email and Role
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

forceRestoreAdmin();

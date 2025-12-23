const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Error: ENV variables missing.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function probeAndRestore() {
    console.log('--- Probing mcrikarte@gmail.com conflict ---');

    const TARGET_CPF = '29028981420';
    const NEW_EMAIL = 'mcrikarte@gmail.com';
    const PASSWORD = 'asfus@290289';

    // 1. Try to CREATE the user to check if it exists
    const { data: createdUser, error: createError } = await supabase.auth.admin.createUser({
        email: NEW_EMAIL,
        password: PASSWORD,
        email_confirm: true
    });

    if (createError) {
        console.log(`Create failed: ${createError.message}`);
        // If it says "User already registered", we assume it exists.
        // But unfortuately createUser doesn't return the ID of existing user in error.
        // We really need to find that ID to delete it.
        // Retrying listUsers with different strategy?

        console.log('Attempting to find user via listUsers again (checking all pages)...');
        // Pagination loop again, but stricter
    } else {
        console.log('Create SUCCEEDED! Email was free.');
        // So why did update fail?
        // Maybe because we just created it now, we have a user.
        // We should DELETE this successfuly created user so we can rename the other one.
        console.log(`Deleting temporary probe user: ${createdUser.user.id}`);
        await supabase.auth.admin.deleteUser(createdUser.user.id);

        // If create succeeded, then update failed for another reason.
        console.log('Retry update on original user...');
    }

    // 2. Find target profile
    const { data: profiles } = await supabase.from('profiles').select('*').eq('cpf', TARGET_CPF);
    if (!profiles || profiles.length === 0) return;
    const profile = profiles[0];

    // 3. Update Auth User
    console.log(`Updating Auth User ${profile.id} (${profile.email})...`);
    const { data: user, error: updateError } = await supabase.auth.admin.updateUserById(profile.id, {
        email: NEW_EMAIL,
        password: PASSWORD,
        user_metadata: { ...profile.metadata, role: 'admin' },
        email_confirm: true
    });

    if (updateError) {
        console.error(`Update FAILED: ${updateError.message}`);
        // If "Error updating user" persists and Create succeeded (then deleted),
        // maybe there's a trigger blocking it?
        // Triggers on auth.users?
        // I fixed triggers earlier...
    } else {
        console.log('Auth User updated successfully.');

        // 4. Update Profile
        await supabase.from('profiles').update({ email: NEW_EMAIL, role: 'admin' }).eq('id', profile.id);
        console.log('Profile updated.');
    }
}

probeAndRestore();

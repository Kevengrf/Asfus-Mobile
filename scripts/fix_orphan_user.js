const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function repairOrphan(email) {
    console.log('--- Repairing Orphan Profile:', email);

    // 1. Get Profile
    const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('email', email)
        .single();

    if (profileError) {
        console.error('Profile not found.');
        return;
    }
    console.log('Profile ID:', profile.id);

    // 2. Try to Delete Auth User specific to this ID (even if not listed)
    console.log('Attempting force delete of Auth User...');
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(profile.id);

    if (deleteError) {
        console.log('Delete Auth Error (Expected if user truly gone):', deleteError.message);
    } else {
        console.log('Auth User Deleted (was phantom/zombie).');
    }

    // 3. Create New Auth User
    console.log('Creating fresh Auth User...');
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        id: profile.id, // Try to keep ID
        email: email,
        password: 'Asfus@123456',
        email_confirm: true,
        user_metadata: { must_change_password: true, skip_profile_creation: true }
    });

    if (createError) {
        console.error('Re-creation with SAME ID failed:', createError.message);
        // Fallback: Generate NEW ID for Auth, and update Profile to match
        console.log('Fallback: Creating Auth User with NEW ID and linking profile...');

        const { data: fallbackUser, error: fallbackError } = await supabaseAdmin.auth.admin.createUser({
            email: email,
            password: 'Asfus@123456',
            email_confirm: true,
            user_metadata: { must_change_password: true, skip_profile_creation: true }
        });

        if (fallbackError) {
            console.error('CRITICAL: Fallback creation failed:', fallbackError);
            return;
        }

        const newId = fallbackUser.user.id;
        console.log('New Auth ID:', newId);

        // Update Profile ID (Note: This is tricky if ID is FK elsewhere. Cascading updates required or manual)
        // Since supabase ID is primary key, we might need to delete and recreate profile or update tables.
        // Let's try simple update (if allowed) or copy-delete-insert.

        // Copy profile data
        const { error: updateError } = await supabaseAdmin.from('profiles').update({ id: newId }).eq('id', profile.id);

        if (updateError) {
            console.error('Failed to migrate profile ID. You may need to delete profile and let it recreate.', updateError);
            // Last resort: Delete Profile and let it recreate empty? No, we lose data.
            // Better: Create new profile copy, move relational data (if any), delete old.
            // For now, let's just log the new ID user created. 
            console.log(`MANUAL ACTION REQUIRED: Update profile ID ${profile.id} to ${newId} in database.`);
        } else {
            console.log('Profile migrated to new Auth ID successfully.');
        }

    } else {
        console.log('Success! User restored with original ID:', newUser.user.id);
    }
}

repairOrphan('kevenwilliam2304@gmail.com');

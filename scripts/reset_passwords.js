const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function resetPasswords() {
    console.log('Starting mass password reset...');

    // 1. Fetch all profiles with their ID and CPF
    const { data: profiles, error: fetchError } = await supabase
        .from('profiles')
        .select('id, cpf, email')
        .not('cpf', 'is', null);

    if (fetchError) {
        console.error('Error fetching profiles:', fetchError);
        return;
    }

    console.log(`Found ${profiles.length} profiles to update.`);

    let successCount = 0;
    let failCount = 0;

    for (const profile of profiles) {
        const { id, cpf, email } = profile;

        // Clean CPF: remove all non-digits
        const cleanCpf = cpf.replace(/\D/g, '');

        // Validate CPF length (should be 11 digits mostly, but at least 6)
        if (cleanCpf.length < 6) {
            console.warn(`Skipping user ${email} (${id}): CPF too short '${cpf}'`);
            failCount++;
            continue;
        }

        // Extract first 6 digits
        const cpfPrefix = cleanCpf.substring(0, 6);
        const newPassword = `asfus@${cpfPrefix}`;

        console.log(`Updating user ${email}... Password will be: asfus@${cpfPrefix}`);

        // Update user password using Admin API
        const { error: updateError } = await supabase.auth.admin.updateUserById(
            id,
            {
                password: newPassword,
                email_confirm: true, // Ensure email is confirmed so they can login
                user_metadata: { cpf: cpf } // Ensure metadata is in sync if needed
            }
        );

        if (updateError) {
            console.error(`Failed to update ${email}:`, updateError.message);
            failCount++;
        } else {
            console.log(`Success: ${email}`);
            successCount++;
        }
    }

    console.log('------------------------------------------------');
    console.log(`Password reset complete.`);
    console.log(`Success: ${successCount}`);
    console.log(`Failed: ${failCount}`);
}

resetPasswords();

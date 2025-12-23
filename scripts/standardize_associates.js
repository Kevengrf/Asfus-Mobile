const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Error: ENV variables missing.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function standardizeAssociates() {
    console.log('--- Starting Standardization of Associates ---');

    // 1. Fetch non-admin profiles
    // We filter heavily to avoid touching admins
    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, cpf, nome_completo, email, role')
        .neq('role', 'admin');

    if (error) {
        console.error('Error fetching profiles:', error);
        return;
    }

    console.log(`Found ${profiles.length} NON-ADMIN profiles.`);

    let processed = 0;
    let skipped = 0;
    let errors = 0;

    for (const profile of profiles) {
        const { id, cpf, nome_completo, email } = profile;

        if (!cpf) {
            console.warn(`[SKIP] ID: ${id} (${nome_completo}) - Missing CPF`);
            skipped++;
            continue;
        }

        const cleanCpf = cpf.replace(/\D/g, '');
        if (cleanCpf.length < 11) {
            console.warn(`[SKIP] ID: ${id} (${nome_completo}) - Invalid CPF length: ${cleanCpf}`);
            skipped++;
            continue;
        }

        const newEmail = `${cleanCpf}@asfus.com.br`;

        console.log(`Processing: ${nome_completo} -> ${newEmail}`);

        // 2. Update Profile Email
        // We use update to set the new standardized email
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ email: newEmail })
            .eq('id', id);

        if (updateError) {
            console.error(`  [ERROR] Update Profile Failed: ${updateError.message}`);
            errors++;
            continue;
        }

        // 3. Delete Auth User (Force First Access)
        // We don't care if it fails because user might not exist in Auth
        const { error: deleteError } = await supabase.auth.admin.deleteUser(id);

        if (deleteError) {
            // If user doesn't exist, that's fine/good.
            if (!deleteError.message.includes("User not found")) {
                console.warn(`  [WARN] Delete Auth Failed: ${deleteError.message}`);
            }
        } else {
            console.log(`  [OK] Auth User Deleted (Reset)`);
        }

        processed++;
    }

    console.log('\n================ REPORT ================');
    console.log(`Total Profiles: ${profiles.length}`);
    console.log(`Processed (Reset): ${processed}`);
    console.log(`Skipped (No/Bad CPF): ${skipped}`);
    console.log(`Errors: ${errors}`);
}

standardizeAssociates();

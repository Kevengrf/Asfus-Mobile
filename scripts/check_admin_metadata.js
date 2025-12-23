const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Error: ENV variables missing.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAndFixAdmins() {
    console.log('--- Checking Admin Metadata ---');

    // 1. Fetch all admins from profiles
    const { data: admins, error } = await supabase
        .from('profiles')
        .select('id, email, role')
        .eq('role', 'admin');

    if (error) {
        console.error('Error fetching admins:', error);
        return;
    }

    console.log(`Found ${admins.length} Admin Profiles.`);

    for (const admin of admins) {
        // 2. Fetch Auth User
        const { data: { user }, error: authError } = await supabase.auth.admin.getUserById(admin.id);

        if (authError || !user) {
            console.error(`[ERROR] Auth User not found for admin ${admin.email}`);
            continue;
        }

        const metaRole = user.user_metadata?.role;
        console.log(`Admin: ${admin.email} | Profile Role: ${admin.role} | Metadata Role: ${metaRole}`);

        // 3. Fix if missing or wrong
        if (metaRole !== 'admin') {
            console.log(`  -> FIXING metadata for ${admin.email}...`);
            const { error: updateError } = await supabase.auth.admin.updateUserById(admin.id, {
                user_metadata: {
                    ...user.user_metadata,
                    role: 'admin'
                }
            });

            if (updateError) {
                console.error(`  -> Failed to update: ${updateError.message}`);
            } else {
                console.log(`  -> Success!`);
            }
        }
    }
}

checkAndFixAdmins();

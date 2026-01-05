const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const ORPHAN_ID = '6acbf992-c39d-4a74-b0ff-9170e753c8c3';

async function checkDependencies() {
    console.log(`Checking dependencies for Orphan ID: ${ORPHAN_ID}`);

    // 1. Check Associates (if applicable, based on schema, associates might be profiles directly? No, usually linked)
    // Looking at schema from previous steps: profiles IS the main user table. 
    // Are there other tables referencing profiles.id?
    // 'appointments', 'gallery'?, 'news'?

    // Let's check appointments if it exists
    const { count: apptCount, error: apptError } = await supabaseAdmin
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', ORPHAN_ID);

    if (apptError) console.log('Error checking appointments:', apptError.message);
    else console.log(`Appointments linked: ${apptCount}`);

    // Check generic delete attempt to see constraint error
    console.log('Attempting Dry-Run Delete to see error...');
    const { error: deleteError } = await supabaseAdmin
        .from('profiles')
        .delete()
        .eq('id', ORPHAN_ID);

    if (deleteError) {
        console.error('DELETE FAILED. Reason:', deleteError);
        console.error('Message:', deleteError.message);
        console.error('Details:', deleteError.details);
    } else {
        console.log('DELETE SUCCESS! (The profile is gone now)');
    }
}

checkDependencies();

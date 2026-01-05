const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ID found in previous step
const PROFILE_ID = '6acbf992-c39d-4a74-b0ff-9170e753c8c3';

async function check() {
    console.log(`Checking Profile ID: ${PROFILE_ID}`);
    const { data: user, error } = await supabaseAdmin.auth.admin.getUserById(PROFILE_ID);

    if (error) {
        console.log('Error getting user:', error.message);
    }

    if (user && user.user) {
        console.log('User Exists! Not an orphan.');
        console.log('Email:', user.user.email);
    } else {
        console.log('User NOT found. This IS an orphan profile.');

        // Optional: Delete it here? verify logic first.
    }
}

check();

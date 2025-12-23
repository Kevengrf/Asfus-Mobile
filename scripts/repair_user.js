const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function repairUser() {
    const email = 'kevenwilliam2304@gmail.com';
    // ID found in previous step
    const id = '6acbf992-c39d-4a74-b0ff-9170e753c8c3';

    console.log('--- Repairing User:', email, id);

    // Try to create user with specific ID to restore link
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
        id: id,
        email: email,
        password: 'Asfus@123456',
        email_confirm: true,
        user_metadata: {
            must_change_password: true,
            skip_profile_creation: true // Important for our new trigger logic if applicable
        }
    });

    if (error) {
        console.error('Create Failed:', error);
    } else {
        console.log('Create Success:', data.user.id);
    }
}
repairUser();

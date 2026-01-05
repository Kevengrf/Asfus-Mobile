const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const TARGET_EMAIL = 'kevenwilliam2304@gmail.com';

async function check() {
    console.log(`Checking profile for: ${TARGET_EMAIL}`);

    const { data: profile, error } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('email', TARGET_EMAIL)
        .single();

    if (error) {
        console.error('Error fetching profile:', error);

        // Check if Auth user exists anyway
        console.log('Checking Auth User by listUsers (fallback)...');
        const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
        const target = users.find(u => u.email === TARGET_EMAIL);
        if (target) {
            console.log('Auth User FOUND:', target.id);
            console.log('Metadata:', target.user_metadata);
        } else {
            console.log('Auth User NOT FOUND.');
        }

    } else {
        console.log('Profile found:');
        console.log(`- ID: ${profile.id}`);
        console.log(`- Role: ${profile.role}`); // Should be 'admin'
        console.log(`- Status: ${profile.status}`);
        console.log(`- Nome: ${profile.nome_completo}`);
    }

    // Also check Auth Metadata
    if (profile) {
        const { data: user } = await supabaseAdmin.auth.admin.getUserById(profile.id);
        console.log('\nAuth Metadata:');
        console.log(user?.user?.user_metadata);
    }
}

check();

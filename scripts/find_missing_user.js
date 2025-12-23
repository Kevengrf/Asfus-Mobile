const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Error: ENV variables missing.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function findUser() {
    const searchTerm = 'Manoel Cicero';
    console.log(`--- Searching for user containing: "${searchTerm}" ---`);

    // 1. Search in Profiles
    const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .ilike('nome_completo', `%${searchTerm}%`);

    if (profileError) {
        console.error('Profile Search Error:', profileError);
    } else {
        console.log(`Found ${profiles.length} profiles:`);
        profiles.forEach(p => console.log(JSON.stringify(p, null, 2)));
    }

    // 2. Search in Auth (harder to search by name without metadata, but we can list and filter)
    // We will list last 100 users and check metadata
    console.log('\nChecking recent Auth users (metadata)...');
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers({ perPage: 100 });

    if (authError) {
        console.error('Auth Search Error:', authError);
    } else {
        const foundAuth = users.filter(u =>
            (u.user_metadata?.nome_completo && u.user_metadata.nome_completo.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase()))
        );

        if (foundAuth.length > 0) {
            console.log(`Found ${foundAuth.length} auth users:`);
            foundAuth.forEach(u => console.log(`ID: ${u.id}, Email: ${u.email}, Meta: ${JSON.stringify(u.user_metadata)}`));
        } else {
            console.log('No matching auth users found in recent list.');
        }
    }
}

findUser();

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Error: ENV missing.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function diagnose() {
    const TARGET_ID = '9d8f3fe9-918e-4265-9f93-a5f9b4022d3a';
    const TARGET_CPF = '29028981420';
    console.log(`Diagnosing User: ID=${TARGET_ID}, CPF=${TARGET_CPF}`);

    // 1. Check Profile by ID
    const { data: profileById, error: pIdError } = await supabase.from('profiles').select('*').eq('id', TARGET_ID).maybeSingle();
    console.log('Profile by ID:', profileById || 'NOT FOUND');
    if (pIdError) console.error(pIdError);

    // 2. Check Profile by CPF
    const { data: profileByCpf, error: pCpfError } = await supabase.from('profiles').select('*').eq('cpf', TARGET_CPF);
    console.log('Profile(s) by CPF:', profileByCpf && profileByCpf.length > 0 ? profileByCpf : 'NOT FOUND');

    // 3. Check Auth User by ID
    const { data: { user: authUser }, error: authError } = await supabase.auth.admin.getUserById(TARGET_ID);

    if (authUser) {
        console.log('Auth User FOUND:', authUser.id);
        console.log(' - Email:', authUser.email);
        console.log(' - Meta:', authUser.user_metadata);
    } else {
        console.log('Auth User NOT FOUND by ID.');
        if (authError) console.log('Auth Error:', authError.message);
    }
}

diagnose();

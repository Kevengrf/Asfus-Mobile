const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkProfile() {
    const cpf = '29028981420';
    console.log(`Checking profile for CPF: ${cpf}`);

    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('cpf', cpf);

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Profile found:', data);
    }
}

checkProfile();

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Error: ENV variables missing.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function forceFixProfile() {
    console.log('--- Force Fixing Admin Profile ---');

    // ID from Step 1088 output
    const userId = 'c7881583-0ae6-4e89-9a86-eb41f0709c44';
    const email = 'admin@asfus.com.br';
    const cpf = '29028981420';

    console.log(`Fixing User ID: ${userId}`);

    // Check if auth user exists (sanity check)
    const { data: { user }, error: uError } = await supabase.auth.admin.getUserById(userId);
    if (!user) {
        console.error('User not found in Auth! classic ghost user issue?');
        return;
    }
    console.log('Auth User confirmed.');

    // Upsert Profile with CORRECT status 'ativo'
    const { error: insError } = await supabase.from('profiles').upsert({
        id: userId,
        email: email,
        role: 'admin',
        cpf: cpf,
        nome_completo: 'Administrador',
        status: 'ativo' // Correct value
    });

    if (insError) {
        console.error(`Profile Upsert FAILED: ${insError.message}`);
    } else {
        console.log('✅ Profile fixed/created successfully.');
        console.log(`Login with: ${email} / DefaultAdmin@2025`);
    }
}

forceFixProfile();

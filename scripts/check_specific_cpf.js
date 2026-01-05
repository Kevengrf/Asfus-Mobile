const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// CPF from user request
const TARGET_CPF = '10337215499';

async function check() {
    console.log(`Checking status for CPF: ${TARGET_CPF}`);

    // Check both clean and potentially formatted versions just to be safe
    // But usually we store cleaned or formatted. Let's try to find it.

    const { data: profiles, error } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .or(`cpf.eq.${TARGET_CPF},cpf.eq.103.372.154-99`);

    if (error) {
        console.error('Error fetching profile:', error);
        return;
    }

    if (profiles && profiles.length > 0) {
        console.log('Found matching profiles:');
        profiles.forEach(p => {
            console.log(`- Nome: ${p.nome_completo}`);
            console.log(`  Email: ${p.email}`);
            console.log(`  Role: ${p.role}`);
            console.log(`  Status: ${p.status}`);
            console.log(`  CPF stored: ${p.cpf}`);
            console.log('---');
        });

        const admin = profiles.find(p => p.role === 'admin');
        if (admin) {
            console.log('✅ EXISTE UM ADMIN com este CPF.');
        } else {
            console.log('❌ O usuário existe mas NAO é admin (Role: user).');
        }
    } else {
        console.log('❌ NENHUM usuário encontrado com este CPF.');
    }
}

check();

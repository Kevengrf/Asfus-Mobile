const { createClient } = require('@supabase/supabase-js');
const { randomUUID } = require('node:crypto');
require('dotenv').config({ path: '.env.local' });

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// We will create a profile with NO Auth user
// ID must be a UUID
const MOCK_ID = randomUUID();
const MOCK_CPF = '999.999.999-99';
const MOCK_EMAIL = 'imported_user_test@example.com';

async function simulateImport() {
    console.log('Simulating Imported User (Profile Only)...');
    console.log(`ID: ${MOCK_ID}`);
    console.log(`CPF: ${MOCK_CPF}`);
    console.log(`Email: ${MOCK_EMAIL}`);

    // 1. Ensure no auth user exists with this email (cleanup)
    const { data: existingAuth } = await supabaseAdmin.auth.admin.listUsers();
    const foundAuth = existingAuth.users.find(u => u.email === MOCK_EMAIL);
    if (foundAuth) {
        console.log('Found existing auth user, deleting...');
        await supabaseAdmin.auth.admin.deleteUser(foundAuth.id);
    }

    // 2. Insert Profile directly
    // Note: Triggers usually run on AUTH creation. Here we insert directly into profiles.
    // If triggers exist on profiles, they might run, but usually they don't break simple inserts.
    const { error } = await supabaseAdmin
        .from('profiles')
        .upsert({
            id: MOCK_ID,
            nome_completo: 'Usuario Importado Teste',
            email: MOCK_EMAIL,
            cpf: '99999999999', // Stored clean usually? Let's check actions.ts. 
            // actions.ts cleanCpf = cpf.replace(/\D/g, ''); 
            // So if I store clean: 99999999999
            role: 'user', // Constraint requires 'user' or 'admin', not 'associate'
            status: 'ativo', // Must be active for First Access
            codtipo: '1',
            chapa: '9999'
        });

    if (error) {
        console.error('Error creating profile:', error);
    } else {
        console.log('✅ Created "Imported" Profile successfully.');
        console.log(`You can now test First Access with CPF: ${MOCK_CPF}`);
    }
}

simulateImport();

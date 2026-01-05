const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

const TARGET_EMAIL = 'kevenwilliam2304@gmail.com';
const TARGET_CPF = '12272844464';

async function diagnose() {
    console.log(`--- DIAGNOSIS START for ${TARGET_EMAIL} ---`);

    // 1. Check Profile (Email)
    console.log('\n1. Checking Profile by Email...');
    const { data: profileByEmail } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .ilike('email', TARGET_EMAIL);
    console.log('Profile by Email:', profileByEmail?.length, profileByEmail?.map(p => ({ id: p.id, email: p.email })));

    // 2. Check Profile (CPF)
    console.log('\n2. Checking Profile by CPF...');
    const { data: profileByCPF } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('cpf', TARGET_CPF);
    console.log('Profile by CPF:', profileByCPF?.length, profileByCPF?.map(p => ({ id: p.id, cpf: p.cpf, email: p.email })));

    // 3. Check Auth User (List matching email)
    console.log('\n3. Checking Auth User by Email...');
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) console.error("List Error:", listError);

    const targetUser = users?.find(u => u.email?.toLowerCase() === TARGET_EMAIL.toLowerCase());
    console.log('Auth User Found:', targetUser ? targetUser.id : 'NONE');

    // 4. Analysis & Auto-Fix
    if (targetUser) {
        console.log('\n[!] Auth User EXISTS.');
        if (!profileByEmail?.length) {
            console.log('    -> This is a "Reverse Orphan" (Auth exists, Profile missing).');
            console.log('    -> This blocks creation with "Database error checking email" (actually User Already Registered but obfuscated?).');
            console.log('    -> ATTEMPTING DELETE OF AUTH USER...');

            const { error: delErr } = await supabaseAdmin.auth.admin.deleteUser(targetUser.id);
            if (delErr) {
                console.log('       Delete Failed:', delErr.message);
            } else {
                console.log('       Delete SUCCESS. You should now be able to create the user.');
            }
        } else {
            console.log('    -> Auth user exists AND Profile exists. This should be a standard "User already exists" error.');
        }
    } else {
        console.log('\n[OK] Auth User does not exist.');
    }

    if (profileByCPF?.length) {
        console.log('\n[!] CPF COLLISION DETECTED.');
        console.log('    -> Profile with this CPF already exists:', profileByCPF[0].email);
        console.log('    -> This will cause a Unique Constraint Violation on INSERT if not handled.');
        // We don't auto-delete because maybe that's a valid user?
    }
}

diagnose();

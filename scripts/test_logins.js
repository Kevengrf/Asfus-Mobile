const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Need admin to list users
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; // Need anon to test login

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Error: ENV variables missing.');
    process.exit(1);
}

const adminClient = createClient(supabaseUrl, supabaseServiceKey);
const authClient = createClient(supabaseUrl, supabaseAnonKey);

async function testLogins() {
    console.log('--- Starting Automated Login Test ---');

    // 1. Fetch profiles
    const { data: profiles, error } = await adminClient
        .from('profiles')
        .select('id, email, cpf, nome_completo');

    if (error) {
        console.error('Error fetching profiles:', error);
        return;
    }

    console.log(`Testing ${profiles.length} profiles...`);

    let success = [];
    let failed = [];

    for (const profile of profiles) {
        const { email, cpf, nome_completo } = profile;
        if (!email) {
            failed.push({ name: nome_completo, email: 'NO EMAIL', reason: 'No Email in Profile' });
            continue;
        }

        // Calculate expected password
        let password = 'Asfus@123456';
        if (cpf) {
            const cleanCpf = cpf.replace(/\D/g, '');
            if (cleanCpf.length >= 6) {
                password = `Asfus@${cleanCpf.substring(0, 6)}`;
            }
        }

        // Attempt Login
        const { data, error } = await authClient.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) {
            // Try fallback password? 
            // Maybe user has strict 123456?
            if (password !== 'Asfus@123456') {
                const retry = await authClient.auth.signInWithPassword({
                    email: email,
                    password: 'Asfus@123456'
                });
                if (!retry.error) {
                    success.push({ email, password: 'Asfus@123456 (Fallback)' });
                    continue;
                }
            }

            failed.push({
                name: nome_completo,
                email,
                expected_password: password,
                error: error.message
            });
        } else {
            success.push({ email, password: 'OK' });
            // Logout immediately
            await authClient.auth.signOut();
        }
    }

    console.log('\n================ REPORT ================');
    console.log(`Total: ${profiles.length}`);
    console.log(`Success: ${success.length}`);
    console.log(`Failed: ${failed.length}`);

    if (failed.length > 0) {
        console.log('\n--- FAILED USERS ---');
        failed.forEach(f => {
            console.log(`[${f.email}] (${f.name}) -> Error: ${f.error}`);
        });
    }
}

testLogins();

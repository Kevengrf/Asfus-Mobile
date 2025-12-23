const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Error: ENV variables missing.');
    process.exit(1);
}

const adminClient = createClient(supabaseUrl, supabaseServiceKey);
const authClient = createClient(supabaseUrl, supabaseAnonKey);

async function testSingleLogin() {
    console.log('--- Testing Single Associate Login ---');

    // 1. Fetch one profile with CPF
    const { data: profiles, error } = await adminClient
        .from('profiles')
        .select('email, cpf, nome_completo')
        .neq('email', 'mcrikarte@gmail.com') // Skip admin
        .not('cpf', 'is', null)
        .limit(1);

    if (error || !profiles || profiles.length === 0) {
        console.error('Error fetching profile:', error);
        return;
    }

    const profile = profiles[0];
    const { email, cpf, nome_completo } = profile;
    console.log(`Testing user: ${email} (${nome_completo})`);

    // Calculate expected password
    let password = 'Asfus@123456';
    const cleanCpf = cpf.replace(/\D/g, '');
    if (cleanCpf.length >= 6) {
        password = `Asfus@${cleanCpf.substring(0, 6)}`;
    }
    console.log(`Using password: ${password}`);

    // Attempt Login
    const { data, error: loginError } = await authClient.auth.signInWithPassword({
        email: email,
        password: password
    });

    if (loginError) {
        // Try fallback
        console.log('Login failed, trying fallback Asfus@123456...');
        const { data: retryData, error: retryError } = await authClient.auth.signInWithPassword({
            email: email,
            password: 'Asfus@123456'
        });

        if (retryError) {
            console.error('❌ Login FAILED:', retryError.message);
        } else {
            console.log('✅ Login SUCCESS (Fallback Password)');
        }
    } else {
        console.log('✅ Login SUCCESS (CPF Password)');
    }
}

testSingleLogin();

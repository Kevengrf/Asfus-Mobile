const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Error: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required.');
    process.exit(1);
}

// Client-side auth uses Anon Key
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verifyLogin() {
    const email = '29028981420@asfus.com.br';
    const password = 'asfus@290289';

    console.log(`Attempting login for: ${email}`);

    const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
    });

    if (error) {
        console.error('LOGIN FAILED:', error);
        console.error('Status:', error.status);
        console.error('Message:', error.message);
    } else {
        console.log('LOGIN SUCCESSFUL!');
        console.log('User ID:', data.user.id);
        console.log('Email:', data.user.email);
        console.log('Session Token:', data.session.access_token.substring(0, 20) + '...');
    }
}

verifyLogin();

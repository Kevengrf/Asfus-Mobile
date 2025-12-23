const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Error: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const TARGET_EMAIL = '29028981420@asfus.com.br';
const PASSWORD = 'asfus@290289'; // Based on CPF

async function findIdViaLogin() {
    console.log(`Attempting login for: ${TARGET_EMAIL}`);

    const { data, error } = await supabase.auth.signInWithPassword({
        email: TARGET_EMAIL,
        password: PASSWORD
    });

    if (error) {
        console.error('Login failed:', error.message);
        if (error.message.includes('Invalid login credentials')) {
            console.log('Password might be wrong, or user does not exist (contradicting create error).');
        }
    } else {
        console.log('LOGIN SUCCESS! Ghost User Found.');
        console.log('User ID:', data.user.id);
    }
}

findIdViaLogin();

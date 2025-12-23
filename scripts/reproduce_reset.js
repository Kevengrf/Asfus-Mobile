const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testReset(email) {
    console.log('--- Testing Password Reset for:', email);

    // 1. Find profile
    const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('email', email)
        .single();

    if (profileError) {
        console.error('Profile not found:', profileError.message);
        return;
    }
    console.log('Profile found:', profile.id);

    // 2. Try simple update
    const newPassword = 'Asfus@123456';

    console.log('Attempting updateUserById...');
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(profile.id, {
        password: newPassword,
        user_metadata: { must_change_password: true }
    });

    if (error) {
        console.error('updateUserById FAILED:', error); // Log full error object
        console.error('Message:', error.message);

        if (error.message.includes('User not found')) {
            console.log('User not found in Auth. Attempting createUser...');
            const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
                id: profile.id, // Force ID match
                email: profile.email,
                password: newPassword,
                email_confirm: true,
                user_metadata: { skip_profile_creation: true }
            });

            if (createError) {
                console.error('createUser FAILED:', createError);
            } else {
                console.log('createUser SUCCESS:', createData.user.id);
            }
        }
    } else {
        console.log('updateUserById SUCCESS:', data.user.id);
    }
}

// Pass an email as argument
const targetEmail = process.argv[2] || 'mcrikarte@gmail.com';
testReset(targetEmail);

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const TARGET_EMAIL = 'mcrikarte@gmail.com';
const TARGET_CPF = '29028981420';

// Bypass corruption on main email
const ALIAS_EMAIL = 'mcrikarte+mobile@gmail.com';

async function fixMcrikarte() {
    console.log(`Fixing user: ${TARGET_EMAIL} -> Alias: ${ALIAS_EMAIL}`);

    // 1. Find profile (Exact or Renamed)
    let profile = null;
    const { data: exactProfiles } = await supabase.from('profiles').select('*').eq('email', TARGET_EMAIL);
    if (exactProfiles && exactProfiles.length > 0) profile = exactProfiles[0];
    else {
        const { data: renamed } = await supabase.from('profiles').select('*').ilike('email', `${TARGET_EMAIL}%`);
        if (renamed && renamed.length > 0) profile = renamed[0];
    }

    if (!profile) {
        console.error('Profile not found!');
        return;
    }

    const oldId = profile.id;
    console.log(`Found Profile ID: ${oldId} (${profile.email})`);

    // 2. Prepare Password
    const cleanCpf = TARGET_CPF.replace(/\D/g, '');
    const cpfPrefix = cleanCpf.substring(0, 6);
    const password = `asfus@${cpfPrefix}`;

    // 3. Rename Profile if needed (to free up constraints for alias if alias was somehow used? unlikely but safe)
    // Actually we need to rename the OLD profile so we can insert a NEW one with the ALIAS.
    // The ALIAS will be the new unique key.

    if (profile.email === ALIAS_EMAIL) {
        console.log('Profile already has alias email. Checking auth...');
    } else if (profile.email === TARGET_EMAIL) {
        console.log('Renaming old profile...');
        const tempSuffix = `_fixing_${Math.floor(Math.random() * 1000)}`;
        await supabase.from('profiles').update({ email: `${TARGET_EMAIL}${tempSuffix}` }).eq('id', oldId);
    }

    // 4. Create Auth User with ALIAS
    console.log(`Creating Auth User: ${ALIAS_EMAIL}`);
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: ALIAS_EMAIL,
        password: password,
        email_confirm: true,
        user_metadata: { cpf: TARGET_CPF, nome_completo: profile.nome_completo }
    });

    if (createError) {
        console.error(`Failed to create alias user: ${createError.message}`);
        // If alias exists, we should probably use it?
        return;
    }
    const newId = newUser.user.id;
    console.log(`Created Alias User ID: ${newId}`);

    // 5. Insert New Profile with ALIAS
    const newProfile = { ...profile };
    newProfile.id = newId;
    newProfile.email = ALIAS_EMAIL;
    newProfile.cpf = TARGET_CPF;
    delete newProfile.created_at;

    const { error: insertError } = await supabase.from('profiles').insert(newProfile);
    if (insertError) {
        console.error(`Failed to insert profile: ${insertError.message}`);
        return;
    }

    // 6. Migrate Appointments
    await supabase.from('appointments').update({ user_id: newId }).eq('user_id', oldId);
    console.log('Appointments migrated.');

    // 7. Delete Old Profile
    await supabase.from('profiles').delete().eq('id', oldId);
    console.log('Old profile deleted.');

    console.log('SUCCESS: User repaired using alias email.');
}

fixMcrikarte();

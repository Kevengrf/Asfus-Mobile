require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const userData = {
    id: 'ecdd6ea5-a978-4829-83d0-74f11b04b82f',
    email: 'mcrikarte@gmail.com',
    nome_completo: 'MANOEL CICERO RICARTE DE MOURA',
    cpf: '29028981420',
    telefone: '81041020738',
    chapa: '0000305',
    dt_nasc: '1962-03-19',
    sexo: 'M',
    role: 'user',
    status: 'ativo'
};

const password = userData.cpf.substring(0, 5);

async function importUser() {
    console.log(`Starting import for ${userData.nome_completo}...`);

    // SKIP AUTH CHECK - DATABASE ERROR
    // Assuming we might have issues with Auth API, let's try to just UPSERT the profile.
    // If the Auth user doesn't exist, this will fail with FK constraint error.
    let userId = userData.id;

    /*
    // 1. Check if user exists (with pagination)
    let existingUser = null;
    let page = 1;
    let hasNextPage = true;

    console.log('Searching for existing user...');

    while (hasNextPage) {
        const { data: { users }, error } = await supabase.auth.admin.listUsers({ page: page, perPage: 1000 });
        if (error) {
            console.error('Error listing users:', error);
            break;
        }

        const found = users.find(u => u.email === userData.email);
        if (found) {
            existingUser = found;
            break;
        }

        if (users.length < 1000) hasNextPage = false;
        page++;
    }

    if (existingUser) {
        console.log(`User already exists in Auth: ${existingUser.email} (${existingUser.id})`);
        userId = existingUser.id;
    } else {
        console.log('Creating user in Auth...');
        const { data, error } = await supabase.auth.admin.createUser({
            // id: userData.id, // Let Supabase generate a new ID to avoid potential conflicts
            email: userData.email,
            password: password,
            email_confirm: true,
            user_metadata: {
                nome_completo: userData.nome_completo,
                cpf: userData.cpf
            }
        });

        if (error) {
            console.error('Error creating auth user:', error);
            // return; // Don't return, try profile anyway?
        } else {
             console.log('Auth user created:', data.user.id);
             userId = data.user.id;
        }
    }
    */

    console.log('Attempting to upsert profile for ID:', userId);

    // 2. Insert/Update Profile
    console.log('Upserting profile...');
    const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
            id: userId,
            nome_completo: userData.nome_completo,
            email: userData.email,
            cpf: userData.cpf,
            telefone: userData.telefone,
            chapa: userData.chapa,
            dt_nasc: userData.dt_nasc,
            sexo: userData.sexo,
            role: userData.role,
            status: userData.status,
            // Assuming default empty values for others
            created_at: new Date().toISOString()
        });

    if (profileError) {
        console.error('Error upserting profile:', profileError);
    } else {
        console.log('Profile upserted successfully!');
    }
}

importUser();

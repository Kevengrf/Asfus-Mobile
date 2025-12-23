const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEW_SUPABASE_URL || 'https://pecvhaagsheziwdugizm.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function check() {
    console.log('--- Debug Users ---');

    // 1. Count Profiles
    const { count: profileCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    console.log(`Perfis no DB: ${profileCount}`);

    // 2. Count Auth Users
    let allUsers = [];
    let page = 1;
    const perPage = 50;

    while (true) {
        const { data: { users }, error } = await supabase.auth.admin.listUsers({ page, perPage });
        if (error) {
            console.error('Erro listUsers:', error);
            break;
        }
        if (!users || users.length === 0) break;

        allUsers = allUsers.concat(users);
        console.log(`Page ${page}: ${users.length} users retrieved.`);
        page++;
        if (users.length < perPage) break;
    }

    console.log(`Total Auth Users fetched: ${allUsers.length}`);

    if (allUsers.length > 0) {
        console.log('Exemplo de Email:', allUsers[0].email);
    }
}

check();

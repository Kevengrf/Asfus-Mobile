const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Error: ENV variables missing.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function listAllUsers() {
    console.log('--- Listing ALL Auth Users ---');

    let allUsers = [];
    let page = 1;
    let keepGoing = true;

    while (keepGoing) {
        const { data: { users }, error } = await supabase.auth.admin.listUsers({ page: page, perPage: 50 });

        if (error) {
            console.error('List Error:', error.message);
            break;
        }

        if (!users || users.length === 0) {
            keepGoing = false;
        } else {
            users.forEach(u => {
                console.log(`[${u.id}] ${u.email} (Role: ${u.role})`);
                allUsers.push(u);
            });
            page++;
        }
    }
    console.log(`Total Found: ${allUsers.length}`);
}

listAllUsers();

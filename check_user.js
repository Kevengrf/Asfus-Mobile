require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function findUser() {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .ilike('nome_completo', '%Manoel Cicero Ricarte%');

    if (error) {
        console.error('Error fetching user:', error);
    } else {
        console.log('User found:', data);

        if (data.length === 0) {
            // Try searching by broader terms
            console.log('Searching by name "Manoel"...');
            const { data: dataManoel, error: errorManoel } = await supabase
                .from('profiles')
                .select('*')
                .ilike('nome_completo', '%Manoel%')
                .limit(10);

            if (errorManoel) console.error(errorManoel);
            else console.log('Matches for Manoel:', dataManoel);

            console.log('Searching by name "Cicero"...');
            const { data: dataCicero, error: errorCicero } = await supabase
                .from('profiles')
                .select('*')
                .ilike('nome_completo', '%Cicero%')
                .limit(10);

            if (errorCicero) console.error(errorCicero);
            else console.log('Matches for Cicero:', dataCicero);

            console.log('Searching by name "Ricarte"...');
            const { data: dataRicarte, error: errorRicarte } = await supabase
                .from('profiles')
                .select('*')
                .ilike('nome_completo', '%Ricarte%')
                .limit(10);

            if (errorRicarte) console.error(errorRicarte);
            else console.log('Matches for Ricarte:', dataRicarte);

            console.log('Searching by CPF "29028981420"...');
            const { data: dataCpf, error: errorCpf } = await supabase
                .from('profiles')
                .select('*')
                .eq('cpf', '29028981420');

            if (errorCpf) console.error(errorCpf);
            else console.log('Matches for CPF:', dataCpf);
        }
    }
}

findUser();

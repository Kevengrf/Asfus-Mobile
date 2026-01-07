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
    nome_completo: 'MANOEL CICERO RICARTE DE MOURA',
    cpf: '29028981420',
    telefone: '81041020738',
    chapa: '0000305',
    dt_nasc: '1962-03-19',
    sexo: 'M'
    // role: 'admin' (preserved)
    // email: 'admin@asfus.com.br' (preserved)
};

async function updateAdmin() {
    console.log('Updating Admin Profile with Manoel\'s data...');

    const { data, error } = await supabase
        .from('profiles')
        .update({
            nome_completo: userData.nome_completo,
            telefone: userData.telefone,
            chapa: userData.chapa,
            dt_nasc: userData.dt_nasc,
            sexo: userData.sexo
        })
        .eq('cpf', userData.cpf)
        .select();

    if (error) {
        console.error('Error updating profile:', error);
    } else {
        console.log('Profile updated successfully:', data);
    }
}

updateAdmin();

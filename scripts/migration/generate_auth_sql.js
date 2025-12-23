
const fs = require('fs');
const path = require('path');
const Papa = require('papaparse'); // Já deve estar instalado no projeto, se não, use npm install papaparse

const INPUT_FILE = path.resolve(__dirname, '../../users_backup.csv');
const OUTPUT_FILE = path.resolve(__dirname, '../../import_auth_users.sql');

function generateSql() {
    if (!fs.existsSync(INPUT_FILE)) {
        console.error('ERRO: Arquivo users_backup.csv não encontrado na raiz do projeto.');
        console.log('Por favor, renomeie seu arquivo CSV exportado para "users_backup.csv" e coloque na pasta principal.');
        return;
    }

    console.log('Lendo CSV...');
    const csvFile = fs.readFileSync(INPUT_FILE, 'utf8');

    Papa.parse(csvFile, {
        header: true,
        skipEmptyLines: true,
        complete: function (results) {
            const users = results.data;
            let sqlContent = '-- Script gerado automaticamente para importar usuários em auth.users\n\n';

            // Campos essenciais que geralmente queremos importar
            // O CSV do Supabase pode ter muitos campos. Vamos focar nos principais e nos que tiverem valor.
            // Mapeamento de colunas se necessário, mas geralmente os nomes batem.

            users.forEach(user => {
                // Sanitização básica
                const columns = [];
                const values = [];

                // Lista de colunas permitidas/esperadas na tabela auth.users
                // Ajuste conforme seu CSV. O CSV do "SELECT * FROM auth.users" retorna exatamente as colunas do DB.
                const allowedColumns = [
                    'id', 'instance_id', 'aud', 'role', 'email', 'encrypted_password',
                    'email_confirmed_at', 'invited_at', 'confirmation_token', 'confirmation_sent_at',
                    'recovery_token', 'recovery_sent_at', 'email_change_token_new', 'email_change',
                    'email_change_sent_at', 'last_sign_in_at', 'raw_app_meta_data', 'raw_user_meta_data',
                    'is_super_admin', 'created_at', 'updated_at', 'phone', 'phone_confirmed_at',
                    'phone_change', 'phone_change_token', 'phone_change_sent_at',
                    'email_change_token_current', 'email_change_confirm_status', 'banned_until',
                    'reauthentication_token', 'reauthentication_sent_at', 'is_sso_user', 'deleted_at'
                ];

                for (const key in user) {
                    if (allowedColumns.includes(key)) {
                        let value = user[key];

                        // Tratar nulls e vazios e a string "null" que vem do CSV
                        if (value === '' || value === undefined || value === null) {
                            value = 'NULL';
                        } else if (typeof value === 'string' && value.toLowerCase() === 'null') {
                            value = 'NULL';
                        } else {
                            // Escapar aspas simples
                            value = value.replace(/'/g, "''");

                            // Tratar JSON blobs (meta_data)
                            if (key.includes('meta_data')) {
                                value = `'${value}'`;
                            } else {
                                value = `'${value}'`;
                            }
                        }

                        // Casos booleanos (Postgres aceita 't', 'f', true, false, mas CSV pode vir diferente)
                        if (key === 'is_super_admin' || key === 'is_sso_user') {
                            if (value === "'t'" || value === "'true'") value = 'true';
                            if (value === "'f'" || value === "'false'") value = 'false';
                        }

                        columns.push(`"${key}"`);
                        values.push(value);
                    }
                }

                if (columns.length > 0) {
                    const insert = `INSERT INTO auth.users (${columns.join(', ')}) VALUES (${values.join(', ')}) ON CONFLICT (id) DO NOTHING;\n`;
                    sqlContent += insert;
                }
            });

            // Adicionar Identity se houver identidades (opcional, complexo via CSV simples)

            fs.writeFileSync(OUTPUT_FILE, sqlContent);
            console.log(`Sucesso! Script gerado em: ${OUTPUT_FILE}`);
            console.log(`Abra este arquivo no SQL Editor do seu NOVO Supabase e execute.`);
        }
    });
}

generateSql();

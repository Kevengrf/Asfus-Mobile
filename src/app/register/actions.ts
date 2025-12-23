'use server';

import { supabaseAdmin } from "@/lib/supabase/admin";
import { randomUUID } from "node:crypto";

export async function submitRegistration(formData: FormData) {
    const nome_completo = formData.get("nome") as string;
    const cpf = formData.get("cpf") as string;
    const codtipo = formData.get("codtipo") as string;
    const chapa = formData.get("chapa") as string;
    const dt_nasc = formData.get("dt_nasc") as string;
    const sexo = formData.get("sexo") as string;
    const telefone1 = formData.get("telefone1") as string;
    const email = formData.get("email") as string;

    const nome_dependente = formData.get("nome_dependente") as string;
    const sexo_dependente = formData.get("sexo_dependente") as string;
    const grauparentesco_dependente = formData.get("grauparentesco_dependente") as string;
    const data_nascimento_dependente = formData.get("data_nascimento_dependente") as string;

    // Validation
    if (!cpf || !email || !nome_completo) {
        return { error: 'Campos obrigatórios faltando.' };
    }

    // 1. Check if user already exists
    const { data: existingProfiles, error: checkError } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .or(`cpf.eq.${cpf},email.eq.${email}`);

    if (existingProfiles && existingProfiles.length > 0) {
        return { error: 'Já existe um cadastro com este CPF ou Email.' };
    }

    // 2. Create Auth User (Placeholder)
    // We create a user with a random password since they will set it later via First Access.
    // They cannot login until status is 'ativo'.
    // Status default is likely 'pendente' or we force it.

    // Generate a temporary random password
    const tempPassword = `Temp@${randomUUID().substring(0, 8)}`;

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
            nome_completo,
            cpf,
            codtipo,
            chapa,
            dt_nasc,
            sexo,
            telefone: telefone1,
            // Dependents
            nome_dependente: nome_dependente || null,
            sexo_dependente: sexo_dependente || null,
            grauparentesco_dependente: grauparentesco_dependente || null,
            data_nascimento_dependente: data_nascimento_dependente || null,
            // Status
            status: 'pendente', // Force pending
            role: 'user'
        }
    });

    if (authError) {
        return { error: `Erro ao criar solicitação: ${authError.message}` };
    }

    const userId = authData.user.id;

    // 3. Create Profile (if trigger didn't catch it, or to update status)
    // Our trigger 'on_auth_user_created' might have run.
    // Let's ensure connection and status.
    const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .upsert({
            id: userId,
            email,
            nome_completo,
            cpf,
            codtipo,
            chapa,
            dt_nasc,
            sexo,
            telefone: telefone1,
            dependentes: nome_dependente ? [{
                nome: nome_dependente,
                sexo: sexo_dependente,
                parentesco: grauparentesco_dependente,
                dt_nasc: data_nascimento_dependente
            }] : [], // Adjust jsonb structure if needed, or flat fields
            // Assuming flat fields based on register page usage? 
            // Register page passed them to metadata. Trigger might have mapped them. 
            // Let's assume Trigger mapped them or flat fields exist. 
            // Based on previous files, profiles has flat fields for ONE dependent?
            // "nome_dependente", "sexo_dependente"... yes.
            nome_dependente: nome_dependente || null,
            sexo_dependente: sexo_dependente || null,
            grauparentesco_dependente: grauparentesco_dependente || null,
            data_nascimento_dependente: data_nascimento_dependente || null,

            status: 'pendente',
            role: 'user'
        });

    if (updateError) {
        // cleanup
        await supabaseAdmin.auth.admin.deleteUser(userId);
        return { error: `Erro ao salvar perfil: ${updateError.message}` };
    }

    return { success: true };
}

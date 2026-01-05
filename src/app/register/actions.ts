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

    const dependentesHeader = formData.get("dependentes_json") as string;
    let dependentesList: any[] = [];
    try {
        if (dependentesHeader) {
            dependentesList = JSON.parse(dependentesHeader);
        }
    } catch (e) {
        console.error("Error parsing dependentes:", e);
    }

    // Validation
    const cleanCpf = cpf.replace(/\D/g, '');

    if (!cleanCpf || !email || !nome_completo) {
        return { error: 'Campos obrigatórios faltando.' };
    }

    // --- ORPHAN CLEANUP ---
    // 1. Check Email Orphan
    const { data: orphanEmail } = await supabaseAdmin.from('profiles').select('id').eq('email', email).single();
    if (orphanEmail) {
        const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(orphanEmail.id);
        if (!authUser?.user) {
            console.log(`[Register] Orphan by Email ${email}. Cleaning up...`);
            await supabaseAdmin.from('profiles').delete().eq('id', orphanEmail.id);
        }
    }
    // 2. Check CPF Orphan
    if (cleanCpf) {
        const { data: orphanCPF } = await supabaseAdmin.from('profiles').select('id, email').eq('cpf', cleanCpf).single();
        if (orphanCPF) {
            const { data: authUserCPF } = await supabaseAdmin.auth.admin.getUserById(orphanCPF.id);
            if (!authUserCPF?.user) {
                console.log(`[Register] Orphan by CPF ${cleanCpf}. Cleaning up...`);
                await supabaseAdmin.from('profiles').delete().eq('id', orphanCPF.id);
            } else {
                // Conflict
                if (orphanCPF.email !== email) {
                    return { error: `CPF já cadastrado para outro email: ${orphanCPF.email}` };
                }
            }
        }
    }

    // 1. Check if user already exists (Double check after cleanup)
    const { data: existingProfiles, error: checkError } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .or(`cpf.eq.${cleanCpf},email.eq.${email}`);

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
            // Dependents - Saving list instead of flat fields
            dependentes: dependentesList,
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
            dependentes: dependentesList, // Save dynamic list

            // Remove flat fields from DB save if schema doesn't require them or if we want to clean up
            // Keeping them null to avoid errors if columns exist and are not nullable (unlikely for dependents)
            nome_dependente: null,
            sexo_dependente: null,
            grauparentesco_dependente: null,
            data_nascimento_dependente: null,

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

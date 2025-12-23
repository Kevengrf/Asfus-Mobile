'use server'

import { supabaseAdmin } from "@/lib/supabase/admin";

export async function checkCpf(cpf: string) {
    if (!cpf) return { error: "CPF inválido" };

    const cleanCpf = cpf.replace(/\D/g, '');
    const possibilities = [
        cleanCpf,
        cleanCpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
    ];

    const { data: profiles, error } = await supabaseAdmin
        .from('profiles')
        .select('id, email, nome_completo, cpf, status')
        .in('cpf', possibilities)
        .limit(1);

    if (error || !profiles || profiles.length === 0) {
        return { error: "CPF não encontrado na base de dados. Solicite seu cadastro." };
    }

    const profile = profiles[0];

    // Status check
    if (profile.status === 'rejeitado') {
        return { error: "Seu cadastro foi rejeitado. Entre em contato com a administração." };
    }
    if (profile.status === 'pendente') {
        // Pending users CAN do first access to set password? Or wait for approval?
        // User says: "when he is permitted by admin he can access first access"
        // So checking status 'ativo' might be required?
        // But maybe "First Access" IS the activation?
        // The prompt says: "quando ele é permitido pelo admin ele pode acessar o primeiro acesso"
        // This implies: Register -> Pending -> Admin Approves (Active) -> First Access.
        // So if Pending, we tell them to wait.
        return { error: "Seu cadastro ainda está em análise. Aguarde aprovação." };
    }

    // Existing Auth User check
    // We WANT to find the auth user to update it.
    // If no auth user exists (orphaned profile), we'll create one later.

    return {
        success: true,
        name: profile.nome_completo,
        email: profile.email || '',
        cpf: profile.cpf,
        exists: true // Flag to frontend/next step
    };
}

export async function activateAccount(prevState: any, formData: FormData) {
    const cpf = formData.get("cpf") as string;
    let email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (password !== confirmPassword) {
        return { success: false, error: "As senhas não coincidem." };
    }
    if (password.length < 6) {
        return { success: false, error: "A senha deve ter no mínimo 6 caracteres." };
    }

    // 1. Validation
    const cleanCpf = cpf.replace(/\D/g, '');
    const possibilities = [
        cleanCpf,
        cleanCpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
    ];

    const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('id, email, status')
        .in('cpf', possibilities)
        .single();

    if (!profile) return { success: false, error: "Perfil não encontrado." };

    if (profile.status !== 'ativo') {
        return { success: false, error: "Conta não está ativa. Contate o administrador." };
    }

    const userId = profile.id;

    // 2. Check if Auth User Exists
    const { data: authUser, error: authFetchError } = await supabaseAdmin.auth.admin.getUserById(userId);

    // 3. Create or Update Logic
    if (authFetchError || !authUser) {
        // Create new user linked to profile
        const { error: createError } = await supabaseAdmin.auth.admin.createUser({
            id: userId,
            email: email,
            password: password,
            email_confirm: true,
            user_metadata: {
                nome_completo: formData.get("name") || "", // We don't have name easily here unless we fetch profile again or pass it
                skip_profile_creation: true
            }
        });
        if (createError) return { success: false, error: createError.message };
    } else {
        // User exists, just update password
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
            password: password,
            email_confirm: true
        });
        if (updateError) return { success: false, error: updateError.message };
    }

    // 4. Update Profile Email if changed
    if (email && email !== profile.email) {
        await supabaseAdmin
            .from('profiles')
            .update({ email: email })
            .eq('id', userId);

        // Also update auth email if we didn't just create it with that email
        if (authUser) {
            await supabaseAdmin.auth.admin.updateUserById(userId, { email: email });
        }
    }

    return { success: true, error: "" };
}

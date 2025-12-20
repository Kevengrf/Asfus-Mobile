'use server'

import { supabaseAdmin } from "@/lib/supabase/admin";

export async function checkCpf(cpf: string) {
    if (!cpf) return { error: "CPF inválido" };

    const cleanCpf = cpf.replace(/\D/g, '');

    // Try finding exact match or formatted match?
    // Let's search by likely formats.
    // Assuming DB has formatted or unformatted. Ideally we should normalize checks.
    // But since Supabase 'or' query with mixed types is annoying, let's just fetch by clean version if possible?
    // We'll trust the user has normalized data or we search broadly.
    // Let's fetch all profiles and filter in memory if needed? No, inefficient.
    // Let's try flexible search.

    // Actually, `getEmailByCpf` logic tried multiple formats.
    const possibilities = [
        cleanCpf,
        cleanCpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
    ];

    const { data: profiles, error } = await supabaseAdmin
        .from('profiles')
        .select('id, email, nome_completo, cpf')
        .in('cpf', possibilities)
        .limit(1);

    if (error || !profiles || profiles.length === 0) {
        return { error: "CPF não encontrado na base de dados." };
    }

    const profile = profiles[0];

    // Check if user already exists in Auth
    try {
        const { data: user, error: userError } = await supabaseAdmin.auth.admin.getUserById(profile.id);
        if (user && user.user) {
            return { error: "Este usuário já possui cadastro ativo. Tente fazer login ou resetar a senha." };
        }
    } catch (e) {
        // User likely doesn't exist, which is good.
    }

    return {
        success: true,
        name: profile.nome_completo,
        email: profile.email || '',
        cpf: profile.cpf
    };
}

export async function activateAccount(prevState: any, formData: FormData) {
    const cpf = formData.get("cpf") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (password !== confirmPassword) {
        return { success: false, error: "As senhas não coincidem." };
    }

    if (password.length < 6) {
        return { success: false, error: "A senha deve ter no mínimo 6 caracteres." };
    }

    // 1. Fetch Profile again to be safe
    const check = await checkCpf(cpf);
    if (!check.success || !check.cpf) {
        return { success: false, error: check.error || "Erro ao validar CPF." };
    }

    // Recover ID from profile search (checkCpf didn't return ID to client for security, but we need it here)
    // We'll re-fetch ID securely.
    const cleanCpf = cpf.replace(/\D/g, '');
    const possibilities = [
        cleanCpf,
        cleanCpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
    ];

    const { data: profiles } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .in('cpf', possibilities)
        .single();

    if (!profiles) return { success: false, error: "Perfil não encontrado." };
    const userId = profiles.id;

    // 2. Create Auth User
    const { data: user, error: createError } = await supabaseAdmin.auth.admin.createUser({
        id: userId, // Correct property is 'id', not 'uid'
        email: email,
        password: password,
        email_confirm: true, // Auto confirm
        user_metadata: {
            nome_completo: check.name,
            skip_profile_creation: true
        }
    } as any);

    if (createError) {
        // Handle "User already registered" specifically if checkCpf missed it
        if (createError.message.includes("already registered")) {
            return { success: false, error: "Usuário já registrado. Faça login." };
        }
        return { success: false, error: `Erro ao criar usuário: ${createError.message}` };
    }

    // 3. Update Profile Email if changed
    // We always update it to ensure consistency with Auth
    if (email) {
        await supabaseAdmin
            .from('profiles')
            .update({ email: email })
            .eq('id', userId);
    }

    return { success: true, error: "" };
}

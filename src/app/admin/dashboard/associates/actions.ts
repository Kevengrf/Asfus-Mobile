
'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

export async function addAssociate(formData: FormData) {
  const nome_completo = formData.get("nome") as string;
  const cpf = formData.get("cpf") as string;
  const codtipo = formData.get("codtipo") as string;
  const chapa = formData.get("chapa") as string;
  const dt_nasc = formData.get("dt_nasc") as string;
  const sexo = formData.get("sexo") as string;
  const telefone1 = formData.get("telefone1") as string;
  const email = formData.get("email") as string;
  let password = formData.get("password") as string;

  // Sanitiza o CPF (remove tudo que não for número)
  const cleanCpf = cpf.replace(/\D/g, '');

  if (!email || !nome_completo) {
    return { error: 'Campos obrigatórios estão faltando.' };
  }

  // --- Limpeza de Perfis Orfãos (Fix Database Error) ---
  console.log(`[addAssociate] Iniciando criação para ${email} / CPF: ${cleanCpf}`);

  // 1. Verificação por Email
  const { data: existingProfileByEmail } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('email', email)
    .single();

  if (existingProfileByEmail) {
    const { data: authUser, error: authCheckError } = await supabaseAdmin.auth.admin.getUserById(existingProfileByEmail.id);
    if (authCheckError || !authUser?.user) {
      console.log(`[addAssociate] Perfil órfão encontrado por Email (${email}). Removendo...`);
      await supabaseAdmin.from('profiles').delete().eq('id', existingProfileByEmail.id);
    }
  }

  // 2. Verificação por CPF
  if (cleanCpf) {
    const { data: existingProfileByCPF } = await supabaseAdmin
      .from('profiles')
      .select('id, email')
      .eq('cpf', cleanCpf)
      .single();

    if (existingProfileByCPF) {
      const { data: authUserCPF, error: authErrorCPF } = await supabaseAdmin.auth.admin.getUserById(existingProfileByCPF.id);

      if (authErrorCPF || !authUserCPF?.user) {
        console.log(`[addAssociate] Perfil órfão encontrado por CPF (${cleanCpf}). Removendo...`);
        await supabaseAdmin.from('profiles').delete().eq('id', existingProfileByCPF.id);
      } else {
        if (existingProfileByCPF.email !== email) {
          return { error: `Este CPF já está sendo usado pelo usuário: ${existingProfileByCPF.email}` };
        }
      }
    }
  }

  // Set default password if not provided
  if (!password) {
    if (cleanCpf.length >= 6) {
      password = `Asfus@${cleanCpf.substring(0, 6)}`;
    } else {
      password = 'Asfus@123456'; // Fallback
    }
  }

  // 1. Create user in auth.users
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role: 'user', status: 'ativo', nome_completo }
  });

  if (authError) {
    return { error: authError.message };
  }
  const user = authData.user;

  // 2. Upsert profile
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .upsert({
      id: user.id,
      role: 'user',
      status: 'ativo',
      nome_completo,
      cpf: cleanCpf,
      email,
      telefone: telefone1,
      codtipo,
      chapa,
      dt_nasc,
      sexo
    });

  if (profileError) {
    // If updating profile fails, delete the created auth user for consistency
    await supabaseAdmin.auth.admin.deleteUser(user.id);
    return { error: `Falha ao atualizar o perfil do associado: ${profileError.message}` };
  }

  revalidatePath('/admin/dashboard/associates');
  return { data: { user } };
}

export async function promoteToAdmin(userId: string) {
  if (!userId) {
    return { error: 'ID do usuário é obrigatório.' };
  }

  const { error } = await supabaseAdmin
    .from('profiles')
    .update({ role: 'admin' })
    .eq('id', userId);

  if (error) {
    console.error('Erro ao promover para admin:', error.message);
    return { error: `Erro ao promover usuário: ${error.message}` };
  }

  // 2. Sync with Auth Metadata (Required for Middleware/Login redirection)
  const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    user_metadata: { role: 'admin' }
  });

  if (authError) {
    console.error('Warning: Failed to sync admin role to Auth metadata:', authError.message);
  }

  revalidatePath('/admin/dashboard/associates');
  revalidatePath('/admin/dashboard/admins');
  return { message: 'Usuário promovido a administrador com sucesso!' };
}

export async function deleteAssociate(userId: string) {
  if (!userId) {
    return { error: 'ID do usuário é obrigatório.' };
  }

  // 1. Delete from AuthService
  const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);

  if (authError && !authError.message.includes('User not found')) {
    console.error('Erro ao deletar associado do Auth:', authError.message);
    return { error: `Erro ao deletar associado do Auth: ${authError.message}` };
  }

  // 2. Delete from Profiles table (manual cleanup to ensure it disappears from lists)
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .delete()
    .eq('id', userId);

  if (profileError) {
    console.error('Erro ao deletar perfil do associado:', profileError.message);
    // Not returning error here because Auth user is already gone, so it's partially successful.
    // Ideally we would use a transaction or cascade.
  }

  revalidatePath('/admin/dashboard/associates');
  revalidatePath('/admin/dashboard/admins'); // Also revalidate admins in case it was an admin
  return { message: 'Associado deletado com sucesso!' };
}

export async function approveAssociate(userId: string) {
  if (!userId) return { error: 'ID inválido' };

  const { error } = await supabaseAdmin
    .from('profiles')
    .update({ status: 'ativo' })
    .eq('id', userId);

  if (error) {
    return { error: `Erro ao aprovar: ${error.message}` };
  }

  revalidatePath('/admin/dashboard');

  // Log Action
  const { createClient } = await import("@/lib/supabase/server");
  const supabaseRel = createClient();
  const { data: { user: adminUser } } = await supabaseRel.auth.getUser();

  if (adminUser) {
    const { logActionServer } = await import("@/lib/audit-server");
    // Fetch user name for target?
    const { data: targetProfile } = await supabaseAdmin.from('profiles').select('nome_completo').eq('id', userId).single();
    await logActionServer(adminUser.id, 'Aprovar Associado', `Associado: ${targetProfile?.nome_completo || userId}`, { associate_id: userId });
  }

  return { message: 'Associado aprovado com sucesso!' };
}

export async function rejectAssociate(userId: string) {
  if (!userId) return { error: 'ID inválido' };

  const { error } = await supabaseAdmin
    .from('profiles')
    .update({ status: 'rejeitado' })
    .eq('id', userId);

  if (error) {
    return { error: `Erro ao rejeitar: ${error.message}` };
  }

  revalidatePath('/admin/dashboard');

  // Log Action
  const { createClient } = await import("@/lib/supabase/server");
  const supabaseRel = createClient();
  const { data: { user: adminUser } } = await supabaseRel.auth.getUser();

  if (adminUser) {
    const { logActionServer } = await import("@/lib/audit-server");
    const { data: targetProfile } = await supabaseAdmin.from('profiles').select('nome_completo').eq('id', userId).single();
    await logActionServer(adminUser.id, 'Rejeitar Associado', `Associado: ${targetProfile?.nome_completo || userId}`, { associate_id: userId });
  }

  return { message: 'Associado rejeitado com sucesso!' };
}

export async function resetPassword(userId: string) {
  if (!userId) return { error: 'ID inválido' };

  // 1. Fetch user profile to get CPF
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('cpf, email')
    .eq('id', userId)
    .single();

  if (profileError || !profile) {
    return { error: `Erro ao buscar perfil para resetar senha: ${profileError?.message}` };
  }

  let newPassword = 'Asfus@123456';
  if (profile.cpf) {
    const cleanCpf = profile.cpf.replace(/\D/g, '');
    if (cleanCpf.length >= 6) {
      newPassword = `Asfus@${cleanCpf.substring(0, 6)}`;
    }
  }

  const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    password: newPassword,
    user_metadata: { must_change_password: true }
  });

  if (error) {
    // If user doesn't exist (Imported user), create them now
    if (error.message.toLowerCase().includes("user not found")) {
      console.log('User not found in Auth, creating new user for profile:', userId);
      const { error: createError } = await supabaseAdmin.auth.admin.createUser({
        id: userId, // Link to existing profile
        email: profile.email,
        password: newPassword,
        email_confirm: true,
        user_metadata: {
          must_change_password: true,
          skip_profile_creation: true
        }
      });

      if (createError) {
        console.error('Error creating user during reset:', createError);
        return { error: "Erro ao criar usuário: " + createError.message };
      }

      return { message: `Usuário importado ativado! Senha definida para: ${newPassword}` };
    }

    console.error('Erro ao resetar senha:', error.message);
    return { error: `Erro ao resetar senha: ${error.message}` };
  }

  return { message: `Senha resetada com sucesso para: ${newPassword}` };
}

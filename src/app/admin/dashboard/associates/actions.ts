
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
  const password = formData.get("password") as string;

  if (!email || !password || !nome_completo) {
    return { error: 'Campos obrigatórios estão faltando.' };
  }

  // 1. Create user in auth.users
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError) {
    return { error: authError.message };
  }
  const user = authData.user;
  
  // 2. Update the profile that was created by the trigger
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .update({ 
        role: 'user', 
        status: 'ativo',
        nome_completo,
        cpf,
        email,
        telefone: telefone1,
        codtipo,
        chapa,
        dt_nasc,
        sexo
    })
    .eq('id', user.id);

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

  revalidatePath('/admin/dashboard/associates');
  revalidatePath('/admin/dashboard/admins');
  return { message: 'Usuário promovido a administrador com sucesso!' };
}


'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server'; // Import server client
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

// Tipagem para o estado do formulário, usado pelo useFormState
export interface FormState {
  message: string;
  type: 'success' | 'error';
}

export async function createAdminUser(
  prevState: FormState | undefined,
  formData: FormData
): Promise<FormState> {
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const cpf = formData.get('cpf') as string;
  const codtipo = formData.get('codtipo') as string;
  const chapa = formData.get('chapa') as string;
  const dt_nasc = formData.get('dt_nasc') as string;
  const sexo = formData.get('sexo') as string;
  const telefone1 = formData.get('telefone1') as string;


  // --- Validação dos Dados ---
  if (!name || !email || !password || !cpf) {
    return {
      message: 'Nome, Email, CPF e Senha são obrigatórios.',
      type: 'error',
    };
  }
  if (password.length < 8) {
    return {
      message: 'A senha deve ter no mínimo 8 caracteres.',
      type: 'error',
    };
  }

  // --- Criação do Usuário no Auth ---
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // Auto-confirma o email
  });

  if (authError) {
    console.error('Erro ao criar usuário no Auth:', authError.message);
    return {
      message: `Erro ao criar autenticação: ${authError.message}`,
      type: 'error',
    };
  }
  const user = authData.user;
  if (!user) {
    return { message: 'Não foi possível criar o usuário.', type: 'error' };
  }

  // --- Inserção do Perfil na Tabela 'profiles' ---
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .update({
      nome_completo: name,
      role: 'admin',
      status: 'ativo',
      cpf,
      codtipo,
      chapa,
      dt_nasc,
      sexo,
      telefone: telefone1,
      email, // Ensure email is saved to profile
    })
    .eq('id', user.id);

  if (profileError) {
    console.error('Erro ao atualizar perfil:', profileError.message);
    // Se a atualização do perfil falhar, deleta o usuário do Auth para evitar inconsistência
    await supabaseAdmin.auth.admin.deleteUser(user.id);
    return {
      message: `Erro ao atualizar perfil: ${profileError.message}`,
      type: 'error',
    };
  }

  // --- Sucesso ---
  // Revalida o path para que a lista de admins seja atualizada na página
  revalidatePath('/admin/dashboard/admins');

  return {
    message: `Administrador "${name}" criado com sucesso!`,
    type: 'success',
  };
}

export async function getAdmins() {
  // Busca direta na tabela profiles, evitando dependência de paginação do listUsers
  const { data: profiles, error: profilesError } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('role', 'admin');

  if (profilesError) {
    console.error('Erro ao buscar perfis de admin:', profilesError.message);
    return [];
  }

  // Retorna os perfis diretamente. O email agora deve estar salvo no perfil.
  // Se não estiver, o componente vai mostrar o que tiver ou N/A.
  return profiles || [];
}

export async function deleteAdmin(userId: string) {
  // 1. Delete from AuthService
  const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);

  if (authError && !authError.message.includes('User not found')) {
    console.error("Error deleting admin from Auth:", authError.message)
    return { error: 'Erro ao deletar o admin do Auth.' };
  }

  // 2. Delete from Profiles table
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .delete()
    .eq('id', userId);

  if (profileError) {
    console.error("Error deleting admin profile:", profileError.message)
    // Similar to deleteAssociate, we don't return error if Auth deletion succeeded
  }

  revalidatePath('/admin/dashboard/admins');
  return { message: 'Admin deletado com sucesso.' };
}

export async function demoteAdmin(userId: string) {
  if (!userId) {
    return { error: 'ID do usuário é obrigatório.' };
  }

  const { error } = await supabaseAdmin
    .from('profiles')
    .update({ role: 'user' })
    .eq('id', userId);

  if (error) {
    console.error('Erro ao demover admin:', error.message);
    return { error: `Erro ao demover admin: ${error.message}` };
  }

  revalidatePath('/admin/dashboard/admins');
  revalidatePath('/admin/dashboard/associates');
  return { message: 'Admin removido da lista de administradores com sucesso.' };
}

export async function logout() {
  const supabase = createClient(); // Server client
  await supabase.auth.signOut();
  revalidatePath('/', 'layout'); // Revalidate all layouts
  redirect('/login'); // Redirect to login page
}

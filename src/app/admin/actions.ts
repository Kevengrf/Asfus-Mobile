
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
    const { data: { users }, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (usersError) {
        console.error('Erro ao buscar usuários do Auth:', usersError.message);
        return [];
    }

    const userIds = users.map(u => u.id);
    if (userIds.length === 0) {
        return [];
    }

    const { data: profiles, error: profilesError } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .in('id', userIds)
        .eq('role', 'admin');

    if (profilesError) {
        console.error('Erro ao buscar perfis de admin:', profilesError.message);
        return [];
    }
    
    const profilesMap = new Map(profiles.map((p: { id: string }) => [p.id, p]));
    
    const finalAdmins = users
        .map(user => {
            const profile = profilesMap.get(user.id);
            if (!profile) return null;
            
            return {
                ...user,
                ...profile
            };
        })
        .filter(userOrNull => userOrNull !== null);

    return finalAdmins;
}

export async function deleteAdmin(userId: string) {
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (error) {
        console.error("Error deleting admin:", error.message)
        return { error: 'Erro ao deletar o admin.' };
    }
    
    revalidatePath('/admin/dashboard/admins');
    return { message: 'Admin deletado com sucesso.' };
}

export async function logout() {
  const supabase = createClient(); // Server client
  await supabase.auth.signOut();
  revalidatePath('/', 'layout'); // Revalidate all layouts
  redirect('/login'); // Redirect to login page
}

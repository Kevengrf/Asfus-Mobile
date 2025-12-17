
'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

export async function inviteAdmin(prevState: any, formData: FormData) {
  const email = formData.get('email') as string;

  if (!email) {
    return { error: 'Email is required.' };
  }

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    email_confirm: true, // Automatically confirm the email
  });

  if (error) {
    if (error.message.includes('unique constraint')) {
        return { error: 'Este email já está em uso.' };
    }
    return { error: 'Ocorreu um erro ao enviar o convite.' };
  }
  
  // Assumindo que o trigger fará a inserção na tabela profiles
  // e definirá a role e o status. Se não, precisamos fazer isso aqui.
  
  revalidatePath('/admin/dashboard/admins');
  return { data, message: "Convite enviado com sucesso!" };
}

export async function getAdmins() {
    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();
    
    if (error) {
        console.error('Error fetching users:', error);
        return [];
    }

    // O trigger deve criar um perfil para cada usuário.
    // Vamos buscar os perfis para pegar a 'role' e 'status'.
    const { data: profiles, error: profilesError } = await supabaseAdmin
        .from('profiles')
        .select('*');

    if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        return [];
    }
    
    // Mapeia os perfis para um acesso mais fácil
    const profilesMap = new Map(profiles.map(p => [p.id, p]));
    
    // Filtra para retornar apenas administradores e anexa o status
    const admins = users
        .map(user => {
            const profile = profilesMap.get(user.id);
            return {
                ...user,
                role: profile?.role,
                status: profile?.status,
            };
        })
        .filter(user => user.role === 'admin');

    return admins;
}

export async function updateAdminStatus(userId: string, status: 'ativo' | 'pendente') {
    const { data, error } = await supabaseAdmin
        .from('profiles')
        .update({ status })
        .eq('id', userId);

    if (error) {
        return { error: 'Erro ao atualizar o status do admin.' };
    }
    revalidatePath('/admin/dashboard/admins');
    return { data };
}

export async function deleteAdmin(userId: string) {
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (error) {
        // O trigger no banco de dados deve cuidar da remoção do perfil associado
        return { error: 'Erro ao deletar o admin.' };
    }
    
    revalidatePath('/admin/dashboard/admins');
    return { message: 'Admin deletado com sucesso.' };
}

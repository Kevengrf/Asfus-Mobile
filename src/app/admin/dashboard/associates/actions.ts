
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

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      nome_completo,
      cpf,
      codtipo,
      chapa,
      dt_nasc,
      sexo,
      telefone1,
      role: 'user',
      status: 'ativo'
    },
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/admin/dashboard/associates');
  return { data };
}

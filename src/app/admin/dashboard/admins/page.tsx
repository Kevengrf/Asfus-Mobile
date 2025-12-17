
import { getAdmins } from '../../actions';
import { AdminsClient } from '@/components/admin/AdminsClient';

// Este agora é um Server Component, que roda no servidor.
export default async function AdminsPage() {
  // 1. Busca os dados no servidor antes de a página ser renderizada.
  // A função 'getAdmins' agora está mais robusta.
  const admins = await getAdmins();

  // 2. Passa os dados iniciais para o componente de cliente.
  // O componente de cliente vai lidar com a interatividade (delete, etc).
  return <AdminsClient initialAdmins={admins as any} />;
}

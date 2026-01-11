import { supabaseAdmin } from "@/lib/supabase/admin";
import AdminDashboardClient from "@/components/admin/AdminDashboardClient";

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const { data: pendingProfiles, error } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('status', 'pendente')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching pending profiles:", error);
    return <div>Erro ao carregar solicitações.</div>;
  }

  return <AdminDashboardClient pendingProfiles={pendingProfiles as any} />;
}

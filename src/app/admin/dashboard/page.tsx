
import { redirect } from 'next/navigation';

// This is a Server Component that performs a redirect.
export default function AdminDashboardRedirectPage() {
  redirect('/admin/dashboard/appointments');
  
  // Return null or a loading component, although redirect should happen on the server.
  return null;
}

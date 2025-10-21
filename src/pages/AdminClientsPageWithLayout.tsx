import { DashboardSidebar } from '@/components/DashboardSidebar';
import { DashboardHeader } from '@/components/DashboardHeader';
import AdminClientsPage from './AdminClientsPage';

export default function AdminClientsPageWithLayout() {
  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col">
        <DashboardHeader />
        <main className="flex-1 p-6">
          <AdminClientsPage />
        </main>
      </div>
    </div>
  );
}

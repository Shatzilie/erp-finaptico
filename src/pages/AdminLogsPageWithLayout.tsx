import { ProtectedRoute } from '@/components/ProtectedRoute';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { DashboardHeader } from '@/components/DashboardHeader';
import AdminLogsPage from './AdminLogsPage';

export default function AdminLogsPageWithLayout() {
  return (
    <ProtectedRoute>
      <div className="flex h-screen overflow-hidden bg-background">
        <DashboardSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <DashboardHeader />
          <main className="flex-1 overflow-y-auto">
            <AdminLogsPage />
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}

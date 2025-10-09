import { DashboardHeader } from '@/components/DashboardHeader';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import MonitoringPage from './MonitoringPage';

export default function MonitoringPageWithLayout() {
  return (
    <ProtectedRoute skipTenantCheck={true}>
      <div className="flex min-h-screen bg-background">
        <DashboardSidebar />
        
        <div className="flex-1">
          <DashboardHeader />
          
          <main className="p-6">
            <MonitoringPage />
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}

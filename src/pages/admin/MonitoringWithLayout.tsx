import { DashboardSidebar } from '@/components/DashboardSidebar';
import { DashboardHeader } from '@/components/DashboardHeader';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import Monitoring from './Monitoring';

export default function MonitoringWithLayout() {
  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-background">
        <DashboardSidebar />
        <div className="flex-1 flex flex-col">
          <DashboardHeader />
          <main className="flex-1 overflow-y-auto">
            <Monitoring />
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}

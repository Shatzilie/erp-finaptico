import { DashboardHeader } from '@/components/DashboardHeader';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import Modelo111Page from './Modelo111Page';

export default function Modelo111PageWithLayout() {
  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-background">
        <DashboardSidebar />
        
        <div className="flex-1">
          <DashboardHeader />
          
          <main>
            <Modelo111Page />
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}

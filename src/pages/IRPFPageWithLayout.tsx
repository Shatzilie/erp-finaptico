import { DashboardHeader } from '@/components/DashboardHeader';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import IRPFPage from './IRPFPage';

export default function IRPFPageWithLayout() {
  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-background">
        <DashboardSidebar />
        
        <div className="flex-1">
          <DashboardHeader />
          
          <main>
            <IRPFPage />
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
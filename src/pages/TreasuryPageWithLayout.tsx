import { DashboardHeader } from '@/components/DashboardHeader';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import TreasuryPage from './TreasuryPage';

export default function TreasuryPageWithLayout() {
  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-background">
        <DashboardSidebar />
        
        <div className="flex-1">
          <DashboardHeader />
          
          <main className="p-6">
            <TreasuryPage />
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
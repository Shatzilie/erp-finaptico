import { DashboardHeader } from '@/components/DashboardHeader';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import InvoicingPage from './InvoicingPage';

export default function InvoicingPageWithLayout() {
  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-background">
        <DashboardSidebar />
        
        <div className="flex-1">
          <DashboardHeader />
          
          <main>
            <InvoicingPage />
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
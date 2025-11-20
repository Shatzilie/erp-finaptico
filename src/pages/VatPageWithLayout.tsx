import { DashboardHeader } from '@/components/DashboardHeader';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import VatPage from './VatPage';

export default function VatPageWithLayout() {
  return (
    <ProtectedRoute>
      <ErrorBoundary fallbackMessage="Error cargando la página de IVA">
        <div className="flex min-h-screen bg-background">
          <DashboardSidebar />
          
          <div className="flex-1">
            <DashboardHeader />
            
            <main>
              <VatPage />
            </main>
          </div>
        </div>
      </ErrorBoundary>
    </ProtectedRoute>
  );
}
import { DashboardHeader } from '@/components/DashboardHeader';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import SociedadesPage from './SociedadesPage';

export default function SociedadesPageWithLayout() {
  return (
    <ProtectedRoute>
      <ErrorBoundary fallbackMessage="Error cargando la página de Impuesto de Sociedades">
        <div className="flex min-h-screen bg-background">
          <DashboardSidebar />
          
          <div className="flex-1">
            <DashboardHeader />
            
            <main>
              <SociedadesPage />
            </main>
          </div>
        </div>
      </ErrorBoundary>
    </ProtectedRoute>
  );
}
import { DashboardHeader } from '@/components/DashboardHeader';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import StubPage from './StubPage';

export default function StubPageWithLayout({ title }: { title: string }) {
  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-background">
        <DashboardSidebar />
        
        <div className="flex-1">
          <DashboardHeader />
          
          <main>
            <StubPage title={title} />
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
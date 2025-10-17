import { ProtectedRoute } from '@/components/ProtectedRoute';
import { LogOut, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import AdminLogsPage from './AdminLogsPage';

export default function AdminLogsPageWithLayout() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <ProtectedRoute>
      <div className="flex flex-col h-screen overflow-hidden bg-background">
        {/* Simple header without tenant dependency */}
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Portal Financiero - Admin
              </h1>
              <p className="text-sm text-muted-foreground">
                Administración del sistema
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                {user?.email}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="gap-2"
                aria-label="Cerrar sesión"
              >
                <LogOut className="h-4 w-4" />
                Cerrar sesión
              </Button>
            </div>
          </div>
        </header>

        {/* Main content without sidebar */}
        <main className="flex-1 overflow-y-auto">
          <AdminLogsPage />
        </main>
      </div>
    </ProtectedRoute>
  );
}

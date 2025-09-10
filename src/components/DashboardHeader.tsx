import { LogOut, User } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { getTenant } from '@/utils/tenants';
import { FreshnessBadge } from './FreshnessBadge';

export const DashboardHeader = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const { tenant: tenantSlug } = useParams<{ tenant: string }>();
  
  const tenant = getTenant(tenantSlug || '');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-card border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {tenant?.fullName || 'Portal Financiero'}
            </h1>
            <p className="text-sm text-muted-foreground">
              Dashboard de gestión financiera
            </p>
          </div>
          <FreshnessBadge seconds={1800} />
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
  );
};
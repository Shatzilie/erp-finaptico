import { LogOut, User, Clock } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { getTenant } from '@/utils/tenants';
import { FreshnessBadge } from './FreshnessBadge';
import { supabase } from '@/integrations/supabase/client';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns';
import { es } from 'date-fns/locale';

interface UserTenantAccess {
  updated_at: string;
}

export const DashboardHeader = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const { tenant: tenantSlug } = useParams<{ tenant: string }>();
  
  const tenant = getTenant(tenantSlug || '');
  const [lastAccess, setLastAccess] = useState<string | null>(null);
  const [isLoadingAccess, setIsLoadingAccess] = useState(true);

  // Obtener última actividad del usuario
  useEffect(() => {
    const fetchLastAccess = async () => {
      if (!user?.id) return;

      try {
        // Cast del cliente para acceder a tablas no tipadas
        const response = await (supabase as any)
          .from('user_tenant_access')
          .select('updated_at')
          .eq('user_id', user.id)
          .maybeSingle();

        const { data, error } = response as { data: UserTenantAccess | null; error: any };

        if (error) {
          console.error('Error fetching last access:', error);
          return;
        }

        if (data) {
          setLastAccess(data.updated_at || null);
        }
      } catch (error) {
        console.error('Error fetching last access:', error);
      } finally {
        setIsLoadingAccess(false);
      }
    };

    fetchLastAccess();
  }, [user?.id]);

  // Formatear fecha de último acceso
  const formatLastAccess = (dateString: string | null): string => {
    if (!dateString) return 'Primera vez';

    try {
      const date = new Date(dateString);
      
      if (isToday(date)) {
        return `hoy a las ${format(date, 'HH:mm', { locale: es })}`;
      }
      
      if (isYesterday(date)) {
        return `ayer a las ${format(date, 'HH:mm', { locale: es })}`;
      }
      
      return formatDistanceToNow(date, { 
        addSuffix: true, 
        locale: es 
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Fecha no disponible';
    }
  };

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

          {!isLoadingAccess && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2 text-xs text-muted-foreground cursor-help">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Último acceso: {formatLastAccess(lastAccess)}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">
                  {lastAccess 
                    ? `Última actividad registrada: ${format(new Date(lastAccess), "dd/MM/yyyy 'a las' HH:mm", { locale: es })}`
                    : 'Primera vez accediendo al sistema'
                  }
                </p>
              </TooltipContent>
            </Tooltip>
          )}
          
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
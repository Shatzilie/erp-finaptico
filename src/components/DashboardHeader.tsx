import { LogOut, User, Clock, Bell, Calendar, AlertTriangle } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAuth } from '@/contexts/AuthContext';
import { getTenant } from '@/utils/tenants';
import { FreshnessBadge } from './FreshnessBadge';
import { supabase } from '@/integrations/supabase/client';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuthenticatedFetch } from '@/hooks/useAuthenticatedFetch';
import { useTenantAccess } from '@/hooks/useTenantAccess';

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
  
  // Estados para notificaciones fiscales
  const [alerts, setAlerts] = useState<any[]>([]);
  const [criticalCount, setCriticalCount] = useState(0);
  const { fetchWithTimeout } = useAuthenticatedFetch();
  const { tenantSlug: accessTenantSlug } = useTenantAccess();

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
          return;
        }

        if (data) {
          setLastAccess(data.updated_at || null);
        }
      } catch (error) {
        // Silently fail - no es crítico
      } finally {
        setIsLoadingAccess(false);
      }
    };

    fetchLastAccess();
  }, [user?.id]);

  // Cargar alertas fiscales
  useEffect(() => {
    let mounted = true;

    const loadAlerts = async () => {
      if (!accessTenantSlug) return;

      try {
        const response = await fetchWithTimeout(
          'fiscal-calendar',
          {
            tenant_slug: accessTenantSlug,
            action: 'get_calendar',
            params: { status: 'pending' }
          },
          { timeout: 15000 }
        );

        if (mounted && response?.ok) {
          const { declarations, stats } = response.widget_data?.fiscal_calendar?.payload || { declarations: [], stats: { critical: 0 } };
          const today = new Date();
          
          const critical = declarations.filter((d: any) => {
            const dueDate = new Date(d.due_date);
            return dueDate <= today;
          });

          setAlerts(critical);
          setCriticalCount(stats.critical || 0);
        }
      } catch (err) {
        console.error('Error loading alerts:', err);
      }
    };

    loadAlerts();
    
    // Actualizar cada 5 minutos
    const interval = setInterval(loadAlerts, 5 * 60 * 1000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [accessTenantSlug]);

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

          {/* Notificaciones fiscales */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {criticalCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center p-0 text-xs"
                  >
                    {criticalCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  Alertas Fiscales
                </h3>
                {alerts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No hay alertas críticas</p>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {alerts.map((alert: any) => (
                      <div key={alert.id} className="p-3 border rounded-lg bg-red-50">
                        <div className="flex items-start gap-2">
                          <Calendar className="h-4 w-4 text-red-600 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">
                              {alert.model_number} - {alert.declaration_type.toUpperCase()}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Vencimiento: {new Date(alert.due_date).toLocaleDateString('es-ES')}
                            </p>
                            {alert.estimated_amount && (
                              <p className="text-sm font-semibold mt-1">
                                {alert.estimated_amount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <Button 
                  variant="link" 
                  className="w-full"
                  onClick={() => navigate(`/${accessTenantSlug}/calendario-fiscal`)}
                >
                  Ver calendario completo →
                </Button>
              </div>
            </PopoverContent>
          </Popover>
          
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
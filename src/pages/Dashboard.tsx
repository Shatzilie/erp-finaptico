import { useParams, Navigate } from 'react-router-dom';
import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardHeader } from '@/components/DashboardHeader';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { SyncNow } from '@/components/SyncNow';
import { FreshnessBadge } from '@/components/FreshnessBadge';
import { TrendingUp, DollarSign, FileText } from 'lucide-react';

type ChangeType = 'positive' | 'negative' | 'neutral';

interface DashboardCard {
  title: string;
  description: string;
  value: string;
  change: string;
  changeType: ChangeType;
  icon: any;
}

interface Tenant {
  name: string;
  id: string;
}

interface WidgetData {
  payload: { amount: number; currency: string };
  freshness_seconds: number;
}

type KPIData = {
  revenue?: number;
  expenses?: number;
  invoices?: number;
};

const DashboardContent = () => {
  const { tenant: tenantSlug } = useParams<{ tenant: string }>();
  const { user } = useAuth();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unauthorized, setUnauthorized] = useState(false);
  const [widgetData, setWidgetData] = useState<WidgetData | null>(null);
  const [kpi, setKpi] = useState<KPIData>({});
  const [syncing, setSyncing] = useState(false);

  const fetchWidgetData = async (tenantId: string) => {
    try {
      const { data: wd, error } = await (supabase as any)
        .from('widget_data')
        .select('payload, freshness_seconds')
        .eq('tenant_id', tenantId)
        .eq('key', 'cash_balance')
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching widget data:', error);
      } else {
        setWidgetData(wd);
      }
    } catch (err) {
      console.error('Unexpected error fetching widget data:', err);
    }
  };

  const fetchKPIs = async (tenantId: string) => {
    try {
      // Get the 3 KPI widgets
      const { data: widgets, error: werr } = await (supabase as any)
        .from("widget_data")
        .select("key, payload")
        .eq("tenant_id", tenantId)
        .in("key", ["revenue_month", "expenses_month", "invoices_month_count"]);

      if (werr) {
        console.error("widget_data error", werr);
        return;
      }

      // Map to state
      const revenue = widgets?.find((w: any) => w.key === "revenue_month")?.payload?.amount ?? 0;
      const expenses = widgets?.find((w: any) => w.key === "expenses_month")?.payload?.amount ?? 0;
      const invoices = widgets?.find((w: any) => w.key === "invoices_month_count")?.payload?.count ?? 0;

      setKpi({ revenue, expenses, invoices });
    } catch (err) {
      console.error('Unexpected error fetching KPIs:', err);
    }
  };

  const handleSyncComplete = () => {
    if (tenant?.id) {
      fetchWidgetData(tenant.id);
      fetchKPIs(tenant.id);
    }
  };

  const handleSyncNow = async () => {
    if (!tenantSlug) return;
    setSyncing(true);

    try {
      const { data, error } = await supabase.functions.invoke("odoo-sync", {
        body: { tenant: tenantSlug },
      });

      if (error) {
        console.error("sync error", error);
      } else {
        console.log("sync ok", data);
        // Refresh KPIs
        if (tenant?.id) {
          await fetchKPIs(tenant.id);
          await fetchWidgetData(tenant.id);
        }
      }
    } catch (err) {
      console.error("Sync error:", err);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    async function getSessionAndAuthorize() {
      if (!tenantSlug || !user) return;
      
      try {
        // First, get the user's profile and tenant_id
        const { data: profileData, error: profileError } = await (supabase as any)
          .from('profiles')
          .select('tenant_id')
          .eq('user_id', user.id)
          .single();

        if (profileError || !profileData) {
          throw new Error('PROFILE_NOT_FOUND');
        }

        // Then, get the tenant information
        const { data: tenantData, error: tenantError } = await (supabase as any)
          .from('tenants')
          .select('id, slug, name')
          .eq('id', profileData.tenant_id)
          .single();

        if (tenantError || !tenantData) {
          throw new Error('TENANT_NOT_FOUND');
        }

        // Verify user belongs to the requested tenant
        if (tenantData.slug !== tenantSlug) {
          setUnauthorized(true);
          throw new Error('FORBIDDEN');
        }

        // If authorized, set the tenant data
        setTenant({ name: tenantData.name, id: tenantData.id });
        
        // Fetch widget data
        await fetchWidgetData(tenantData.id);
        await fetchKPIs(tenantData.id);
      } catch (err: any) {
        if (err.message === 'FORBIDDEN') {
          setUnauthorized(true);
          setError('No tienes acceso a este tenant');
        } else {
          setError('Error al verificar permisos');
        }
      } finally {
        setLoading(false);
      }
    }

    getSessionAndAuthorize();
  }, [tenantSlug, user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Cargando...</CardTitle>
            <CardDescription>Verificando permisos y obteniendo información del tenant</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (unauthorized) {
    return <Navigate to="/login" replace />;
  }

  if (error || !tenant) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Acceso denegado</CardTitle>
            <CardDescription>
              {error || `No tienes permisos para acceder al tenant "${tenantSlug}".`}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const cards: DashboardCard[] = [
    {
      title: 'Ingresos (mes)',
      description: 'Ingresos del mes actual',
      value: kpi.revenue !== undefined ? 
        `€${kpi.revenue.toLocaleString('es-ES', { minimumFractionDigits: 2 })}` : 
        'Sin datos',
      change: 'mes en curso',
      changeType: 'positive',
      icon: TrendingUp,
    },
    {
      title: 'Gastos (mes)',
      description: 'Gastos del mes actual',
      value: kpi.expenses !== undefined ? 
        `€${kpi.expenses.toLocaleString('es-ES', { minimumFractionDigits: 2 })}` : 
        'Sin datos',
      change: 'mes en curso',
      changeType: 'neutral',
      icon: DollarSign,
    },
    {
      title: 'Nº Facturas (mes)',
      description: 'Facturas emitidas este mes',
      value: kpi.invoices !== undefined ? 
        kpi.invoices.toString() : 
        'Sin datos',
      change: 'mes en curso',
      changeType: 'neutral',
      icon: FileText,
    },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />
      
      <div className="flex-1">
        <DashboardHeader />
        
        <main className="p-6">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-foreground mb-2">
                  Dashboard Principal
                </h2>
                <p className="text-muted-foreground">
                  Resumen financiero de {tenant.name}
                </p>
              </div>
              <div className="flex items-center gap-4">
                {widgetData && (
                  <FreshnessBadge seconds={widgetData.freshness_seconds} />
                )}
                <button
                  onClick={handleSyncNow}
                  disabled={syncing}
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {syncing ? "Sincronizando..." : "Sincronizar ahora"}
                </button>
              </div>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {cards.map((card, index) => {
              const Icon = card.icon;
              return (
                <Card key={index} className="bg-gradient-card shadow-card hover:shadow-elevated transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {card.title}
                    </CardTitle>
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground mb-1">
                      {card.value}
                    </div>
                    <div className="flex items-center gap-1">
                      <span
                        className={`text-xs font-medium ${
                          card.changeType === 'positive'
                            ? 'text-profit'
                            : card.changeType === 'negative'
                            ? 'text-loss'
                            : 'text-muted-foreground'
                        }`}
                      >
                        {card.change}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {card.changeType !== 'neutral' 
                          ? 'vs mes anterior'
                          : ''}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {card.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
};

export default function Dashboard() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
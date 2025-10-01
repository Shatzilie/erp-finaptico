import { useParams, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardHeader } from '@/components/DashboardHeader';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { TrendingUp, DollarSign, FileText } from 'lucide-react';
import KpiBoard from '@/components/dashboard/KpiBoard';
import { ChartsSection } from '@/components/dashboard/ChartsSection';
import StubPage from '@/pages/stubs/StubPage';
import { PDFGenerator } from '@/components/PDFGenerator';
import { PageHeader } from '@/components/PageHeader';

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
  slug: string;
}

interface MonthlyData {
  month: string;
  total: number;
  currency: string;
}

interface RevenueData {
  monthly_revenue: number;
  quarterly_revenue: number;
  annual_revenue: number;
  monthly_history: MonthlyData[];
  outstanding_invoices_count: number;
  outstanding_invoices_amount: number;
  total_invoices: number;
}

interface ExpensesData {
  monthly_expenses: number;
  quarterly_expenses: number;
  annual_expenses: number;
  monthly_history: MonthlyData[];
  pending_invoices_count: number;
  total_pending_amount: number;
  total_invoices: number;
}

interface DashboardData {
  treasury?: {
    total: number;
    accounts: number;
    currency: string;
  };
  revenue?: RevenueData;
  expenses?: ExpensesData;
  profitability?: {
    monthlyMargin: number;
    quarterlyMargin: number;
    yearlyMargin: number;
    marginPercentage: number;
  };
  alerts?: Array<{
    type: string;
    message: string;
    module: string;
  }>;
}

type KPIData = {
  revenue?: number;
  expenses?: number;
  invoices?: number;
};

const DashboardContent = () => {
  const { tenant: tenantSlug, section } = useParams<{ tenant: string; section?: string }>();
  const { user } = useAuth();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unauthorized, setUnauthorized] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [revenueData, setRevenueData] = useState<{ widget_data?: { revenue?: { payload?: RevenueData } } } | null>(null);
  const [expensesData, setExpensesData] = useState<{ widget_data?: { expenses?: { payload?: ExpensesData } } } | null>(null);
  const [kpi, setKpi] = useState<KPIData>({});
  const [syncing, setSyncing] = useState(false);

  const fetchDashboardData = async (tenantId: string, slug: string) => {
    try {
      // Llamar a odoo-dashboard
      const dashboardResponse = await fetch('https://dtmrywilxpilpzokxxif.supabase.co/functions/v1/odoo-dashboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-lovable-secret': 'lovable_sync_2024_LP%#tGxa@Q'
        },
        body: JSON.stringify({ tenant_slug: slug })
      });

      if (dashboardResponse.ok) {
        const dashData = await dashboardResponse.json();
        if (dashData.ok && dashData.widget_data?.dashboard?.payload) {
          setDashboardData(dashData.widget_data.dashboard.payload);
          
          // Actualizar KPIs desde dashboard
          const payload = dashData.widget_data.dashboard.payload;
          setKpi({
            revenue: payload.revenue?.monthly || 0,
            expenses: payload.expenses?.monthly || 0,
            invoices: payload.revenue?.pendingCount || 0
          });
        }
      }

      // Llamar a odoo-revenue para obtener histórico
      const revenueResponse = await fetch('https://dtmrywilxpilpzokxxif.supabase.co/functions/v1/odoo-revenue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-lovable-secret': 'lovable_sync_2024_LP%#tGxa@Q'
        },
        body: JSON.stringify({ tenant_slug: slug })
      });

      if (revenueResponse.ok) {
        const revData = await revenueResponse.json();
        setRevenueData(revData);
      }

      // Llamar a odoo-expenses para obtener histórico
      const expensesResponse = await fetch('https://dtmrywilxpilpzokxxif.supabase.co/functions/v1/odoo-expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-lovable-secret': 'lovable_sync_2024_LP%#tGxa@Q'
        },
        body: JSON.stringify({ tenant_slug: slug })
      });

      if (expensesResponse.ok) {
        const expData = await expensesResponse.json();
        setExpensesData(expData);
      }

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    }
  };

  const handleSyncNow = async () => {
    if (!tenantSlug || !tenant) return;
    setSyncing(true);

    try {
      const response = await fetch('https://dtmrywilxpilpzokxxif.supabase.co/functions/v1/odoo-sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-lovable-secret': 'lovable_sync_2024_LP%#tGxa@Q'
        },
        body: JSON.stringify({
          tenant_slug: tenantSlug
        })
      });

      const data = await response.json();
      if (!data.ok) {
        console.error("sync error", data.error);
      } else {
        console.log("sync ok", data);
        // Refresh data
        if (tenant?.id) {
          await fetchDashboardData(tenant.id, tenant.slug);
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
        const supabaseClient = supabase as any;

        // First, get the user's profile and tenant_id
        const { data: profileData, error: profileError } = await supabaseClient
          .from('profiles')
          .select('tenant_id')
          .eq('user_id', user.id)
          .single();

        if (profileError || !profileData) {
          throw new Error('PROFILE_NOT_FOUND');
        }

        // Then, get the tenant information
        const { data: tenantData, error: tenantError } = await supabaseClient
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
        setTenant({ 
          name: tenantData.name, 
          id: tenantData.id,
          slug: tenantData.slug 
        });
        
        // Fetch all dashboard data
        await fetchDashboardData(tenantData.id, tenantData.slug);
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

  const getSectionTitle = (section?: string) => {
    switch (section) {
      case 'dashboard':
        return 'Dashboard Principal';
      case 'treasury':
        return 'Tesorería';
      case 'invoicing':
        return 'Facturación';
      case 'expenses':
        return 'Gastos';
      case 'vat':
        return 'IVA';
      case 'irpf':
        return 'IRPF';
      case 'is':
        return 'Impuesto de Sociedades';
      case 'calendar':
        return 'Calendario Fiscal';
      case 'docs':
        return 'Documentación';
      case 'advisory':
        return 'Asesoría';
      case 'company':
        return 'Mi Empresa';
      default:
        return 'Dashboard Principal';
    }
  };

  const renderMainContent = () => {
    // Default to dashboard if no section specified
    const currentSection = section || 'dashboard';
    
    if (currentSection === 'dashboard') {
      return (
        <div className="space-y-8">
          {/* KPIs */}
          <KpiBoard data={dashboardData} isLoading={loading} />

          {/* Gráficas */}
          <ChartsSection
            data={{
              revenue_history: revenueData?.widget_data?.revenue?.payload?.monthly_history || [],
              expenses_history: expensesData?.widget_data?.expenses?.payload?.monthly_history || []
            }}
            isLoading={loading}
          />
        </div>
      );
    }
    
    return <StubPage title={getSectionTitle(currentSection)} />;
  };

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />
      
      <div className="flex-1">
        <DashboardHeader />
        
        {/* Header con botón PDF */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <PageHeader 
                  title={`Dashboard Ejecutivo - ${tenant.name}`}
                  subtitle="Resumen financiero y fiscal en tiempo real"
                />
              </div>
              <div className="flex space-x-4">
                <PDFGenerator 
                  tenantSlug={tenant.slug}
                  className="shadow-lg"
                />
              </div>
            </div>
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
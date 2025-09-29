import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw, TrendingUp, TrendingDown, AlertCircle, DollarSign, Calendar, Download } from "lucide-react";
import KpiBoard from "@/components/KpiBoard";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { backendAdapter } from "@/lib/backendAdapter";
import { PDFGenerator } from "@/components/PDFGenerator";

// Tipos
interface DashboardData {
  treasury: {
    total: number;
    accounts: number;
    currency: string;
  };
  revenue: {
    monthly: number;
    quarterly: number;
    yearly: number;
    pendingCount: number;
  };
  expenses: {
    monthly: number;
    quarterly: number;
    yearly: number;
    pendingCount: number;
  };
  profitability: {
    monthlyMargin: number;
    quarterlyMargin: number;
    yearlyMargin: number;
    marginPercentage: number;
  };
  alerts: Array<{
    type: string;
    message: string;
    module: string;
  }>;
}

interface Tenant {
  id: string;
  name: string;
  slug: string;
}

const Dashboard = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);

  // 🆕 CARGAR TENANT DEL USUARIO AUTENTICADO
  useEffect(() => {
    const loadTenant = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          toast({
            title: "Error de autenticación",
            description: "Debes iniciar sesión",
            variant: "destructive",
          });
          return;
        }

        // Obtener tenant del usuario
        const { data: profile, error } = await supabase
          .from('profiles')
          .select(`
            tenant_id,
            tenants (
              id,
              name,
              slug
            )
          `)
          .eq('id', user.id)
          .single();

        if (error) throw error;

        if (!profile?.tenants) {
          toast({
            title: "Error",
            description: "No se encontró la empresa asociada al usuario",
            variant: "destructive",
          });
          return;
        }

        setTenant({
          id: profile.tenants.id,
          name: profile.tenants.name,
          slug: profile.tenants.slug,
        });

      } catch (error) {
        console.error('Error loading tenant:', error);
        toast({
          title: "Error",
          description: "No se pudo cargar la información de la empresa",
          variant: "destructive",
        });
      }
    };

    loadTenant();
  }, [toast]);

  // 🔄 CARGAR DASHBOARD SOLO CUANDO TENANT ESTÉ DISPONIBLE
  useEffect(() => {
    if (tenant?.slug) {
      loadDashboardData();
    }
  }, [tenant]);

  const loadDashboardData = async () => {
    if (!tenant?.slug) {
      console.warn('No tenant available');
      return;
    }

    setIsLoading(true);
    try {
      const data = await backendAdapter.getDashboard(tenant.slug);
      setDashboardData(data);
      setLastSync(new Date());
    } catch (error) {
      console.error('Error loading dashboard:', error);
      toast({
        title: "Error al cargar datos",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 🔄 SYNC CORREGIDO - SIN CREDENCIALES HARDCODEADAS
  const handleSyncNow = async () => {
    if (!tenant?.slug) {
      toast({
        title: "Error",
        description: "No hay empresa seleccionada",
        variant: "destructive",
      });
      return;
    }

    setIsSyncing(true);
    try {
      // Usar método centralizado que internamente usa tenant_slug
      await backendAdapter.syncTreasury(tenant.slug);
      
      toast({
        title: "Sincronización completada",
        description: "Datos actualizados correctamente",
      });
      
      // Recargar dashboard después de sync
      await loadDashboardData();
    } catch (error) {
      console.error('Error syncing:', error);
      toast({
        title: "Error en sincronización",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // 📊 CALCULAR MÉTRICAS
  const calculateMetrics = () => {
    if (!dashboardData) return null;

    const { revenue, expenses, profitability } = dashboardData;

    return {
      monthlyGrowth: revenue.monthly > 0 
        ? ((revenue.monthly - expenses.monthly) / revenue.monthly * 100).toFixed(1)
        : "0.0",
      quarterlyGrowth: revenue.quarterly > 0
        ? ((revenue.quarterly - expenses.quarterly) / revenue.quarterly * 100).toFixed(1)
        : "0.0",
      yearlyGrowth: revenue.yearly > 0
        ? ((revenue.yearly - expenses.yearly) / revenue.yearly * 100).toFixed(1)
        : "0.0",
      cashFlow: profitability.monthlyMargin,
      marginPercentage: profitability.marginPercentage,
    };
  };

  const metrics = calculateMetrics();

  // 🎨 RENDER
  if (isLoading || !tenant) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando datos empresariales...</p>
          {tenant && <p className="text-sm text-muted-foreground mt-2">{tenant.name}</p>}
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Error al cargar datos
            </CardTitle>
            <CardDescription>
              No se pudieron obtener los datos del dashboard para {tenant.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={loadDashboardData} className="w-full">
              Reintentar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header con nombre del tenant */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Panel de Control</h1>
          <p className="text-muted-foreground mt-1">
            {tenant.name}
          </p>
        </div>
        <div className="flex gap-2">
          {lastSync && (
            <Badge variant="outline" className="flex items-center gap-2">
              <Calendar className="h-3 w-3" />
              Última actualización: {lastSync.toLocaleString('es-ES')}
            </Badge>
          )}
          <Button
            onClick={handleSyncNow}
            disabled={isSyncing}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Sincronizando...' : 'Sincronizar ahora'}
          </Button>
          {/* 🆕 PDF GENERATOR CON TENANT DINÁMICO */}
          <PDFGenerator
            data={dashboardData}
            tenantSlug={tenant.slug}
            tenantName={tenant.name}
          />
        </div>
      </div>

      {/* Alertas */}
      {dashboardData.alerts.length > 0 && (
        <div className="space-y-2">
          {dashboardData.alerts.map((alert, idx) => (
            <Card key={idx} className={`border-l-4 ${
              alert.type === 'warning' ? 'border-l-yellow-500' : 'border-l-blue-500'
            }`}>
              <CardContent className="p-4 flex items-center gap-3">
                <AlertCircle className={`h-5 w-5 ${
                  alert.type === 'warning' ? 'text-yellow-500' : 'text-blue-500'
                }`} />
                <div>
                  <p className="font-medium">{alert.message}</p>
                  <p className="text-sm text-muted-foreground">Módulo: {alert.module}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* KPIs principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tesorería</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardData.treasury.total.toLocaleString('es-ES')} {dashboardData.treasury.currency}
            </div>
            <p className="text-xs text-muted-foreground">
              {dashboardData.treasury.accounts} cuentas activas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Facturación Anual</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardData.revenue.yearly.toLocaleString('es-ES')} €
            </div>
            <p className="text-xs text-muted-foreground">
              {dashboardData.revenue.pendingCount} facturas pendientes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gastos Anuales</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardData.expenses.yearly.toLocaleString('es-ES')} €
            </div>
            <p className="text-xs text-muted-foreground">
              {dashboardData.expenses.pendingCount} por pagar
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Margen Anual</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardData.profitability.marginPercentage.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {dashboardData.profitability.yearlyMargin.toLocaleString('es-ES')} € beneficio
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs con métricas detalladas */}
      <Tabs defaultValue="monthly" className="space-y-4">
        <TabsList>
          <TabsTrigger value="monthly">Mensual</TabsTrigger>
          <TabsTrigger value="quarterly">Trimestral</TabsTrigger>
          <TabsTrigger value="yearly">Anual</TabsTrigger>
        </TabsList>

        <TabsContent value="monthly" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Ingresos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {dashboardData.revenue.monthly.toLocaleString('es-ES')} €
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Gastos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {dashboardData.expenses.monthly.toLocaleString('es-ES')} €
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Margen</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {dashboardData.profitability.monthlyMargin.toLocaleString('es-ES')} €
                </div>
                <p className="text-xs text-muted-foreground">
                  {metrics?.monthlyGrowth}% de margen
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="quarterly" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Ingresos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {dashboardData.revenue.quarterly.toLocaleString('es-ES')} €
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Gastos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {dashboardData.expenses.quarterly.toLocaleString('es-ES')} €
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Margen</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {dashboardData.profitability.quarterlyMargin.toLocaleString('es-ES')} €
                </div>
                <p className="text-xs text-muted-foreground">
                  {metrics?.quarterlyGrowth}% de margen
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="yearly" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Ingresos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {dashboardData.revenue.yearly.toLocaleString('es-ES')} €
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Gastos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {dashboardData.expenses.yearly.toLocaleString('es-ES')} €
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Margen</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {dashboardData.profitability.yearlyMargin.toLocaleString('es-ES')} €
                </div>
                <p className="text-xs text-muted-foreground">
                  {metrics?.yearlyGrowth}% de margen
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* 🆕 KPIBOARD CON TENANT DINÁMICO */}
      <KpiBoard tenantSlug={tenant.slug} />
    </div>
  );
};

export default Dashboard;
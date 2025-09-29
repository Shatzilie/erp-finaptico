import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  AlertCircle,
  Download,
  RefreshCw,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { FiscalCard } from '@/components/dashboard/FiscalComponents';
import { generateDashboardPDF } from '@/components/PDFGenerator';
import {
  fetchDashboardData,
  fetchIVAData,
  fetchIRPFData,
  fetchSociedadesData,
  type DashboardData,
  type FiscalData,
  type SmartAlert,
} from '@/lib/backendAdapter';

export default function Dashboard() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tenantSlug, setTenantSlug] = useState<string>('');
  const [companyName, setCompanyName] = useState<string>('');
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [ivaData, setIvaData] = useState<FiscalData | null>(null);
  const [irpfData, setIrpfData] = useState<FiscalData | null>(null);
  const [sociedadesData, setSociedadesData] = useState<FiscalData | null>(null);

  const loadTenantInfo = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single();

      if (!profile?.tenant_id) throw new Error('No tenant assigned');

      const { data: tenant } = await supabase
        .from('tenants')
        .select('slug, name')
        .eq('id', profile.tenant_id)
        .single();

      if (!tenant) throw new Error('Tenant not found');

      setTenantSlug(tenant.slug);
      setCompanyName(tenant.name);
      return tenant.slug;
    } catch (error) {
      console.error('Error loading tenant:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar la información del tenant',
        variant: 'destructive',
      });
      return null;
    }
  };

  const loadAllData = async (slug: string) => {
    try {
      setLoading(true);

      const [dashboard, iva, irpf, sociedades] = await Promise.allSettled([
        fetchDashboardData(slug),
        fetchIVAData(slug),
        fetchIRPFData(slug),
        fetchSociedadesData(slug),
      ]);

      if (dashboard.status === 'fulfilled') {
        setDashboardData(dashboard.value);
      } else {
        console.error('Error loading dashboard:', dashboard.reason);
      }

      if (iva.status === 'fulfilled') {
        setIvaData(iva.value);
      } else {
        console.error('Error loading IVA:', iva.reason);
      }

      if (irpf.status === 'fulfilled') {
        setIrpfData(irpf.value);
      } else {
        console.error('Error loading IRPF:', irpf.reason);
      }

      if (sociedades.status === 'fulfilled') {
        setSociedadesData(sociedades.value);
      } else {
        console.error('Error loading Sociedades:', sociedades.reason);
      }

      toast({
        title: 'Datos actualizados',
        description: 'Dashboard cargado correctamente',
      });
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Error',
        description: 'Error al cargar los datos del dashboard',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (!tenantSlug) return;
    setRefreshing(true);
    await loadAllData(tenantSlug);
    setRefreshing(false);
  };

  const handleExportPDF = async () => {
    if (!dashboardData) {
      toast({
        title: 'Error',
        description: 'No hay datos para exportar',
        variant: 'destructive',
      });
      return;
    }

    try {
      await generateDashboardPDF(dashboardData, companyName);
      toast({
        title: 'PDF generado',
        description: 'El dashboard se ha exportado correctamente',
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: 'Error',
        description: 'Error al generar el PDF',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    const init = async () => {
      const slug = await loadTenantInfo();
      if (slug) {
        await loadAllData(slug);
      }
    };
    init();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              No se pudieron cargar los datos del dashboard
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getAlertIcon = (type: SmartAlert['type']) => {
    switch (type) {
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'info':
        return <AlertCircle className="h-4 w-4 text-blue-600" />;
      case 'success':
        return <AlertCircle className="h-4 w-4 text-green-600" />;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Financiero</h1>
          <p className="text-muted-foreground">{companyName}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleRefresh} disabled={refreshing} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <Button onClick={handleExportPDF} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar PDF
          </Button>
        </div>
      </div>

      {/* Alertas */}
      {dashboardData.alerts && dashboardData.alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Alertas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {dashboardData.alerts.map((alert, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2 rounded bg-muted">
                  {getAlertIcon(alert.type)}
                  <span className="text-sm">{alert.message}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Métricas principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tesorería Total</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardData.treasury.total.toLocaleString('es-ES')} €
            </div>
            <p className="text-xs text-muted-foreground">
              {dashboardData.treasury.accounts.length} cuentas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Anuales</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardData.revenue.annual_revenue.toLocaleString('es-ES')} €
            </div>
            <p className="text-xs text-muted-foreground">
              {dashboardData.revenue.outstanding_invoices_count} facturas pendientes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gastos Anuales</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardData.expenses.annual_expenses.toLocaleString('es-ES')} €
            </div>
            <p className="text-xs text-muted-foreground">
              {dashboardData.expenses.pending_invoices_count} por pagar
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Margen Anual</CardTitle>
            <PiggyBank className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardData.profitability.yearlyMargin.toLocaleString('es-ES')} €
            </div>
            <p className="text-xs text-muted-foreground">
              {dashboardData.profitability.marginPercentage.toFixed(2)}% de margen
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Información Fiscal */}
      <div className="grid gap-4 md:grid-cols-3">
        {ivaData && <FiscalCard data={ivaData} title="IVA Trimestral" type="iva" />}
        {irpfData && <FiscalCard data={irpfData} title="IRPF Trimestral" type="irpf" />}
        {sociedadesData && (
          <FiscalCard data={sociedadesData} title="Impuesto Sociedades" type="sociedades" />
        )}
      </div>

      {/* Cuentas de Tesorería */}
      <Card>
        <CardHeader>
          <CardTitle>Cuentas Bancarias</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dashboardData.treasury.accounts.map((account) => (
              <div
                key={account.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div>
                  <p className="font-medium">{account.name}</p>
                  {account.iban && <p className="text-sm text-muted-foreground">{account.iban}</p>}
                </div>
                <div className="text-right">
                  <p className="font-bold">{account.balance.toLocaleString('es-ES')} €</p>
                  <p className="text-sm text-muted-foreground">{account.currency}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
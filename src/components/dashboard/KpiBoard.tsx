import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, RefreshCw, TrendingUp, TrendingDown, DollarSign, 
         AlertTriangle, CheckCircle, Euro, Target } from 'lucide-react';
import { ChartsSection } from './ChartsSection';
import { IvaCard, IrpfCard, SociedadesCard } from './FiscalComponents';
import { supabase } from '@/integrations/supabase/client';

interface DashboardData {
  totalCash?: number;
  monthlyRevenue?: number;
  quarterlyRevenue?: number;
  yearlyRevenue?: number;
  pendingInvoices?: number;
  monthlyExpenses?: number;
  quarterlyExpenses?: number;
  yearlyExpenses?: number;
  pendingPayments?: number;
  monthlyMargin?: number;
  quarterlyMargin?: number;
  yearlyMargin?: number;
  marginPercentage?: number;
  alerts?: Array<{ type: string; message: string; module: string; }>;
  lastUpdated?: string;
}

interface FiscalData {
  iva?: any;
  irpf?: any;
  sociedades?: any;
}

function useTenantSlug() {
  const params = useParams();
  const location = useLocation();

  let slug = (params as any)?.tenant || (params as any)?.tenantSlug || "";
  if (!slug) {
    const first = location.pathname.split("/").filter(Boolean)[0];
    slug = first || "";
  }
  return slug;
}

const formatEuro = (amount: number) => {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatNumber = (value: number, decimals = 2) => {
  return new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
};

export default function KpiBoard() {
  const slug = useTenantSlug();
  const [data, setData] = useState<DashboardData | null>(null);
  const [fiscalData, setFiscalData] = useState<FiscalData>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  const fetchDashboardData = async () => {
    console.log('🎯 Cargando datos del Dashboard para tenant:', slug);
    
    if (!slug) {
      setError('No se pudo determinar el tenant');
      setLoading(false);
      return;
    }

    try {
      // PASO 1: Obtener el tenant_id desde el slug
      const { data: tenantData, error: tenantError } = await (supabase as any)
        .from('tenants')
        .select('id')
        .eq('slug', slug)
        .single();

      if (tenantError || !tenantData) {
        console.error('❌ Tenant no encontrado:', tenantError);
        throw new Error('Tenant no encontrado');
      }

      const tenantId = tenantData.id;
      console.log('✅ Tenant ID obtenido:', tenantId);

      // PASO 2: Llamar a todas las Edge Functions en paralelo
      const [dashboardResponse, ivaResponse, irpfResponse, sociedadesResponse] = await Promise.all([
        fetch('https://dtmrywilxpilpzokxxif.supabase.co/functions/v1/odoo-dashboard', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-lovable-secret': 'lovable_sync_2024_LP%#tGxa@Q'
          },
          body: JSON.stringify({ tenant_slug: tenantId })
        }),
        fetch('https://dtmrywilxpilpzokxxif.supabase.co/functions/v1/odoo-iva', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-lovable-secret': 'lovable_sync_2024_LP%#tGxa@Q'
          },
          body: JSON.stringify({ 
            tenant_slug: slug,
            quarter: 3,
            year: 2025
          })
        }),
        fetch('https://dtmrywilxpilpzokxxif.supabase.co/functions/v1/odoo-irpf', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-lovable-secret': 'lovable_sync_2024_LP%#tGxa@Q'
          },
          body: JSON.stringify({ 
            tenant_slug: slug,
            quarter: 3,
            year: 2025
          })
        }),
        fetch('https://dtmrywilxpilpzokxxif.supabase.co/functions/v1/odoo-sociedades', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-lovable-secret': 'lovable_sync_2024_LP%#tGxa@Q'
          },
          body: JSON.stringify({ 
            tenant_slug: slug,
            year: 2025
          })
        })
      ]);
      
      // Procesar respuesta del dashboard
      if (!dashboardResponse.ok) {
        const errorText = await dashboardResponse.text();
        console.error('❌ Error response dashboard:', errorText);
        throw new Error(`HTTP ${dashboardResponse.status}: ${errorText}`);
      }
      
      const dashboardResult = await dashboardResponse.json();
      console.log('📊 Dashboard:', dashboardResult);
      
      if (dashboardResult.ok && dashboardResult.widget_data?.dashboard?.success) {
        const dashboardPayload = dashboardResult.widget_data.dashboard.payload;
        
        const transformedData: DashboardData = {
          totalCash: dashboardPayload.treasury?.total || 0,
          monthlyRevenue: dashboardPayload.revenue?.monthly || 0,
          quarterlyRevenue: dashboardPayload.revenue?.quarterly || 0,
          yearlyRevenue: dashboardPayload.revenue?.yearly || 0,
          pendingInvoices: dashboardPayload.revenue?.pendingCount || 0,
          monthlyExpenses: dashboardPayload.expenses?.monthly || 0,
          quarterlyExpenses: dashboardPayload.expenses?.quarterly || 0,
          yearlyExpenses: dashboardPayload.expenses?.yearly || 0,
          pendingPayments: dashboardPayload.expenses?.pendingCount || 0,
          monthlyMargin: dashboardPayload.profitability?.monthlyMargin || 0,
          quarterlyMargin: dashboardPayload.profitability?.quarterlyMargin || 0,
          yearlyMargin: dashboardPayload.profitability?.yearlyMargin || 0,
          marginPercentage: dashboardPayload.profitability?.marginPercentage || 0,
          alerts: dashboardPayload.alerts || [],
          lastUpdated: dashboardResult.meta?.execution_time
        };
        
        setData(transformedData);
      }

      // Procesar respuestas fiscales
      const ivaResult = await ivaResponse.json();
      const irpfResult = await irpfResponse.json();
      const sociedadesResult = await sociedadesResponse.json();

      console.log('📊 IVA:', ivaResult);
      console.log('📊 IRPF:', irpfResult);
      console.log('📊 Sociedades:', sociedadesResult);

      setFiscalData({
        iva: ivaResult.ok ? ivaResult.widget_data?.iva?.payload : null,
        irpf: irpfResult.ok ? irpfResult.widget_data?.irpf?.payload : null,
        sociedades: sociedadesResult.ok ? sociedadesResult.widget_data?.sociedades?.payload : null
      });

      setError(null);
    } catch (err: any) {
      console.error('❌ Error cargando datos:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncNow = async () => {
    console.log('🔄 Sincronizando Dashboard...');
    setSyncing(true);
    try {
      await fetchDashboardData();
      console.log('✅ Sincronización completada');
    } catch (err) {
      console.error('❌ Error en sincronización:', err);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    
    const interval = setInterval(fetchDashboardData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [slug]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando datos del Dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mx-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Error al cargar el dashboard: {error}
          <Button variant="outline" size="sm" className="ml-2" onClick={handleSyncNow}>
            Reintentar
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No hay datos disponibles</p>
        <Button onClick={handleSyncNow} className="mt-4">
          <RefreshCw className="w-4 h-4 mr-2" />
          Cargar datos
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      
      {/* SECCIÓN 1: ESTADO FISCAL */}
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold">Estado Fiscal del Trimestre</h2>
            <p className="text-muted-foreground">Q3 2025 • Situación actualizada</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-blue-50">
              Backend Nuevo
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSyncNow}
              disabled={syncing}
            >
              {syncing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Sincronizar
            </Button>
          </div>
        </div>

        {/* Alertas */}
        {data.alerts && data.alerts.length > 0 && (
          <div className="space-y-3 mb-10">
            {data.alerts.map((alert, index) => (
              <Alert 
                key={index} 
                variant={alert.type === 'warning' ? 'destructive' : 'default'}
              >
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{alert.message}</AlertDescription>
              </Alert>
            ))}
          </div>
        )}

        {/* Tarjetas fiscales - USANDO COMPONENTES REALES */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {fiscalData.iva ? (
            <IvaCard data={fiscalData.iva} />
          ) : (
            <Card className="border-gray-200">
              <CardContent className="pt-6">
                <Loader2 className="h-6 w-6 animate-spin mx-auto" />
              </CardContent>
            </Card>
          )}

          {fiscalData.irpf ? (
            <IrpfCard data={fiscalData.irpf} />
          ) : (
            <Card className="border-gray-200">
              <CardContent className="pt-6">
                <Loader2 className="h-6 w-6 animate-spin mx-auto" />
              </CardContent>
            </Card>
          )}

          {fiscalData.sociedades ? (
            <SociedadesCard data={fiscalData.sociedades} />
          ) : (
            <Card className="border-gray-200">
              <CardContent className="pt-6">
                <Loader2 className="h-6 w-6 animate-spin mx-auto" />
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* SEPARADOR VISUAL */}
      <div className="my-16">
        <hr className="border-gray-200" />
      </div>

      {/* SECCIÓN 2: EVOLUCIÓN DE LA EMPRESA */}
      <div className="space-y-8">
        <ChartsSection tenantSlug={slug} />
      </div>

      {/* SEPARADOR VISUAL */}
      <div className="my-16">
        <hr className="border-gray-200" />
      </div>

      {/* SECCIÓN 3: GESTIÓN OPERATIVA */}
      <div className="space-y-8">
        <div className="flex items-center gap-2 mb-8">
          <h2 className="text-2xl font-bold">Gestión Operativa</h2>
          <Badge variant="outline">Tesorería, ingresos, gastos y rentabilidad</Badge>
        </div>

        {/* KPIs operativos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Saldo disponible */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Euro className="h-4 w-4" />
                Saldo disponible en bancos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${(data.totalCash || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatEuro(data.totalCash || 0)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Cuentas bancarias
              </p>
              <Badge variant={(data.totalCash || 0) >= 0 ? "default" : "destructive"} className="mt-2">
                {(data.totalCash || 0) >= 0 ? 'Positivo' : 'Negativo'}
              </Badge>
            </CardContent>
          </Card>

          {/* Facturación */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Facturación
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatEuro(data.yearlyRevenue || 0)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Año actual
              </p>
              <p className="text-xs text-muted-foreground">
                Mes: {formatEuro(data.monthlyRevenue || 0)}
              </p>
            </CardContent>
          </Card>

          {/* Pagos realizados */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingDown className="h-4 w-4" />
                Pagos realizados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatEuro(data.yearlyExpenses || 0)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Año actual
              </p>
              <p className="text-xs text-muted-foreground">
                Mes: {formatEuro(data.monthlyExpenses || 0)}
              </p>
            </CardContent>
          </Card>

          {/* Rentabilidad */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Target className="h-4 w-4" />
                Rentabilidad
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${(data.yearlyMargin || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatEuro(data.yearlyMargin || 0)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Margen anual
              </p>
              <p className={`text-xs mt-1 font-medium ${(data.marginPercentage || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatNumber(data.marginPercentage || 0, 1)}%
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Información del período */}
      <Card className="mt-16">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Información del Período
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-sm">
            <div>
              <span className="text-muted-foreground">Año fiscal:</span>
              <p className="font-medium">2025</p>
            </div>
            <div>
              <span className="text-muted-foreground">Trimestre:</span>
              <p className="font-medium">Q3</p>
            </div>
            <div>
              <span className="text-muted-foreground">Mes:</span>
              <p className="font-medium">Septiembre</p>
            </div>
            <div>
              <span className="text-muted-foreground">Última actualización:</span>
              <p className="font-medium">
                {data.lastUpdated ? new Date(data.lastUpdated).toLocaleString('es-ES') : 'Ahora mismo'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
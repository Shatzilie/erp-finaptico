import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, RefreshCw, TrendingUp, TrendingDown, DollarSign, 
         AlertTriangle, CheckCircle, XCircle, Euro, CreditCard, 
         Receipt, Target } from 'lucide-react';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  const fetchDashboardData = async () => {
    console.log('🎯 Cargando datos del Dashboard...');
    
    try {
      const response = await fetch('https://dtmrywilxpilpzokxxif.supabase.co/functions/v1/odoo-dashboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-lovable-secret': 'lovable_sync_2024_LP%#tGxa@Q'
        },
        body: JSON.stringify({
          tenant_slug: 'c4002f55-f7d5-4dd4-9942-d7ca65a551fd'
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error response:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const result = await response.json();
      console.log('📊 Respuesta completa de la API:', result);
      
      // CORRECCIÓN CRÍTICA: Acceder a los datos correctamente
      if (result.ok && result.widget_data?.dashboard?.success) {
        const dashboardPayload = result.widget_data.dashboard.payload;
        console.log('✅ Datos extraídos correctamente:', dashboardPayload);
        
        // Transformar el formato del backend al formato esperado
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
          lastUpdated: result.meta?.execution_time
        };
        
        setData(transformedData);
        setError(null);
      } else {
        // Manejar errores de la API
        const errorMsg = result.error || 'Error desconocido en la respuesta de la API';
        console.error('❌ Error en la respuesta de la API:', errorMsg);
        throw new Error(errorMsg);
      }
    } catch (err: any) {
      console.error('❌ Error cargando datos del Dashboard:', err);
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
    
    // Auto-refresh cada 5 minutos
    const interval = setInterval(fetchDashboardData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

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
    <div className="space-y-12"> {/* ESPACIADO AMPLIO - Cambiado de space-y-6 a space-y-12 */}
      
      {/* SECCIÓN 1: ESTADO FISCAL - Con separación amplia */}
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-8"> {/* Añadido mb-8 para más separación */}
          <div>
            <h2 className="text-2xl font-bold">📊 Estado Fiscal del Trimestre</h2>
            <p className="text-muted-foreground">Q3 2025 • Situación actualizada</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-blue-50">
              🚀 Backend Nuevo
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
          <div className="space-y-3 mb-10"> {/* Cambiado mb-6 a mb-10 para más separación */}
            {data.alerts.map((alert, index) => (
              <Alert 
                key={index} 
                variant={alert.type === 'warning' ? 'destructive' : alert.type === 'info' ? 'default' : 'destructive'}
              >
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{alert.message}</AlertDescription>
              </Alert>
            ))}
          </div>
        )}

        {/* Tarjetas fiscales - con más espacio */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12"> {/* Cambiado gap-6 a gap-8 y mb-8 a mb-12 */}
          {/* Tarjeta IVA */}
          <Card className="border-red-200 bg-red-50/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Receipt className="h-4 w-4 text-red-600" />
                IVA - Tercer Trimestre
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600 mb-2">
                Previsión: pagar 1765,74 €
              </div>
              <div className="space-y-1 text-xs text-muted-foreground">
                <p>IVA cobrado (facturas): 2520 €</p>
                <p>IVA pagado (gastos): 754,26 €</p>
              </div>
              <Badge variant="destructive" className="mt-3">
                Hay que pagar a Hacienda
              </Badge>
            </CardContent>
          </Card>

          {/* Tarjeta IRPF */}
          <Card className="border-blue-200 bg-blue-50/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Receipt className="h-4 w-4 text-blue-600" />
                IRPF - Tercer Trimestre
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600 mb-2">
                Previsión: a tu favor 1597,82 €
              </div>
              <div className="space-y-1 text-xs text-muted-foreground">
                <p>IRPF aplicado en servicios</p>
                <p>IRPF soportado: 2497,66 €</p>
                <p>IRPF practicado: 869,84 €</p>
              </div>
              <Badge variant="default" className="mt-3">
                No hay que hacer nada
              </Badge>
            </CardContent>
          </Card>

          {/* Tarjeta Impuesto de Sociedades */}
          <Card className="border-gray-200 bg-gray-50/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Receipt className="h-4 w-4 text-gray-600" />
                Impuesto de Sociedades - 2025
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600 mb-2">
                Previsión actual: 0 €
              </div>
              <div className="space-y-1 text-xs text-muted-foreground">
                <p>Sin ingresos proyectos (a día de hoy)</p>
                <p>Resultado empresarial: -9437 €</p>
              </div>
              <Badge variant="secondary" className="mt-3">
                No hay que pagar a Hacienda
              </Badge>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* SEPARADOR VISUAL AMPLIO */}
      <div className="my-16"> {/* Separador más amplio - Cambiado de my-12 a my-16 */}
        <hr className="border-gray-200" />
      </div>

      {/* SECCIÓN 2: EVOLUCIÓN DE LA EMPRESA - Con separación amplia */}
      <div className="space-y-8">
        <div className="flex items-center gap-2 mb-8"> {/* Añadido mb-8 */}
          <h2 className="text-2xl font-bold">📈 Evolución de tu empresa</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-12"> {/* Cambiado gap-8 a gap-10 y mb-8 a mb-12 */}
          {/* Gráfica de Ingresos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Ingresos Galway Morgon Mensual
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48 flex items-center justify-center bg-muted/20 rounded">
                <p className="text-muted-foreground">Gráfica de ingresos mensual</p>
              </div>
            </CardContent>
          </Card>

          {/* Gráfica de Balances */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Balances del Margen
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48 flex items-center justify-center bg-muted/20 rounded">
                <p className="text-muted-foreground">Gráfica de márgenes</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* SEPARADOR VISUAL AMPLIO */}
      <div className="my-16"> {/* Separador más amplio */}
        <hr className="border-gray-200" />
      </div>

      {/* SECCIÓN 3: GESTIÓN OPERATIVA - Con separación amplia */}
      <div className="space-y-8">
        <div className="flex items-center gap-2 mb-8"> {/* Añadido mb-8 */}
          <h2 className="text-2xl font-bold">💼 Gestión Operativa</h2>
          <Badge variant="outline">Tesorería, ingresos, gastos y rentabilidad</Badge>
        </div>

        {/* KPIs operativos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12"> {/* Cambiado gap-6 a gap-8 y mb-8 a mb-12 */}
          {/* Saldo disponible en bancos */}
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
                6 cuentas activas
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
                Facturación del mes actual
              </p>
              <p className="text-xs text-muted-foreground">
                Sep: {formatEuro(data.monthlyRevenue || 0)}
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
                Pagos del mes actual
              </p>
              <p className="text-xs text-muted-foreground">
                Sep: {formatEuro(data.monthlyExpenses || 0)}
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
                Margen estimado entre ingresos y gastos
              </p>
              <p className={`text-xs mt-1 font-medium ${(data.marginPercentage || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatNumber(data.marginPercentage || 0, 1)}%
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Información del período */}
      <Card className="mt-16"> {/* Añadido mt-16 para más separación final */}
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Información del Período
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-sm"> {/* Cambiado gap-6 a gap-8 */}
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
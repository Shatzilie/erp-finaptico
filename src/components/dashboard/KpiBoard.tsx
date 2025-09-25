import { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Building, 
  TrendingUp, 
  TrendingDown, 
  Calculator, 
  Percent, 
  Euro, 
  RefreshCw, 
  Loader2,
  Wallet,
  FileText,
  AlertTriangle,
  Info,
  Clock
} from 'lucide-react';

interface DashboardData {
  treasury: {
    totalCash: number;
    accounts: number;
    status: string;
  };
  revenue: {
    yearly: number;
    monthly: number;
    pendingInvoices: number;
  };
  expenses: {
    yearly: number;
    monthly: number;
    pendingBills: number;
  };
  profitability: {
    yearlyMargin: number;
    marginPercentage: number;
  };
  iva: {
    repercutido: number;
    soportado: number;
    diferencia: number;
    status: string;
  };
  irpf: {
    practicadas: number;
    soportadas: number;
    status: string;
  };
  societies: {
    resultado: number;
    status: string;
    baseImponible: number;
    cuota: number;
  };
  period: {
    year: number;
    quarter: number;
    month: number;
  };
  alerts: Array<{
    type: string;
    message: string;
  }>;
  lastUpdated: string;
}

// Interface para la respuesta de la API
interface ApiResponse {
  ok: boolean;
  widget_data: {
    dashboard: {
      success: boolean;
      payload: DashboardData;
    };
  };
  meta: {
    execution_time: string;
    tenant_slug: string;
    trace: any[];
  };
  error?: string;
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
      
      const result: ApiResponse = await response.json();
      console.log('📊 Respuesta completa de la API:', result);
      
      // CORRECCIÓN CRÍTICA: Acceder a los datos correctamente
      if (result.ok && result.widget_data?.dashboard?.success) {
        const dashboardPayload = result.widget_data.dashboard.payload;
        console.log('✅ Datos extraídos correctamente:', dashboardPayload);
        
        // Añadir timestamp de actualización
        setData({
          ...dashboardPayload,
          lastUpdated: result.meta.execution_time
        });
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
  }, [slug]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Dashboard Principal</h2>
            <p className="text-sm text-muted-foreground">Cargando datos financieros...</p>
          </div>
          <Button disabled>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Cargando...
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-3/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-1/2 mb-2" />
                <Skeleton className="h-3 w-1/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Dashboard Principal</h2>
            <p className="text-sm text-muted-foreground">Error al cargar datos</p>
          </div>
          <Button onClick={handleSyncNow} disabled={syncing} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
            Reintentar
          </Button>
        </div>
        
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-red-800">
            <strong>Error al cargar el dashboard:</strong><br />
            {error || 'Error desconocido. Por favor, intenta recargar la página.'}
          </AlertDescription>
        </Alert>
        
        {/* Información de debug */}
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="text-sm text-amber-800">Información de Debug</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-amber-700">
            <p>• Tenant: {slug || 'No definido'}</p>
            <p>• Función: odoo-dashboard</p>
            <p>• Estado: {error ? 'Error' : 'Sin datos'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Dashboard Principal</h2>
          <p className="text-sm text-muted-foreground">
            Resumen financiero completo - {data.period?.year} Q{data.period?.quarter}
          </p>
        </div>
        <Button onClick={handleSyncNow} disabled={syncing} variant="outline">
          <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Sincronizando...' : 'Sincronizar ahora'}
        </Button>
      </div>

      {/* Alertas dinámicas */}
      {data.alerts && data.alerts.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-medium">Alertas importantes</h3>
          {data.alerts.map((alert, index) => (
            <Alert key={index} className={
              alert.type === 'warning' ? 'border-yellow-200 bg-yellow-50' :
              alert.type === 'important' ? 'border-red-200 bg-red-50' :
              'border-blue-200 bg-blue-50'
            }>
              <AlertTriangle className={`h-4 w-4 ${
                alert.type === 'warning' ? 'text-yellow-600' :
                alert.type === 'important' ? 'text-red-600' :
                'text-blue-600'
              }`} />
              <AlertDescription className={
                alert.type === 'warning' ? 'text-yellow-800' :
                alert.type === 'important' ? 'text-red-800' :
                'text-blue-800'
              }>
                {alert.message}
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Indicadores principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Tesorería */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Tesorería
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${data.treasury.totalCash >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatEuro(data.treasury.totalCash)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {data.treasury.accounts} cuentas • Estado: {data.treasury.status}
            </p>
            <Badge variant={data.treasury.totalCash >= 0 ? "default" : "destructive"} className="mt-2">
              {data.treasury.totalCash >= 0 ? 'Positivo' : 'Negativo'}
            </Badge>
          </CardContent>
        </Card>

        {/* Ingresos */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Facturación Anual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatEuro(data.revenue.yearly)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Mensual: {formatEuro(data.revenue.monthly)}
            </p>
            <p className="text-xs text-muted-foreground">
              Pendientes: {data.revenue.pendingInvoices} facturas
            </p>
          </CardContent>
        </Card>

        {/* Gastos */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingDown className="h-4 w-4" />
              Gastos Anuales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatEuro(data.expenses.yearly)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Mensual: {formatEuro(data.expenses.monthly)}
            </p>
            <p className="text-xs text-muted-foreground">
              Pendientes: {data.expenses.pendingBills} facturas
            </p>
          </CardContent>
        </Card>

        {/* Rentabilidad */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Rentabilidad
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${data.profitability.yearlyMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatEuro(data.profitability.yearlyMargin)}
            </div>
            <p className={`text-xs mt-1 font-medium ${data.profitability.marginPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatNumber(data.profitability.marginPercentage, 1)}%
            </p>
            <Badge variant={data.profitability.yearlyMargin >= 0 ? "default" : "destructive"} className="mt-2">
              {data.profitability.yearlyMargin >= 0 ? 'Beneficio' : 'Pérdida'}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Módulos fiscales */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* IVA */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Percent className="h-5 w-5" />
              IVA Trimestral (Q{data.period?.quarter} {data.period?.year})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">IVA cobrado:</span>
              <span className="font-medium">{formatEuro(data.iva.repercutido)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">IVA pagado:</span>
              <span className="font-medium">{formatEuro(data.iva.soportado)}</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="text-sm font-medium">Diferencia:</span>
              <span className={`font-bold ${data.iva.diferencia >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                {formatEuro(data.iva.diferencia)}
              </span>
            </div>
            <Badge 
              variant={data.iva.status === 'A INGRESAR' ? 'destructive' : 
                      data.iva.status === 'A COMPENSAR' ? 'default' : 'secondary'}
              className="w-full justify-center"
            >
              {data.iva.status}
            </Badge>
            {data.iva.status === 'A INGRESAR' && (
              <div className="bg-red-50 border border-red-200 p-2 rounded text-xs text-red-800">
                💰 Hay que pagar a Hacienda
              </div>
            )}
          </CardContent>
        </Card>

        {/* IRPF */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              IRPF Trimestral (Q{data.period?.quarter} {data.period?.year})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Retenido a clientes:</span>
              <span className="font-medium">{formatEuro(data.irpf.practicadas)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Retenido por proveedores:</span>
              <span className="font-medium">{formatEuro(data.irpf.soportadas)}</span>
            </div>
            <Badge 
              variant={data.irpf.status === 'NEUTRO' ? 'secondary' : 'default'}
              className="w-full justify-center"
            >
              {data.irpf.status}
            </Badge>
            {data.irpf.status === 'NEUTRO' && (
              <div className="bg-gray-50 border border-gray-200 p-2 rounded text-xs text-gray-700">
                ℹ️ Sin movimientos significativos
              </div>
            )}
          </CardContent>
        </Card>

        {/* Impuesto de Sociedades */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Impuesto Sociedades ({data.period?.year})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Resultado ejercicio:</span>
              <span className={`font-bold text-lg ${data.societies.resultado >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatEuro(data.societies.resultado)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Base imponible:</span>
              <span className="font-medium">{formatEuro(data.societies.baseImponible)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Cuota estimada:</span>
              <span className="font-medium">{formatEuro(data.societies.cuota)}</span>
            </div>
            <Badge 
              variant={data.societies.status === 'PÉRDIDAS' ? 'secondary' : 'destructive'}
              className="w-full justify-center"
            >
              {data.societies.status}
            </Badge>
            {data.societies.status === 'PÉRDIDAS' && (
              <div className="bg-yellow-50 border border-yellow-200 p-2 rounded text-xs text-yellow-800">
                ⚠️ No hay que pagar Impuesto de Sociedades
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Información del período */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Información del Período
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Año fiscal:</span>
              <p className="font-medium">{data.period?.year}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Trimestre:</span>
              <p className="font-medium">Q{data.period?.quarter}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Mes:</span>
              <p className="font-medium">{data.period?.month}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Última actualización:</span>
              <p className="font-medium flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {data.lastUpdated ? new Date(data.lastUpdated).toLocaleString('es-ES') : 'Ahora mismo'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
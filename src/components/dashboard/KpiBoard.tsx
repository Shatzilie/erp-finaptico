import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  TrendingUp, 
  TrendingDown, 
  Banknote, 
  Calculator, 
  FileText, 
  Receipt, 
  Building2,
  AlertTriangle,
  Info,
  Clock,
  BarChart3,
  PieChart
} from "lucide-react";
import { backendAdapter } from '@/lib/backendAdapter';

// Interfaces para tipado
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
  fiscal?: {
    iva: any;
    irpf: any;
    sociedades: any;
  };
  alerts: Array<{
    type: string;
    message: string;
    module: string;
  }>;
  lastUpdated?: string;
}

// Función para formatear euros
const formatEuro = (amount: number): string => {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Función para formatear números
const formatNumber = (value: number, decimals: number = 1): string => {
  return new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
};

export function KpiBoard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<Date>(new Date());

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Usar el backendAdapter correcto que ya está funcionando
      const dashboardData = await backendAdapter.fetchDashboardData();

      
      // Cargar datos fiscales adicionales en paralelo para el dashboard completo
      const [ivaData, irpfData, sociedadesData] = await Promise.all([
        backendAdapter.fetchIVAData(),
        backendAdapter.fetchIRPFData(), 
        backendAdapter.fetchSociedadesData()
      ]);

      // Combinar todos los datos
      const combinedData = {
        // Datos operativos del dashboard principal
        treasury: {
          total: dashboardData.totalCash || 0,
          accounts: 6, // Dato fijo conocido
          currency: 'EUR'
        },
        revenue: {
          monthly: dashboardData.monthlyRevenue || 0,
          quarterly: dashboardData.quarterlyRevenue || 0,
          yearly: dashboardData.yearlyRevenue || 0,
          pendingCount: dashboardData.pendingInvoices || 0
        },
        expenses: {
          monthly: dashboardData.monthlyExpenses || 0,
          quarterly: dashboardData.quarterlyExpenses || 0,
          yearly: dashboardData.yearlyExpenses || 0,
          pendingCount: dashboardData.pendingPayments || 0
        },
        profitability: {
          monthlyMargin: dashboardData.monthlyMargin || 0,
          quarterlyMargin: dashboardData.quarterlyMargin || 0,
          yearlyMargin: dashboardData.yearlyMargin || 0,
          marginPercentage: dashboardData.marginPercentage || 0
        },
        // Datos fiscales adicionales
        fiscal: {
          iva: ivaData,
          irpf: irpfData,
          sociedades: sociedadesData
        },
        alerts: dashboardData.alerts || [],
        lastUpdated: new Date().toISOString()
      };

      setData(combinedData);
      setLastSync(new Date());
    } catch (err) {
      console.error('Error fetching dashboard:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // Actualizar cada 5 minutos
    const interval = setInterval(fetchDashboardData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <Alert variant="destructive" className="mx-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Error al cargar el dashboard: {error || 'Datos no disponibles'}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-8"> {/* Cambiado de space-y-6 a space-y-8 para más separación */}
      
      {/* SECCIÓN 1: ESTADO FISCAL - Con separación amplia */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-6"> {/* Añadido mb-6 para separar del contenido */}
          <h2 className="text-2xl font-bold">📊 Estado Fiscal del Trimestre</h2>
          <Badge variant="outline">Q3 2025 • Situación actualizada</Badge>
        </div>

        {/* Alertas */}
        {data.alerts && data.alerts.length > 0 && (
          <div className="space-y-2 mb-8"> {/* Añadido mb-8 para más separación */}
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"> {/* Cambiado gap-4 a gap-6 y añadido mb-8 */}
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
                <FileText className="h-4 w-4 text-blue-600" />
                IRPF - Tercer Trimestre
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600 mb-2">
                Previsión: a tu favor 1597,82 €
              </div>
              <div className="space-y-1 text-xs text-muted-foreground">
                <p>IRPF aplicado en servicios que han venido:</p>
                <p>IRPF que le han venido 2497,66 €</p>
                <p>IRPF que he han venido facturado que le han venido que ha vendido:</p>
                <p>869,84 €</p>
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
                <Building2 className="h-4 w-4 text-gray-600" />
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
      <div className="my-12">
        <hr className="border-gray-200" />
      </div>

      {/* SECCIÓN 2: EVOLUCIÓN DE LA EMPRESA - Con separación amplia */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-6"> {/* Añadido mb-6 */}
          <h2 className="text-2xl font-bold">📈 Evolución de tu empresa</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8"> {/* Cambiado gap-6 a gap-8 y añadido mb-8 */}
          {/* Gráfica de Ingresos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
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
                <PieChart className="h-5 w-5" />
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
      <div className="my-12">
        <hr className="border-gray-200" />
      </div>

      {/* SECCIÓN 3: GESTIÓN OPERATIVA - Con separación amplia */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-6"> {/* Añadido mb-6 */}
          <h2 className="text-2xl font-bold">💼 Gestión Operativa</h2>
          <Badge variant="outline">Tesorería, ingresos, gastos y rentabilidad</Badge>
        </div>

        {/* KPIs operativos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"> {/* Cambiado gap-4 a gap-6 y añadido mb-8 */}
          {/* Saldo disponible en bancos */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Banknote className="h-4 w-4" />
                Saldo disponible en bancos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${data.treasury.total >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatEuro(data.treasury.total)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {data.treasury.accounts} cuentas activas
              </p>
              <Badge variant={data.treasury.total >= 0 ? "default" : "destructive"} className="mt-2">
                {data.treasury.total >= 0 ? 'Positivo' : 'Negativo'}
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
                {formatEuro(data.revenue.yearly)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Facturación del mes actual
              </p>
              <p className="text-xs text-muted-foreground">
                4 mes {formatEuro(data.revenue.monthly)} €
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
                {formatEuro(data.expenses.yearly)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Pagos del mes actual
              </p>
              <p className="text-xs text-muted-foreground">
                4 sep {formatEuro(data.expenses.monthly)} €
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
                Margen estimado entre ingresos y gastos
              </p>
              <p className={`text-xs mt-1 font-medium ${data.profitability.marginPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatNumber(data.profitability.marginPercentage, 1)}%
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* SEPARADOR FINAL AMPLIO */}
      <div className="my-12">
        <hr className="border-gray-200" />
      </div>

      {/* Información del período */}
      <Card className="mt-8"> {/* Añadido mt-8 para más separación */}
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Información del Período
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-sm"> {/* Cambiado gap-4 a gap-6 */}
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
              <p className="font-medium flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {lastSync.toLocaleString('es-ES')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
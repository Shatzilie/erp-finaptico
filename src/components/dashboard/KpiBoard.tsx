// src/components/dashboard/KpiBoard.tsx
// =====================================
// VERSIÓN MIGRADA - Compatible con nuevo backend + fallback automático + TARJETAS FISCALES

import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, RefreshCw, TrendingUp, TrendingDown, DollarSign, 
         AlertTriangle, CheckCircle, XCircle, Euro, CreditCard, 
         Receipt, Target, Calculator, Percent, FileText, Building } from 'lucide-react';

// 🔥 IMPORTAR NUEVO ADAPTADOR
import { DashboardApiClient, LegacyDashboardData } from '@/lib/backendAdapter';

// 🆕 INTERFACES PARA DATOS FISCALES
interface FiscalData {
  iva: {
    iva_diferencia: number;
    iva_repercutido: number;
    iva_soportado: number;
    status: string;
    period: { quarter: number; year: number; };
  } | null;
  irpf: {
    diferencia: number;
    retenciones_practicadas: number;
    retenciones_soportadas: number;
    status: string;
    period: { quarter: number; year: number; };
  } | null;
  sociedades: {
    cuota_diferencial: number;
    resultado_ejercicio: number;
    base_imponible: number;
    status: string;
    period: { year: number; };
  } | null;
}

// 🔧 HOOK PARA TENANT SLUG
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

// 💶 FORMATEO DE MONEDA
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

// 🎨 COMPONENTE PRINCIPAL
export default function KpiBoard() {
  const slug = useTenantSlug();
  const [data, setData] = useState<LegacyDashboardData | null>(null);
  const [fiscalData, setFiscalData] = useState<FiscalData>({ iva: null, irpf: null, sociedades: null });
  const [loading, setLoading] = useState(true);
  const [fiscalLoading, setFiscalLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [syncMethod, setSyncMethod] = useState<'new' | 'legacy' | 'unknown'>('unknown');

  // 🌐 INSTANCIA DEL CLIENTE API
  const apiClient = new DashboardApiClient();

  // 📊 FUNCIÓN PARA LLAMAR ENDPOINTS FISCALES usando backendAdapter
  const fetchFiscalData = async (tenantSlug: string) => {
    console.log('🧾 Cargando datos fiscales...');
    setFiscalLoading(true);
    
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentQuarter = Math.ceil((currentDate.getMonth() + 1) / 3);

    try {
      // Usar el mismo patrón de URLs que el backendAdapter para consistencia
      const baseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://rnccrpmgywcbbnrqmfkz.supabase.co';
      const headers = {
        'Content-Type': 'application/json',
        'x-lovable-secret': 'lovable_sync_2024_LP%#tGxa@Q'
      };

      // Llamadas paralelas a los 3 endpoints fiscales
      const [ivaResponse, irpfResponse, sociedadesResponse] = await Promise.allSettled([
        // IVA trimestral
        fetch(`${baseUrl}/functions/v1/odoo-iva`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            tenant_slug: tenantSlug,
            quarter: currentQuarter,
            year: currentYear
          })
        }),
        
        // IRPF trimestral
        fetch(`${baseUrl}/functions/v1/odoo-irpf`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            tenant_slug: tenantSlug,
            quarter: currentQuarter,
            year: currentYear
          })
        }),
        
        // Impuesto Sociedades anual
        fetch(`${baseUrl}/functions/v1/odoo-sociedades`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            tenant_slug: tenantSlug,
            year: currentYear
          })
        })
      ]);

      // Procesar respuestas
      const newFiscalData: FiscalData = { iva: null, irpf: null, sociedades: null };

      // Procesar IVA
      if (ivaResponse.status === 'fulfilled') {
        try {
          const ivaJson = await ivaResponse.value.json();
          if (ivaJson.ok && ivaJson.widget_data?.iva?.payload) {
            newFiscalData.iva = ivaJson.widget_data.iva.payload;
            console.log('✅ IVA cargado:', newFiscalData.iva);
          } else {
            console.log('⚠️ IVA response sin datos:', ivaJson);
          }
        } catch (e) {
          console.error('❌ Error parsing IVA:', e);
        }
      } else {
        console.error('❌ IVA request failed:', ivaResponse.reason);
      }

      // Procesar IRPF
      if (irpfResponse.status === 'fulfilled') {
        try {
          const irpfJson = await irpfResponse.value.json();
          if (irpfJson.ok && irpfJson.widget_data?.irpf?.payload) {
            newFiscalData.irpf = irpfJson.widget_data.irpf.payload;
            console.log('✅ IRPF cargado:', newFiscalData.irpf);
          } else {
            console.log('⚠️ IRPF response sin datos:', irpfJson);
          }
        } catch (e) {
          console.error('❌ Error parsing IRPF:', e);
        }
      } else {
        console.error('❌ IRPF request failed:', irpfResponse.reason);
      }

      // Procesar Sociedades
      if (sociedadesResponse.status === 'fulfilled') {
        try {
          const sociedadesJson = await sociedadesResponse.value.json();
          if (sociedadesJson.ok && sociedadesJson.widget_data?.sociedades?.payload) {
            newFiscalData.sociedades = sociedadesJson.widget_data.sociedades.payload;
            console.log('✅ Sociedades cargado:', newFiscalData.sociedades);
          } else {
            console.log('⚠️ Sociedades response sin datos:', sociedadesJson);
          }
        } catch (e) {
          console.error('❌ Error parsing Sociedades:', e);
        }
      } else {
        console.error('❌ Sociedades request failed:', sociedadesResponse.reason);
      }

      setFiscalData(newFiscalData);
      console.log('✅ Datos fiscales finales:', newFiscalData);
      
    } catch (err) {
      console.error('❌ Error general cargando datos fiscales:', err);
    } finally {
      setFiscalLoading(false);
    }
  };

  // 📊 FUNCIÓN DE CARGA DE DATOS (NUEVA)
  const fetchDashboardData = async () => {
    console.log('🎯 Cargando datos del Dashboard...');
    setLoading(true);
    setError(null);
    
    const tenantSlug = slug || 'c4002f55-f7d5-4dd4-9942-d7ca65a551fd';
    
    try {
      // Cargar datos operativos y fiscales en paralelo
      const [dashboardData] = await Promise.all([
        apiClient.fetchDashboardData(tenantSlug),
        fetchFiscalData(tenantSlug)
      ]);
      
      setData(dashboardData);
      setLastSync(new Date());
      
      // Detectar qué método se usó (para mostrar en UI)
      if (dashboardData.alerts?.some(a => a.type === 'error')) {
        setSyncMethod('legacy');
      } else {
        setSyncMethod('new');
      }
      
      console.log('✅ Datos del dashboard cargados:', dashboardData);
      
    } catch (err) {
      console.error('❌ Error cargando dashboard:', err);
      setError('Error cargando datos del dashboard. Verificar conexión.');
      setSyncMethod('unknown');
    } finally {
      setLoading(false);
    }
  };

  // 🔄 FUNCIÓN DE SINCRONIZACIÓN MANUAL
  const handleSync = async () => {
    setSyncing(true);
    await fetchDashboardData();
    setSyncing(false);
  };

  // 🚀 EFECTO INICIAL
  useEffect(() => {
    fetchDashboardData();
  }, [slug]);

  // 🎯 RENDERIZADO DEL ESTADO DE CARGA
  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando datos del dashboard...</p>
        </div>
      </div>
    );
  }

  // ❌ RENDERIZADO DEL ESTADO DE ERROR
  if (error && !data) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center max-w-md">
          <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Error de Conexión</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={fetchDashboardData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  // 🎛️ DATOS POR DEFECTO SI FALTAN
  const dashboardData: LegacyDashboardData = data || {
    totalCash: 0,
    monthlyRevenue: 0,
    quarterlyRevenue: 0,
    yearlyRevenue: 0,
    pendingInvoices: 0,
    monthlyExpenses: 0,
    quarterlyExpenses: 0,
    yearlyExpenses: 0,
    pendingPayments: 0,
    monthlyMargin: 0,
    quarterlyMargin: 0,
    yearlyMargin: 0,
    marginPercentage: 0,
    alerts: []
  };

  return (
    <div className="space-y-6">
      {/* 📊 HEADER CON INFO DE SINCRONIZACIÓN */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Ejecutivo</h1>
          <p className="text-muted-foreground">
            Vista general de indicadores clave de negocio
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Indicador del método de sync */}
          <Badge variant={syncMethod === 'new' ? 'default' : syncMethod === 'legacy' ? 'secondary' : 'destructive'}>
            {syncMethod === 'new' ? '🚀 Backend Nuevo' : syncMethod === 'legacy' ? '🔄 Fallback Legacy' : '❌ Error'}
          </Badge>
          
          {/* Última sincronización */}
          {lastSync && (
            <span className="text-xs text-muted-foreground">
              {lastSync.toLocaleTimeString('es-ES')}
            </span>
          )}
          
          {/* Botón de sync */}
          <Button onClick={handleSync} disabled={syncing} variant="outline" size="sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Sincronizando...' : 'Actualizar'}
          </Button>
        </div>
      </div>

      {/* 🚨 ALERTAS */}
      {dashboardData.alerts && dashboardData.alerts.length > 0 && (
        <div className="space-y-2">
          {dashboardData.alerts.slice(0, 3).map((alert, index) => (
            <Alert key={index} variant={alert.type === 'error' ? 'destructive' : 'default'}>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>{alert.module}:</strong> {alert.message}
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* 🎯 GRID DE KPIS PRINCIPALES - OPERATIVOS */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        
        {/* 💰 TESORERÍA */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tesorería</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatEuro(dashboardData.totalCash || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Saldo total en cuentas
            </p>
          </CardContent>
        </Card>

        {/* 📈 INGRESOS MENSUALES */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Mes</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatEuro(dashboardData.monthlyRevenue || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Facturación del mes actual
            </p>
          </CardContent>
        </Card>

        {/* 📉 GASTOS MENSUALES */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gastos Mes</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatEuro(dashboardData.monthlyExpenses || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Gastos del mes actual
            </p>
          </CardContent>
        </Card>

        {/* 🎯 MARGEN MENSUAL */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Margen Mes</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(dashboardData.monthlyMargin || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatEuro(dashboardData.monthlyMargin || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatNumber(dashboardData.marginPercentage || 0, 1)}% margen
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 🧾 GRID DE KPIS FISCALES */}
      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-3">
        
        {/* 🧾 IVA TRIMESTRAL */}
        <Card className={fiscalLoading ? 'opacity-60' : ''}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              IVA Q{fiscalData.iva?.period?.quarter || 3} {fiscalData.iva?.period?.year || 2025}
            </CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {fiscalLoading ? (
              <div className="flex items-center">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span className="text-sm text-muted-foreground">Cargando...</span>
              </div>
            ) : fiscalData.iva ? (
              <>
                <div className={`text-2xl font-bold ${
                  fiscalData.iva.iva_diferencia >= 0 ? 'text-red-600' : 'text-green-600'
                }`}>
                  {formatEuro(Math.abs(fiscalData.iva.iva_diferencia))}
                </div>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-muted-foreground">
                    Repercutido: {formatEuro(fiscalData.iva.iva_repercutido)}
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    Soportado: {formatEuro(fiscalData.iva.iva_soportado)}
                  </p>
                </div>
                <Badge 
                  variant={fiscalData.iva.iva_diferencia >= 0 ? 'destructive' : 'default'}
                  className="mt-2 w-full justify-center"
                >
                  {fiscalData.iva.status}
                </Badge>
              </>
            ) : (
              <div className="text-sm text-muted-foreground">Error cargando IVA</div>
            )}
          </CardContent>
        </Card>

        {/* 🧾 IRPF TRIMESTRAL */}
        <Card className={fiscalLoading ? 'opacity-60' : ''}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              IRPF Q{fiscalData.irpf?.period?.quarter || 3} {fiscalData.irpf?.period?.year || 2025}
            </CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {fiscalLoading ? (
              <div className="flex items-center">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span className="text-sm text-muted-foreground">Cargando...</span>
              </div>
            ) : fiscalData.irpf ? (
              <>
                <div className={`text-2xl font-bold ${
                  fiscalData.irpf.diferencia >= 0 ? 'text-red-600' : 'text-blue-600'
                }`}>
                  {formatEuro(Math.abs(fiscalData.irpf.diferencia))}
                </div>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-muted-foreground">
                    Practicadas: {formatEuro(fiscalData.irpf.retenciones_practicadas)}
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    Soportadas: {formatEuro(fiscalData.irpf.retenciones_soportadas)}
                  </p>
                </div>
                <Badge 
                  variant={fiscalData.irpf.diferencia >= 0 ? 'destructive' : 'default'}
                  className="mt-2 w-full justify-center"
                >
                  {fiscalData.irpf.diferencia < 0 ? 'A tu favor' : fiscalData.irpf.status}
                </Badge>
              </>
            ) : (
              <div className="text-sm text-muted-foreground">Error cargando IRPF</div>
            )}
          </CardContent>
        </Card>

        {/* 🏢 IMPUESTO SOCIEDADES */}
        <Card className={fiscalLoading ? 'opacity-60' : ''}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              I. Sociedades {fiscalData.sociedades?.period?.year || 2025}
            </CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {fiscalLoading ? (
              <div className="flex items-center">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span className="text-sm text-muted-foreground">Cargando...</span>
              </div>
            ) : fiscalData.sociedades ? (
              <>
                <div className={`text-2xl font-bold ${
                  fiscalData.sociedades.cuota_diferencial >= 0 ? 'text-red-600' : 'text-blue-600'
                }`}>
                  {formatEuro(Math.abs(fiscalData.sociedades.cuota_diferencial))}
                </div>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-muted-foreground">
                    Resultado: {formatEuro(fiscalData.sociedades.resultado_ejercicio)}
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    Base: {formatEuro(fiscalData.sociedades.base_imponible)}
                  </p>
                </div>
                <Badge 
                  variant={
                    fiscalData.sociedades.status === 'NEUTRO' ? 'secondary' :
                    fiscalData.sociedades.cuota_diferencial >= 0 ? 'destructive' : 'default'
                  }
                  className="mt-2 w-full justify-center"
                >
                  {fiscalData.sociedades.resultado_ejercicio < 0 ? 'Sin impuesto (pérdidas)' : fiscalData.sociedades.status}
                </Badge>
              </>
            ) : (
              <div className="text-sm text-muted-foreground">Error cargando Sociedades</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 📊 GRID DE KPIS SECUNDARIOS */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        
        {/* 📅 TRIMESTRAL */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Trimestre Actual</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Ingresos:</span>
              <span className="font-semibold text-blue-600">
                {formatEuro(dashboardData.quarterlyRevenue || 0)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Gastos:</span>
              <span className="font-semibold text-red-600">
                {formatEuro(dashboardData.quarterlyExpenses || 0)}
              </span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="text-sm font-medium">Margen:</span>
              <span className={`font-bold ${(dashboardData.quarterlyMargin || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatEuro(dashboardData.quarterlyMargin || 0)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* 📅 ANUAL */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Año Actual</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Ingresos:</span>
              <span className="font-semibold text-blue-600">
                {formatEuro(dashboardData.yearlyRevenue || 0)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Gastos:</span>
              <span className="font-semibold text-red-600">
                {formatEuro(dashboardData.yearlyExpenses || 0)}
              </span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="text-sm font-medium">Margen:</span>
              <span className={`font-bold ${(dashboardData.yearlyMargin || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatEuro(dashboardData.yearlyMargin || 0)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* 🔔 PENDIENTES */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pendientes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Facturas cobro:</span>
              <Badge variant={dashboardData.pendingInvoices === 0 ? 'default' : 'destructive'}>
                {dashboardData.pendingInvoices || 0}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Facturas pago:</span>
              <Badge variant={dashboardData.pendingPayments === 0 ? 'default' : 'secondary'}>
                {dashboardData.pendingPayments || 0}
              </Badge>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="text-sm font-medium">Estado:</span>
              <Badge variant={
                (dashboardData.pendingInvoices || 0) === 0 && (dashboardData.pendingPayments || 0) === 0 
                ? 'default' : 'secondary'
              }>
                {(dashboardData.pendingInvoices || 0) === 0 && (dashboardData.pendingPayments || 0) === 0 
                  ? 'Todo al día' : 'Pendientes'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 🔧 INFORMACIÓN TÉCNICA (Solo en desarrollo) */}
      {process.env.NODE_ENV === 'development' && (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              🔧 Info Técnica (Solo desarrollo)
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs space-y-1">
            <div>Tenant: {slug || 'default'}</div>
            <div>Método Sync: {syncMethod}</div>
            <div>Última sync: {lastSync?.toLocaleString('es-ES') || 'nunca'}</div>
            <div>Alertas: {dashboardData.alerts?.length || 0}</div>
            <div>Backend Status: {error ? '❌ Error' : data ? '✅ OK' : '⏳ Cargando'}</div>
            <div>Fiscal IVA: {fiscalData.iva ? '✅' : '❌'}</div>
            <div>Fiscal IRPF: {fiscalData.irpf ? '✅' : '❌'}</div>
            <div>Fiscal Sociedades: {fiscalData.sociedades ? '✅' : '❌'}</div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
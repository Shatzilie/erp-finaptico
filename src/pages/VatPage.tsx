import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Calculator, TrendingUp, TrendingDown, AlertCircle, Calendar, RefreshCw, Loader2 } from 'lucide-react';
import { FreshnessBadge } from '@/components/FreshnessBadge';
import { SyncNow } from '@/components/SyncNow';
import { useTenantAccess } from '@/hooks/useTenantAccess';
import { useAuthenticatedFetch } from '@/hooks/useAuthenticatedFetch';
import { handleApiError } from '@/lib/apiErrorHandler';
import { formatCurrency } from '@/lib/utils';

interface IVAData {
  iva_repercutido: number;
  iva_soportado: number;
  iva_diferencia: number;
  status: string;
  period: {
    quarter: number;
    year: number;
  };
  sales_invoices_count?: number;
  purchase_invoices_count?: number;
}


const quarters = [
  { value: 1, label: 'Q1 (Ene-Mar)' },
  { value: 2, label: 'Q2 (Abr-Jun)' },
  { value: 3, label: 'Q3 (Jul-Sep)' },
  { value: 4, label: 'Q4 (Oct-Dic)' }
];

// Generate years dynamically including the current year
const generateYearOptions = () => {
  const currentYear = new Date().getFullYear();
  const years = [];
  
  // Desde el próximo año hasta 4 años atrás
  for (let year = currentYear + 1; year >= currentYear - 4; year--) {
    years.push({ value: year, label: year.toString() });
  }
  
  return years;
};

const years = generateYearOptions();

const isPeriodInFuture = (quarter: number, year: number) => {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentQuarter = Math.ceil((currentDate.getMonth() + 1) / 3);
  
  return year > currentYear || (year === currentYear && quarter > currentQuarter);
};

export default function VatPage() {
  const { tenantSlug, isLoading: tenantLoading, error: tenantError } = useTenantAccess();
  const [ivaData, setIvaData] = useState<IVAData | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedQuarter, setSelectedQuarter] = useState<number>(Math.ceil((new Date().getMonth() + 1) / 3));
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const { fetchWithTimeout } = useAuthenticatedFetch();

  const fetchIVAData = async (quarter?: number, year?: number) => {
    if (!tenantSlug) return;
    setLoading(true);
    try {
      const result = await fetchWithTimeout(
        'odoo-iva',
        { 
          tenant_slug: tenantSlug,
          quarter: quarter || Math.ceil((new Date().getMonth() + 1) / 3),
          year: year || new Date().getFullYear()
        },
        { timeout: 30000, retries: 1 }
      );

      if (result.ok && result.widget_data?.iva?.payload) {
        setIvaData(result.widget_data.iva.payload);
        setLastUpdated(new Date());
        console.log('✅ IVA data loaded successfully');
      } else {
        throw new Error('Invalid IVA response structure');
      }
    } catch (error: any) {
      handleApiError(error, 'IVA');
      setIvaData(null);
    } finally {
      setLoading(false);
    }
  };

  // Remove the duplicate useEffect as fetchIVAData will be called correctly
  useEffect(() => {
    if (tenantSlug) {
      fetchIVAData(selectedQuarter, selectedYear);
    }
  }, [tenantSlug]);

  const handleRefresh = () => {
    fetchIVAData(selectedQuarter, selectedYear);
  };

  // When changing period, call fetchIVAData with new values
  const handlePeriodChange = async (newQuarter: number, newYear: number) => {
    await fetchIVAData(newQuarter, newYear);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'A INGRESAR':
        return 'destructive';
      case 'A COMPENSAR':
        return 'default';
      case 'NEUTRO':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getDiferenciaColor = (diferencia: number) => {
    if (diferencia < 0) return 'text-green-600';
    if (diferencia > 0) return 'text-red-600';
    return 'text-muted-foreground';
  };

  const getStatusMessage = (diferencia: number, status: string) => {
    if (diferencia > 0) {
      return `Este trimestre pagarás ${formatCurrency(diferencia)} de IVA`;
    } else if (diferencia < 0) {
      return `Tienes ${formatCurrency(Math.abs(diferencia))} a tu favor de IVA`;
    } else {
      return 'IVA equilibrado este trimestre';
    }
  };

  // Validar tenant loading
  if (tenantLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600">Cargando información del tenant...</p>
        </div>
      </div>
    );
  }

  // Validar tenant error
  if (tenantError || !tenantSlug) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-red-500 text-center">
          <p className="font-semibold">Error cargando tenant</p>
          <p>{tenantError || 'No se pudo obtener el tenant'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Declaración de IVA</h1>
          <p className="text-muted-foreground">
            Estoy calculando tu IVA trimestral y preparando las declaraciones
          </p>
        </div>
        <div className="flex items-center gap-4">
          <FreshnessBadge seconds={Math.floor((new Date().getTime() - lastUpdated.getTime()) / 1000)} />
          <SyncNow slug={tenantSlug} onSyncComplete={handleRefresh} />
        </div>
      </div>

      {/* Quarter and Year Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Selecciona el trimestre a consultar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Trimestre</label>
              <Select value={selectedQuarter.toString()} onValueChange={(value) => {
                const newQuarter = parseInt(value);
                setSelectedQuarter(newQuarter);
                handlePeriodChange(newQuarter, selectedYear);
              }}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {quarters.map((quarter) => (
                    <SelectItem key={quarter.value} value={quarter.value.toString()}>
                      {quarter.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Año</label>
              <Select value={selectedYear.toString()} onValueChange={(value) => {
                const newYear = parseInt(value);
                setSelectedYear(newYear);
                handlePeriodChange(selectedQuarter, newYear);
              }}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year.value} value={year.value.toString()}>
                      {year.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* IVA KPIs */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">IVA cobrado</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? (
                <div className="flex items-center">
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  Calculando...
                </div>
              ) : (
                formatCurrency(ivaData?.iva_repercutido || 0)
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              IVA repercutido en tus ventas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">IVA pagado</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? (
                <div className="flex items-center">
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  Calculando...
                </div>
              ) : (
                formatCurrency(ivaData?.iva_soportado || 0)
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              IVA soportado en tus compras
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resultado del IVA</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${loading ? '' : getDiferenciaColor(ivaData?.iva_diferencia || 0)}`}>
              {loading ? (
                <div className="flex items-center">
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  Calculando...
                </div>
              ) : (
                formatCurrency(ivaData?.iva_diferencia || 0)
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {(ivaData?.iva_diferencia || 0) > 0 ? 'Vas a pagar' : 'Tienes a favor'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mi gestión</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {loading ? (
                <div className="flex items-center">
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  Calculando...
                </div>
              ) : (
                <Badge variant={getStatusColor(ivaData?.status || '')}>
                  {ivaData?.status === 'A INGRESAR' ? 'VAS A PAGAR' : 
                   ivaData?.status === 'A COMPENSAR' ? 'GESTIONANDO DEVOLUCIÓN' : 
                   'EQUILIBRADO'}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Trimestre {ivaData?.period?.quarter || selectedQuarter} - {ivaData?.period?.year || selectedYear}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Warning Messages */}
      {isPeriodInFuture(selectedQuarter, selectedYear) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-blue-600 mr-2" />
            <span className="text-blue-800">
              Este trimestre aún no ha terminado. Los datos de Q{selectedQuarter} {selectedYear} se actualizarán cuando transcurra el período.
            </span>
          </div>
        </div>
      )}

      {!isPeriodInFuture(selectedQuarter, selectedYear) && ivaData && 
       (ivaData.sales_invoices_count === 0 || ivaData.purchase_invoices_count === 0) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
            <span className="text-yellow-800">
              No encuentro facturas registradas para Q{selectedQuarter} {selectedYear}. Revisa que estén todas subidas a Odoo.
            </span>
          </div>
        </div>
      )}

      {/* Summary Card */}
      {ivaData && (
        <Card>
          <CardHeader>
            <CardTitle>Mi cálculo para este trimestre</CardTitle>
            <CardDescription>
              Q{ivaData.period.quarter} {ivaData.period.year} - {getStatusMessage(ivaData.iva_diferencia, ivaData.status)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span>IVA cobrado a tus clientes:</span>
              <span className="font-semibold">{formatCurrency(ivaData.iva_repercutido)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>IVA pagado a proveedores:</span>
              <span className="font-semibold">{formatCurrency(ivaData.iva_soportado)}</span>
            </div>
            
            {/* Invoice Counters */}
            <div className="grid grid-cols-2 gap-4 py-2">
              <div>
                <p className="text-sm text-muted-foreground">Facturas emitidas</p>
                <p className="text-lg font-semibold">{ivaData?.sales_invoices_count || 0}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Facturas recibidas</p>
                <p className="text-lg font-semibold">{ivaData?.purchase_invoices_count || 0}</p>
              </div>
            </div>
            
            <Separator />
            <div className="flex justify-between items-center">
              <span className="font-semibold">Resultado final:</span>
              <span className={`font-bold text-lg ${getDiferenciaColor(ivaData.iva_diferencia)}`}>
                {formatCurrency(ivaData.iva_diferencia)}
              </span>
            </div>
            <div className="text-center">
              <Badge variant={getStatusColor(ivaData.status)} className="text-sm">
                {ivaData.status === 'A INGRESAR' ? 'Vas a pagar' :
                 ivaData.status === 'A COMPENSAR' ? 'Estoy tramitando la devolución' :
                 'Todo equilibrado este trimestre'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
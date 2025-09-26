import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Receipt, TrendingUp, TrendingDown, Calculator, AlertCircle, Calendar, RefreshCw } from 'lucide-react';
import { FreshnessBadge } from '@/components/FreshnessBadge';
import { SyncNow } from '@/components/SyncNow';

interface IRPFData {
  retenciones_practicadas: number;
  retenciones_soportadas: number;
  diferencia: number;
  status: string;
  period: {
    quarter: number;
    year: number;
    date_from?: string;
    date_to?: string;
  };
  retenciones_practicadas_count?: number;
  retenciones_soportadas_count?: number;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount);
};

const getTenantId = (tenant: string) => {
  const tenantMap: Record<string, string> = {
    'young-minds': 'c4002f55-f7d5-4dd4-9942-d7ca65a551fd',
    'blacktar': 'otro-uuid-aqui' // Add real UUID when available
  };
  return tenantMap[tenant] || tenant;
};

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

export default function IRPFPage() {
  const { tenant } = useParams();
  const [irpfData, setIrpfData] = useState<IRPFData | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedQuarter, setSelectedQuarter] = useState<number>(Math.ceil((new Date().getMonth() + 1) / 3));
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchIRPFData = async (quarter?: number, year?: number) => {
    console.log(`🎯 fetchIRPFData llamada con: Q${quarter} ${year}`);
    setLoading(true);
    try {
      const response = await fetch('https://dtmrywilxpilpzokxxif.supabase.co/functions/v1/odoo-irpf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-lovable-secret': 'lovable_sync_2024_LP%#tGxa@Q'
        },
        body: JSON.stringify({
          tenant_slug: getTenantId(tenant || ''),
          quarter: quarter || Math.ceil((new Date().getMonth() + 1) / 3),
          year: year || new Date().getFullYear()
        })
      });
      
      console.log('🔍 Respuesta de la API:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const result = await response.json();
      console.log('📊 Datos IRPF parseados:', result);
      setIrpfData(result.widget_data.irpf.payload);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('❌ Error fetching IRPF data:', error);
      setIrpfData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log(`🔄 useEffect triggered for Q${selectedQuarter} ${selectedYear}`);
    fetchIRPFData(selectedQuarter, selectedYear);
  }, [tenant]);

  const handleRefresh = () => {
    console.log('🔄 Manual refresh triggered');
    fetchIRPFData(selectedQuarter, selectedYear);
  };

  // When changing period, call fetchIRPFData with new values
  const handlePeriodChange = async (newQuarter: number, newYear: number) => {
    console.log(`🔄 Cambiando a Q${newQuarter} ${newYear}`);
    console.log('📡 Llamando a fetchIRPFData con nuevos parámetros...');
    await fetchIRPFData(newQuarter, newYear);
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
      return `Este trimestre pagarás ${formatCurrency(diferencia)} de IRPF`;
    } else if (diferencia < 0) {
      return `Tienes ${formatCurrency(Math.abs(diferencia))} a tu favor de IRPF`;
    } else {
      return 'IRPF equilibrado este trimestre';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de IRPF</h1>
          <p className="text-muted-foreground">
            Estoy controlando tus retenciones de IRPF y preparando las declaraciones trimestrales
          </p>
        </div>
        <div className="flex items-center gap-4">
          <FreshnessBadge seconds={Math.floor((new Date().getTime() - lastUpdated.getTime()) / 1000)} />
          <SyncNow slug={tenant || ''} onSyncComplete={handleRefresh} />
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
                console.log(`🎯 Selector trimestre cambiado a: ${value}`);
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
                console.log(`📅 Selector año cambiado a: ${value}`);
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

      {/* IRPF KPIs */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">IRPF retenido</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? (
                <div className="flex items-center">
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  Calculando...
                </div>
              ) : (
                formatCurrency(irpfData?.retenciones_practicadas || 0)
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Has retenido a terceros
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">IRPF soportado</CardTitle>
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
                formatCurrency(irpfData?.retenciones_soportadas || 0)
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Te han retenido a ti
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resultado del IRPF</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${loading ? '' : getDiferenciaColor(irpfData?.diferencia || 0)}`}>
              {loading ? (
                <div className="flex items-center">
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  Calculando...
                </div>
              ) : (
                formatCurrency(irpfData?.diferencia || 0)
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {(irpfData?.diferencia || 0) > 0 ? 'Vas a pagar' : 'Tienes a favor'}
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
                <Badge variant={getStatusColor(irpfData?.status || '')}>
                  {irpfData?.status === 'A INGRESAR' ? 'VAS A PAGAR' : 
                   irpfData?.status === 'A COMPENSAR' ? 'TIENES A FAVOR' : 
                   'EQUILIBRADO'}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Trimestre {irpfData?.period?.quarter || selectedQuarter} - {irpfData?.period?.year || selectedYear}
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

      {!isPeriodInFuture(selectedQuarter, selectedYear) && irpfData && 
       (irpfData.retenciones_practicadas_count === 0 && irpfData.retenciones_soportadas_count === 0) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
            <span className="text-yellow-800">
              No encuentro movimientos de IRPF para Q{selectedQuarter} {selectedYear}. Revisa que las facturas estén correctamente configuradas.
            </span>
          </div>
        </div>
      )}

      {/* Summary Card */}
      {irpfData && (
        <Card>
          <CardHeader>
            <CardTitle>Mi cálculo para este trimestre</CardTitle>
            <CardDescription>
              Q{irpfData.period.quarter} {irpfData.period.year} - {getStatusMessage(irpfData.diferencia, irpfData.status)}
              {irpfData.period.date_from && irpfData.period.date_to && (
                <span className="block text-xs mt-1">
                  {irpfData.period.date_from} - {irpfData.period.date_to}
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span>IRPF que has retenido:</span>
              <span className="font-semibold">{formatCurrency(irpfData.retenciones_practicadas)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>IRPF que te han retenido:</span>
              <span className="font-semibold">{formatCurrency(irpfData.retenciones_soportadas)}</span>
            </div>
            
            {/* Movement Counters */}
            <div className="grid grid-cols-2 gap-4 py-2">
              <div>
                <p className="text-sm text-muted-foreground">Retenciones realizadas</p>
                <p className="text-lg font-semibold">{irpfData?.retenciones_practicadas_count || 0}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Retenciones recibidas</p>
                <p className="text-lg font-semibold">{irpfData?.retenciones_soportadas_count || 0}</p>
              </div>
            </div>
            
            <Separator />
            <div className="flex justify-between items-center">
              <span className="font-semibold">Resultado final:</span>
              <span className={`font-bold text-lg ${getDiferenciaColor(irpfData.diferencia)}`}>
                {formatCurrency(irpfData.diferencia)}
              </span>
            </div>
            <div className="text-center">
              <Badge variant={getStatusColor(irpfData.status)} className="text-sm">
                {irpfData.status === 'A INGRESAR' ? 'Vas a pagar' :
                 irpfData.status === 'A COMPENSAR' ? 'Lo usaré para compensar impuestos futuros' :
                 'Todo equilibrado este trimestre'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
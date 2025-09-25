import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, DollarSign, Calendar, Building, CreditCard, Loader2 } from 'lucide-react';
import { backendAdapter } from '@/lib/backendAdapter';

interface DashboardData {
  fiscal: {
    iva: {
      repercutido: number;
      soportado: number;
      diferencia: number;
      status: string;
    };
    irpf: {
      practicadas: number;
      soportadas: number;
      diferencia: number;
      status: string;
    };
    sociedades: {
      resultado: number;
      impuesto: number;
      status: string;
    };
  };
  operativo: {
    tesoreria: {
      total: number;
      currency: string;
      accounts: number;
    };
    ingresos: {
      monthly: number;
      yearly: number;
      pendingCount: number;
    };
    gastos: {
      monthly: number;
      yearly: number;
      pendingCount: number;
    };
    margen: {
      monthlyMargin: number;
      yearlyMargin: number;
      marginPercentage: number;
    };
  };
}

const KpiBoard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-ES', { 
      style: 'currency', 
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getFiscalStatus = (type: string, value: number, status: string) => {
    switch(type) {
      case 'iva':
        return value > 0 ? 
          { color: 'bg-red-100 border-red-300 text-red-800', icon: AlertTriangle, severity: 'high' } :
          { color: 'bg-blue-100 border-blue-300 text-blue-800', icon: CheckCircle, severity: 'good' };
      case 'irpf':
        return value < 0 ? 
          { color: 'bg-blue-100 border-blue-300 text-blue-800', icon: CheckCircle, severity: 'good' } :
          { color: 'bg-red-100 border-red-300 text-red-800', icon: AlertTriangle, severity: 'high' };
      case 'sociedades':
        return value === 0 ? 
          { color: 'bg-gray-100 border-gray-300 text-gray-800', icon: CheckCircle, severity: 'neutral' } :
          { color: 'bg-red-100 border-red-300 text-red-800', icon: AlertTriangle, severity: 'high' };
      default:
        return { color: 'bg-gray-100 border-gray-300 text-gray-800', icon: CheckCircle, severity: 'neutral' };
    }
  };

  const generateFiscalSummary = (): string => {
    if (!data) return 'Cargando información fiscal...';
    
    const { iva, irpf, sociedades } = data.fiscal;
    let messages: string[] = [];
    
    if (iva.diferencia > 0) {
      messages.push(`Debes ingresar ${iva.diferencia.toLocaleString()}€ de IVA`);
    } else if (iva.diferencia < 0) {
      messages.push(`Hacienda te debe devolver ${Math.abs(iva.diferencia).toLocaleString()}€ de IVA`);
    }
    
    if (irpf.diferencia < 0) {
      messages.push(`Tu IRPF está a tu favor por ${Math.abs(irpf.diferencia).toLocaleString()}€`);
    } else if (irpf.diferencia > 0) {
      messages.push(`Debes pagar ${irpf.diferencia.toLocaleString()}€ de IRPF`);
    }
    
    if (sociedades.resultado < 0) {
      messages.push(`Sin Impuesto de Sociedades por pérdidas`);
    } else if (sociedades.impuesto > 0) {
      messages.push(`Previsión IS: ${sociedades.impuesto.toLocaleString()}€`);
    }
    
    return messages.length > 0 ? messages.join('. ') + '.' : 'Situación fiscal equilibrada.';
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Obtener datos en paralelo usando el backendAdapter
        const [dashboardResponse, ivaResponse, irpfResponse, sociedadesResponse] = await Promise.allSettled([
          backendAdapter.fetchDashboardData(),
          backendAdapter.fetchIVAData(),
          backendAdapter.fetchIRPFData(),
          backendAdapter.fetchSociedadesData()
        ]);

        // Procesar dashboard principal
        let dashboardData: any = null;
        if (dashboardResponse.status === 'fulfilled' && dashboardResponse.value?.ok) {
          dashboardData = dashboardResponse.value.widget_data.dashboard.payload;
        }

        // Procesar datos fiscales
        let ivaData: any = null;
        let irpfData: any = null;
        let sociedadesData: any = null;

        if (ivaResponse.status === 'fulfilled' && ivaResponse.value?.ok) {
          ivaData = ivaResponse.value.widget_data.iva.payload;
        }

        if (irpfResponse.status === 'fulfilled' && irpfResponse.value?.ok) {
          irpfData = irpfResponse.value.widget_data.irpf.payload;
        }

        if (sociedadesResponse.status === 'fulfilled' && sociedadesResponse.value?.ok) {
          sociedadesData = sociedadesResponse.value.widget_data.sociedades.payload;
        }

        // Construir el objeto de datos consolidado
        const consolidatedData: DashboardData = {
          fiscal: {
            iva: {
              repercutido: ivaData?.iva_repercutido || 0,
              soportado: ivaData?.iva_soportado || 0,
              diferencia: ivaData?.iva_diferencia || 0,
              status: ivaData?.status || 'NEUTRO'
            },
            irpf: {
              practicadas: irpfData?.retenciones_practicadas || 0,
              soportadas: irpfData?.retenciones_soportadas || 0,
              diferencia: irpfData?.diferencia || 0,
              status: irpfData?.status || 'NEUTRO'
            },
            sociedades: {
              resultado: sociedadesData?.resultado_ejercicio || 0,
              impuesto: sociedadesData?.cuota_diferencial || 0,
              status: sociedadesData?.status || 'NEUTRO'
            }
          },
          operativo: {
            tesoreria: {
              total: dashboardData?.treasury?.total || 0,
              currency: dashboardData?.treasury?.currency || 'EUR',
              accounts: dashboardData?.treasury?.accounts || 0
            },
            ingresos: {
              monthly: dashboardData?.revenue?.monthly || 0,
              yearly: dashboardData?.revenue?.yearly || 0,
              pendingCount: dashboardData?.revenue?.pendingCount || 0
            },
            gastos: {
              monthly: dashboardData?.expenses?.monthly || 0,
              yearly: dashboardData?.expenses?.yearly || 0,
              pendingCount: dashboardData?.expenses?.pendingCount || 0
            },
            margen: {
              monthlyMargin: dashboardData?.profitability?.monthlyMargin || 0,
              yearlyMargin: dashboardData?.profitability?.yearlyMargin || 0,
              marginPercentage: dashboardData?.profitability?.marginPercentage || 0
            }
          }
        };

        setData(consolidatedData);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Error al cargar los datos del dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <p className="text-gray-600">Cargando dashboard ejecutivo...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Alert className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {error || 'Error al cargar los datos del dashboard'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const ivaStatus = getFiscalStatus('iva', data.fiscal.iva.diferencia, data.fiscal.iva.status);
  const irpfStatus = getFiscalStatus('irpf', data.fiscal.irpf.diferencia, data.fiscal.irpf.status);
  const sociedadesStatus = getFiscalStatus('sociedades', data.fiscal.sociedades.impuesto, data.fiscal.sociedades.status);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header con título y estado general */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-900">Dashboard Ejecutivo</h1>
          <p className="text-lg text-gray-600">Q3 2025 • Situación actualizada</p>
        </div>

        {/* ZONA SUPERIOR: FISCALIDAD */}
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">📊 Estado Fiscal del Trimestre</h2>
            <Alert className="max-w-4xl mx-auto bg-slate-50 border-slate-200">
              <AlertTriangle className="h-5 w-5" />
              <AlertDescription className="text-base font-medium">
                {generateFiscalSummary()}
              </AlertDescription>
            </Alert>
          </div>

          {/* Tarjetas Fiscales */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* IVA Card */}
            <Card className={`${ivaStatus.color} border-2 shadow-lg hover:shadow-xl transition-all duration-300`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    IVA Q3 2025
                  </CardTitle>
                  <ivaStatus.icon className="h-6 w-6" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold mb-2">
                    {formatCurrency(Math.abs(data.fiscal.iva.diferencia))}
                  </div>
                  <Badge variant={data.fiscal.iva.diferencia > 0 ? "destructive" : "secondary"} className="text-sm font-semibold">
                    {data.fiscal.iva.status}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-600">Repercutido</div>
                    <div className="font-semibold">{formatCurrency(data.fiscal.iva.repercutido)}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Soportado</div>
                    <div className="font-semibold">{formatCurrency(data.fiscal.iva.soportado)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* IRPF Card */}
            <Card className={`${irpfStatus.color} border-2 shadow-lg hover:shadow-xl transition-all duration-300`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    IRPF Q3 2025
                  </CardTitle>
                  <irpfStatus.icon className="h-6 w-6" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold mb-2">
                    {formatCurrency(Math.abs(data.fiscal.irpf.diferencia))}
                  </div>
                  <Badge variant={data.fiscal.irpf.diferencia < 0 ? "secondary" : "destructive"} className="text-sm font-semibold">
                    {data.fiscal.irpf.status}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-600">Practicadas</div>
                    <div className="font-semibold">{formatCurrency(data.fiscal.irpf.practicadas)}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Soportadas</div>
                    <div className="font-semibold">{formatCurrency(data.fiscal.irpf.soportadas)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Impuesto Sociedades Card */}
            <Card className={`${sociedadesStatus.color} border-2 shadow-lg hover:shadow-xl transition-all duration-300`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    I. Sociedades 2025
                  </CardTitle>
                  <sociedadesStatus.icon className="h-6 w-6" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold mb-2">
                    {formatCurrency(data.fiscal.sociedades.impuesto)}
                  </div>
                  <Badge variant="secondary" className="text-sm font-semibold">
                    {data.fiscal.sociedades.status}
                  </Badge>
                </div>
                <div className="text-center text-sm">
                  <div className="text-gray-600">Resultado ejercicio</div>
                  <div className={`font-semibold ${data.fiscal.sociedades.resultado < 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {formatCurrency(data.fiscal.sociedades.resultado)}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ZONA INFERIOR: GESTIÓN OPERATIVA */}
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-gray-800">💼 Gestión Operativa</h2>
            <p className="text-gray-600">Tesorería, ingresos, gastos y rentabilidad</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Tesorería */}
            <Card className="bg-white border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-bold flex items-center gap-2 text-blue-700">
                  <DollarSign className="h-5 w-5" />
                  Tesorería
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-2">
                  <div className="text-3xl font-bold text-blue-700">
                    {formatCurrency(data.operativo.tesoreria.total)}
                  </div>
                  <div className="text-sm text-gray-600">
                    {data.operativo.tesoreria.accounts} cuentas activas
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Ingresos */}
            <Card className="bg-white border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-bold flex items-center gap-2 text-green-700">
                  <TrendingUp className="h-5 w-5" />
                  Ingresos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-2">
                  <div className="text-2xl font-bold text-green-700">
                    {formatCurrency(data.operativo.ingresos.monthly)}
                  </div>
                  <div className="text-sm text-gray-600">Este mes</div>
                  <div className="text-xs text-gray-500">
                    Anual: {formatCurrency(data.operativo.ingresos.yearly)}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Gastos */}
            <Card className="bg-white border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-bold flex items-center gap-2 text-red-700">
                  <TrendingDown className="h-5 w-5" />
                  Gastos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-2">
                  <div className="text-2xl font-bold text-red-700">
                    {formatCurrency(data.operativo.gastos.monthly)}
                  </div>
                  <div className="text-sm text-gray-600">Este mes</div>
                  <div className="text-xs text-gray-500">
                    Anual: {formatCurrency(data.operativo.gastos.yearly)}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Margen */}
            <Card className="bg-white border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-bold flex items-center gap-2 text-purple-700">
                  <CheckCircle className="h-5 w-5" />
                  Rentabilidad
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-2">
                  <div className="text-2xl font-bold text-purple-700">
                    {data.operativo.margen.marginPercentage}%
                  </div>
                  <div className="text-sm text-gray-600">Margen anual</div>
                  <div className="text-xs text-gray-500">
                    {formatCurrency(data.operativo.margen.yearlyMargin)}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer con timestamp */}
        <div className="text-center text-sm text-gray-500 mt-8 pt-6 border-t border-gray-200">
          Última actualización: {new Date().toLocaleString('es-ES')}
        </div>
      </div>
    </div>
  );
};

export default KpiBoard;
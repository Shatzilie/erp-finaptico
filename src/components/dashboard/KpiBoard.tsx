import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, DollarSign, Calendar, Building, CreditCard, Loader2 } from 'lucide-react';
import { backendAdapter, type LegacyDashboardData, type IVAData, type IRPFData, type SociedadesData } from '@/lib/backendAdapter';

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
      messages.push(`Este trimestre pagarás ${iva.diferencia.toLocaleString()}€ de IVA. Ya estoy preparando la declaración`);
    } else if (iva.diferencia < 0) {
      messages.push(`Hacienda te debe ${Math.abs(iva.diferencia).toLocaleString()}€ de IVA. Estoy tramitando tu devolución`);
    }
    
    if (irpf.diferencia < 0) {
      messages.push(`Hacienda te debe ${Math.abs(irpf.diferencia).toLocaleString()}€ de IRPF. Estoy gestionando la compensación`);
    } else if (irpf.diferencia > 0) {
      messages.push(`Pagarás ${irpf.diferencia.toLocaleString()}€ de IRPF. Preparando el modelo 130`);
    }
    
    if (sociedades.resultado < 0) {
      messages.push(`No hay impuesto de sociedades porque el resultado ha sido negativo`);
    } else if (sociedades.impuesto > 0) {
      messages.push(`Calculando la declaración anual de sociedades: ${sociedades.impuesto.toLocaleString()}€`);
    }
    
    return messages.length > 0 ? messages.join('. ') + '.' : 'Situación fiscal equilibrada.';
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        console.log('🎯 Cargando dashboard ejecutivo completo...');

        // 🔥 CARGAR DATOS EN PARALELO - OPERATIVOS + FISCALES
        const [dashboardResponse, ivaResponse, irpfResponse, sociedadesResponse] = await Promise.allSettled([
          backendAdapter.fetchDashboardData(), // Datos operativos
          backendAdapter.fetchIVAData(),       // Datos IVA
          backendAdapter.fetchIRPFData(),      // Datos IRPF
          backendAdapter.fetchSociedadesData() // Datos Sociedades
        ]);

        console.log('📊 Respuestas recibidas:', {
          dashboard: dashboardResponse.status,
          iva: ivaResponse.status, 
          irpf: irpfResponse.status,
          sociedades: sociedadesResponse.status
        });

        // 🔄 PROCESAR DATOS OPERATIVOS
        let operativeData: LegacyDashboardData = {};
        if (dashboardResponse.status === 'fulfilled') {
          operativeData = dashboardResponse.value;
          console.log('✅ Datos operativos:', operativeData);
        } else {
          console.warn('⚠️ Error en datos operativos:', dashboardResponse.reason);
        }

        // 🔄 PROCESAR DATOS FISCALES
        let ivaData: IVAData | null = null;
        let irpfData: IRPFData | null = null;
        let sociedadesData: SociedadesData | null = null;

        if (ivaResponse.status === 'fulfilled' && ivaResponse.value?.ok) {
          ivaData = ivaResponse.value.widget_data.iva.payload;
          console.log('✅ Datos IVA:', ivaData);
        }

        if (irpfResponse.status === 'fulfilled' && irpfResponse.value?.ok) {
          irpfData = irpfResponse.value.widget_data.irpf.payload;
          console.log('✅ Datos IRPF:', irpfData);
        }

        if (sociedadesResponse.status === 'fulfilled' && sociedadesResponse.value?.ok) {
          sociedadesData = sociedadesResponse.value.widget_data.sociedades.payload;
          console.log('✅ Datos Sociedades:', sociedadesData);
        }

        // 🔧 CONSTRUIR OBJETO CONSOLIDADO
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
              total: operativeData.totalCash || 0,
              currency: 'EUR',
              accounts: 4 // Valor fijo por ahora
            },
            ingresos: {
              monthly: operativeData.monthlyRevenue || 0,
              yearly: operativeData.yearlyRevenue || 0,
              pendingCount: operativeData.pendingInvoices || 0
            },
            gastos: {
              monthly: operativeData.monthlyExpenses || 0,
              yearly: operativeData.yearlyExpenses || 0,
              pendingCount: operativeData.pendingPayments || 0
            },
            margen: {
              monthlyMargin: operativeData.monthlyMargin || 0,
              yearlyMargin: operativeData.yearlyMargin || 0,
              marginPercentage: operativeData.marginPercentage || 0
            }
          }
        };

        console.log('🎯 Dashboard consolidado:', consolidatedData);
        setData(consolidatedData);

      } catch (err) {
        console.error('❌ Error cargando dashboard:', err);
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
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">📊 Tu Estado Fiscal del Trimestre</h2>
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
                  <div className="text-base font-medium mb-2 text-gray-700">
                    {data.fiscal.iva.diferencia > 0 ? 'Este trimestre pagarás' : 'Hacienda te debe'}
                  </div>
                  <Badge variant={data.fiscal.iva.diferencia > 0 ? "destructive" : "secondary"} className="text-sm font-semibold">
                    {data.fiscal.iva.status}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-600">Lo que cobraste</div>
                    <div className="font-semibold">{formatCurrency(data.fiscal.iva.repercutido)}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Lo que pagaste</div>
                    <div className="font-semibold">{formatCurrency(data.fiscal.iva.soportado)}</div>
                  </div>
                </div>
                <div className="text-xs text-center text-gray-500">
                  {data.fiscal.iva.diferencia > 0 ? 
                    'Ya estoy preparando la declaración' : 
                    'Estoy tramitando tu devolución'
                  }
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
                  <div className="text-base font-medium mb-2 text-gray-700">
                    {data.fiscal.irpf.diferencia > 0 ? 'Pagarás de IRPF' : 'Hacienda te debe'}
                  </div>
                  <Badge variant={data.fiscal.irpf.diferencia < 0 ? "secondary" : "destructive"} className="text-sm font-semibold">
                    {data.fiscal.irpf.status}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-600">Te retuvieron</div>
                    <div className="font-semibold">{formatCurrency(data.fiscal.irpf.practicadas)}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Retuviste tú</div>
                    <div className="font-semibold">{formatCurrency(data.fiscal.irpf.soportadas)}</div>
                  </div>
                </div>
                <div className="text-xs text-center text-gray-500">
                  {data.fiscal.irpf.diferencia > 0 ? 
                    'Preparando el modelo 130' : 
                    'Gestionando tu compensación'
                  }
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
                    {data.fiscal.sociedades.impuesto === 0 ? 
                      '0€' : 
                      formatCurrency(data.fiscal.sociedades.impuesto)
                    }
                  </div>
                  <div className="text-base font-medium mb-2 text-gray-700">
                    {data.fiscal.sociedades.impuesto === 0 ? 
                      'Sin impuesto este año' : 
                      'Pagarás en Sociedades'
                    }
                  </div>
                  <Badge variant="secondary" className="text-sm font-semibold">
                    {data.fiscal.sociedades.status}
                  </Badge>
                </div>
                <div className="text-center text-sm">
                  <div className="text-gray-600">Resultado del ejercicio</div>
                  <div className={`font-semibold ${data.fiscal.sociedades.resultado < 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {formatCurrency(data.fiscal.sociedades.resultado)}
                  </div>
                </div>
                <div className="text-xs text-center text-gray-500">
                  {data.fiscal.sociedades.impuesto === 0 ? 
                    'El resultado fue negativo' : 
                    'Calculando la declaración anual'
                  }
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
                  Liquidez Disponible
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-2">
                  <div className="text-3xl font-bold text-blue-700">
                    {formatCurrency(data.operativo.tesoreria.total)}
                  </div>
                  <div className="text-sm text-gray-600">
                    En {data.operativo.tesoreria.accounts} cuentas bancarias
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Ingresos */}
            <Card className="bg-white border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-bold flex items-center gap-2 text-green-700">
                  <TrendingUp className="h-5 w-5" />
                  Facturación Mensual
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
                  Gastos del Mes
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
                  Margen Mensual
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-2">
                  <div className="text-2xl font-bold text-purple-700">
                    {data.operativo.margen.marginPercentage}%
                  </div>
                  <div className="text-sm text-gray-600">Margen sobre ingresos</div>
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
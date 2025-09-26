import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Wallet, Receipt, Calculator, Building2, AlertCircle } from 'lucide-react';

interface KpiData {
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
  fiscal: {
    iva: {
      diferencia: number;
      repercutido: number;
      soportado: number;
      status: string;
    };
    irpf: {
      diferencia: number;
      practicadas: number;
      soportadas: number;
      status: string;
    };
    sociedades: {
      cuota_diferencial: number;
      resultado_ejercicio: number;
      status: string;
    };
  };
  alerts: Array<{
    type: string;
    message: string;
    module: string;
  }>;
}

interface KpiBoardProps {
  data: KpiData;
}

const KpiBoard: React.FC<KpiBoardProps> = ({ data }) => {
  // Función para formatear moneda
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Alertas */}
      {data.alerts && data.alerts.length > 0 && (
        <div className="grid gap-4">
          {data.alerts.map((alert, index) => (
            <Card key={index} className="border-l-4 border-l-amber-400 bg-amber-50">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <span className="text-sm font-medium text-amber-800">{alert.message}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* KPIs Operativos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Tesorería */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Liquidez Disponible</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.treasury.total)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              En {data.treasury.accounts} cuentas bancarias
            </p>
          </CardContent>
        </Card>

        {/* Ingresos */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Facturación Mensual</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.revenue.monthly)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {data.revenue.pendingCount > 0 && `${data.revenue.pendingCount} facturas pendientes`}
            </p>
          </CardContent>
        </Card>

        {/* Gastos */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gastos del Mes</CardTitle>
            <Receipt className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.expenses.monthly)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {data.expenses.pendingCount > 0 && `${data.expenses.pendingCount} por pagar`}
            </p>
          </CardContent>
        </Card>

        {/* Margen */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Margen Mensual</CardTitle>
            {data.profitability.monthlyMargin >= 0 ? 
              <TrendingUp className="h-4 w-4 text-green-600" /> : 
              <TrendingDown className="h-4 w-4 text-red-600" />
            }
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.profitability.monthlyMargin)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {data.profitability.marginPercentage.toFixed(1)}% sobre ingresos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* KPIs Fiscales - Con textos de Fatima */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* IVA */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">IVA Trimestral</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">
                {formatCurrency(Math.abs(data.fiscal.iva.diferencia))}
              </div>
              <div className="text-base font-medium mb-2 text-gray-700">
                {data.fiscal.iva.diferencia > 0 ? 'Este trimestre pagarás' : 'Hacienda te debe'}
              </div>
              <Badge variant={data.fiscal.iva.diferencia > 0 ? "destructive" : "secondary"} className="text-sm font-semibold">
                {data.fiscal.iva.diferencia > 0 ? 'A INGRESAR' : 'A DEVOLVER'}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm mt-4">
              <div>
                <div className="text-gray-600">Lo que cobraste</div>
                <div className="font-semibold">{formatCurrency(data.fiscal.iva.repercutido)}</div>
              </div>
              <div>
                <div className="text-gray-600">Lo que pagaste</div>
                <div className="font-semibold">{formatCurrency(data.fiscal.iva.soportado)}</div>
              </div>
            </div>
            <div className="text-xs text-center text-gray-500 mt-2">
              {data.fiscal.iva.diferencia > 0 ? 
                'Ya estoy preparando la declaración' : 
                'Estoy tramitando tu devolución'
              }
            </div>
          </CardContent>
        </Card>

        {/* IRPF */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">IRPF Trimestral</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">
                {formatCurrency(Math.abs(data.fiscal.irpf.diferencia))}
              </div>
              <div className="text-base font-medium mb-2 text-gray-700">
                {data.fiscal.irpf.diferencia > 0 ? 'Pagarás de IRPF' : 'Hacienda te debe'}
              </div>
              <Badge variant={data.fiscal.irpf.diferencia > 0 ? "destructive" : "secondary"} className="text-sm font-semibold">
                {data.fiscal.irpf.diferencia > 0 ? 'A INGRESAR' : 'A COMPENSAR'}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm mt-4">
              <div>
                <div className="text-gray-600">Te retuvieron</div>
                <div className="font-semibold">{formatCurrency(data.fiscal.irpf.practicadas)}</div>
              </div>
              <div>
                <div className="text-gray-600">Retuviste tú</div>
                <div className="font-semibold">{formatCurrency(data.fiscal.irpf.soportadas)}</div>
              </div>
            </div>
            <div className="text-xs text-center text-gray-500 mt-2">
              {data.fiscal.irpf.diferencia > 0 ? 
                'Preparando el modelo 130' : 
                'Gestionando tu compensación'
              }
            </div>
          </CardContent>
        </Card>

        {/* Impuesto de Sociedades */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sociedades Anual</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">
                {data.fiscal.sociedades.cuota_diferencial === 0 ? 
                  '0€' : 
                  formatCurrency(Math.abs(data.fiscal.sociedades.cuota_diferencial))
                }
              </div>
              <div className="text-base font-medium mb-2 text-gray-700">
                {data.fiscal.sociedades.cuota_diferencial === 0 ? 
                  'Sin impuesto este año' : 
                  data.fiscal.sociedades.cuota_diferencial > 0 ? 'Pagarás en Sociedades' : 'Te devolverán'
                }
              </div>
              <Badge 
                variant={
                  data.fiscal.sociedades.cuota_diferencial === 0 ? "outline" :
                  data.fiscal.sociedades.cuota_diferencial > 0 ? "destructive" : "secondary"
                } 
                className="text-sm font-semibold"
              >
                {data.fiscal.sociedades.status || 'NEUTRO'}
              </Badge>
            </div>
            <div className="text-sm mt-4">
              <div className="text-center">
                <div className="text-gray-600">Resultado del ejercicio</div>
                <div className={`font-semibold ${data.fiscal.sociedades.resultado_ejercicio >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(data.fiscal.sociedades.resultado_ejercicio)}
                </div>
              </div>
            </div>
            <div className="text-xs text-center text-gray-500 mt-2">
              {data.fiscal.sociedades.cuota_diferencial === 0 ? 
                'El resultado fue negativo' : 
                'Calculando la declaración anual'
              }
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resumen Anual */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Tu Situación Fiscal del Año</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{formatCurrency(data.revenue.yearly)}</div>
              <div className="text-sm text-gray-600">Ingresos totales facturados</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{formatCurrency(data.expenses.yearly)}</div>
              <div className="text-sm text-gray-600">Gastos del ejercicio</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${data.profitability.yearlyMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(data.profitability.yearlyMargin)}
              </div>
              <div className="text-sm text-gray-600">Beneficio del año</div>
            </div>
          </div>
          <div className="text-center mt-4 text-sm text-gray-600">
            Tu margen sobre ventas es del {data.profitability.marginPercentage.toFixed(1)}%. 
            {data.profitability.marginPercentage > 20 ? 
              ' Excelente rentabilidad.' : 
              data.profitability.marginPercentage > 10 ? 
              ' Rentabilidad saludable.' : 
              ' Podemos optimizar los márgenes.'
            }
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default KpiBoard;
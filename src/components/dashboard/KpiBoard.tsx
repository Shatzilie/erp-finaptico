import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Loader2, TrendingUp, TrendingDown, DollarSign, CreditCard, AlertTriangle, FileText } from "lucide-react";
import { backendAdapter } from "@/lib/backendAdapter";
import { IvaCard, IrpfCard } from "./FiscalComponents";

interface KpiBoardProps {
  tenantId: string;
}

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
  alerts: Array<{
    type: string;
    message: string;
    module: string;
  }>;
}

interface IVAData {
  iva_repercutido: number;
  iva_soportado: number;
  iva_diferencia: number;
  status: string;
  period: {
    quarter: number;
    year: number;
  };
}

interface IRPFData {
  retenciones_practicadas: number;
  retenciones_soportadas: number;
  diferencia: number;
  status: string;
  period: {
    quarter: number;
    year: number;
  };
}

interface SociedadesData {
  resultado_ejercicio: number;
  cuota_diferencial: number;
  status: string;
  period: {
    year: number;
  };
  annual_summary: {
    beneficio_bruto: number;
    impuesto_provision: number;
    beneficio_neto: number;
  };
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

const KpiBoard = ({ tenantId }: KpiBoardProps) => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [ivaData, setIvaData] = useState<IVAData | null>(null);
  const [irpfData, setIRPFData] = useState<IRPFData | null>(null);
  const [sociedadesData, setSociedadesData] = useState<SociedadesData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!tenantId) {
        setError("No se ha especificado tenant");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const currentDate = new Date();
        const currentQuarter = Math.ceil((currentDate.getMonth() + 1) / 3);
        const currentYear = currentDate.getFullYear();

        const [legacyData, ivaResponse, irpfResponse, sociedadesResponse] = await Promise.all([
          backendAdapter.fetchDashboardData(tenantId),
          backendAdapter.fetchIVAData(currentQuarter, currentYear, tenantId),
          backendAdapter.fetchIRPFData(currentQuarter, currentYear, tenantId),
          backendAdapter.fetchSociedadesData(currentYear, tenantId)
        ]);

        // Convertir LegacyDashboardData a DashboardData
        if (legacyData) {
          const convertedData: DashboardData = {
            treasury: {
              total: legacyData.totalCash || 0,
              accounts: 1,
              currency: 'EUR'
            },
            revenue: {
              monthly: legacyData.monthlyRevenue || 0,
              quarterly: legacyData.quarterlyRevenue || 0,
              yearly: legacyData.yearlyRevenue || 0,
              pendingCount: legacyData.pendingInvoices || 0
            },
            expenses: {
              monthly: legacyData.monthlyExpenses || 0,
              quarterly: legacyData.quarterlyExpenses || 0,
              yearly: legacyData.yearlyExpenses || 0,
              pendingCount: legacyData.pendingPayments || 0
            },
            profitability: {
              monthlyMargin: legacyData.monthlyMargin || 0,
              quarterlyMargin: legacyData.quarterlyMargin || 0,
              yearlyMargin: legacyData.yearlyMargin || 0,
              marginPercentage: legacyData.marginPercentage || 0
            },
            alerts: legacyData.alerts || []
          };
          setDashboardData(convertedData);
        }

        if (ivaResponse.ok && ivaResponse.widget_data?.iva?.payload) {
          setIvaData(ivaResponse.widget_data.iva.payload);
        }

        if (irpfResponse.ok && irpfResponse.widget_data?.irpf?.payload) {
          setIRPFData(irpfResponse.widget_data.irpf.payload);
        }

        if (sociedadesResponse.ok && sociedadesResponse.widget_data?.sociedades?.payload) {
          setSociedadesData(sociedadesResponse.widget_data.sociedades.payload);
        }

      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError("Error al cargar los datos del dashboard");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [tenantId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
        {error}
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800">
        No hay datos disponibles
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Tesoreria</p>
              <p className="text-2xl font-bold">{formatCurrency(dashboardData.treasury.total)}</p>
              <p className="text-xs text-gray-500 mt-1">{dashboardData.treasury.accounts} cuenta{dashboardData.treasury.accounts !== 1 ? 's' : ''}</p>
            </div>
            <div className="bg-blue-50 p-3 rounded-full">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Ingresos (mes)</p>
              <p className="text-2xl font-bold">{formatCurrency(dashboardData.revenue.monthly)}</p>
              <p className="text-xs text-gray-500 mt-1">Anual: {formatCurrency(dashboardData.revenue.yearly)}</p>
            </div>
            <div className="bg-green-50 p-3 rounded-full">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Gastos (mes)</p>
              <p className="text-2xl font-bold">{formatCurrency(dashboardData.expenses.monthly)}</p>
              <p className="text-xs text-gray-500 mt-1">Anual: {formatCurrency(dashboardData.expenses.yearly)}</p>
            </div>
            <div className="bg-red-50 p-3 rounded-full">
              <TrendingDown className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Margen Anual</p>
              <p className="text-2xl font-bold">{formatCurrency(dashboardData.profitability.yearlyMargin)}</p>
              <p className="text-xs text-gray-500 mt-1">{dashboardData.profitability.marginPercentage.toFixed(1)}% margen</p>
            </div>
            <div className={`p-3 rounded-full ${dashboardData.profitability.yearlyMargin >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
              <CreditCard className={`w-6 h-6 ${dashboardData.profitability.yearlyMargin >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {ivaData && (
          <IvaCard data={ivaData} />
        )}

        {irpfData && (
          <IrpfCard data={irpfData} />
        )}

        {sociedadesData && (
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Impuesto de Sociedades {sociedadesData.period.year}</p>
                <p className={`text-2xl font-bold ${sociedadesData.cuota_diferencial < 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(sociedadesData.cuota_diferencial)}
                </p>
              </div>
              <div className={`p-3 rounded-full ${sociedadesData.cuota_diferencial < 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                <FileText className={`w-6 h-6 ${sociedadesData.cuota_diferencial < 0 ? 'text-green-600' : 'text-red-600'}`} />
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Resultado ejercicio:</span>
                <span className="font-medium">{formatCurrency(sociedadesData.resultado_ejercicio)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Beneficio bruto:</span>
                <span className="font-medium">{formatCurrency(sociedadesData.annual_summary.beneficio_bruto)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Provisión impuesto:</span>
                <span className="font-medium">{formatCurrency(sociedadesData.annual_summary.impuesto_provision)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Beneficio neto:</span>
                <span className="font-medium">{formatCurrency(sociedadesData.annual_summary.beneficio_neto)}</span>
              </div>
              <div className="pt-2 border-t">
                <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                  sociedadesData.status === 'A PAGAR' ? 'bg-red-100 text-red-700' :
                  sociedadesData.status === 'A DEVOLVER' ? 'bg-green-100 text-green-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {sociedadesData.status}
                </span>
              </div>
            </div>
          </Card>
        )}
      </div>

      {dashboardData.alerts && dashboardData.alerts.length > 0 && (
        <Card className="p-6 bg-yellow-50 border-yellow-200">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-yellow-900 mb-2">Alertas</h3>
              <ul className="space-y-1">
                {dashboardData.alerts.map((alert, index) => (
                  <li key={index} className="text-sm text-yellow-800">
                    {alert.message}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default KpiBoard;
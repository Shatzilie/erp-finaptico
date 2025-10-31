import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingUp, TrendingDown, DollarSign, CreditCard, AlertTriangle, FileText, ArrowUp, ArrowDown, CheckCircle, XCircle, Info, Circle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { backendAdapter } from "@/lib/backendAdapter";
import { IvaCard, IrpfCard, SociedadesCard, getFiscalStatusLabel } from "./FiscalComponents";
import { PayrollCostWidget } from "./PayrollCostWidget";
import { formatCurrency, calculateDelta, formatDelta } from "@/lib/formatters";

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
  amount: number;
  iva_repercutido: number;
  iva_soportado: number;
  iva_diferencia: number;
  status: string;
  period: {
    quarter: number;
    year: number;
    date_from?: string;
    date_to?: string;
  };
  quarterly_summary?: {
    total_sales: number;
    total_purchases: number;
    net_result: number;
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
    date_from?: string;
    date_to?: string;
  };
  quarterly_summary?: {
    total_retenciones_practicadas: number;
    total_retenciones_soportadas: number;
    net_result: number;
  };
}

interface SociedadesData {
  resultado_ejercicio: number;
  cuota_diferencial: number;
  status: string;
  period: {
    year: number;
    date_from?: string;
    date_to?: string;
  };
  annual_summary: {
    beneficio_bruto: number;
    impuesto_provision: number;
    beneficio_neto: number;
  };
}

const getFiscalStatusColor = (value: number | null | undefined): string => {
  if (value === null || value === undefined || isNaN(value)) return "#9CA3AF"; // Gris (sin datos)
  if (value <= 0) return "#00BFA5"; // Verde Finaptico (al día / a favor)
  if (value > 0 && value <= 1000) return "#EAB308"; // Amarillo visible (pendiente controlado)
  return "#EF4444"; // Rojo (pendiente crítico)
};

interface MonthlyData {
  month: string;
  total: number;
  currency: string;
}

const KpiBoard = ({ tenantId }: KpiBoardProps) => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [ivaData, setIvaData] = useState<IVAData | null>(null);
  const [irpfData, setIRPFData] = useState<IRPFData | null>(null);
  const [sociedadesData, setSociedadesData] = useState<SociedadesData | null>(null);
  const [revenueHistory, setRevenueHistory] = useState<MonthlyData[]>([]);
  const [expensesHistory, setExpensesHistory] = useState<MonthlyData[]>([]);
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
          
          // Guardar historial para calcular deltas
          setRevenueHistory(legacyData.revenue_history || []);
          setExpensesHistory(legacyData.expenses_history || []);
        }

        // ✅ PARSING DE IVA - Lee los datos del payload
        if (ivaResponse && typeof ivaResponse === 'object') {
          const ivaResp = ivaResponse as any;
          
          const ivaDataToSet = {
            amount: ivaResp.iva_a_ingresar || 0,
            iva_repercutido: ivaResp.iva_repercutido || 0,
            iva_soportado: ivaResp.iva_soportado || 0,
            iva_diferencia: ivaResp.iva_a_ingresar || 0,
            status: (ivaResp.iva_a_ingresar || 0) > 0 ? 'A INGRESAR' : 'A COMPENSAR',
            period: {
              quarter: ivaResp.quarter || currentQuarter,
              year: ivaResp.year || currentYear
            }
          };
          setIvaData(ivaDataToSet);
        }

        // ✅ PARSING DE IRPF - Lee los datos del payload
        if (irpfResponse && typeof irpfResponse === 'object') {
          const irpfResp = irpfResponse as any;
          setIRPFData({
            retenciones_practicadas: irpfResp.retenciones_practicadas || 0,
            retenciones_soportadas: irpfResp.retenciones_soportadas || 0,
            diferencia: irpfResp.diferencia || 0,
            status: (irpfResp.diferencia || 0) > 0 ? 'A INGRESAR' : 'A COMPENSAR',
            period: {
              quarter: irpfResp.quarter || currentQuarter,
              year: irpfResp.year || currentYear
            }
          });
        }

        // ✅ PARSING DE SOCIEDADES - Lee los datos del payload
        if (sociedadesResponse && typeof sociedadesResponse === 'object') {
          const socResp = sociedadesResponse as any;
          
          // Backend devuelve: { ok, widget_data: { sociedades: { payload } } }
          const payload = socResp.widget_data?.sociedades?.payload || socResp;
          
          setSociedadesData({
            resultado_ejercicio: payload.resultado_ejercicio || 0,
            cuota_diferencial: payload.cuota_diferencial || 0,
            status: payload.status || 'NEUTRO',
            period: {
              year: payload.period?.year || currentYear
            },
            annual_summary: payload.annual_summary || {
              beneficio_bruto: 0,
              impuesto_provision: 0,
              beneficio_neto: 0
            }
          });
        }

      } catch (err) {
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

  // Calcular deltas para KPIs principales
  const calculateKpiDelta = (history: MonthlyData[], currentValue: number) => {
    if (history.length < 2) return null;
    
    // Obtener el mes actual y el anterior
    const sortedHistory = [...history].sort((a, b) => b.month.localeCompare(a.month));
    const currentMonth = sortedHistory[0]?.total || currentValue;
    const previousMonth = sortedHistory[1]?.total || 0;
    
    return calculateDelta(currentMonth, previousMonth);
  };

  const revenueDelta = calculateKpiDelta(revenueHistory, dashboardData.revenue.monthly);
  const expensesDelta = calculateKpiDelta(expensesHistory, dashboardData.expenses.monthly);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <p className="text-sm text-gray-600">Tesoreria</p>
                <TooltipProvider>
                  <Tooltip>
                <TooltipTrigger asChild>
                      <Info className="w-4 h-4 text-[#6C5CE7] cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[300px]">
                      <p>Aquí ves el saldo total que tengo controlado en las cuentas de la empresa. No necesitas hacer nada, solo refleja la tesorería real del momento.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <p className="text-2xl font-bold">{formatCurrency(dashboardData.treasury.total, 0)}</p>
              <p className="text-xs text-gray-500 mt-1">{dashboardData.treasury.accounts} cuenta{dashboardData.treasury.accounts !== 1 ? 's' : ''}</p>
            </div>
            <div className="bg-blue-50 p-3 rounded-full">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-1.5 mb-1">
                <p className="text-sm text-gray-600">Ingresos (mes)</p>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-4 h-4 text-[#6C5CE7] cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[300px]">
                      <p>Este bloque muestra las facturas emitidas en el periodo. Son ingresos facturados, no necesariamente cobrados todavía.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <p className="text-2xl font-bold">{formatCurrency(dashboardData.revenue.monthly, 0)}</p>
              {revenueDelta !== null && (
                <div className={`flex items-center gap-1 mt-2 text-sm ${revenueDelta >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {revenueDelta >= 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                  <span className="font-medium">{formatDelta(revenueDelta)}</span>
                  <span className="text-xs text-gray-500">vs mes anterior</span>
                </div>
              )}
              <p className="text-xs text-gray-500 mt-1">Anual: {formatCurrency(dashboardData.revenue.yearly, 0)}</p>
            </div>
            <div className="bg-green-50 p-3 rounded-full">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-1.5 mb-1">
                <p className="text-sm text-gray-600">Gastos (mes)</p>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-4 h-4 text-[#6C5CE7] cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[300px]">
                      <p>Aquí aparecen los gastos registrados en la contabilidad. Incluye todos los pagos con factura a nombre de la empresa.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <p className="text-2xl font-bold">{formatCurrency(dashboardData.expenses.monthly, 0)}</p>
              {expensesDelta !== null && (
                <div className={`flex items-center gap-1 mt-2 text-sm ${expensesDelta >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {expensesDelta >= 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                  <span className="font-medium">{formatDelta(expensesDelta)}</span>
                  <span className="text-xs text-gray-500">vs mes anterior</span>
                </div>
              )}
              <p className="text-xs text-gray-500 mt-1">Anual: {formatCurrency(dashboardData.expenses.yearly, 0)}</p>
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
              <p className="text-2xl font-bold">{formatCurrency(dashboardData.profitability.yearlyMargin, 0)}</p>
              <p className="text-xs text-gray-500 mt-1">{dashboardData.profitability.marginPercentage.toFixed(1)}% margen</p>
            </div>
            <div className={`p-3 rounded-full ${dashboardData.profitability.yearlyMargin >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
              <CreditCard className={`w-6 h-6 ${dashboardData.profitability.yearlyMargin >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {ivaData && (
          <IvaCard data={ivaData} />
        )}

        {irpfData && (
          <IrpfCard data={irpfData} />
        )}

        <PayrollCostWidget tenantId={tenantId} />

        {sociedadesData && (
          <SociedadesCard data={sociedadesData} />
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
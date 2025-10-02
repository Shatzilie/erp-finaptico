import { Card } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line
} from "recharts";

interface MonthlyData {
  month: string;
  total: number;
  currency: string;
}

interface ChartsData {
  revenue_history: MonthlyData[];
  expenses_history: MonthlyData[];
}

interface ChartsSectionProps {
  data: ChartsData;
  isLoading?: boolean;
}

const MONTH_NAMES: Record<string, string> = {
  '01': 'Ene', '02': 'Feb', '03': 'Mar', '04': 'Abr',
  '05': 'May', '06': 'Jun', '07': 'Jul', '08': 'Ago',
  '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dic'
};

const MONTH_NAMES_FULL: Record<string, string> = {
  '01': 'enero', '02': 'febrero', '03': 'marzo', '04': 'abril',
  '05': 'mayo', '06': 'junio', '07': 'julio', '08': 'agosto',
  '09': 'septiembre', '10': 'octubre', '11': 'noviembre', '12': 'diciembre'
};

const CORPORATE_COLORS = {
  primary: '#6C5CE7',
  primaryLight: '#C8A2C8',
  secondary: '#00BFA5',
  secondaryLight: '#9ADB91',
  tertiary: '#FB670A',
  tertiaryLight: '#FFAC49',
  quaternary: '#272F7A',
  quaternaryMid: '#458CCC',
  quinary: '#293696',
  quinaryLight: '#6AA6DA'
};

function generateNarrative({
  current,
  previous,
  label,
  month,
  isCount = false,
}: {
  current?: number;
  previous?: number;
  label: string;
  month: string;
  isCount?: boolean;
}) {
  if (current == null && previous == null) {
    return `💬 Aún no tengo suficientes datos este mes para analizar ${label.toLowerCase()}.`;
  }

  if (current != null && previous != null && previous !== 0) {
    const delta = ((current - previous) / previous) * 100;
    const direction = delta > 0 ? 'más' : 'menos';
    const absDelta = Math.abs(delta).toFixed(1);
    
    if (isCount) {
      return `💬 En ${month}, ${label.toLowerCase()} fue de ${Math.round(current)} facturas, un ${absDelta}% ${direction} que en el mes anterior.`;
    }
    
    const formattedCurrent = new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(current);
    
    return `💬 En ${month}, ${label.toLowerCase()} fue de ${formattedCurrent}, un ${absDelta}% ${direction} que en el mes anterior.`;
  }

  if (current != null) {
    if (isCount) {
      return `💬 En ${month}, ${label.toLowerCase()} fue de ${Math.round(current)} facturas.`;
    }
    
    const formattedCurrent = new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(current);
    
    return `💬 En ${month}, ${label.toLowerCase()} fue de ${formattedCurrent}.`;
  }

  return `💬 No dispongo del dato de ${label.toLowerCase()} para ${month}.`;
}

function getLatestMonthData(data: MonthlyData[]): { current?: number; previous?: number; monthName: string } {
  if (!data || data.length === 0) {
    return { monthName: 'este mes' };
  }

  const sortedData = [...data].sort((a, b) => b.month.localeCompare(a.month));
  const latest = sortedData[0];
  const previous = sortedData[1];
  
  const [, month] = latest.month.split('-');
  const monthName = MONTH_NAMES_FULL[month] || 'este mes';

  return {
    current: latest?.total,
    previous: previous?.total,
    monthName
  };
}

function prepareChartData(monthlyData: MonthlyData[]) {
  if (!monthlyData || monthlyData.length === 0) {
    return { chartData: [], hasData: false };
  }

  const currentYear = new Date().getFullYear();
  const previousYear = currentYear - 1;

  const dataByMonth = monthlyData.reduce((acc, item) => {
    if (!item.month) return acc;
    
    const [year, month] = item.month.split('-');
    const monthKey = month;
    
    if (!acc[monthKey]) {
      acc[monthKey] = { month: monthKey, currentYear: 0, previousYear: 0 };
    }
    
    if (parseInt(year) === currentYear) {
      acc[monthKey].currentYear = item.total;
    } else if (parseInt(year) === previousYear) {
      acc[monthKey].previousYear = item.total;
    }
    
    return acc;
  }, {} as Record<string, { month: string; currentYear: number; previousYear: number }>);

  const chartData = Object.entries(dataByMonth)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([monthKey, values]) => ({
      month: MONTH_NAMES[monthKey] || monthKey,
      [`${currentYear}`]: Math.round(values.currentYear),
      [`${previousYear}`]: Math.round(values.previousYear)
    }));

  const hasData = chartData.some(d => {
    const current = d[`${currentYear}`] as number;
    const previous = d[`${previousYear}`] as number;
    return current > 0 || previous > 0;
  });
  
  return { chartData, hasData };
}

function prepareCountChartData(revenueData: MonthlyData[], expensesData: MonthlyData[]) {
  const currentYear = new Date().getFullYear();
  const previousYear = currentYear - 1;

  const revenueCount = revenueData.reduce((acc, item) => {
    if (!item.month) return acc;
    const [year, month] = item.month.split('-');
    const monthKey = month;
    
    if (!acc[monthKey]) {
      acc[monthKey] = { currentYear: 0, previousYear: 0 };
    }
    
    if (parseInt(year) === currentYear && item.total > 0) {
      acc[monthKey].currentYear++;
    } else if (parseInt(year) === previousYear && item.total > 0) {
      acc[monthKey].previousYear++;
    }
    
    return acc;
  }, {} as Record<string, { currentYear: number; previousYear: number }>);

  const expensesCount = expensesData.reduce((acc, item) => {
    if (!item.month) return acc;
    const [year, month] = item.month.split('-');
    const monthKey = month;
    
    if (!acc[monthKey]) {
      acc[monthKey] = { currentYear: 0, previousYear: 0 };
    }
    
    if (parseInt(year) === currentYear && item.total > 0) {
      acc[monthKey].currentYear++;
    } else if (parseInt(year) === previousYear && item.total > 0) {
      acc[monthKey].previousYear++;
    }
    
    return acc;
  }, {} as Record<string, { currentYear: number; previousYear: number }>);

  return { revenueCount, expensesCount };
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

const ChartsSection = ({ data, isLoading }: ChartsSectionProps) => {
  const currentYear = new Date().getFullYear();
  const previousYear = currentYear - 1;

  const revenueChart = prepareChartData(data.revenue_history || []);
  const expensesChart = prepareChartData(data.expenses_history || []);
  
  const profitChartData = revenueChart.chartData.map((item, index) => {
    const expenseItem = expensesChart.chartData[index];
    const currentRevenue = item[`${currentYear}`] as number || 0;
    const previousRevenue = item[`${previousYear}`] as number || 0;
    const currentExpense = expenseItem?.[`${currentYear}`] as number || 0;
    const previousExpense = expenseItem?.[`${previousYear}`] as number || 0;
    
    return {
      month: item.month,
      [`${currentYear}`]: currentRevenue - currentExpense,
      [`${previousYear}`]: previousRevenue - previousExpense
    };
  });

  const { revenueCount, expensesCount } = prepareCountChartData(
    data.revenue_history || [],
    data.expenses_history || []
  );

  const invoiceCountData = Object.entries(revenueCount)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([monthKey, values]) => ({
      month: MONTH_NAMES[monthKey] || monthKey,
      [`${currentYear}`]: values.currentYear,
      [`${previousYear}`]: values.previousYear
    }));

  const purchaseCountData = Object.entries(expensesCount)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([monthKey, values]) => ({
      month: MONTH_NAMES[monthKey] || monthKey,
      [`${currentYear}`]: values.currentYear,
      [`${previousYear}`]: values.previousYear
    }));

  const hasProfitData = profitChartData.some(d => {
    const current = d[`${currentYear}`] as number;
    const previous = d[`${previousYear}`] as number;
    return current !== 0 || previous !== 0;
  });
  
  const hasInvoiceData = invoiceCountData.some(d => {
    const current = d[`${currentYear}`] as number;
    const previous = d[`${previousYear}`] as number;
    return current > 0 || previous > 0;
  });
  
  const hasPurchaseData = purchaseCountData.some(d => {
    const current = d[`${currentYear}`] as number;
    const previous = d[`${previousYear}`] as number;
    return current > 0 || previous > 0;
  });

  const revenueLatest = getLatestMonthData(data.revenue_history || []);
  const expensesLatest = getLatestMonthData(data.expenses_history || []);
  
  const profitLatest = {
    current: revenueLatest.current && expensesLatest.current 
      ? revenueLatest.current - expensesLatest.current 
      : undefined,
    previous: revenueLatest.previous && expensesLatest.previous
      ? revenueLatest.previous - expensesLatest.previous
      : undefined,
    monthName: revenueLatest.monthName
  };

  const getLatestCount = (countData: typeof invoiceCountData) => {
    if (countData.length === 0) return { current: undefined, previous: undefined };
    const latest = countData[countData.length - 1];
    const previous = countData[countData.length - 2];
    return {
      current: latest?.[`${currentYear}`] as number || 0,
      previous: previous?.[`${currentYear}`] as number || latest?.[`${previousYear}`] as number || 0
    };
  };

  const invoiceCountLatest = getLatestCount(invoiceCountData);
  const purchaseCountLatest = getLatestCount(purchaseCountData);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i} className="p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="h-64 bg-gray-100 rounded"></div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (!revenueChart.hasData && !expensesChart.hasData) {
    return (
      <Card className="p-6 text-center">
        <p className="text-gray-500">No hay datos históricos suficientes para mostrar gráficas</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {hasProfitData && (
          <Card className="p-6 col-span-full">
            <h3 className="text-lg font-semibold mb-4">Beneficio Neto (Comparativa Anual)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={profitChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#666" />
                <YAxis stroke="#666" tickFormatter={formatCurrency} />
                <Tooltip formatter={(value) => formatCurrency(value as number)} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey={`${currentYear}`}
                  stroke={CORPORATE_COLORS.primary}
                  strokeWidth={2}
                  dot={{ fill: CORPORATE_COLORS.primary, r: 4 }}
                  activeDot={{ r: 6 }}
                  name={`${currentYear}`}
                />
                <Line
                  type="monotone"
                  dataKey={`${previousYear}`}
                  stroke={CORPORATE_COLORS.primaryLight}
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ fill: CORPORATE_COLORS.primaryLight, r: 4 }}
                  name={`${previousYear}`}
                />
              </LineChart>
            </ResponsiveContainer>
            <p className="text-sm text-gray-600 mt-3 mb-2 leading-relaxed">
              {generateNarrative({
                current: profitLatest.current,
                previous: profitLatest.previous,
                label: "el beneficio neto",
                month: profitLatest.monthName
              })}
            </p>
          </Card>
        )}

        {revenueChart.hasData && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Importe Facturado (Comparativa Anual)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueChart.chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#666" />
                <YAxis stroke="#666" tickFormatter={formatCurrency} />
                <Tooltip formatter={(value) => formatCurrency(value as number)} />
                <Legend />
                <Bar dataKey={`${currentYear}`} fill={CORPORATE_COLORS.secondary} name={`${currentYear}`} />
                <Bar dataKey={`${previousYear}`} fill={CORPORATE_COLORS.secondaryLight} name={`${previousYear}`} />
              </BarChart>
            </ResponsiveContainer>
            <p className="text-sm text-gray-600 mt-3 mb-2 leading-relaxed">
              {generateNarrative({
                current: revenueLatest.current,
                previous: revenueLatest.previous,
                label: "el importe facturado",
                month: revenueLatest.monthName
              })}
            </p>
          </Card>
        )}

        {expensesChart.hasData && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Importe de Compras (Comparativa Anual)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={expensesChart.chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#666" />
                <YAxis stroke="#666" tickFormatter={formatCurrency} />
                <Tooltip formatter={(value) => formatCurrency(value as number)} />
                <Legend />
                <Bar dataKey={`${currentYear}`} fill={CORPORATE_COLORS.tertiary} name={`${currentYear}`} />
                <Bar dataKey={`${previousYear}`} fill={CORPORATE_COLORS.tertiaryLight} name={`${previousYear}`} />
              </BarChart>
            </ResponsiveContainer>
            <p className="text-sm text-gray-600 mt-3 mb-2 leading-relaxed">
              {generateNarrative({
                current: expensesLatest.current,
                previous: expensesLatest.previous,
                label: "el importe de compras",
                month: expensesLatest.monthName
              })}
            </p>
          </Card>
        )}

        {hasInvoiceData && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Número de Facturas Emitidas (Comparativa Anual)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={invoiceCountData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip />
                <Legend />
                <Bar dataKey={`${currentYear}`} fill={CORPORATE_COLORS.quaternary} name={`${currentYear}`} />
                <Bar dataKey={`${previousYear}`} fill={CORPORATE_COLORS.quaternaryMid} name={`${previousYear}`} />
              </BarChart>
            </ResponsiveContainer>
            <p className="text-sm text-gray-600 mt-3 mb-2 leading-relaxed">
              {generateNarrative({
                current: invoiceCountLatest.current,
                previous: invoiceCountLatest.previous,
                label: "el número de facturas emitidas",
                month: revenueLatest.monthName,
                isCount: true
              })}
            </p>
          </Card>
        )}

        {hasPurchaseData && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Número de Facturas de Compra (Comparativa Anual)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={purchaseCountData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip />
                <Legend />
                <Bar dataKey={`${currentYear}`} fill={CORPORATE_COLORS.quinary} name={`${currentYear}`} />
                <Bar dataKey={`${previousYear}`} fill={CORPORATE_COLORS.quinaryLight} name={`${previousYear}`} />
              </BarChart>
            </ResponsiveContainer>
            <p className="text-sm text-gray-600 mt-3 mb-2 leading-relaxed">
              {generateNarrative({
                current: purchaseCountLatest.current,
                previous: purchaseCountLatest.previous,
                label: "el número de facturas de compra",
                month: expensesLatest.monthName,
                isCount: true
              })}
            </p>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ChartsSection;
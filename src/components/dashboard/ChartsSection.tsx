import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";
import { formatCurrency } from "@/lib/utils";

interface MonthlyData {
  month: string;
  total: number;
  count?: number;
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
      monthKey: monthKey,
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

function prepareProfitChartData(revenueData: MonthlyData[], expensesData: MonthlyData[]) {
  const currentYear = new Date().getFullYear();
  const previousYear = currentYear - 1;

  const revenueByMonth = revenueData.reduce((acc, item) => {
    if (!item.month) return acc;
    const [year, month] = item.month.split('-');
    const key = `${year}-${month}`;
    acc[key] = item.total;
    return acc;
  }, {} as Record<string, number>);

  const expensesByMonth = expensesData.reduce((acc, item) => {
    if (!item.month) return acc;
    const [year, month] = item.month.split('-');
    const key = `${year}-${month}`;
    acc[key] = item.total;
    return acc;
  }, {} as Record<string, number>);

  const allMonths = new Set([...Object.keys(revenueByMonth), ...Object.keys(expensesByMonth)]);

  const profitByMonth = Array.from(allMonths).reduce((acc, monthKey) => {
    const [year, month] = monthKey.split('-');
    
    if (!acc[month]) {
      acc[month] = { month: month, currentYear: 0, previousYear: 0 };
    }

    const revenue = revenueByMonth[monthKey] || 0;
    const expenses = expensesByMonth[monthKey] || 0;
    const profit = revenue - expenses;

    if (parseInt(year) === currentYear) {
      acc[month].currentYear = profit;
    } else if (parseInt(year) === previousYear) {
      acc[month].previousYear = profit;
    }

    return acc;
  }, {} as Record<string, { month: string; currentYear: number; previousYear: number }>);

  const chartData = Object.entries(profitByMonth)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([monthKey, values]) => ({
      month: MONTH_NAMES[monthKey] || monthKey,
      [`${currentYear}`]: Math.round(values.currentYear),
      [`${previousYear}`]: Math.round(values.previousYear)
    }));

  const hasData = chartData.some(d => {
    const current = d[`${currentYear}`] as number;
    const previous = d[`${previousYear}`] as number;
    return current !== 0 || previous !== 0;
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
    
    if (parseInt(year) === currentYear) {
      acc[monthKey].currentYear = item.count || 0;
    } else if (parseInt(year) === previousYear) {
      acc[monthKey].previousYear = item.count || 0;
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
    
    if (parseInt(year) === currentYear) {
      acc[monthKey].currentYear = item.count || 0;
    } else if (parseInt(year) === previousYear) {
      acc[monthKey].previousYear = item.count || 0;
    }
    
    return acc;
  }, {} as Record<string, { currentYear: number; previousYear: number }>);

  return { revenueCount, expensesCount };
}


const ChartsSection = ({ data, isLoading }: ChartsSectionProps) => {
  const currentYear = new Date().getFullYear();
  const previousYear = currentYear - 1;

  const revenueChart = prepareChartData(data.revenue_history || []);
  const expensesChart = prepareChartData(data.expenses_history || []);
  const profitChart = prepareProfitChartData(data.revenue_history || [], data.expenses_history || []);

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
        {profitChart.hasData && (
          <Card className="p-6 col-span-full">
            <h3 className="text-lg font-semibold mb-4">Beneficio Neto (Comparativa Anual)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={profitChart.chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#666" />
                <YAxis stroke="#666" tickFormatter={(value) => formatCurrency(value as number)} />
                <Tooltip formatter={(value) => formatCurrency(value as number)} />
                <Legend />
                <Line type="monotone" dataKey={`${currentYear}`} stroke={CORPORATE_COLORS.primary} strokeWidth={2} dot={{ fill: CORPORATE_COLORS.primary, r: 4 }} activeDot={{ r: 6 }} name={`${currentYear}`} />
                <Line type="monotone" dataKey={`${previousYear}`} stroke={CORPORATE_COLORS.primaryLight} strokeWidth={2} strokeDasharray="5 5" dot={{ fill: CORPORATE_COLORS.primaryLight, r: 4 }} name={`${previousYear}`} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        )}

        {revenueChart.hasData && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Importe Facturado (Comparativa Anual)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueChart.chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#666" />
                <YAxis stroke="#666" tickFormatter={(value) => formatCurrency(value as number)} />
                <Tooltip formatter={(value) => formatCurrency(value as number)} />
                <Legend />
                <Bar dataKey={`${currentYear}`} fill={CORPORATE_COLORS.secondary} name={`${currentYear}`} />
                <Bar dataKey={`${previousYear}`} fill={CORPORATE_COLORS.secondaryLight} name={`${previousYear}`} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}

        {expensesChart.hasData && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Importe de Compras (Comparativa Anual)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={expensesChart.chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#666" />
                <YAxis stroke="#666" tickFormatter={(value) => formatCurrency(value as number)} />
                <Tooltip formatter={(value) => formatCurrency(value as number)} />
                <Legend />
                <Bar dataKey={`${currentYear}`} fill={CORPORATE_COLORS.tertiary} name={`${currentYear}`} />
                <Bar dataKey={`${previousYear}`} fill={CORPORATE_COLORS.tertiaryLight} name={`${previousYear}`} />
              </BarChart>
            </ResponsiveContainer>
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
          </Card>
        )}
      </div>
    </div>
  );
};

export default ChartsSection;
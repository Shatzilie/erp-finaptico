import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react";

interface MonthlyData {
  month: string;
  total: number;
  count: number;
  currency: string;
}

interface ChartsSectionProps {
  revenue_history?: MonthlyData[];
  expenses_history?: MonthlyData[];
}

const ChartsSection = ({ revenue_history = [], expenses_history = [] }: ChartsSectionProps) => {
  const prepareComparisonData = (data: MonthlyData[]) => {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth(); // 0-indexed (octubre = 9)
    const previousYear = currentYear - 1;

    const monthNames = [
      'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
      'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
    ];

    const chartData = monthNames.map((monthName, index) => {
      const currentYearMonth = `${currentYear}-${String(index + 1).padStart(2, '0')}`;
      const previousYearMonth = `${previousYear}-${String(index + 1).padStart(2, '0')}`;

      // Para el año actual: solo hasta el mes actual (inclusive)
      const currentYearValue = index <= currentMonth 
        ? (data.find(d => d.month === currentYearMonth)?.total || 0)
        : 0;

      // Para el año anterior: todos los meses sin restricción
      const previousYearValue = data.find(d => d.month === previousYearMonth)?.total || 0;

      return {
        month: monthName,
        [currentYear]: currentYearValue,
        [previousYear]: previousYearValue
      };
    });

    return chartData;
  };

  const prepareProfitChartData = () => {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth(); // 0-indexed (octubre = 9)
    const previousYear = currentYear - 1;

    const monthNames = [
      'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
      'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
    ];

    const chartData = monthNames.map((monthName, index) => {
      const currentYearMonth = `${currentYear}-${String(index + 1).padStart(2, '0')}`;
      const previousYearMonth = `${previousYear}-${String(index + 1).padStart(2, '0')}`;

      // Año actual: solo hasta mes actual (inclusive)
      let currentYearProfit = 0;
      if (index <= currentMonth) {
        const currentRevenue = revenue_history.find(r => r.month === currentYearMonth)?.total || 0;
        const currentExpenses = expenses_history.find(e => e.month === currentYearMonth)?.total || 0;
        currentYearProfit = currentRevenue - currentExpenses;
      }

      // Año anterior: sin restricciones, todos los meses
      const previousRevenue = revenue_history.find(r => r.month === previousYearMonth)?.total || 0;
      const previousExpenses = expenses_history.find(e => e.month === previousYearMonth)?.total || 0;
      const previousYearProfit = previousRevenue - previousExpenses;

      return {
        month: monthName,
        [currentYear]: currentYearProfit,
        [previousYear]: previousYearProfit
      };
    });

    return chartData;
  };

  const revenueData = prepareComparisonData(revenue_history);
  const expensesData = prepareComparisonData(expenses_history);
  const profitData = prepareProfitChartData();

  const currentYear = new Date().getFullYear();
  const previousYear = currentYear - 1;

  const calculateTrend = (data: any[], yearKey: string) => {
    const values = data
      .map(d => d[yearKey])
      .filter(v => v !== null && v !== undefined && v > 0);
    
    if (values.length < 2) return 0;
    
    const firstValue = values[0];
    const lastValue = values[values.length - 1];
    return ((lastValue - firstValue) / firstValue) * 100;
  };

  const revenueTrend = calculateTrend(revenueData, currentYear);
  const expensesTrend = calculateTrend(expensesData, currentYear);
  const profitTrend = calculateTrend(profitData, currentYear);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            entry.value !== 0 && (
              <p key={index} style={{ color: entry.color }} className="text-sm">
                {entry.name}: {formatCurrency(entry.value)}
              </p>
            )
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Ingresos */}
      <Card className="dashboard-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              Ingresos (Comparativa Anual)
            </CardTitle>
            <div className="flex items-center gap-2">
              {revenueTrend > 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
              <span className={`text-sm font-medium ${revenueTrend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {revenueTrend > 0 ? '+' : ''}{revenueTrend.toFixed(1)}%
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="colorRevenueCurrent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorRevenuePrevious" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#94a3b8" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" stroke="#64748b" style={{ fontSize: '12px' }} />
              <YAxis stroke="#64748b" style={{ fontSize: '12px' }} tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '14px' }} />
              <Area
                type="monotone"
                dataKey={previousYear}
                stroke="#94a3b8"
                fillOpacity={1}
                fill="url(#colorRevenuePrevious)"
                strokeWidth={2}
                name={`${previousYear}`}
              />
              <Area
                type="monotone"
                dataKey={currentYear}
                stroke="#10b981"
                fillOpacity={1}
                fill="url(#colorRevenueCurrent)"
                strokeWidth={2}
                name={`${currentYear}`}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Gastos */}
      <Card className="dashboard-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-red-600" />
              Gastos (Comparativa Anual)
            </CardTitle>
            <div className="flex items-center gap-2">
              {expensesTrend > 0 ? (
                <TrendingUp className="h-4 w-4 text-red-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-green-600" />
              )}
              <span className={`text-sm font-medium ${expensesTrend > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {expensesTrend > 0 ? '+' : ''}{expensesTrend.toFixed(1)}%
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={expensesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" stroke="#64748b" style={{ fontSize: '12px' }} />
              <YAxis stroke="#64748b" style={{ fontSize: '12px' }} tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '14px' }} />
              <Bar dataKey={previousYear} fill="#94a3b8" name={`${previousYear}`} radius={[4, 4, 0, 0]} />
              <Bar dataKey={currentYear} fill="#ef4444" name={`${currentYear}`} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Beneficio Neto */}
      <Card className="dashboard-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-blue-600" />
              Beneficio Neto (Comparativa Anual)
            </CardTitle>
            <div className="flex items-center gap-2">
              {profitTrend > 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
              <span className={`text-sm font-medium ${profitTrend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {profitTrend > 0 ? '+' : ''}{profitTrend.toFixed(1)}%
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={profitData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" stroke="#64748b" style={{ fontSize: '12px' }} />
              <YAxis stroke="#64748b" style={{ fontSize: '12px' }} tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '14px' }} />
              <Line
                type="monotone"
                dataKey={previousYear}
                stroke="#94a3b8"
                strokeWidth={2}
                dot={{ fill: '#94a3b8', r: 4 }}
                name={`${previousYear}`}
              />
              <Line
                type="monotone"
                dataKey={currentYear}
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: '#3b82f6', r: 4 }}
                name={`${currentYear}`}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChartsSection;
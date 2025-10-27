import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { formatCurrency } from "@/lib/formatters";

interface MonthlyData {
  month: string;
  total: number;
  year?: number;
  count?: number;
}

interface HistoricalData {
  history?: MonthlyData[];
  monthlyData?: MonthlyData[];
}

interface RevenueExpensesChartProps {
  revenueData: MonthlyData[] | HistoricalData;
  expensesData: MonthlyData[] | HistoricalData;
  isLoading?: boolean;
}

const MONTH_NAMES: Record<string, string> = {
  '01': 'Ene', '02': 'Feb', '03': 'Mar', '04': 'Abr',
  '05': 'May', '06': 'Jun', '07': 'Jul', '08': 'Ago',
  '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dic'
};

const RevenueExpensesChart = ({ revenueData, expensesData, isLoading }: RevenueExpensesChartProps) => {
  // Normalizar datos: extraer array correcto
  const normalizeData = (data: MonthlyData[] | HistoricalData): MonthlyData[] => {
    if (Array.isArray(data)) {
      return data;
    }
    // Prioridad: history > monthlyData > array vacío
    return data.history || data.monthlyData || [];
  };

  const revenueArray = normalizeData(revenueData);
  const expensesArray = normalizeData(expensesData);

  // Preparar datos combinando revenue y expenses por mes
  const prepareChartData = () => {
    if (!revenueArray.length && !expensesArray.length) {
      return [];
    }

    // Crear un mapa con todos los meses disponibles
    const monthsMap = new Map<string, { Ingresos: number; Gastos: number }>();

    // Agregar datos de revenue
    revenueArray.forEach(item => {
      if (item.month) {
        if (!monthsMap.has(item.month)) {
          monthsMap.set(item.month, { Ingresos: 0, Gastos: 0 });
        }
        const existing = monthsMap.get(item.month)!;
        existing.Ingresos = Math.round(item.total);
      }
    });

    // Agregar datos de expenses
    expensesArray.forEach(item => {
      if (item.month) {
        if (!monthsMap.has(item.month)) {
          monthsMap.set(item.month, { Ingresos: 0, Gastos: 0 });
        }
        const existing = monthsMap.get(item.month)!;
        existing.Gastos = Math.round(item.total);
      }
    });

    // Convertir a array, ordenar por fecha y tomar últimos 12 meses
    const sortedData = Array.from(monthsMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-12)
      .map(([monthKey, values]) => {
        const [year, month] = monthKey.split('-');
        return {
          month: `${MONTH_NAMES[month]} ${year}`,
          Ingresos: values.Ingresos,
          Gastos: values.Gastos
        };
      });

    return sortedData;
  };

  const chartData = prepareChartData();
  const hasData = chartData.length > 0 && chartData.some(d => d.Ingresos > 0 || d.Gastos > 0);

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-80 bg-gray-100 rounded"></div>
        </div>
      </Card>
    );
  }

  if (!hasData) {
    return (
      <Card className="p-6 text-center">
        <p className="text-gray-500">No hay datos históricos disponibles</p>
        <p className="text-xs text-gray-400 mt-2">
          Revenue: {revenueArray.length} registros | Expenses: {expensesArray.length} registros
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Evolución Ingresos vs Gastos</h3>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="month" 
            stroke="#6b7280"
            tick={{ fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis 
            stroke="#6b7280"
            tickFormatter={formatCurrency}
            tick={{ fontSize: 12 }}
          />
          <Tooltip 
            formatter={(value) => formatCurrency(value as number)}
            contentStyle={{ 
              backgroundColor: 'white', 
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '12px'
            }}
          />
          <Legend 
            wrapperStyle={{ paddingTop: '20px' }}
          />
          <Line 
            type="monotone" 
            dataKey="Ingresos" 
            stroke="#3b82f6" 
            strokeWidth={3}
            dot={{ fill: '#3b82f6', r: 5 }}
            activeDot={{ r: 7 }}
            name="Ingresos"
          />
          <Line 
            type="monotone" 
            dataKey="Gastos" 
            stroke="#ef4444" 
            strokeWidth={3}
            dot={{ fill: '#ef4444', r: 5 }}
            activeDot={{ r: 7 }}
            name="Gastos"
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
};

export default RevenueExpensesChart;
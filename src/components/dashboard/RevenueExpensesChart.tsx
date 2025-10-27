import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { formatCurrency } from "@/lib/formatters";

interface MonthlyData {
  month: string;
  total: number;
  currency: string;
}

interface RevenueExpensesChartProps {
  revenueData: MonthlyData[];
  expensesData: MonthlyData[];
  isLoading?: boolean;
}

const MONTH_NAMES: Record<string, string> = {
  '01': 'Ene', '02': 'Feb', '03': 'Mar', '04': 'Abr',
  '05': 'May', '06': 'Jun', '07': 'Jul', '08': 'Ago',
  '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dic'
};

const RevenueExpensesChart = ({ revenueData, expensesData, isLoading }: RevenueExpensesChartProps) => {
  // Preparar datos para los últimos 12 meses
  const prepareChartData = () => {
    const currentDate = new Date();
    const chartData: any[] = [];
    
    // Generar últimos 12 meses
    for (let i = 11; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const monthKey = `${year}-${month}`;
      const monthLabel = `${MONTH_NAMES[month]} ${year}`;
      
      // Buscar revenue y expenses para este mes
      const revenue = revenueData.find(r => r.month === monthKey)?.total || 0;
      const expenses = expensesData.find(e => e.month === monthKey)?.total || 0;
      
      chartData.push({
        month: monthLabel,
        Ingresos: Math.round(revenue),
        Gastos: Math.round(expenses)
      });
    }
    
    return chartData;
  };

  const chartData = prepareChartData();
  const hasData = chartData.some(d => d.Ingresos > 0 || d.Gastos > 0);

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

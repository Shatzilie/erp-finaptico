import { Card } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
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

export function ChartsSection({ data, isLoading }: ChartsSectionProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-pulse">
        {[1, 2, 3, 4, 5].map(i => (
          <Card key={i} className="p-6 h-80 bg-gray-100" />
        ))}
      </div>
    );
  }

  // Preparar datos combinados para gráfica de beneficio
  const profitData = prepareComparisonData(
    data.revenue_history,
    data.expenses_history
  );

  // Preparar datos de importe facturado
  const revenueAmountData = prepareYearComparisonData(data.revenue_history);

  // Preparar datos de importe de compras
  const expensesAmountData = prepareYearComparisonData(data.expenses_history);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Análisis Financiero Comparativo</h2>

      {/* Gráfica 1: Beneficio neto antes de impuestos */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">
          Beneficio Neto Antes de Impuestos (Año Actual vs Anterior)
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={profitData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="monthLabel"
              tick={{ fill: '#6b7280', fontSize: 12 }}
            />
            <YAxis
              tick={{ fill: '#6b7280', fontSize: 12 }}
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k €`}
            />
            <Tooltip
              formatter={(value: number) => `${value.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €`}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px'
              }}
            />
            <Legend />
            <Bar
              dataKey="currentYear"
              name="Año Actual"
              fill="#1e40af"
              radius={[8, 8, 0, 0]}
            />
            <Bar
              dataKey="previousYear"
              name="Año Anterior"
              fill="#93c5fd"
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Grid de 2 columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfica 2: Importe total facturado */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">
            Importe Facturado (sin IVA)
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={revenueAmountData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="monthLabel"
                tick={{ fill: '#6b7280', fontSize: 11 }}
              />
              <YAxis
                tick={{ fill: '#6b7280', fontSize: 11 }}
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k €`}
              />
              <Tooltip
                formatter={(value: number) => `${value.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €`}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Bar
                dataKey="currentYear"
                name="Año Actual"
                fill="#f97316"
                radius={[6, 6, 0, 0]}
              />
              <Bar
                dataKey="previousYear"
                name="Año Anterior"
                fill="#fed7aa"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Gráfica 3: Importe total de compras */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">
            Importe de Compras (sin IVA)
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={expensesAmountData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="monthLabel"
                tick={{ fill: '#6b7280', fontSize: 11 }}
                tickFormatter={(value) => value}
              />
              <YAxis
                tick={{ fill: '#6b7280', fontSize: 11 }}
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k €`}
              />
              <Tooltip
                formatter={(value: number) => `${value.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €`}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Bar
                dataKey="currentYear"
                name="Año Actual"
                fill="#8b5cf6"
                radius={[6, 6, 0, 0]}
              />
              <Bar
                dataKey="previousYear"
                name="Año Anterior"
                fill="#ddd6fe"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}

// ========== FUNCIONES HELPER CORREGIDAS ==========

function formatMonthLabel(monthStr: string): string {
  const months = [
    "Ene", "Feb", "Mar", "Abr", "May", "Jun",
    "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"
  ];
  const parts = monthStr.split("-");
  if (parts.length === 2) {
    const monthNum = parseInt(parts[1]) - 1;
    return months[monthNum] || monthStr;
  }
  return monthStr;
}

function prepareYearComparisonData(history: MonthlyData[]) {
  if (!history || history.length === 0) {
    return [];
  }

  const currentYear = new Date().getFullYear();
  const previousYear = currentYear - 1;

  // Agrupar por mes (solo MM)
  const monthMap = new Map<string, { currentYear: number; previousYear: number; monthLabel: string }>();

  history.forEach(item => {
    const [year, month] = item.month.split("-");
    const yearNum = parseInt(year);
    const monthNum = parseInt(month);

    if (!monthMap.has(month)) {
      monthMap.set(month, {
        currentYear: 0,
        previousYear: 0,
        monthLabel: formatMonthLabel(`0-${month}`)
      });
    }

    const entry = monthMap.get(month)!;
    if (yearNum === currentYear) {
      entry.currentYear = Math.round(item.total * 100) / 100;
    } else if (yearNum === previousYear) {
      entry.previousYear = Math.round(item.total * 100) / 100;
    }
  });

  // Convertir a array y ordenar por mes
  return Array.from(monthMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([_, value]) => value);
}

function prepareComparisonData(
  revenueHistory: MonthlyData[],
  expensesHistory: MonthlyData[]
) {
  if (!revenueHistory || !expensesHistory) {
    return [];
  }

  const currentYear = new Date().getFullYear();
  const previousYear = currentYear - 1;

  // Crear mapa de revenue por mes completo (YYYY-MM)
  const revenueMap = new Map<string, number>();
  revenueHistory.forEach(r => {
    revenueMap.set(r.month, r.total);
  });

  // Crear mapa de expenses por mes completo (YYYY-MM)
  const expensesMap = new Map<string, number>();
  expensesHistory.forEach(e => {
    expensesMap.set(e.month, e.total);
  });

  // Obtener todos los meses únicos
  const allMonths = new Set<string>();
  revenueHistory.forEach(r => {
    const [_, month] = r.month.split("-");
    allMonths.add(month);
  });
  expensesHistory.forEach(e => {
    const [_, month] = e.month.split("-");
    allMonths.add(month);
  });

  // Crear array de resultados
  const results: any[] = [];

  Array.from(allMonths).sort().forEach(month => {
    const currentYearKey = `${currentYear}-${month}`;
    const previousYearKey = `${previousYear}-${month}`;

    const currentRevenue = revenueMap.get(currentYearKey) || 0;
    const currentExpenses = expensesMap.get(currentYearKey) || 0;
    const previousRevenue = revenueMap.get(previousYearKey) || 0;
    const previousExpenses = expensesMap.get(previousYearKey) || 0;

    results.push({
      monthLabel: formatMonthLabel(`0-${month}`),
      currentYear: Math.round((currentRevenue - currentExpenses) * 100) / 100,
      previousYear: Math.round((previousRevenue - previousExpenses) * 100) / 100
    });
  });

  return results;
}
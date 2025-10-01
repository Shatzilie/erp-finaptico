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

  // Preparar datos de facturas emitidas (conteo)
  const invoiceCountData = prepareInvoiceCountData(data.revenue_history);

  // Preparar datos de importe facturado
  const revenueAmountData = prepareYearComparisonData(data.revenue_history);

  // Preparar datos de facturas de compra (conteo)
  const purchaseCountData = prepareInvoiceCountData(data.expenses_history);

  // Preparar datos de importe de compras
  const expensesAmountData = prepareYearComparisonData(data.expenses_history);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Análisis Financiero</h2>

      {/* Gráfica 1: Beneficio neto antes de impuestos */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">
          Beneficio Neto Antes de Impuestos (Mensual)
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={profitData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="month"
              tick={{ fill: '#6b7280', fontSize: 12 }}
              tickFormatter={(value) => formatMonthLabel(value)}
            />
            <YAxis
              tick={{ fill: '#6b7280', fontSize: 12 }}
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k €`}
            />
            <Tooltip
              formatter={(value: number) => `${value.toLocaleString('es-ES')} €`}
              labelFormatter={(label) => formatMonthLabel(label)}
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

      {/* Grid de 2 columnas para el resto */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfica 2: Número de facturas emitidas */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">
            Facturas Emitidas (Número)
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={invoiceCountData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="month"
                tick={{ fill: '#6b7280', fontSize: 11 }}
                tickFormatter={(value) => formatMonthLabel(value)}
              />
              <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} />
              <Tooltip
                labelFormatter={(label) => formatMonthLabel(label)}
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
                fill="#10b981"
                radius={[6, 6, 0, 0]}
              />
              <Bar
                dataKey="previousYear"
                name="Año Anterior"
                fill="#86efac"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Gráfica 3: Importe total facturado */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">
            Importe Facturado (sin IVA)
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={revenueAmountData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="month"
                tick={{ fill: '#6b7280', fontSize: 11 }}
                tickFormatter={(value) => formatMonthLabel(value)}
              />
              <YAxis
                tick={{ fill: '#6b7280', fontSize: 11 }}
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k €`}
              />
              <Tooltip
                formatter={(value: number) => `${value.toLocaleString('es-ES')} €`}
                labelFormatter={(label) => formatMonthLabel(label)}
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

        {/* Gráfica 4: Número de facturas de compra */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">
            Facturas de Compra (Número)
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={purchaseCountData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="month"
                tick={{ fill: '#6b7280', fontSize: 11 }}
                tickFormatter={(value) => formatMonthLabel(value)}
              />
              <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} />
              <Tooltip
                labelFormatter={(label) => formatMonthLabel(label)}
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
                fill="#3b82f6"
                radius={[6, 6, 0, 0]}
              />
              <Bar
                dataKey="previousYear"
                name="Año Anterior"
                fill="#bfdbfe"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Gráfica 5: Importe total de compras */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">
            Importe de Compras (sin IVA)
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={expensesAmountData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="month"
                tick={{ fill: '#6b7280', fontSize: 11 }}
                tickFormatter={(value) => formatMonthLabel(value)}
              />
              <YAxis
                tick={{ fill: '#6b7280', fontSize: 11 }}
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k €`}
              />
              <Tooltip
                formatter={(value: number) => `${value.toLocaleString('es-ES')} €`}
                labelFormatter={(label) => formatMonthLabel(label)}
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

// ========== FUNCIONES HELPER ==========

function formatMonthLabel(monthStr: string): string {
  const months = [
    "Ene", "Feb", "Mar", "Abr", "May", "Jun",
    "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"
  ];
  const [year, month] = monthStr.split("-");
  return `${months[parseInt(month) - 1]} ${year.slice(2)}`;
}

function prepareComparisonData(
  revenueHistory: MonthlyData[],
  expensesHistory: MonthlyData[]
) {
  const currentYear = new Date().getFullYear();
  const previousYear = currentYear - 1;

  const allMonths = new Set([
    ...revenueHistory.map(r => r.month),
    ...expensesHistory.map(e => e.month)
  ]);

  const revenueMap = new Map(revenueHistory.map(r => [r.month, r.total]));
  const expensesMap = new Map(expensesHistory.map(e => [e.month, e.total]));

  return Array.from(allMonths)
    .sort()
    .map(month => {
      const revenue = revenueMap.get(month) || 0;
      const expenses = expensesMap.get(month) || 0;
      const profit = Math.round((revenue - expenses) * 100) / 100;
      const year = parseInt(month.split("-")[0]);

      return {
        month,
        [year === currentYear ? "currentYear" : "previousYear"]: profit
      };
    })
    .reduce((acc, curr) => {
      const existing = acc.find(item => item.month === curr.month);
      if (existing) {
        Object.assign(existing, curr);
      } else {
        acc.push(curr);
      }
      return acc;
    }, [] as any[])
    .slice(-12);
}

function prepareYearComparisonData(history: MonthlyData[]) {
  const currentYear = new Date().getFullYear();
  
  return history
    .slice(-24) // Últimos 24 meses (2 años)
    .reduce((acc, item) => {
      const year = parseInt(item.month.split("-")[0]);
      const monthKey = item.month.slice(5); // Solo MM
      
      const existing = acc.find(x => x.month === monthKey);
      if (existing) {
        if (year === currentYear) {
          existing.currentYear = Math.round(item.total * 100) / 100;
        } else {
          existing.previousYear = Math.round(item.total * 100) / 100;
        }
      } else {
        acc.push({
          month: monthKey,
          currentYear: year === currentYear ? Math.round(item.total * 100) / 100 : 0,
          previousYear: year !== currentYear ? Math.round(item.total * 100) / 100 : 0
        });
      }
      
      return acc;
    }, [] as any[])
    .sort((a, b) => a.month.localeCompare(b.month));
}

function prepareInvoiceCountData(history: MonthlyData[]) {
  // Por ahora usamos un mock del conteo
  // TODO: Implementar conteo real cuando las Edge Functions lo devuelvan
  return prepareYearComparisonData(history).map(item => ({
    ...item,
    currentYear: Math.floor(item.currentYear / 1000), // Mock: ~1 factura por cada 1000€
    previousYear: Math.floor(item.previousYear / 1000)
  }));
}
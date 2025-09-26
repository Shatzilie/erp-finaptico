import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';

// Tipos de datos
interface MonthlyData {
  month: string;
  total: number;
  currency: string;
}

interface ChartData {
  month: string;
  monthName: string;
  ingresos: number;
  gastos: number;
  margen: number;
}

interface ChartsProps {
  tenantSlug: string;
}

// Función para convertir YYYY-MM a nombre de mes
const getMonthName = (monthStr: string): string => {
  const [year, month] = monthStr.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' });
};

// Función para formatear euros
const formatEuro = (amount: number): string => {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

// Tooltip personalizado
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-medium text-gray-900 mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            <span className="font-medium">{entry.name}:</span> {formatEuro(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export const ChartsSection: React.FC<ChartsProps> = ({ tenantSlug }) => {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Función para obtener datos de revenue
  const fetchRevenueData = async (): Promise<MonthlyData[]> => {
    const response = await fetch('https://dtmrywilxpilpzokxxif.supabase.co/functions/v1/odoo-revenue', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-lovable-secret': 'lovable_sync_2024_LP%#tGxa@Q'
      },
      body: JSON.stringify({ tenant_slug: tenantSlug })
    });

    if (!response.ok) {
      throw new Error('Error fetching revenue data');
    }

    const data = await response.json();
    return data.widget_data?.revenue?.payload?.monthly_history || [];
  };

  // Función para obtener datos de expenses
  const fetchExpensesData = async (): Promise<MonthlyData[]> => {
    const response = await fetch('https://dtmrywilxpilpzokxxif.supabase.co/functions/v1/odoo-expenses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-lovable-secret': 'lovable_sync_2024_LP%#tGxa@Q'
      },
      body: JSON.stringify({ tenant_slug: tenantSlug })
    });

    if (!response.ok) {
      throw new Error('Error fetching expenses data');
    }

    const data = await response.json();
    return data.widget_data?.expenses?.payload?.monthly_history || [];
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Obtener datos en paralelo
        const [revenueData, expensesData] = await Promise.all([
          fetchRevenueData(),
          fetchExpensesData()
        ]);

        // Verificar que tenemos datos históricos suficientes (mínimo 3 meses)
        if (revenueData.length < 3 || expensesData.length < 3) {
          console.log('Insufficient historical data, hiding charts');
          setChartData([]);
          setLoading(false);
          return;
        }

        // Combinar datos por mes
        const combinedData = new Map<string, ChartData>();

        // Inicializar con datos de ingresos
        revenueData.forEach(item => {
          combinedData.set(item.month, {
            month: item.month,
            monthName: getMonthName(item.month),
            ingresos: item.total,
            gastos: 0,
            margen: 0
          });
        });

        // Añadir datos de gastos
        expensesData.forEach(item => {
          const existing = combinedData.get(item.month);
          if (existing) {
            existing.gastos = item.total;
            existing.margen = existing.ingresos - item.total;
          }
        });

        // Convertir a array y ordenar por fecha
        const finalData = Array.from(combinedData.values())
          .sort((a, b) => a.month.localeCompare(b.month));

        setChartData(finalData);

      } catch (err) {
        console.error('Error loading chart data:', err);
        setError('Error cargando datos de gráficas');
      } finally {
        setLoading(false);
      }
    };

    if (tenantSlug) {
      loadData();
    }
  }, [tenantSlug]);

  // Si está cargando
  if (loading) {
    return (
      <div className="mt-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Evolución de tu empresa</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-24"></div>
              </CardHeader>
              <CardContent>
                <div className="h-48 bg-gray-100 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Si hay error
  if (error) {
    return (
      <div className="mt-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Evolución de tu empresa</h2>
        <Card>
          <CardContent className="p-6">
            <p className="text-red-600 text-center">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Si no hay datos suficientes, no mostrar nada
  if (chartData.length < 3) {
    return null;
  }

  return (
    <div className="mt-8">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Evolución de tu empresa</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfica de Ingresos */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-purple-700">
              <TrendingUp className="h-4 w-4" />
              Ingresos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="monthName" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey="ingresos" 
                    stroke="#6C5CE7" 
                    strokeWidth={3}
                    dot={{ fill: "#6C5CE7", strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: "#6C5CE7" }}
                    name="Ingresos"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Gráfica de Gastos */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-teal-600">
              <TrendingDown className="h-4 w-4" />
              Gastos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="monthName" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey="gastos" 
                    stroke="#00BFA5" 
                    strokeWidth={3}
                    dot={{ fill: "#00BFA5", strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: "#00BFA5" }}
                    name="Gastos"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Gráfica de Margen */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-gray-700">
              <BarChart3 className="h-4 w-4" />
              Margen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="monthName" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey="margen" 
                    stroke="#111827" 
                    strokeWidth={3}
                    dot={{ fill: "#111827", strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: "#111827" }}
                    name="Margen"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
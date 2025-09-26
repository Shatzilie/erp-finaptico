import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { TrendingUp, TrendingDown, PieChart as PieChartIcon } from 'lucide-react';

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
  margenPorcentaje: number;
}

interface TaxData {
  iva: number;
  irpf: number;
  is: number;
}

interface FiscalChartData {
  name: string;
  value: number;
  color: string;
}

interface ChartsProps {
  tenantSlug: string;
}

// Función para convertir YYYY-MM a nombre de mes abreviado
const getMonthName = (monthStr: string): string => {
  const [year, month] = monthStr.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  const monthName = date.toLocaleDateString('es-ES', { month: 'short' });
  const yearShort = year.slice(2);
  return `${monthName} ${yearShort}`;
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

// Función para formatear porcentajes
const formatPercent = (value: number): string => {
  return `${value.toFixed(1)}%`;
};

// Tooltip personalizado para barras
const BarTooltip = ({ active, payload, label }: any) => {
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

// Tooltip personalizado para línea de margen
const MarginTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-medium text-gray-900 mb-2">{label}</p>
        <p className="text-sm" style={{ color: payload[0].color }}>
          <span className="font-medium">Margen:</span> {formatPercent(payload[0].value)}
        </p>
      </div>
    );
  }
  return null;
};

// Tooltip personalizado para donut fiscal
const FiscalTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-medium text-gray-900">{data.name}</p>
        <p className="text-sm" style={{ color: data.payload.color }}>
          <span className="font-medium">Importe:</span> {formatEuro(data.value)}
        </p>
      </div>
    );
  }
  return null;
};

export const ChartsSection: React.FC<ChartsProps> = ({ tenantSlug }) => {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [fiscalData, setFiscalData] = useState<FiscalChartData[]>([]);
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

  // Función para obtener datos fiscales
  const fetchFiscalData = async (): Promise<TaxData> => {
    const currentYear = new Date().getFullYear();
    const currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3);

    // Obtener datos de IVA, IRPF e IS en paralelo
    const [ivaResponse, irpfResponse, isResponse] = await Promise.all([
      fetch('https://dtmrywilxpilpzokxxif.supabase.co/functions/v1/odoo-iva', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-lovable-secret': 'lovable_sync_2024_LP%#tGxa@Q'
        },
        body: JSON.stringify({ 
          tenant_slug: tenantSlug,
          quarter: currentQuarter,
          year: currentYear 
        })
      }),
      fetch('https://dtmrywilxpilpzokxxif.supabase.co/functions/v1/odoo-irpf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-lovable-secret': 'lovable_sync_2024_LP%#tGxa@Q'
        },
        body: JSON.stringify({ 
          tenant_slug: tenantSlug,
          quarter: currentQuarter,
          year: currentYear 
        })
      }),
      fetch('https://dtmrywilxpilpzokxxif.supabase.co/functions/v1/odoo-sociedades', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-lovable-secret': 'lovable_sync_2024_LP%#tGxa@Q'
        },
        body: JSON.stringify({ 
          tenant_slug: tenantSlug,
          year: currentYear 
        })
      })
    ]);

    const ivaData = await ivaResponse.json();
    const irpfData = await irpfResponse.json();
    const isData = await isResponse.json();

    return {
      iva: Math.abs(ivaData.widget_data?.iva?.payload?.iva_diferencia || 0),
      irpf: Math.abs(irpfData.widget_data?.irpf?.payload?.diferencia || 0),
      is: Math.abs(isData.widget_data?.sociedades?.payload?.cuota_diferencial || 0)
    };
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Obtener datos en paralelo
        const [revenueData, expensesData, taxData] = await Promise.all([
          fetchRevenueData(),
          fetchExpensesData(),
          fetchFiscalData()
        ]);

        // Verificar que tenemos datos históricos suficientes (mínimo 3 meses)
        if (revenueData.length < 3 || expensesData.length < 3) {
          console.log('Insufficient historical data, hiding charts');
          setChartData([]);
          setLoading(false);
          return;
        }

        // Combinar datos por mes (últimos 12 meses)
        const combinedData = new Map<string, ChartData>();

        // Tomar solo los últimos 12 meses
        const last12Revenue = revenueData.slice(-12);
        const last12Expenses = expensesData.slice(-12);

        // Inicializar con datos de ingresos
        last12Revenue.forEach(item => {
          combinedData.set(item.month, {
            month: item.month,
            monthName: getMonthName(item.month),
            ingresos: item.total,
            gastos: 0,
            margenPorcentaje: 0
          });
        });

        // Añadir datos de gastos y calcular margen porcentual
        last12Expenses.forEach(item => {
          const existing = combinedData.get(item.month);
          if (existing) {
            existing.gastos = item.total;
            // Calcular margen porcentual: ((ingresos - gastos) / ingresos) * 100
            existing.margenPorcentaje = existing.ingresos > 0 
              ? ((existing.ingresos - item.total) / existing.ingresos) * 100 
              : 0;
          }
        });

        // Convertir a array y ordenar por fecha
        const finalData = Array.from(combinedData.values())
          .sort((a, b) => a.month.localeCompare(b.month));

        setChartData(finalData);

        // Preparar datos fiscales para el donut
        const fiscalChartData: FiscalChartData[] = [];
        
        if (taxData.iva > 0) {
          fiscalChartData.push({ name: 'IVA', value: taxData.iva, color: '#6C5CE7' });
        }
        if (taxData.irpf > 0) {
          fiscalChartData.push({ name: 'IRPF', value: taxData.irpf, color: '#74C0FC' });
        }
        if (taxData.is > 0) {
          fiscalChartData.push({ name: 'IS', value: taxData.is, color: '#111827' });
        }

        setFiscalData(fiscalChartData);

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
        {/* 1. Gráfico de barras comparativo Ingresos vs Gastos */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Ingresos y Gastos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="monthName" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip content={<BarTooltip />} />
                  <Bar 
                    dataKey="ingresos" 
                    fill="#6C5CE7" 
                    name="Ingresos"
                    radius={[2, 2, 0, 0]}
                  />
                  <Bar 
                    dataKey="gastos" 
                    fill="#00BFA5" 
                    name="Gastos"
                    radius={[2, 2, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* 2. Gráfico de línea - Margen Anual (%) */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Margen Anual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="monthName" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                    tickFormatter={(value) => `${value.toFixed(0)}%`}
                    domain={[0, 100]}
                  />
                  <Tooltip content={<MarginTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey="margenPorcentaje" 
                    stroke="#111827" 
                    strokeWidth={3}
                    dot={{ fill: "#111827", strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: "#111827" }}
                    name="Margen %"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* 3. Gráfico donut fiscal */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <PieChartIcon className="h-4 w-4" />
              Situación Fiscal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              {fiscalData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={fiscalData}
                      cx="50%"
                      cy="50%"
                      innerRadius={35}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {fiscalData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<FiscalTooltip />} />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36}
                      iconType="circle"
                      wrapperStyle={{ fontSize: '12px' }}
                      formatter={(value, entry: any) => (
                        <span style={{ color: entry.color }}>
                          {value}
                        </span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                  Sin obligaciones fiscales
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
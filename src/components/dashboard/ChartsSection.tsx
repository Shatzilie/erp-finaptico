import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { TrendingUp, Calculator } from 'lucide-react';

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
  margenPorcentaje: number;
}

interface FiscalSummary {
  ivaAPagar: number;
  irpfAFavor: number;
  isProvision: number;
  resumenFiscal: string;
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

// Función para formatear euros abreviados
const formatEuroShort = (amount: number): string => {
  if (Math.abs(amount) >= 1000) {
    return `${(amount / 1000).toFixed(0)}k€`;
  }
  return formatEuro(amount);
};

// Tooltip personalizado para barras
const BarTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const ingresos = payload.find((p: any) => p.dataKey === 'ingresos')?.value || 0;
    const gastos = payload.find((p: any) => p.dataKey === 'gastos')?.value || 0;
    const margen = ingresos - gastos;
    const margenPct = ingresos > 0 ? ((margen / ingresos) * 100).toFixed(1) : 0;
    
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-medium text-gray-900 mb-2">{label}</p>
        <p className="text-sm text-purple-600">
          <span className="font-medium">Ingresos:</span> {formatEuro(ingresos)}
        </p>
        <p className="text-sm text-teal-600">
          <span className="font-medium">Gastos:</span> {formatEuro(gastos)}
        </p>
        <hr className="my-1" />
        <p className="text-sm text-gray-800 font-medium">
          <span>Margen:</span> {formatEuro(margen)} ({margenPct}%)
        </p>
      </div>
    );
  }
  return null;
};

// Tooltip para gráfico de margen
const MarginTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const margen = payload[0].value;
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-medium text-gray-900 mb-2">{label}</p>
        <p className="text-sm text-gray-700">
          <span className="font-medium">Margen:</span> {formatEuro(margen)}
        </p>
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

  // Función para obtener resumen fiscal
  const fetchFiscalSummary = async (): Promise<FiscalSummary> => {
    const currentYear = new Date().getFullYear();
    const currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3);

    // Obtener datos fiscales en paralelo
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

    const ivaAmount = ivaData.widget_data?.iva?.payload?.iva_diferencia || 0;
    const irpfAmount = irpfData.widget_data?.irpf?.payload?.diferencia || 0;
    const isAmount = isData.widget_data?.sociedades?.payload?.cuota_diferencial || 0;

    // Determinar resumen fiscal
    let resumen = "";
    if (ivaAmount > 0 && irpfAmount < 0) {
      resumen = `IVA a pagar: ${formatEuro(ivaAmount)} • IRPF a compensar: ${formatEuro(Math.abs(irpfAmount))}`;
    } else if (ivaAmount > 0 && irpfAmount >= 0) {
      resumen = `IVA: ${formatEuro(ivaAmount)} • IRPF: ${formatEuro(irpfAmount)} a pagar`;
    } else if (ivaAmount <= 0 && irpfAmount < 0) {
      resumen = `IVA: ${formatEuro(Math.abs(ivaAmount))} • IRPF: ${formatEuro(Math.abs(irpfAmount))} a compensar`;
    } else {
      resumen = "Sin obligaciones fiscales significativas";
    }

    return {
      ivaAPagar: Math.max(0, ivaAmount),
      irpfAFavor: Math.abs(Math.min(0, irpfAmount)),
      isProvision: Math.max(0, isAmount),
      resumenFiscal: resumen
    };
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

        // Verificar que tenemos datos históricos suficientes
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
            margen: 0,
            margenPorcentaje: 0
          });
        });

        // Añadir datos de gastos
        last12Expenses.forEach(item => {
          const existing = combinedData.get(item.month);
          if (existing) {
            existing.gastos = item.total;
            existing.margen = existing.ingresos - item.total;
            existing.margenPorcentaje = existing.ingresos > 0 
              ? ((existing.margen / existing.ingresos) * 100) 
              : 0;
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

  // Calcular promedio de margen para línea de referencia
  const averageMargin = chartData.reduce((sum, item) => sum + item.margen, 0) / chartData.length;

  return (
    <div className="mt-12">
      <h2 className="text-xl font-semibold text-gray-900 mb-8">Evolución de tu empresa</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 1. Gráfico combinado: Ingresos vs Gastos con línea de margen */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-4">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Ingresos, Gastos y Margen Mensual
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 25, right: 35, left: 25, bottom: 10 }}>
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
                    tickFormatter={formatEuroShort}
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
                  <ReferenceLine 
                    y={averageMargin} 
                    stroke="#111827" 
                    strokeDasharray="3 3"
                    label={{ value: `Margen promedio: ${formatEuroShort(averageMargin)}`, position: 'topRight', fontSize: 11 }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* 2. Evolución del margen mensual */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Evolución del Margen
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 25, right: 15, left: 15, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="monthName" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#6b7280' }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#6b7280' }}
                    tickFormatter={formatEuroShort}
                  />
                  <Tooltip content={<MarginTooltip />} />
                  <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="2 2" />
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
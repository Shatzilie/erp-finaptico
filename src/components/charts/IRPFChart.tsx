import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface IRPFChartProps {
  labels: string[];
  series: {
    practicadas: number[];
    soportadas: number[];
  };
}

export const IRPFChart = ({ labels, series }: IRPFChartProps) => {
  const data = labels.map((label, index) => ({
    quarter: label,
    practicadas: series.practicadas[index],
    soportadas: series.soportadas[index]
  }));

  const formatEuro = (value: number) => 
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);

  const hasData = series.practicadas.some(v => v !== 0) || series.soportadas.some(v => v !== 0);

  if (!hasData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>IRPF por Trimestre</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground">Sin datos disponibles</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>IRPF por Trimestre</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="quarter"
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis 
              tickFormatter={formatEuro}
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <Tooltip 
              formatter={(value: number) => formatEuro(value)}
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }}
            />
            <Legend 
              wrapperStyle={{
                paddingTop: '20px'
              }}
            />
            <Bar 
              dataKey="practicadas" 
              fill="#f59e0b" 
              name="Practicadas"
              radius={[4, 4, 0, 0]}
            />
            <Bar 
              dataKey="soportadas" 
              fill="#06b6d4" 
              name="Soportadas"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

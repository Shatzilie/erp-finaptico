import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet, TrendingUp, TrendingDown, PiggyBank } from 'lucide-react';
import type { DashboardData } from '@/lib/backendAdapter';

interface KpiBoardProps {
  data: DashboardData | null;
}

export function KpiBoard({ data }: KpiBoardProps) {
  if (!data) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cargando...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">--</div>
              <p className="text-xs text-muted-foreground">Esperando datos</p>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tesorería Total</CardTitle>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {data.treasury.total.toLocaleString('es-ES')} €
          </div>
          <p className="text-xs text-muted-foreground">
            {data.treasury.accounts.length} cuentas
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Ingresos Anuales</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {data.revenue.annual_revenue.toLocaleString('es-ES')} €
          </div>
          <p className="text-xs text-muted-foreground">
            {data.revenue.outstanding_invoices_count} facturas pendientes
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Gastos Anuales</CardTitle>
          <TrendingDown className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {data.expenses.annual_expenses.toLocaleString('es-ES')} €
          </div>
          <p className="text-xs text-muted-foreground">
            {data.expenses.pending_invoices_count} por pagar
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Margen Anual</CardTitle>
          <PiggyBank className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {data.profitability.yearlyMargin.toLocaleString('es-ES')} €
          </div>
          <p className="text-xs text-muted-foreground">
            {data.profitability.marginPercentage.toFixed(2)}% de margen
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
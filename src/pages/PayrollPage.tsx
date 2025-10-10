import { useState, useEffect } from 'react';
import { useAuthenticatedFetch } from '@/hooks/useAuthenticatedFetch';
import { useTenantAccess } from '@/hooks/useTenantAccess';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, DollarSign, TrendingUp, Calculator, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/formatters';

type Payslip = {
  id: number;
  reference: string;
  employee_id: number;
  employee_name: string;
  date_from: string;
  date_to: string;
  state: string;
  struct_name: string;
  gross_salary: number;
  irpf_amount: number;
  ss_employee: number;
  ss_employer: number;
  net_salary: number;
  total_cost: number;
};

type PayrollData = {
  payslips: Payslip[];
  totals: {
    total_gross: number;
    total_irpf: number;
    total_ss_employee: number;
    total_ss_employer: number;
    total_net: number;
    total_cost: number;
  };
  period: { year: number; month: number | null };
  count: number;
};

const MONTHS = [
  { value: 'all', label: 'Todos los meses' },
  { value: '1', label: 'Enero' },
  { value: '2', label: 'Febrero' },
  { value: '3', label: 'Marzo' },
  { value: '4', label: 'Abril' },
  { value: '5', label: 'Mayo' },
  { value: '6', label: 'Junio' },
  { value: '7', label: 'Julio' },
  { value: '8', label: 'Agosto' },
  { value: '9', label: 'Septiembre' },
  { value: '10', label: 'Octubre' },
  { value: '11', label: 'Noviembre' },
  { value: '12', label: 'Diciembre' },
];

export default function PayrollPage() {
  const { tenantSlug } = useTenantAccess();
  const { fetchWithTimeout } = useAuthenticatedFetch();
  const { toast } = useToast();

  const [selectedYear, setSelectedYear] = useState(2025);
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [payrollData, setPayrollData] = useState<PayrollData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchPayslips = async () => {
    if (!tenantSlug) return;
    
    setIsLoading(true);
    try {
      const response = await fetchWithTimeout('odoo-payroll', {
        tenant_slug: tenantSlug,
        action: 'get_payslips',
        params: { 
          year: selectedYear, 
          month: selectedMonth === 'all' ? null : parseInt(selectedMonth) 
        }
      });

      if (response.ok && response.widget_data?.payroll?.success) {
        setPayrollData(response.widget_data.payroll.payload);
      } else {
        toast({
          title: "Error",
          description: "No se pudieron cargar las nóminas",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al cargar las nóminas",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (tenantSlug) {
      fetchPayslips();
    }
  }, [tenantSlug]);

  const formatPeriod = (dateFrom: string, dateTo: string) => {
    const date = new Date(dateFrom);
    return new Intl.DateTimeFormat('es-ES', { month: 'short', year: 'numeric' }).format(date);
  };

  const getStateBadge = (state: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", label: string }> = {
      done: { variant: "default", label: "Pagada" },
      paid: { variant: "secondary", label: "Confirmada" },
      draft: { variant: "outline", label: "Borrador" },
    };
    const config = variants[state] || { variant: "outline", label: state };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (isLoading && !payrollData) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div>
          <Skeleton className="h-10 w-48 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <Skeleton className="h-10 w-[180px]" />
              <Skeleton className="h-10 w-[200px]" />
              <Skeleton className="h-10 w-[120px]" />
            </div>
          </CardContent>
        </Card>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Título */}
      <div>
        <h1 className="text-3xl font-bold">Nóminas</h1>
        <p className="text-muted-foreground">Gestión de nóminas y coste laboral</p>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Año" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2023">2023</SelectItem>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2025">2025</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Mes" />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((month) => (
                  <SelectItem key={month.value} value={month.value}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button onClick={fetchPayslips} disabled={isLoading}>
              <Search className="mr-2 h-4 w-4" />
              {isLoading ? 'Cargando...' : 'Buscar'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      {payrollData && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Bruto Total</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(payrollData.totals.total_gross, 0)}</div>
                <p className="text-xs text-muted-foreground mt-1">Salarios brutos</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">IRPF Total</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(payrollData.totals.total_irpf, 0)}</div>
                <p className="text-xs text-muted-foreground mt-1">Retenciones</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Neto Total</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(payrollData.totals.total_net, 0)}</div>
                <p className="text-xs text-muted-foreground mt-1">A pagar</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Coste Total</CardTitle>
                <Calculator className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(payrollData.totals.total_cost, 0)}</div>
                <p className="text-xs text-muted-foreground mt-1">Empresa + SS</p>
              </CardContent>
            </Card>
          </div>

          {/* Tabla de nóminas */}
          <Card>
            <CardHeader>
              <CardTitle>Detalle de Nóminas</CardTitle>
            </CardHeader>
            <CardContent>
              {payrollData.payslips.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No se encontraron nóminas para este período</p>
                </div>
              ) : (
                <>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Empleado</TableHead>
                          <TableHead>Referencia</TableHead>
                          <TableHead>Período</TableHead>
                          <TableHead className="text-right">Bruto</TableHead>
                          <TableHead className="text-right">IRPF</TableHead>
                          <TableHead className="text-right">Neto</TableHead>
                          <TableHead className="text-right">Coste Total</TableHead>
                          <TableHead>Estado</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {payrollData.payslips.map((payslip) => (
                          <TableRow key={payslip.id}>
                            <TableCell className="font-medium">{payslip.employee_name}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{payslip.reference}</TableCell>
                            <TableCell>{formatPeriod(payslip.date_from, payslip.date_to)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(payslip.gross_salary, 0)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(payslip.irpf_amount, 0)}</TableCell>
                            <TableCell className="text-right font-medium">{formatCurrency(payslip.net_salary, 0)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(payslip.total_cost, 0)}</TableCell>
                            <TableCell>{getStateBadge(payslip.state)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="mt-4 text-sm text-muted-foreground">
                    Total: {payrollData.count} nómina{payrollData.count !== 1 ? 's' : ''}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthenticatedFetch } from '@/hooks/useAuthenticatedFetch';
import { useTenantAccess } from '@/hooks/useTenantAccess';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileText, TrendingUp, AlertCircle, Download, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/formatters';

interface Modelo111Data {
  period: {
    quarter: number;
    year: number;
    date_from: string;
    date_to: string;
  };
  total_irpf_retenido: number;
  numero_nominas: number;
  status: string;
}

export default function Modelo111Page() {
  const navigate = useNavigate();
  const { tenantSlug } = useTenantAccess();
  const { fetchWithTimeout } = useAuthenticatedFetch();
  const { toast } = useToast();

  const [selectedYear, setSelectedYear] = useState(2025);
  const [selectedQuarter, setSelectedQuarter] = useState(4);
  const [modelo111Data, setModelo111Data] = useState<Modelo111Data | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const getPeriodName = (quarter: number) => {
    const quarters: Record<number, string> = {
      1: 'Primer trimestre (Enero - Marzo)',
      2: 'Segundo trimestre (Abril - Junio)',
      3: 'Tercer trimestre (Julio - Septiembre)',
      4: 'Cuarto trimestre (Octubre - Diciembre)'
    };
    return quarters[quarter];
  };

  const getDeadlineDate = (quarter: number, year: number) => {
    const deadlineMonths: Record<number, string> = { 
      1: 'Abril', 
      2: 'Julio', 
      3: 'Octubre', 
      4: 'Enero' 
    };
    const deadlineMonth = deadlineMonths[quarter];
    const deadlineYear = quarter === 4 ? year + 1 : year;
    return `20 de ${deadlineMonth} de ${deadlineYear}`;
  };

  const fetchModelo111 = async () => {
    if (!tenantSlug) return;
    
    setIsLoading(true);
    try {
      const response = await fetchWithTimeout('odoo-payroll', {
        tenant_slug: tenantSlug,
        action: 'get_modelo111',
        params: {
          year: selectedYear,
          quarter: selectedQuarter
        }
      });

      if (response.ok && response.widget_data?.modelo111?.success) {
        setModelo111Data(response.widget_data.modelo111.payload);
        toast({
          title: "Modelo 111 cargado",
          description: `Datos del Q${selectedQuarter} ${selectedYear} obtenidos correctamente`
        });
      } else {
        toast({
          title: "Error",
          description: "No se pudo cargar el Modelo 111",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (tenantSlug) {
      fetchModelo111();
    }
  }, [tenantSlug]);

  const handleDownload = () => {
    toast({
      title: "Funcionalidad en desarrollo",
      description: "La descarga del Modelo 111 estará disponible próximamente"
    });
  };

  const handleViewPayslips = () => {
    if (tenantSlug) {
      navigate(`/${tenantSlug}/payroll`);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Título */}
      <div>
        <h1 className="text-3xl font-bold">Modelo 111 - Retenciones IRPF</h1>
        <p className="text-muted-foreground">Declaración trimestral de retenciones de trabajadores</p>
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

            <Select value={selectedQuarter.toString()} onValueChange={(v) => setSelectedQuarter(parseInt(v))}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Trimestre" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Q1 - Ene-Mar</SelectItem>
                <SelectItem value="2">Q2 - Abr-Jun</SelectItem>
                <SelectItem value="3">Q3 - Jul-Sep</SelectItem>
                <SelectItem value="4">Q4 - Oct-Dic</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={fetchModelo111} disabled={isLoading}>
              {isLoading ? 'Cargando...' : 'Buscar'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* KPIs */}
      {!isLoading && modelo111Data && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Total IRPF Retenido */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">IRPF Total Retenido</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(modelo111Data.total_irpf_retenido, 2)}</div>
                <p className="text-xs text-muted-foreground mt-1">Q{selectedQuarter} {selectedYear}</p>
              </CardContent>
            </Card>

            {/* Número de Nóminas */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Nóminas Procesadas</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{modelo111Data.numero_nominas}</div>
                <p className="text-xs text-muted-foreground mt-1">{getPeriodName(selectedQuarter)}</p>
              </CardContent>
            </Card>

            {/* Estado */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Estado</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <Badge 
                  variant={modelo111Data.status === "A INGRESAR" ? "destructive" : "secondary"}
                  className="text-sm font-semibold"
                >
                  {modelo111Data.status}
                </Badge>
                <p className="text-xs text-muted-foreground mt-2">
                  Límite: {getDeadlineDate(selectedQuarter, selectedYear)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Resumen de la Declaración */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Resumen de la Declaración
              </CardTitle>
              <CardDescription>
                Detalle del período fiscal y cantidades a ingresar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Período fiscal</p>
                  <p className="text-lg font-semibold">
                    {getPeriodName(selectedQuarter)} de {selectedYear}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Fecha límite de presentación</p>
                  <p className="text-lg font-semibold">
                    {getDeadlineDate(selectedQuarter, selectedYear)}
                  </p>
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm font-medium text-muted-foreground mb-2">Total a ingresar</p>
                <p className="text-4xl font-bold text-primary">
                  {formatCurrency(modelo111Data.total_irpf_retenido, 2)}
                </p>
              </div>

              <Alert>
                <AlertDescription>
                  Esta declaración incluye <strong>{modelo111Data.numero_nominas} nóminas procesadas</strong> en el trimestre. 
                  El total de retenciones IRPF practicadas es <strong>{formatCurrency(modelo111Data.total_irpf_retenido, 2)}</strong>.
                </AlertDescription>
              </Alert>

              <div className="flex flex-wrap gap-3 pt-4">
                <Button onClick={handleDownload} className="gap-2">
                  <Download className="h-4 w-4" />
                  Descargar Modelo 111
                </Button>
                <Button variant="outline" onClick={handleViewPayslips} className="gap-2">
                  <Eye className="h-4 w-4" />
                  Ver Nóminas del Trimestre
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Empty State */}
      {!isLoading && !modelo111Data && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-muted-foreground">
              No hay datos disponibles para este período
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Selecciona un año y trimestre y haz clic en "Buscar"
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

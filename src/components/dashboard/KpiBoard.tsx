import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  FileText, 
  AlertCircle,
  Calendar,
  CheckCircle,
  XCircle
} from "lucide-react";
import { backendAdapter } from "@/lib/backendAdapter";
import { useToast } from "@/hooks/use-toast";

// 🔷 TIPOS
interface KpiBoardProps {
  tenantSlug: string;
}

interface IVAData {
  period: {
    quarter: number;
    year: number;
    date_from: string;
    date_to: string;
  };
  iva_repercutido: number;
  iva_soportado: number;
  iva_diferencia: number;
  base_imponible_ventas: number;
  base_imponible_compras: number;
  sales_invoices_count: number;
  purchase_invoices_count: number;
  status: string;
  quarterly_summary: {
    total_sales: number;
    total_purchases: number;
    net_result: number;
  };
}

interface IRPFData {
  period: {
    quarter: number;
    year: number;
    date_from: string;
    date_to: string;
  };
  retenciones_practicadas: number;
  retenciones_soportadas: number;
  pagos_a_cuenta: number;
  diferencia: number;
  retenciones_practicadas_count: number;
  retenciones_soportadas_count: number;
  status: string;
  quarterly_summary: {
    total_retenciones_practicadas: number;
    total_retenciones_soportadas: number;
    net_result: number;
  };
}

interface SociedadesData {
  period: {
    year: number;
    date_from: string;
    date_to: string;
  };
  resultado_ejercicio: number;
  ingresos_anuales: number;
  base_imponible: number;
  tipo_impositivo: number;
  cuota_integra: number;
  pagos_previos: number;
  cuota_diferencial: number;
  status: string;
  empresa_tipo: string;
  annual_summary: {
    beneficio_bruto: number;
    impuesto_provision: number;
    beneficio_neto: number;
  };
}

const KpiBoard = ({ tenantSlug }: KpiBoardProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [ivaData, setIvaData] = useState<IVAData | null>(null);
  const [irpfData, setIrpfData] = useState<IRPFData | null>(null);
  const [sociedadesData, setSociedadesData] = useState<SociedadesData | null>(null);

  useEffect(() => {
    loadFiscalData();
  }, [tenantSlug]);

  const loadFiscalData = async () => {
    if (!tenantSlug) return;

    setIsLoading(true);
    try {
      const [iva, irpf, sociedades] = await Promise.all([
        backendAdapter.getIVA(tenantSlug),
        backendAdapter.getIRPF(tenantSlug),
        backendAdapter.getSociedades(tenantSlug),
      ]);

      setIvaData(iva);
      setIrpfData(irpf);
      setSociedadesData(sociedades);
    } catch (error) {
      console.error('Error loading fiscal data:', error);
      toast({
        title: "Error al cargar datos fiscales",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "A INGRESAR":
      case "A PAGAR":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "A COMPENSAR":
      case "A DEVOLVER":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "A INGRESAR":
      case "A PAGAR":
        return "destructive";
      case "A COMPENSAR":
      case "A DEVOLVER":
        return "default";
      default:
        return "secondary";
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            Cargando datos fiscales...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="iva" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="iva">IVA</TabsTrigger>
          <TabsTrigger value="irpf">IRPF</TabsTrigger>
          <TabsTrigger value="sociedades">Sociedades</TabsTrigger>
        </TabsList>

        {/* IVA TAB */}
        <TabsContent value="iva" className="space-y-4">
          {ivaData && (
            <>
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>IVA - Trimestre {ivaData.period.quarter} / {ivaData.period.year}</CardTitle>
                      <CardDescription>
                        {ivaData.period.date_from} - {ivaData.period.date_to}
                      </CardDescription>
                    </div>
                    <Badge variant={getStatusColor(ivaData.status)}>
                      {ivaData.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">IVA Repercutido</p>
                      <p className="text-2xl font-bold text-green-600">
                        {ivaData.iva_repercutido.toLocaleString('es-ES')} €
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {ivaData.sales_invoices_count} facturas
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">IVA Soportado</p>
                      <p className="text-2xl font-bold text-red-600">
                        {ivaData.iva_soportado.toLocaleString('es-ES')} €
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {ivaData.purchase_invoices_count} facturas
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Diferencia</p>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(ivaData.status)}
                        <p className={`text-2xl font-bold ${
                          ivaData.iva_diferencia > 0 ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {ivaData.iva_diferencia.toLocaleString('es-ES')} €
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Base Imponible Ventas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xl font-bold">
                      {ivaData.base_imponible_ventas.toLocaleString('es-ES')} €
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Base Imponible Compras</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xl font-bold">
                      {ivaData.base_imponible_compras.toLocaleString('es-ES')} €
                    </p>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        {/* IRPF TAB */}
        <TabsContent value="irpf" className="space-y-4">
          {irpfData && (
            <>
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>IRPF - Trimestre {irpfData.period.quarter} / {irpfData.period.year}</CardTitle>
                      <CardDescription>
                        {irpfData.period.date_from} - {irpfData.period.date_to}
                      </CardDescription>
                    </div>
                    <Badge variant={getStatusColor(irpfData.status)}>
                      {irpfData.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Retenciones Practicadas</p>
                      <p className="text-2xl font-bold text-green-600">
                        {irpfData.retenciones_practicadas.toLocaleString('es-ES')} €
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {irpfData.retenciones_practicadas_count} retenciones
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Retenciones Soportadas</p>
                      <p className="text-2xl font-bold text-red-600">
                        {irpfData.retenciones_soportadas.toLocaleString('es-ES')} €
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {irpfData.retenciones_soportadas_count} retenciones
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Diferencia</p>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(irpfData.status)}
                        <p className={`text-2xl font-bold ${
                          irpfData.diferencia > 0 ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {irpfData.diferencia.toLocaleString('es-ES')} €
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* SOCIEDADES TAB */}
        <TabsContent value="sociedades" className="space-y-4">
          {sociedadesData && (
            <>
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>Impuesto de Sociedades - {sociedadesData.period.year}</CardTitle>
                      <CardDescription>
                        {sociedadesData.period.date_from} - {sociedadesData.period.date_to}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="outline">{sociedadesData.empresa_tipo}</Badge>
                      <Badge variant={getStatusColor(sociedadesData.status)}>
                        {sociedadesData.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Resultado Ejercicio</p>
                      <p className="text-xl font-bold">
                        {sociedadesData.resultado_ejercicio.toLocaleString('es-ES')} €
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Base Imponible</p>
                      <p className="text-xl font-bold">
                        {sociedadesData.base_imponible.toLocaleString('es-ES')} €
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Tipo Impositivo</p>
                      <p className="text-xl font-bold">
                        {sociedadesData.tipo_impositivo}%
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Cuota Diferencial</p>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(sociedadesData.status)}
                        <p className={`text-xl font-bold ${
                          sociedadesData.cuota_diferencial > 0 ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {sociedadesData.cuota_diferencial.toLocaleString('es-ES')} €
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Beneficio Bruto</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xl font-bold">
                      {sociedadesData.annual_summary.beneficio_bruto.toLocaleString('es-ES')} €
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Provisión Impuesto</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xl font-bold text-red-600">
                      {sociedadesData.annual_summary.impuesto_provision.toLocaleString('es-ES')} €
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Beneficio Neto</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xl font-bold text-green-600">
                      {sociedadesData.annual_summary.beneficio_neto.toLocaleString('es-ES')} €
                    </p>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default KpiBoard;
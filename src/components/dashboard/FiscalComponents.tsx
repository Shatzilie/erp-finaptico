import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, AlertCircle, FileText, Euro } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// ============================================
// TIPOS LOCALES (sin archivo separado)
// ============================================
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
  status: "A INGRESAR" | "A COMPENSAR" | "NEUTRO";
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
  retenciones_practicadas_count?: number;
  retenciones_soportadas_count?: number;
  status: "A INGRESAR" | "A COMPENSAR" | "NEUTRO";
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
  ingresos_anuales?: number;
  base_imponible: number;
  tipo_impositivo: number;
  cuota_integra: number;
  pagos_previos: number;
  cuota_diferencial: number;
  status: "A PAGAR" | "A DEVOLVER" | "NEUTRO";
  empresa_tipo?: string;
  annual_summary: {
    beneficio_bruto: number;
    impuesto_provision: number;
    beneficio_neto: number;
  };
}

// ============================================
// UTILIDADES
// ============================================
const getStatusColor = (status: string) => {
  switch (status) {
    case "A INGRESAR":
    case "A PAGAR":
      return "text-red-600";
    case "A COMPENSAR":
    case "A DEVOLVER":
      return "text-green-600";
    case "NEUTRO":
      return "text-gray-600";
    default:
      return "text-gray-600";
  }
};

const getStatusBadgeVariant = (status: string): "default" | "destructive" | "secondary" => {
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

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

// ============================================
// COMPONENTES EXPORTADOS (para KpiBoard)
// ============================================

export const IvaCard = ({ data }: { data: IVAData }) => {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <FileText className="h-4 w-4 text-blue-600" />
            IVA Q{data.period?.quarter || 'N/A'} {data.period?.year || ''}
          </CardTitle>
          <Badge variant={getStatusBadgeVariant(data.status)}>
            {data.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Diferencia a liquidar</p>
          <p className={`text-3xl font-bold ${getStatusColor(data.status)}`}>
            {formatCurrency(data.iva_diferencia)}
          </p>
        </div>

        <div className="pt-3 border-t space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-green-600" />
              IVA Repercutido
            </span>
            <span className="text-sm font-medium">
              {formatCurrency(data.iva_repercutido)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingDown className="h-3 w-3 text-red-600" />
              IVA Soportado
            </span>
            <span className="text-sm font-medium">
              {formatCurrency(data.iva_soportado)}
            </span>
          </div>
        </div>

        <div className="pt-2 text-xs text-muted-foreground">
          <p>{data.sales_invoices_count} facturas emitidas • {data.purchase_invoices_count} facturas recibidas</p>
        </div>
      </CardContent>
    </Card>
  );
};

export const IrpfCard = ({ data }: { data: IRPFData }) => {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <FileText className="h-4 w-4 text-purple-600" />
            IRPF Q{data.period?.quarter || 'N/A'} {data.period?.year || ''}
          </CardTitle>
          <Badge variant={getStatusBadgeVariant(data.status)}>
            {data.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Diferencia trimestral</p>
          <p className={`text-3xl font-bold ${getStatusColor(data.status)}`}>
            {formatCurrency(data.diferencia)}
          </p>
        </div>

        <div className="pt-3 border-t space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">
              Retenciones practicadas
            </span>
            <span className="text-sm font-medium">
              {formatCurrency(data.retenciones_practicadas)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">
              Retenciones soportadas
            </span>
            <span className="text-sm font-medium">
              {formatCurrency(data.retenciones_soportadas)}
            </span>
          </div>
        </div>

        <div className="pt-2 text-xs text-muted-foreground">
          <p>
            {data.retenciones_practicadas_count || 0} practicadas • {data.retenciones_soportadas_count || 0} soportadas
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export const SociedadesCard = ({ data }: { data: SociedadesData }) => {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <FileText className="h-4 w-4 text-orange-600" />
            Sociedades {data.period?.year || ''}
          </CardTitle>
          <Badge variant={getStatusBadgeVariant(data.status)}>
            {data.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Cuota diferencial</p>
          <p className={`text-3xl font-bold ${getStatusColor(data.status)}`}>
            {formatCurrency(data.cuota_diferencial)}
          </p>
        </div>

        <div className="pt-3 border-t space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">
              Base imponible
            </span>
            <span className="text-sm font-medium">
              {formatCurrency(data.base_imponible)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">
              Cuota íntegra
            </span>
            <span className="text-sm font-medium">
              {formatCurrency(data.cuota_integra)}
            </span>
          </div>
        </div>

        <div className="pt-2 text-xs text-muted-foreground">
          <p>
            Tipo impositivo: {data.tipo_impositivo}% • {data.empresa_tipo || 'N/A'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
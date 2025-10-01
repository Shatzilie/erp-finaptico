import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, AlertCircle, FileText } from "lucide-react";
import { FiscalData } from "@/types/dashboard";

interface FiscalComponentsProps {
  fiscalData: FiscalData;
}

export const FiscalComponents = ({ fiscalData }: FiscalComponentsProps) => {
  // Función helper para determinar el color del estado
  const getStatusColor = (status: string) => {
    switch (status) {
      case "A INGRESAR":
        return "text-red-600";
      case "A COMPENSAR":
        return "text-green-600";
      case "NEUTRO":
        return "text-gray-600";
      default:
        return "text-gray-600";
    }
  };

  // Función helper para formatear números
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Tarjetas de resumen fiscal */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* IVA Card */}
        {fiscalData.iva && (
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                IVA Q{fiscalData.iva.period?.quarter || 'N/A'} {fiscalData.iva.period?.year || ''}
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(fiscalData.iva.iva_diferencia)}
              </div>
              <p className={`text-xs ${getStatusColor(fiscalData.iva.status)}`}>
                {fiscalData.iva.status}
              </p>
              <div className="mt-4 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Repercutido:</span>
                  <span className="font-medium">
                    {formatCurrency(fiscalData.iva.iva_repercutido)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Soportado:</span>
                  <span className="font-medium">
                    {formatCurrency(fiscalData.iva.iva_soportado)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* IRPF Card */}
        {fiscalData.irpf && (
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                IRPF Q{fiscalData.irpf.period?.quarter || 'N/A'} {fiscalData.irpf.period?.year || ''}
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(fiscalData.irpf.diferencia)}
              </div>
              <p className={`text-xs ${getStatusColor(fiscalData.irpf.status)}`}>
                {fiscalData.irpf.status}
              </p>
              <div className="mt-4 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Practicadas:</span>
                  <span className="font-medium">
                    {formatCurrency(fiscalData.irpf.retenciones_practicadas)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Soportadas:</span>
                  <span className="font-medium">
                    {formatCurrency(fiscalData.irpf.retenciones_soportadas)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Sociedades Card */}
        {fiscalData.sociedades && (
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Impuesto Sociedades {fiscalData.sociedades.period?.year || ''}
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(fiscalData.sociedades.cuota_diferencial)}
              </div>
              <p className={`text-xs ${getStatusColor(fiscalData.sociedades.status)}`}>
                {fiscalData.sociedades.status}
              </p>
              <div className="mt-4 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Base Imponible:</span>
                  <span className="font-medium">
                    {formatCurrency(fiscalData.sociedades.base_imponible)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tipo:</span>
                  <span className="font-medium">
                    {fiscalData.sociedades.tipo_impositivo}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Alertas fiscales */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Alertas Fiscales
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {fiscalData.iva && fiscalData.iva.status === "A INGRESAR" && (
                <div className="flex items-start space-x-2">
                  <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-medium">IVA a ingresar</p>
                    <p className="text-muted-foreground">
                      {formatCurrency(fiscalData.iva.iva_diferencia)}
                    </p>
                  </div>
                </div>
              )}
              {fiscalData.irpf && fiscalData.irpf.status === "A INGRESAR" && (
                <div className="flex items-start space-x-2">
                  <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-medium">IRPF a ingresar</p>
                    <p className="text-muted-foreground">
                      {formatCurrency(fiscalData.irpf.diferencia)}
                    </p>
                  </div>
                </div>
              )}
              {fiscalData.sociedades && fiscalData.sociedades.status === "A PAGAR" && (
                <div className="flex items-start space-x-2">
                  <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-medium">Sociedades a pagar</p>
                    <p className="text-muted-foreground">
                      {formatCurrency(fiscalData.sociedades.cuota_diferencial)}
                    </p>
                  </div>
                </div>
              )}
              {(!fiscalData.iva || fiscalData.iva.status !== "A INGRESAR") &&
                (!fiscalData.irpf || fiscalData.irpf.status !== "A INGRESAR") &&
                (!fiscalData.sociedades || fiscalData.sociedades.status !== "A PAGAR") && (
                  <div className="text-xs text-muted-foreground">
                    No hay alertas fiscales pendientes
                  </div>
                )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detalles ampliados IVA */}
      {fiscalData.iva && (
        <Card>
          <CardHeader>
            <CardTitle>Detalle IVA Trimestral</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center">
                  <TrendingUp className="mr-2 h-4 w-4 text-green-500" />
                  Ventas
                </h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Base Imponible:</span>
                    <span className="font-medium">
                      {formatCurrency(fiscalData.iva.base_imponible_ventas)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">IVA Repercutido:</span>
                    <span className="font-medium">
                      {formatCurrency(fiscalData.iva.iva_repercutido)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-1">
                    <span className="font-medium">Total Ventas:</span>
                    <span className="font-bold">
                      {formatCurrency(
                        fiscalData.iva.base_imponible_ventas +
                          fiscalData.iva.iva_repercutido
                      )}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center">
                  <TrendingDown className="mr-2 h-4 w-4 text-red-500" />
                  Compras
                </h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Base Imponible:</span>
                    <span className="font-medium">
                      {formatCurrency(fiscalData.iva.base_imponible_compras)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">IVA Soportado:</span>
                    <span className="font-medium">
                      {formatCurrency(fiscalData.iva.iva_soportado)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-1">
                    <span className="font-medium">Total Compras:</span>
                    <span className="font-bold">
                      {formatCurrency(
                        fiscalData.iva.base_imponible_compras +
                          fiscalData.iva.iva_soportado
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-muted rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Resultado Trimestral IVA
                  </p>
                  <p className={`text-2xl font-bold ${getStatusColor(fiscalData.iva.status)}`}>
                    {formatCurrency(fiscalData.iva.iva_diferencia)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Estado</p>
                  <p className={`text-lg font-semibold ${getStatusColor(fiscalData.iva.status)}`}>
                    {fiscalData.iva.status}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detalles ampliados IRPF */}
      {fiscalData.irpf && (
        <Card>
          <CardHeader>
            <CardTitle>Detalle IRPF Trimestral</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Retenciones Practicadas</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Importe:</span>
                    <span className="font-medium">
                      {formatCurrency(fiscalData.irpf.retenciones_practicadas)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Operaciones:</span>
                    <span className="font-medium">
                      {fiscalData.irpf.retenciones_practicadas_count || 0}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium">Retenciones Soportadas</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Importe:</span>
                    <span className="font-medium">
                      {formatCurrency(fiscalData.irpf.retenciones_soportadas)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Operaciones:</span>
                    <span className="font-medium">
                      {fiscalData.irpf.retenciones_soportadas_count || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-muted rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Resultado Trimestral IRPF
                  </p>
                  <p className={`text-2xl font-bold ${getStatusColor(fiscalData.irpf.status)}`}>
                    {formatCurrency(fiscalData.irpf.diferencia)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Estado</p>
                  <p className={`text-lg font-semibold ${getStatusColor(fiscalData.irpf.status)}`}>
                    {fiscalData.irpf.status}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detalles Impuesto de Sociedades */}
      {fiscalData.sociedades && (
        <Card>
          <CardHeader>
            <CardTitle>Detalle Impuesto de Sociedades</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Resultado del Ejercicio</h4>
                  <p className="text-2xl font-bold">
                    {formatCurrency(fiscalData.sociedades.resultado_ejercicio)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Ingresos: {formatCurrency(fiscalData.sociedades.ingresos_anuales || 0)}
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Base Imponible</h4>
                  <p className="text-2xl font-bold">
                    {formatCurrency(fiscalData.sociedades.base_imponible)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Tipo: {fiscalData.sociedades.tipo_impositivo}%
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Cuota Íntegra</h4>
                  <p className="text-2xl font-bold">
                    {formatCurrency(fiscalData.sociedades.cuota_integra)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Empresa: {fiscalData.sociedades.empresa_tipo || 'N/A'}
                  </p>
                </div>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Cuota Diferencial
                    </p>
                    <p className={`text-2xl font-bold ${getStatusColor(fiscalData.sociedades.status)}`}>
                      {formatCurrency(fiscalData.sociedades.cuota_diferencial)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Estado</p>
                    <p className={`text-lg font-semibold ${getStatusColor(fiscalData.sociedades.status)}`}>
                      {fiscalData.sociedades.status}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
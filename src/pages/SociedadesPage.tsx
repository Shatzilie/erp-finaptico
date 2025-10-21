import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Building, TrendingUp, TrendingDown, Calculator, Percent, Euro, RefreshCw, Loader2 } from "lucide-react";
import { FreshnessBadge } from "@/components/FreshnessBadge";
import { SyncNow } from "@/components/SyncNow";
import { useTenantAccess } from "@/hooks/useTenantAccess";
import { useAuthenticatedFetch } from "@/hooks/useAuthenticatedFetch";
import { handleApiError } from "@/lib/apiErrorHandler";
import { formatCurrency, formatNumber } from "@/lib/formatters";

interface SociedadesData {
  resultado_ejercicio: number;
  base_imponible: number;
  tipo_impositivo: number;
  cuota_integra: number;
  cuota_diferencial: number;
  status: string;
  empresa_tipo: string;
  ingresos_anuales: number;
  period: {
    year: number;
    date_from: string;
    date_to: string;
  };
  annual_summary: {
    beneficio_bruto: number;
    impuesto_provision: number;
    beneficio_neto: number;
  };
  prevision?: {
    es_prevision: boolean;
    progreso_anual: number;
    ingresos_proyectados: number;
    resultado_proyectado: number;
    cuota_integra_proyectada: number;
    dias_transcurridos: number;
  };
}

const generateYearOptions = () => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let year = currentYear; year >= currentYear - 5; year--) {
    years.push({ value: year, label: year.toString() });
  }
  return years;
};

const years = generateYearOptions();

const isPeriodInFuture = (year: number) => {
  const currentYear = new Date().getFullYear();
  return year > currentYear;
};

export default function SociedadesPage() {
  const { tenantSlug, isLoading: tenantLoading, error: tenantError } = useTenantAccess();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [data, setData] = useState<SociedadesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const { fetchWithTimeout } = useAuthenticatedFetch();

  const fetchSociedadesData = async (year?: number) => {
    if (!tenantSlug) throw new Error("No tenant available");
    const result = await fetchWithTimeout(
      "odoo-sociedades",
      {
        tenant_slug: tenantSlug,
        year: year || new Date().getFullYear(),
      },
      { timeout: 30000, retries: 1 },
    );

    if (result.ok && result.widget_data?.sociedades?.payload) {
      console.log("✅ Sociedades data loaded successfully");
      return result.widget_data.sociedades.payload;
    } else {
      throw new Error("Invalid Sociedades response structure");
    }
  };

  const handleYearChange = async (newYear: number) => {
    setLoading(true);
    try {
      const newData = await fetchSociedadesData(newYear);
      setData(newData);
      setLastUpdated(new Date());
    } catch (error: any) {
      handleApiError(error, "Impuesto de Sociedades");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tenantSlug) {
      fetchSociedadesData(selectedYear)
        .then((result) => {
          setData(result);
          setLastUpdated(new Date());
          setLoading(false);
        })
        .catch((error) => {
          handleApiError(error, "Impuesto de Sociedades");
          setLoading(false);
        });
    }
  }, [tenantSlug]);

  const handleRefresh = () => {
    handleYearChange(selectedYear);
  };

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case "A DEVOLVER":
        return "default";
      case "A PAGAR":
        return "destructive";
      case "PÉRDIDAS":
        return "secondary";
      case "NEUTRO":
        return "secondary";
      default:
        return "secondary";
    }
  };

  const getDiferenciaColor = (diferencia: number) => {
    if (diferencia < 0) return "text-green-600";
    if (diferencia > 0) return "text-red-600";
    return "text-gray-600";
  };

  const getStatusMessage = (data: SociedadesData | null) => {
    if (!data) return "";

    if (data.resultado_ejercicio < 0) {
      return "No hay impuesto porque el resultado ha sido negativo";
    } else if (data.cuota_diferencial > 0) {
      return `Pagarás ${formatCurrency(data.cuota_diferencial)} de Impuesto de Sociedades`;
    } else {
      return "Sin impuesto este año";
    }
  };

  if (tenantLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600">Cargando información del tenant...</p>
        </div>
      </div>
    );
  }

  if (tenantError || !tenantSlug) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-red-500 text-center">
          <p className="font-semibold">Error cargando tenant</p>
          <p>{tenantError || "No se pudo obtener el tenant"}</p>
        </div>
      </div>
    );
  }

  const isInFuture = isPeriodInFuture(selectedYear);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Impuesto de Sociedades</h2>
          <p className="text-muted-foreground">
            Estoy calculando tu Impuesto de Sociedades y preparando la declaración anual
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {lastUpdated && (
            <FreshnessBadge seconds={Math.floor((new Date().getTime() - lastUpdated.getTime()) / 1000)} />
          )}
          <SyncNow slug={tenantSlug} onSyncComplete={() => handleRefresh()} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">Selecciona el año a consultar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col space-y-2">
            <label className="text-sm font-medium">Año</label>
            <Select
              value={selectedYear.toString()}
              onValueChange={(value) => {
                const newYear = parseInt(value);
                setSelectedYear(newYear);
                handleYearChange(newYear);
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Seleccionar año" />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year.value} value={year.value.toString()}>
                    {year.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resultado del año</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <span
                  className={
                    data?.resultado_ejercicio < 0 ? "text-red-600 font-semibold" : "text-green-600 font-semibold"
                  }
                >
                  {formatCurrency(data?.resultado_ejercicio || 0)}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {data?.resultado_ejercicio < 0 ? "Pérdidas del ejercicio" : "Beneficios del ejercicio"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Base a tributar</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? <Skeleton className="h-8 w-24" /> : formatCurrency(data?.base_imponible || 0)}
            </div>
            <p className="text-xs text-muted-foreground">Base imponible calculada</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Impuesto a pagar</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getDiferenciaColor(data?.cuota_diferencial || 0)}`}>
              {loading ? <Skeleton className="h-8 w-24" /> : formatCurrency(Math.abs(data?.cuota_diferencial || 0))}
            </div>
            <p className="text-xs text-muted-foreground">
              {(data?.cuota_diferencial || 0) > 0 ? "Vas a pagar" : "Sin impuesto"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mi gestión</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              {loading ? (
                <Skeleton className="h-6 w-20" />
              ) : (
                <Badge variant={getStatusColor(data?.status || "NEUTRO")}>
                  {data?.status === "A PAGAR"
                    ? "PREPARANDO PAGO"
                    : data?.status === "PÉRDIDAS"
                      ? "SIN IMPUESTO"
                      : data?.status === "A DEVOLVER"
                        ? "GESTIONANDO DEVOLUCIÓN"
                        : "SIN IMPUESTO"}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">Ejercicio {data?.period?.year || selectedYear}</p>
          </CardContent>
        </Card>
      </div>

      {!loading && data && data.resultado_ejercicio < 0 && (
        <Alert className="bg-blue-50 border-blue-200">
          <AlertDescription className="text-blue-800">
            Las pérdidas pueden compensarse con beneficios de ejercicios futuros. Esto reduce impuestos en años
            venideros.
          </AlertDescription>
        </Alert>
      )}

      {isInFuture && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-yellow-800">
              <Building className="h-4 w-4" />
              <p className="text-sm">
                <strong>Año futuro:</strong> Los datos del año {selectedYear} no están disponibles hasta que termine el
                ejercicio.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {data?.prevision?.es_prevision && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-800 mb-3">
            Mi previsión para este año ({data.prevision.progreso_anual}% completado)
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">Facturación proyectada</p>
              <p className="text-lg font-bold text-blue-700">{formatNumber(data.prevision.ingresos_proyectados, 0)}€</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Resultado proyectado</p>
              <p className="text-lg font-bold text-blue-700">{formatNumber(data.prevision.resultado_proyectado, 0)}€</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Impuesto estimado</p>
              <p className="text-lg font-bold text-blue-700">
                {formatNumber(data.prevision.cuota_integra_proyectada, 0)}€
              </p>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Proyección basada en {data.prevision.dias_transcurridos} días de actividad
          </p>
        </div>
      )}

      {!loading && data && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Building className="h-5 w-5" />
              <span>Mi análisis para el ejercicio {selectedYear}</span>
            </CardTitle>
            <p className="text-muted-foreground text-sm mt-2">{getStatusMessage(data)}</p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Sección 1: Cálculo del Impuesto */}
            <div>
              <h4 className="font-semibold text-sm mb-3 text-gray-700">Cálculo del Impuesto de Sociedades</h4>
              <div className="space-y-2 bg-gray-50 p-4 rounded-md">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Resultado del ejercicio:</span>
                  <span className="font-medium">{formatCurrency(data.resultado_ejercicio)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Base imponible:</span>
                  <span className="font-medium">{formatCurrency(data.base_imponible)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Tipo impositivo aplicado:</span>
                  <span className="font-medium">{data.tipo_impositivo}%</span>
                </div>
                <div className="flex justify-between border-t pt-2 mt-2">
                  <span className="text-sm font-semibold">Cuota calculada:</span>
                  <span className="font-bold">{formatCurrency(data.cuota_integra)}</span>
                </div>
              </div>
            </div>

            {/* Sección 2: Resumen Anual */}
            <div>
              <h4 className="font-semibold text-sm mb-3 text-gray-700">Resumen del Ejercicio</h4>
              <div className="space-y-2 bg-blue-50 p-4 rounded-md">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Beneficio bruto:</span>
                  <span className="font-medium">{formatCurrency(data.annual_summary.beneficio_bruto)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Provisión impuesto:</span>
                  <span className="font-medium">{formatCurrency(data.annual_summary.impuesto_provision)}</span>
                </div>
                <div className="flex justify-between border-t pt-2 mt-2">
                  <span className="text-sm font-semibold">Beneficio neto:</span>
                  <span className="font-bold">{formatCurrency(data.annual_summary.beneficio_neto)}</span>
                </div>
              </div>
            </div>

            {/* Sección 3: Información General */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-sm">Tipo de empresa:</span>
                  <span className="font-medium text-sm">
                    {data.empresa_tipo === "PYME" ? "PYME (ventajas fiscales)" : data.empresa_tipo}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-sm">Facturación anual:</span>
                  <span className="font-medium text-sm">{formatCurrency(data.ingresos_anuales)}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-sm">Período fiscal:</span>
                  <span className="font-medium text-sm">
                    {data.period?.date_from} - {data.period?.date_to}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-sm">Presentación declaración:</span>
                  <span className="font-medium text-sm">Julio {data.period?.year + 1}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

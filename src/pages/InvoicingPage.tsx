import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Euro, TrendingUp, FileText, Clock, RefreshCw, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useTenantAccess } from "@/hooks/useTenantAccess";
import { useAuthenticatedFetch } from "@/hooks/useAuthenticatedFetch";
import { handleApiError } from "@/lib/apiErrorHandler";
import { formatCurrency } from "@/lib/formatters";

type InvoicingData = {
  total_revenue: number;
  total_invoices: number;
  average_monthly: number;
  history: Array<{
    year: number;
    month: string;
    month_number: number;
    total: number;
    count: number;
  }>;
};

export default function InvoicingPage() {
  const { tenantSlug, isLoading: tenantLoading, error: tenantError } = useTenantAccess();
  const [data, setData] = useState<InvoicingData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cacheStatus, setCacheStatus] = useState<string>("");
  const { fetchWithTimeout } = useAuthenticatedFetch();

  const fetchRevenueData = async () => {
    if (!tenantSlug) return;

    setLoading(true);
    setError(null);

    try {
      const result = await fetchWithTimeout(
        "odoo-revenue",
        {
          tenant_slug: tenantSlug,
          date_from: undefined,
          date_to: undefined,
        },
        { timeout: 30000, retries: 1 },
      );

      if (result.ok && result.widget_data?.revenue_history?.payload) {
        const payload = result.widget_data.revenue_history.payload;
        setData(payload);
        setCacheStatus(result.meta?.cache_status || "");
        console.log("✅ Revenue data loaded successfully");
      } else {
        throw new Error("Invalid revenue response structure");
      }
    } catch (error: any) {
      handleApiError(error, "Facturación");
      setError("No se pudieron cargar los datos de facturación");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tenantSlug) {
      fetchRevenueData();
    }
  }, [tenantSlug]);

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

  const getMonthlyRevenue = () => {
    if (!data?.history || !Array.isArray(data.history) || data.history.length === 0) {
      return 0;
    }
    const lastMonth = data.history[data.history.length - 1];
    return typeof lastMonth?.total === "number" ? lastMonth.total : 0;
  };

  const getQuarterlyRevenue = () => {
    if (!data?.history || !Array.isArray(data.history) || data.history.length === 0) {
      return 0;
    }

    // Obtener el mes actual desde el último elemento
    const currentMonth = data.history[data.history.length - 1];
    const currentMonthNumber = currentMonth?.month_number;
    const currentYear = currentMonth?.year;

    if (!currentMonthNumber || !currentYear) return 0;

    // Calcular el trimestre actual (Q1: 1-3, Q2: 4-6, Q3: 7-9, Q4: 10-12)
    const currentQuarter = Math.ceil(currentMonthNumber / 3);
    const quarterStartMonth = (currentQuarter - 1) * 3 + 1;
    const quarterEndMonth = currentQuarter * 3;

    // Filtrar los meses del trimestre actual
    const quarterMonths = data.history.filter((month) => {
      return (
        month.year === currentYear && month.month_number >= quarterStartMonth && month.month_number <= quarterEndMonth
      );
    });

    // Sumar los totales
    return quarterMonths.reduce((sum, month) => {
      const revenue = typeof month?.total === "number" ? month.total : 0;
      return sum + revenue;
    }, 0);
  };

  const kpiCards = [
    {
      title: "Facturación Mensual",
      value: getMonthlyRevenue(),
      icon: Euro,
      description: "Ingresos del mes actual",
      color: "text-green-600",
    },
    {
      title: "Facturación Trimestral",
      value: getQuarterlyRevenue(),
      icon: TrendingUp,
      description: "Ingresos del trimestre actual",
      color: "text-blue-600",
    },
    {
      title: "Facturación Anual",
      value: data?.total_revenue || 0,
      icon: TrendingUp,
      description: "Ingresos del año",
      color: "text-purple-600",
    },
    {
      title: "Media Mensual",
      value: data?.average_monthly || 0,
      icon: TrendingUp,
      description: "Promedio de ingresos mensuales",
      color: "text-indigo-600",
    },
    {
      title: "Total Facturas",
      value: data?.total_invoices || 0,
      icon: FileText,
      description: "Facturas emitidas este año",
      color: "text-gray-600",
      isCount: true,
    },
  ];

  const getCacheStatusColor = () => {
    switch (cacheStatus) {
      case "fresh":
        return "bg-green-500";
      case "stale":
        return "bg-yellow-500";
      case "miss":
        return "bg-blue-500";
      case "refreshed":
        return "bg-purple-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="container mx-auto px-6 py-8 max-w-7xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Facturación</h1>
          <p className="text-muted-foreground mt-2">Gestión y seguimiento de ingresos y facturas</p>
        </div>

        <div className="flex items-center gap-3">
          {cacheStatus && (
            <Badge variant="outline" className={`${getCacheStatusColor()} text-white`}>
              {cacheStatus}
            </Badge>
          )}
          <Button onClick={fetchRevenueData} disabled={loading} variant="outline" className="gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Actualizando..." : "Actualizar datos"}
          </Button>
        </div>
      </div>

      {error && (
        <Card className="mb-6 border-destructive">
          <CardContent className="p-4">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {kpiCards.map((card, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? (
                  <Skeleton className="h-8 w-20" />
                ) : card.isCount ? (
                  card.value.toString()
                ) : (
                  formatCurrency(card.value)
                )}
              </div>
              <CardDescription className="text-xs text-muted-foreground">{card.description}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>

      {!loading && !data && !error && (
        <Card className="mt-8">
          <CardContent className="p-8 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay datos disponibles</h3>
            <p className="text-muted-foreground mb-4">
              Haz clic en "Actualizar datos" para cargar la información de facturación.
            </p>
            <Button onClick={fetchRevenueData} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Cargar datos
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

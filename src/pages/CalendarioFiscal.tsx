import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DashboardHeader } from "@/components/DashboardHeader";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuthenticatedFetch } from "@/hooks/useAuthenticatedFetch";
import { useTenantAccess } from "@/hooks/useTenantAccess";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Filter, Clock, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";

interface Obligation {
  id: string;
  model: string;
  name: string;
  period: string;
  due_date: string;
  amount: number;
  status: string;
  submission_date: string | null;
}

const CalendarioFiscal = () => {
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [obligations, setObligations] = useState<Obligation[]>([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [filterStatus, setFilterStatus] = useState("all");
  const { fetchWithTimeout } = useAuthenticatedFetch();
  const { tenantSlug, hasAccess, isLoading: tenantLoading } = useTenantAccess();
  const { toast } = useToast();

  const loadFiscalObligations = async () => {
    if (!tenantSlug || !hasAccess) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const allObligations: Obligation[] = [];
      const currentYear = selectedYear;
      const currentDate = new Date();
      const currentQuarter = Math.ceil((currentDate.getMonth() + 1) / 3);

      // IVA - 4 trimestres
      for (let q = 1; q <= 4; q++) {
        try {
          const ivaRes = await fetchWithTimeout(
            "odoo-iva",
            {
              tenant_slug: tenantSlug,
              quarter: q,
              year: currentYear,
            },
            { timeout: 15000 },
          );

          if (ivaRes?.widget_data?.iva?.success) {
            const iva = ivaRes.widget_data.iva.payload;
            allObligations.push({
              id: `iva-${q}-${currentYear}`,
              model: "303",
              name: "IVA",
              period: iva.period?.label || `${q}T ${currentYear}`,
              due_date: iva.due_date,
              amount: iva.amount || 0,
              status: iva.status || "pending",
              submission_date: iva.submission_date || null,
            });
          }
        } catch (err) {
          console.error(`Error loading IVA Q${q}:`, err);
        }
      }

      // IRPF - 4 trimestres (solo si diferencia !== 0)
      for (let q = 1; q <= 4; q++) {
        try {
          const irpfRes = await fetchWithTimeout(
            "odoo-irpf",
            {
              tenant_slug: tenantSlug,
              quarter: q,
              year: currentYear,
            },
            { timeout: 15000 },
          );

          if (irpfRes?.widget_data?.irpf?.success) {
            const irpf = irpfRes.widget_data.irpf.payload;

            // Solo añadir si hay diferencia
            if (irpf.diferencia !== 0) {
              allObligations.push({
                id: `irpf-${q}-${currentYear}`,
                model: "111",
                name: "IRPF",
              period: irpf.period?.label || `${q}T ${currentYear}`,
              due_date: irpf.period?.date_to || `${currentYear}-${q * 3}-20`,
              amount: irpf.diferencia || 0,
              status: irpf.status || "pending",
              submission_date: irpf.submission_date || null,
              });
            }
          }
        } catch (err) {
          console.error(`Error loading IRPF Q${q}:`, err);
        }
      }

      // Sociedades - Anual
      try {
        const socRes = await fetchWithTimeout(
          "odoo-sociedades",
          {
            tenant_slug: tenantSlug,
            year: currentYear,
          },
          { timeout: 15000 },
        );

        if (socRes?.widget_data?.sociedades?.success) {
          const soc = socRes.widget_data.sociedades.payload;
          allObligations.push({
            id: `sociedades-${currentYear}`,
            model: "200",
            name: "Impuesto de Sociedades",
            period: `Ejercicio ${currentYear}`,
            due_date: `${currentYear + 1}-07-25`,
            amount: soc.cuota_diferencial || 0,
            status: "provisional",
            submission_date: null,
          });
        }
      } catch (err) {
        console.error("Error loading Sociedades:", err);
      }

      console.log("✅ Obligaciones cargadas:", allObligations);
      setObligations(allObligations);
    } catch (err) {
      console.error("Error loading fiscal calendar:", err);
      toast({
        title: "Error al cargar calendario",
        description: err instanceof Error ? err.message : "Error desconocido",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiscalObligations();
  }, [tenantSlug, hasAccess, selectedYear]);

  const syncWithOdoo = async () => {
    setSyncing(true);
    try {
      await loadFiscalObligations();
      toast({
        title: "Sincronización completada",
        description: `Calendario fiscal actualizado para ${selectedYear}`,
      });
    } catch (err) {
      toast({
        title: "Error al sincronizar",
        description: err instanceof Error ? err.message : "Error desconocido",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const variants: Record<string, { variant: "secondary" | "default" | "destructive"; icon: any; label: string }> = {
      pending: { variant: "secondary", icon: Clock, label: "Pendiente" },
      presented: { variant: "default", icon: CheckCircle2, label: "Presentado" },
      provisional: { variant: "secondary", icon: Clock, label: "Provisional" },
      overdue: { variant: "destructive", icon: AlertTriangle, label: "Vencido" },
    };

    const config = variants[status] || variants.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const getUrgency = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffDays = Math.floor((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { label: "VENCIDO", variant: "destructive" as const };
    if (diffDays === 0) return { label: "HOY", variant: "destructive" as const };
    if (diffDays === 1) return { label: "MAÑANA", variant: "destructive" as const };
    if (diffDays <= 7) return { label: `${diffDays} días`, variant: "secondary" as const };
    return null;
  };

  if (tenantLoading || loading) {
    return (
      <ProtectedRoute>
        <div className="flex min-h-screen bg-background">
          <DashboardSidebar />
          <div className="flex-1">
            <DashboardHeader />
            <main className="flex items-center justify-center min-h-[400px]">
              <div className="text-center space-y-4">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                <p className="text-muted-foreground">Cargando calendario fiscal...</p>
              </div>
            </main>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!hasAccess || !tenantSlug) {
    return (
      <ProtectedRoute>
        <div className="flex min-h-screen bg-background">
          <DashboardSidebar />
          <div className="flex-1">
            <DashboardHeader />
            <main className="flex items-center justify-center min-h-[400px]">
              <div className="text-center space-y-4">
                <AlertTriangle className="h-12 w-12 mx-auto text-destructive" />
                <p className="text-muted-foreground">No tienes acceso a un tenant válido</p>
              </div>
            </main>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  const filteredObligations =
    filterStatus === "all" ? obligations : obligations.filter((o) => o.status === filterStatus);

  const pendingObligations = obligations.filter((o) => o.status === "pending" || o.status === "provisional");
  const completedObligations = obligations.filter((o) => o.status === "presented");

  const stats = {
    critical: obligations.filter((o) => {
      const urgency = getUrgency(o.due_date);
      return urgency && urgency.variant === "destructive";
    }).length,
    this_week: obligations.filter((o) => {
      const urgency = getUrgency(o.due_date);
      return urgency && urgency.label.includes("días") && parseInt(urgency.label) <= 7;
    }).length,
    pending: pendingObligations.length,
    submitted: completedObligations.length,
  };

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-background">
        <DashboardSidebar />

        <div className="flex-1">
          <DashboardHeader />

          <main className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                  <Calendar className="h-8 w-8 text-primary" />
                  Calendario Fiscal
                </h1>
                <p className="text-muted-foreground mt-1">Gestión de obligaciones y vencimientos fiscales</p>
              </div>
              <Button onClick={syncWithOdoo} disabled={syncing} className="gap-2">
                {syncing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sincronizando...
                  </>
                ) : (
                  <>🔄 Sincronizar {selectedYear}</>
                )}
              </Button>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Críticas</p>
                      <p className="text-3xl font-bold text-red-600">{stats.critical}</p>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-red-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Esta Semana</p>
                      <p className="text-3xl font-bold text-yellow-600">{stats.this_week}</p>
                    </div>
                    <Clock className="h-8 w-8 text-yellow-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Pendientes</p>
                      <p className="text-3xl font-bold text-blue-600">{stats.pending}</p>
                    </div>
                    <Calendar className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Presentados</p>
                      <p className="text-3xl font-bold text-green-600">{stats.submitted}</p>
                    </div>
                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filtros */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex gap-4 flex-wrap items-center">
                  <Filter className="h-4 w-4 text-muted-foreground" />

                  <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2024">2024</SelectItem>
                      <SelectItem value="2025">2025</SelectItem>
                      <SelectItem value="2026">2026</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="pending">Pendientes</SelectItem>
                      <SelectItem value="presented">Presentados</SelectItem>
                      <SelectItem value="provisional">Provisional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Tabs */}
            <Tabs defaultValue="pending">
              <TabsList>
                <TabsTrigger value="pending">Pendientes ({pendingObligations.length})</TabsTrigger>
                <TabsTrigger value="history">Historial ({completedObligations.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="pending" className="space-y-4">
                {pendingObligations.length === 0 ? (
                  <Card>
                    <CardContent className="pt-6 text-center py-12">
                      <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-4" />
                      <p className="text-lg font-semibold text-foreground">¡Todo al día!</p>
                      <p className="text-sm text-muted-foreground">No hay obligaciones pendientes</p>
                    </CardContent>
                  </Card>
                ) : (
                  pendingObligations.map((obligation) => {
                    const urgency = getUrgency(obligation.due_date);
                    return (
                      <Card key={obligation.id}>
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div className="space-y-2 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-semibold text-lg">
                                  Modelo {obligation.model} - {obligation.name}
                                </h3>
                                <StatusBadge status={obligation.status} />
                                {urgency && (
                                  <Badge variant={urgency.variant}>
                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                    {urgency.label}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                Vencimiento:{" "}
                                {new Date(obligation.due_date).toLocaleDateString("es-ES", {
                                  day: "2-digit",
                                  month: "long",
                                  year: "numeric",
                                })}
                              </p>
                              <p className="text-sm text-muted-foreground">Período: {obligation.period}</p>
                              <p className="text-base font-semibold text-foreground">
                                Importe estimado:{" "}
                                {obligation.amount.toLocaleString("es-ES", {
                                  style: "currency",
                                  currency: "EUR",
                                })}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </TabsContent>

              <TabsContent value="history" className="space-y-4">
                {completedObligations.length === 0 ? (
                  <Card>
                    <CardContent className="pt-6 text-center py-12">
                      <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No hay historial de declaraciones</p>
                    </CardContent>
                  </Card>
                ) : (
                  completedObligations.map((obligation) => (
                    <Card key={obligation.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold text-lg">
                                Modelo {obligation.model} - {obligation.name}
                              </h3>
                              <StatusBadge status={obligation.status} />
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Vencimiento:{" "}
                              {new Date(obligation.due_date).toLocaleDateString("es-ES", {
                                day: "2-digit",
                                month: "long",
                                year: "numeric",
                              })}
                            </p>
                            <p className="text-sm text-muted-foreground">Período: {obligation.period}</p>
                            <p className="text-base font-semibold text-foreground">
                              Importe:{" "}
                              {obligation.amount.toLocaleString("es-ES", {
                                style: "currency",
                                currency: "EUR",
                              })}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>
            </Tabs>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default CalendarioFiscal;

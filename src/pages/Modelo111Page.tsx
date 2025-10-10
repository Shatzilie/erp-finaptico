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

interface Declaration {
  id: string;
  model_number: string;
  declaration_type: string;
  period_year: number;
  period_quarter?: number;
  due_date: string;
  status: string;
  estimated_amount?: number;
}

interface Stats {
  critical: number;
  this_week: number;
  pending: number;
  submitted: number;
}

const CalendarioFiscal = () => {
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [declarations, setDeclarations] = useState<Declaration[]>([]);
  const [stats, setStats] = useState<Stats>({ critical: 0, this_week: 0, pending: 0, submitted: 0 });
  const [selectedYear, setSelectedYear] = useState(2025);
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("pending");
  const { fetchWithTimeout } = useAuthenticatedFetch();
  const { tenantSlug, isLoading: tenantIsLoading } = useTenantAccess();
  const { toast } = useToast();

  const loadCalendar = async () => {
    if (!tenantSlug) return;

    try {
      console.log("📅 Cargando calendario fiscal...");
      setLoading(true);

      const response = await fetchWithTimeout("fiscal-calendar", {
        tenant_slug: tenantSlug,
        action: "get_calendar",
        params: {
          year: selectedYear,
          status: filterStatus === "all" ? undefined : filterStatus,
          declaration_type: filterType === "all" ? undefined : filterType,
        },
      });

      console.log("📊 Respuesta calendario:", response);

      if (response?.widget_data?.fiscal_calendar?.success) {
        const payload = response.widget_data.fiscal_calendar.payload;
        setDeclarations(payload.declarations || []);
        setStats(payload.stats || { critical: 0, this_week: 0, pending: 0, submitted: 0 });
        console.log(`✅ Calendario cargado: ${payload.declarations?.length || 0} declaraciones`);
      }
    } catch (err) {
      console.error("❌ Error loading calendar:", err);
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
    let mounted = true;

    if (mounted && tenantSlug) {
      loadCalendar();
    }

    return () => {
      mounted = false;
    };
  }, [tenantSlug, selectedYear, filterStatus, filterType]);

  const syncWithOdoo = async () => {
    if (!tenantSlug) return;

    setSyncing(true);
    try {
      console.log("🔄 Sincronizando con Odoo...");

      const response = await fetchWithTimeout("fiscal-calendar", {
        tenant_slug: tenantSlug,
        action: "sync_from_odoo",
        params: { year: selectedYear },
      });

      console.log("📊 Respuesta sync:", response);

      if (response?.widget_data?.fiscal_calendar?.success) {
        const synced = response.widget_data.fiscal_calendar.payload.summary.total_synced;
        toast({
          title: "✅ Sincronización completada",
          description: `Se sincronizaron ${synced} obligaciones fiscales`,
        });

        // Recargar calendario
        await loadCalendar();
      }
    } catch (err) {
      console.error("❌ Error syncing:", err);
      toast({
        title: "Error al sincronizar",
        description: err instanceof Error ? err.message : "Error desconocido",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleUpdateStatus = async (declarationId: string, newStatus: string) => {
    if (!tenantSlug) return;

    try {
      await fetchWithTimeout("fiscal-calendar", {
        tenant_slug: tenantSlug,
        action: "update_status",
        params: {
          declaration_id: declarationId,
          status: newStatus,
        },
      });

      toast({ title: "✅ Estado actualizado correctamente" });
      await loadCalendar();
    } catch (err) {
      toast({
        title: "Error al actualizar",
        description: err instanceof Error ? err.message : "Error desconocido",
        variant: "destructive",
      });
    }
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const variants: Record<string, { variant: "secondary" | "default" | "destructive"; icon: any; label: string }> = {
      pending: { variant: "secondary", icon: Clock, label: "Pendiente" },
      submitted: { variant: "default", icon: CheckCircle2, label: "Presentado" },
      paid: { variant: "default", icon: CheckCircle2, label: "Pagado" },
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

  if (tenantIsLoading || (loading && !declarations.length)) {
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

  const pendingDeclarations = declarations.filter((d) => d.status === "pending");
  const historyDeclarations = declarations.filter((d) => d.status === "submitted" || d.status === "paid");

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-background">
        <DashboardSidebar />

        <div className="flex-1">
          <DashboardHeader />

          <main className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                  <Calendar className="h-8 w-8 text-primary" />
                  Calendario Fiscal
                </h1>
                <p className="text-muted-foreground mt-1">Gestión de obligaciones y vencimientos fiscales</p>
              </div>
              <Button onClick={syncWithOdoo} disabled={syncing || !tenantSlug} className="gap-2">
                {syncing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sincronizando...
                  </>
                ) : (
                  <>🔄 Sincronizar con Odoo {selectedYear}</>
                )}
              </Button>
            </div>

            {/* KPIs superiores */}
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

                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="iva">IVA</SelectItem>
                      <SelectItem value="irpf">IRPF</SelectItem>
                      <SelectItem value="sociedades">Sociedades</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="pending">Pendientes</SelectItem>
                      <SelectItem value="submitted">Presentados</SelectItem>
                      <SelectItem value="paid">Pagados</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Tabs */}
            <Tabs defaultValue="pending">
              <TabsList>
                <TabsTrigger value="pending">Pendientes ({pendingDeclarations.length})</TabsTrigger>
                <TabsTrigger value="history">Historial ({historyDeclarations.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="pending" className="space-y-4">
                {pendingDeclarations.length === 0 ? (
                  <Card>
                    <CardContent className="pt-6 text-center py-12">
                      <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-4" />
                      <p className="text-lg font-semibold text-foreground">¡Todo al día!</p>
                      <p className="text-sm text-muted-foreground">No hay obligaciones pendientes</p>
                    </CardContent>
                  </Card>
                ) : (
                  pendingDeclarations.map((declaration) => {
                    const urgency = getUrgency(declaration.due_date);
                    return (
                      <Card key={declaration.id}>
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div className="space-y-2 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-semibold text-lg">
                                  {declaration.model_number} - {declaration.declaration_type.toUpperCase()}
                                </h3>
                                <StatusBadge status={declaration.status} />
                                {urgency && (
                                  <Badge variant={urgency.variant}>
                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                    {urgency.label}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                Vencimiento:{" "}
                                {new Date(declaration.due_date).toLocaleDateString("es-ES", {
                                  day: "2-digit",
                                  month: "long",
                                  year: "numeric",
                                })}
                              </p>
                              {declaration.period_quarter && (
                                <p className="text-sm text-muted-foreground">
                                  Período: Trimestre {declaration.period_quarter}, {declaration.period_year}
                                </p>
                              )}
                              {declaration.estimated_amount && (
                                <p className="text-base font-semibold text-foreground">
                                  Importe estimado:{" "}
                                  {declaration.estimated_amount.toLocaleString("es-ES", {
                                    style: "currency",
                                    currency: "EUR",
                                  })}
                                </p>
                              )}
                            </div>
                            <div className="flex gap-2 ml-4">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUpdateStatus(declaration.id, "submitted")}
                              >
                                Marcar Presentado
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </TabsContent>

              <TabsContent value="history" className="space-y-4">
                {historyDeclarations.length === 0 ? (
                  <Card>
                    <CardContent className="pt-6 text-center py-12">
                      <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No hay historial de declaraciones</p>
                    </CardContent>
                  </Card>
                ) : (
                  historyDeclarations.map((declaration) => (
                    <Card key={declaration.id}>
                      <CardContent className="pt-6">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-lg">
                              {declaration.model_number} - {declaration.declaration_type.toUpperCase()}
                            </h3>
                            <StatusBadge status={declaration.status} />
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Vencimiento:{" "}
                            {new Date(declaration.due_date).toLocaleDateString("es-ES", {
                              day: "2-digit",
                              month: "long",
                              year: "numeric",
                            })}
                          </p>
                          {declaration.period_quarter && (
                            <p className="text-sm text-muted-foreground">
                              Período: Trimestre {declaration.period_quarter}, {declaration.period_year}
                            </p>
                          )}
                          {declaration.estimated_amount && (
                            <p className="text-base font-semibold text-foreground">
                              Importe:{" "}
                              {declaration.estimated_amount.toLocaleString("es-ES", {
                                style: "currency",
                                currency: "EUR",
                              })}
                            </p>
                          )}
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

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, AlertTriangle, Clock, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuthenticatedFetch } from "@/hooks/useAuthenticatedFetch";
import { useTenantAccess } from "@/hooks/useTenantAccess";

interface Obligation {
  id: string;
  model: string;
  name: string;
  due_date: string;
  amount: number;
  status: string;
}

export const FiscalCalendarWidget = () => {
  const [loading, setLoading] = useState(true);
  const [upcoming, setUpcoming] = useState<Obligation[]>([]);
  const { fetchWithTimeout } = useAuthenticatedFetch();
  const { tenantSlug } = useTenantAccess();
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    const loadUpcoming = async () => {
      if (!tenantSlug) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const allObligations: Obligation[] = [];
        const currentDate = new Date();
        const currentQuarter = Math.ceil((currentDate.getMonth() + 1) / 3);
        const currentYear = currentDate.getFullYear();

        // Cargar IVA del trimestre actual
        try {
          const ivaRes = await fetchWithTimeout(
            "odoo-iva",
            {
              tenant_slug: tenantSlug,
              quarter: currentQuarter,
              year: currentYear,
            },
            { timeout: 10000 },
          );

          if (ivaRes?.widget_data?.iva?.success) {
            const iva = ivaRes.widget_data.iva.payload;
            allObligations.push({
              id: `iva-${currentQuarter}-${currentYear}`,
              model: "303",
              name: "IVA",
              due_date: iva.due_date,
              amount: iva.amount || 0,
              status: iva.status || "pending",
            });
          }
        } catch (err) {
          console.error("Error loading IVA:", err);
        }

        // Cargar IRPF del trimestre actual (solo si diferencia !== 0)
        try {
          const irpfRes = await fetchWithTimeout(
            "odoo-irpf",
            {
              tenant_slug: tenantSlug,
              quarter: currentQuarter,
              year: currentYear,
            },
            { timeout: 10000 },
          );

          if (irpfRes?.widget_data?.irpf?.success) {
            const irpf = irpfRes.widget_data.irpf.payload;
            if (irpf.diferencia !== 0) {
              allObligations.push({
                id: `irpf-${currentQuarter}-${currentYear}`,
                model: "111",
                name: "IRPF",
                due_date: irpf.period?.date_to || `${currentYear}-${currentQuarter * 3}-20`,
                amount: irpf.diferencia || 0,
                status: "pending",
              });
            }
          }
        } catch (err) {
          console.error("Error loading IRPF:", err);
        }

        // Cargar Sociedades del año actual
        try {
          const socRes = await fetchWithTimeout(
            "odoo-sociedades",
            {
              tenant_slug: tenantSlug,
              year: currentYear,
            },
            { timeout: 10000 },
          );

          if (socRes?.widget_data?.sociedades?.success) {
            const soc = socRes.widget_data.sociedades.payload;
            const dueDate = `${currentYear + 1}-07-25`;

            // Solo mostrar si está próximo (dentro de 60 días)
            const today = new Date();
            const due = new Date(dueDate);
            const diffDays = Math.floor((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

            if (diffDays <= 60 && diffDays >= 0) {
              allObligations.push({
                id: `sociedades-${currentYear}`,
                model: "200",
                name: "Impuesto de Sociedades",
                due_date: dueDate,
                amount: soc.cuota_diferencial || 0,
                status: "provisional",
              });
            }
          }
        } catch (err) {
          console.error("Error loading Sociedades:", err);
        }

        // Ordenar por fecha de vencimiento (más próximo primero)
        allObligations.sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());

        // Tomar solo los 5 más próximos que estén pendientes
        const pendingUpcoming = allObligations
          .filter((o) => o.status === "pending" || o.status === "provisional")
          .slice(0, 5);

        if (mounted) {
          setUpcoming(pendingUpcoming);
        }
      } catch (err) {
        console.error("Error loading upcoming obligations:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadUpcoming();
    return () => {
      mounted = false;
    };
  }, [tenantSlug]);

  const getUrgency = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffDays = Math.floor((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { label: "VENCIDO", variant: "destructive" as const, icon: AlertTriangle };
    if (diffDays === 0) return { label: "HOY", variant: "destructive" as const, icon: AlertTriangle };
    if (diffDays === 1) return { label: "MAÑANA", variant: "destructive" as const, icon: Clock };
    if (diffDays <= 7) return { label: `${diffDays} días`, variant: "secondary" as const, icon: Clock };
    return { label: new Date(dueDate).toLocaleDateString("es-ES"), variant: "outline" as const, icon: Calendar };
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Próximos Vencimientos Fiscales
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Próximos Vencimientos Fiscales
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {upcoming.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay vencimientos próximos</p>
        ) : (
          upcoming.map((item) => {
            const urgency = getUrgency(item.due_date);
            const Icon = urgency.icon;

            return (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={urgency.variant}>
                      <Icon className="h-3 w-3 mr-1" />
                      {urgency.label}
                    </Badge>
                    <span className="text-sm font-medium">
                      Modelo {item.model} - {item.name}
                    </span>
                  </div>
                  {item.amount !== 0 && (
                    <p className="text-sm font-semibold">
                      {item.amount.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}
                    </p>
                  )}
                </div>
              </div>
            );
          })
        )}
        <Button variant="link" className="w-full" onClick={() => navigate(`/${tenantSlug}/calendario-fiscal`)}>
          Ver calendario completo →
        </Button>
      </CardContent>
    </Card>
  );
};

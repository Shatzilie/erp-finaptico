import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, AlertTriangle, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuthenticatedFetch } from "@/hooks/useAuthenticatedFetch";
import { useTenantAccess } from "@/hooks/useTenantAccess";

export const FiscalCalendarWidget = () => {
  const [loading, setLoading] = useState(true);
  const [upcoming, setUpcoming] = useState<any[]>([]);
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
        const response = await fetchWithTimeout(
          'fiscal-calendar',
          {
            tenant_slug: tenantSlug,
            action: 'get_upcoming',
            params: { limit: 5 }
          },
          { timeout: 15000 }
        );

        if (mounted && response?.ok) {
          setUpcoming(response.widget_data?.fiscal_calendar?.payload || []);
        }
      } catch (err) {
        console.error('Error loading upcoming:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadUpcoming();
    return () => { mounted = false; };
  }, [tenantSlug]);

  const getUrgency = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffDays = Math.floor((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return { label: "HOY", variant: "destructive" as const, icon: AlertTriangle };
    if (diffDays === 1) return { label: "MAÑANA", variant: "destructive" as const, icon: Clock };
    if (diffDays <= 7) return { label: `${diffDays} días`, variant: "secondary" as const, icon: Calendar };
    return { label: new Date(dueDate).toLocaleDateString('es-ES'), variant: "outline" as const, icon: Calendar };
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Próximos Vencimientos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Cargando...</p>
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
          <p className="text-sm text-muted-foreground">
            No hay vencimientos próximos
          </p>
        ) : (
          upcoming.map((item) => {
            const urgency = getUrgency(item.due_date);
            const Icon = urgency.icon;

            return (
              <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={urgency.variant}>
                      <Icon className="h-3 w-3 mr-1" />
                      {urgency.label}
                    </Badge>
                    <span className="text-sm font-medium">
                      {item.model_number} - {item.declaration_type.toUpperCase()}
                    </span>
                  </div>
                  {item.estimated_amount && (
                    <p className="text-sm font-semibold">
                      {item.estimated_amount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                    </p>
                  )}
                </div>
              </div>
            );
          })
        )}
        <Button 
          variant="link" 
          className="w-full"
          onClick={() => navigate(`/${tenantSlug}/calendario-fiscal`)}
        >
          Ver calendario completo →
        </Button>
      </CardContent>
    </Card>
  );
};

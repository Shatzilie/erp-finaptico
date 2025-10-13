import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DashboardHeader } from '@/components/DashboardHeader';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuthenticatedFetch } from '@/hooks/useAuthenticatedFetch';
import { useTenantAccess } from '@/hooks/useTenantAccess';
import { useToast } from '@/hooks/use-toast';
import { 
  Calendar, 
  CheckCircle2, 
  AlertTriangle,
  Loader2,
  Clock
} from 'lucide-react';

interface Obligation {
  model: string;
  model_name: string;
  period: {
    quarter?: number;
    year: number;
    label: string;
  };
  amount: number;
  status: 'pending' | 'presented' | 'overdue';
  due_date: string;
  submission_date?: string | null;
  diferencia?: number;
}

interface SummaryCards {
  critical: number;
  thisWeek: number;
  presented: number;
  totalAmount: number;
}

const CalendarioFiscal = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [obligations, setObligations] = useState<Obligation[]>([]);
  const [summaryCards, setSummaryCards] = useState<SummaryCards>({
    critical: 0,
    thisWeek: 0,
    presented: 0,
    totalAmount: 0
  });
  
  const { fetchWithTimeout } = useAuthenticatedFetch();
  const { tenantSlug, hasAccess, isLoading: tenantLoading } = useTenantAccess();
  const { toast } = useToast();

  const calculateSummaryCards = (obligationsList: Obligation[]) => {
    const today = new Date();
    
    const daysToDue = (dueDate: string) => {
      const due = new Date(dueDate);
      const diffTime = due.getTime() - today.getTime();
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };
    
    const critical = obligationsList.filter(o => {
      const days = daysToDue(o.due_date);
      return days <= 7 && days >= 0 && o.status === 'pending';
    }).length;
    
    const thisWeek = obligationsList.filter(o => {
      const days = daysToDue(o.due_date);
      return days <= 7 && days >= 0;
    }).length;
    
    const presented = obligationsList.filter(o => o.status === 'presented').length;
    
    const totalAmount = obligationsList
      .filter(o => o.status === 'pending')
      .reduce((sum, o) => sum + (o.amount || 0), 0);
    
    setSummaryCards({
      critical,
      thisWeek,
      presented,
      totalAmount
    });
  };

  useEffect(() => {
    let mounted = true;
    
    const loadFiscalData = async () => {
      if (!tenantSlug || !hasAccess) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      
      try {
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentQuarter = Math.ceil((currentDate.getMonth() + 1) / 3);
        
        // Llamar a las 3 funciones en paralelo
        const [ivaResult, irpfResult, sociedadesResult] = await Promise.all([
          fetchWithTimeout('odoo-iva', { 
            tenant_slug: tenantSlug, 
            quarter: currentQuarter, 
            year: currentYear 
          }, { timeout: 30000 }),
          fetchWithTimeout('odoo-irpf', { 
            tenant_slug: tenantSlug, 
            quarter: currentQuarter, 
            year: currentYear 
          }, { timeout: 30000 }),
          fetchWithTimeout('odoo-sociedades', { 
            tenant_slug: tenantSlug, 
            year: currentYear 
          }, { timeout: 30000 })
        ]);
        
        if (!mounted) return;
        
        // Construir array de obligaciones desde las 3 respuestas
        const obligationsList: Obligation[] = [];
        
        // IVA
        if (ivaResult?.widget_data?.iva?.success) {
          obligationsList.push(ivaResult.widget_data.iva.payload);
        }
        
        // IRPF - Solo añadir si hay retenciones (diferencia !== 0)
        if (irpfResult?.widget_data?.irpf?.success) {
          const irpfData = irpfResult.widget_data.irpf.payload;
          if (irpfData.diferencia !== 0) {
            obligationsList.push(irpfData);
          }
        }
        
        // Sociedades
        if (sociedadesResult?.widget_data?.sociedades?.success) {
          obligationsList.push(sociedadesResult.widget_data.sociedades.payload);
        }
        
        setObligations(obligationsList);
        calculateSummaryCards(obligationsList);
        
      } catch (err) {
        if (mounted) {
          const errorMessage = err instanceof Error ? err.message : 'Error al cargar datos fiscales';
          setError(errorMessage);
          console.error('Error loading fiscal data:', err);
          toast({
            title: "Error al cargar datos",
            description: errorMessage,
            variant: "destructive"
          });
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };
    
    loadFiscalData();
    
    return () => {
      mounted = false;
    };
  }, [tenantSlug, hasAccess]);

  const handleSync = () => {
    window.location.reload();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'presented':
        return <Badge className="bg-green-600 text-white hover:bg-green-700">✅ Presentado</Badge>;
      case 'pending':
        return <Badge variant="secondary">⏳ Pendiente</Badge>;
      case 'overdue':
        return <Badge variant="destructive">⚠️ Vencido</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getContextualNote = (obligation: Obligation) => {
    if (obligation.status === 'presented' && obligation.submission_date) {
      const date = new Date(obligation.submission_date).toLocaleDateString('es-ES');
      return `Presentado correctamente el ${date}`;
    }
    
    if (obligation.status === 'overdue') {
      return '⚠️ Plazo vencido - Presentar urgentemente';
    }
    
    if (obligation.status === 'pending') {
      const daysLeft = Math.ceil(
        (new Date(obligation.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );
      
      if (daysLeft <= 7 && daysLeft >= 0) {
        return `⚡ Vence en ${daysLeft} días - Estoy preparando la presentación`;
      }
      
      return 'Estoy preparando la presentación';
    }
    
    return null;
  };

  if (tenantLoading || isLoading) {
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

  const sortedObligations = [...obligations].sort(
    (a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
  );

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
                <p className="text-muted-foreground mt-1">
                  Obligaciones fiscales en tiempo real desde Odoo
                </p>
              </div>
              <Button 
                onClick={handleSync} 
                variant="outline"
                disabled={isLoading}
                className="gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sincronizando...
                  </>
                ) : (
                  <>
                    🔄 Sincronizar
                  </>
                )}
              </Button>
            </div>

            {/* Tarjetas resumen */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="p-4">
                <h4 className="text-sm font-medium text-muted-foreground">Críticas</h4>
                <p className="text-2xl font-bold text-red-600">{summaryCards.critical}</p>
                <p className="text-xs text-muted-foreground">Vencen en 7 días</p>
              </Card>
              
              <Card className="p-4">
                <h4 className="text-sm font-medium text-muted-foreground">Próximas</h4>
                <p className="text-2xl font-bold">{summaryCards.thisWeek}</p>
                <p className="text-xs text-muted-foreground">Esta semana</p>
              </Card>
              
              <Card className="p-4">
                <h4 className="text-sm font-medium text-muted-foreground">Cumplidas</h4>
                <p className="text-2xl font-bold text-green-600">{summaryCards.presented}</p>
                <p className="text-xs text-muted-foreground">Presentadas</p>
              </Card>
              
              <Card className="p-4">
                <h4 className="text-sm font-medium text-muted-foreground">Total a pagar</h4>
                <p className="text-2xl font-bold">
                  {summaryCards.totalAmount.toLocaleString('es-ES', {
                    style: 'currency',
                    currency: 'EUR'
                  })}
                </p>
                <p className="text-xs text-muted-foreground">Pendiente</p>
              </Card>
            </div>

            {/* Lista de obligaciones */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Obligaciones Fiscales</h2>
              
              {error && (
                <Card className="border-destructive">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 text-destructive">
                      <AlertTriangle className="h-5 w-5" />
                      <p>{error}</p>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {sortedObligations.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-center py-12">
                    <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-4" />
                    <p className="text-lg font-semibold text-foreground">¡Todo al día!</p>
                    <p className="text-sm text-muted-foreground">No hay obligaciones pendientes</p>
                  </CardContent>
                </Card>
              ) : (
                sortedObligations.map((obligation, index) => {
                  const contextualNote = getContextualNote(obligation);
                  
                  return (
                    <Card key={index} className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="font-semibold">{obligation.model_name}</h3>
                            {getStatusBadge(obligation.status)}
                          </div>
                          
                          <p className="text-sm text-muted-foreground">
                            {obligation.period.label}
                          </p>
                          
                          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                            <Clock className="h-3 w-3" />
                            Vence: {new Date(obligation.due_date).toLocaleDateString('es-ES', {
                              day: '2-digit',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </p>
                          
                          {contextualNote && (
                            <p className="text-sm mt-2 text-blue-600">
                              💡 {contextualNote}
                            </p>
                          )}
                        </div>
                        
                        <div className="text-right">
                          <p className="font-bold text-lg">
                            {obligation.amount.toLocaleString('es-ES', {
                              style: 'currency',
                              currency: 'EUR'
                            })}
                          </p>
                        </div>
                      </div>
                    </Card>
                  );
                })
              )}
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default CalendarioFiscal;

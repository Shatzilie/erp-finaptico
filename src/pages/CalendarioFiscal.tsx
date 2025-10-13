import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DashboardHeader } from '@/components/DashboardHeader';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuthenticatedFetch } from '@/hooks/useAuthenticatedFetch';
import { useTenantAccess } from '@/hooks/useTenantAccess';
import { useToast } from '@/hooks/use-toast';
import { Calendar, AlertTriangle, Loader2 } from 'lucide-react';

interface Obligation {
  id: string;
  model: string;
  name: string;
  period: string;
  due_date: string;
  amount: number;
  status: 'pending' | 'presented' | 'overdue' | 'provisional';
  submission_date?: string | null;
  note?: string | null;
}

interface SummaryCards {
  critical: number;
  upcoming: number;
  presented: number;
  totalToPay: number;
}

const CalendarioFiscal = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [obligations, setObligations] = useState<Obligation[]>([]);
  const [summaryCards, setSummaryCards] = useState<SummaryCards>({
    critical: 0,
    upcoming: 0,
    presented: 0,
    totalToPay: 0
  });
  const [treasuryBalance, setTreasuryBalance] = useState(0);
  
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
    
    const upcoming = obligationsList.filter(o => {
      const days = daysToDue(o.due_date);
      return days > 7 && days <= 30;
    }).length;
    
    const presented = obligationsList.filter(o => o.status === 'presented').length;
    
    const totalToPay = obligationsList
      .filter(o => o.status === 'pending')
      .reduce((sum, o) => sum + (o.amount || 0), 0);
    
    setSummaryCards({
      critical,
      upcoming,
      presented,
      totalToPay
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
        
        // Llamar a las 4 funciones en paralelo
        const [ivaResult, irpfResult, sociedadesResult, treasuryResult] = await Promise.all([
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
          }, { timeout: 30000 }),
          fetchWithTimeout('odoo-treasury', {
            tenant_slug: tenantSlug
          }, { timeout: 30000 })
        ]);
        
        // Debug logs
        console.log('🧾 IVA Response:', ivaResult?.widget_data?.iva?.payload);
        console.log('📊 IRPF Response:', irpfResult?.widget_data?.irpf?.payload);
        console.log('🏢 Sociedades Response:', sociedadesResult?.widget_data?.sociedades?.payload);
        
        if (!mounted) return;
        
        // Construir array de obligaciones
        const allObligations: Obligation[] = [];
        
        // IVA
        if (ivaResult?.widget_data?.iva?.success) {
          const iva = ivaResult.widget_data.iva.payload;
          allObligations.push({
            id: `iva-${iva.period.quarter}-${iva.period.year}`,
            model: iva.model,
            name: iva.model_name,
            period: iva.period.label,
            due_date: iva.due_date,
            amount: iva.amount || 0,
            status: iva.status,
            submission_date: iva.submission_date,
            note: null
          });
        }
        
        // IRPF - Solo añadir si hay retenciones
        if (irpfResult?.widget_data?.irpf?.success) {
          const irpf = irpfResult.widget_data.irpf.payload;
          if (irpf.diferencia !== 0) {
            allObligations.push({
              id: `irpf-${irpf.period.quarter}-${irpf.period.year}`,
              model: irpf.model,
              name: irpf.model_name,
              period: irpf.period.label,
              due_date: irpf.due_date,
              amount: irpf.diferencia || 0,
              status: irpf.status,
              submission_date: irpf.submission_date,
              note: null
            });
          }
        }
        
        // Sociedades
        if (sociedadesResult?.widget_data?.sociedades?.success) {
          const sociedades = sociedadesResult.widget_data.sociedades.payload;
          allObligations.push({
            id: `sociedades-${sociedades.period.year}`,
            model: '200',
            name: 'Impuesto de Sociedades',
            period: `Ejercicio ${sociedades.period.year}`,
            due_date: sociedades.due_date || `${sociedades.period.year + 1}-07-25`,
            amount: sociedades.cuota_diferencial || 0,
            status: 'provisional',
            submission_date: null,
            note: null
          });
        }
        
        // Tesorería
        if (treasuryResult?.widget_data?.treasury_balance?.success) {
          setTreasuryBalance(treasuryResult.widget_data.treasury_balance.payload.total);
        }
        
        setObligations(allObligations);
        calculateSummaryCards(allObligations);
        
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
    const badges = {
      pending: { label: '⏳ Pendiente', className: 'bg-yellow-100 text-yellow-800' },
      presented: { label: '✅ Presentado', className: 'bg-green-100 text-green-800' },
      overdue: { label: '⚠️ Vencido', className: 'bg-red-100 text-red-800' },
      provisional: { label: '📊 Provisional', className: 'bg-violet-100 text-violet-800' }
    };
    
    const badge = badges[status as keyof typeof badges] || badges.pending;
    
    return (
      <span className={`px-2 py-1 rounded-md text-xs font-medium ${badge.className}`}>
        {badge.label}
      </span>
    );
  };

  const getContextualNote = (obligation: Obligation) => {
    if (obligation.note) return obligation.note;
    
    if (obligation.status === 'presented' && obligation.submission_date) {
      const date = new Date(obligation.submission_date).toLocaleDateString('es-ES');
      return `Presentado correctamente el ${date}`;
    }
    
    if (obligation.status === 'overdue') {
      return '⚠️ El plazo ha vencido. Revisar estado de presentación urgentemente.';
    }
    
    if (obligation.status === 'provisional') {
      return 'Previsión anual estimada. Confirmaré con el cierre del ejercicio.';
    }
    
    if (obligation.status === 'pending') {
      const daysLeft = Math.ceil(
        (new Date(obligation.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );
      
      if (daysLeft <= 7 && daysLeft > 0) {
        return `⚡ Vence en ${daysLeft} días. Estoy preparando la presentación.`;
      }
      
      return 'Estoy preparando la presentación.';
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

  const fiscalImpact = treasuryBalance > 0 
    ? (summaryCards.totalToPay / treasuryBalance) * 100 
    : 0;
  
  let impactMessage = '';
  let impactColor = '';
  
  if (fiscalImpact < 10) {
    impactMessage = 'La carga fiscal es asumible sin impacto en liquidez.';
    impactColor = 'text-green-700';
  } else if (fiscalImpact < 30) {
    impactMessage = 'Carga fiscal moderada, cubierta por la tesorería actual.';
    impactColor = 'text-blue-700';
  } else {
    impactMessage = 'Atención: el impacto fiscal es alto. Revisaré la previsión de pagos.';
    impactColor = 'text-orange-700';
  }

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
                <p className="text-sm text-muted-foreground mt-1">
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
              <Card className="p-4 border-destructive/20 bg-red-50/50">
                <h4 className="text-sm font-medium text-muted-foreground">Críticas</h4>
                <p className="text-3xl font-bold text-destructive">{summaryCards.critical}</p>
                <p className="text-xs text-muted-foreground mt-1">Vencen en 7 días</p>
              </Card>
              
              <Card className="p-4 border-orange-500/20 bg-orange-50/50">
                <h4 className="text-sm font-medium text-muted-foreground">Próximas</h4>
                <p className="text-3xl font-bold text-orange-600">{summaryCards.upcoming}</p>
                <p className="text-xs text-muted-foreground mt-1">En 30 días</p>
              </Card>
              
              <Card className="p-4 border-green-500/20 bg-green-50/50">
                <h4 className="text-sm font-medium text-muted-foreground">Cumplidas</h4>
                <p className="text-3xl font-bold text-green-600">{summaryCards.presented}</p>
                <p className="text-xs text-muted-foreground mt-1">Presentadas</p>
              </Card>
              
              <Card className="p-4 border-violet-500/20 bg-violet-50/50">
                <h4 className="text-sm font-medium text-muted-foreground">Total a pagar</h4>
                <p className="text-3xl font-bold text-violet-600">
                  {summaryCards.totalToPay.toLocaleString('es-ES', {
                    style: 'currency',
                    currency: 'EUR',
                    minimumFractionDigits: 2
                  })}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Pendiente</p>
              </Card>
            </div>

            {/* Lista de obligaciones */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Obligaciones Fiscales</h2>
              
              {error && (
                <Card className="border-destructive p-6">
                  <div className="flex items-center gap-2 text-destructive">
                    <AlertTriangle className="h-5 w-5" />
                    <p>{error}</p>
                  </div>
                </Card>
              )}
              
              {sortedObligations.length === 0 ? (
                <Card className="p-12 text-center">
                  <p className="text-lg font-semibold text-foreground">¡Todo al día!</p>
                  <p className="text-sm text-muted-foreground">No hay obligaciones pendientes</p>
                </Card>
              ) : (
                sortedObligations.map((obligation) => {
                  const contextualNote = getContextualNote(obligation);
                  
                  return (
                    <Card key={obligation.id} className="p-6 hover:border-primary/30 transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-foreground">
                              {obligation.name}
                            </h3>
                            {getStatusBadge(obligation.status)}
                          </div>
                          
                          <p className="text-sm text-muted-foreground mb-1">
                            {obligation.period}
                          </p>
                          
                          <p className="text-sm text-muted-foreground mb-3">
                            📅 Vence: {new Date(obligation.due_date).toLocaleDateString('es-ES', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </p>
                          
                          {contextualNote && (
                            <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mt-3">
                              <p className="text-sm text-blue-900">
                                💡 {contextualNote}
                              </p>
                            </div>
                          )}
                        </div>
                        
                        <div className="text-right ml-6">
                          <p className="text-2xl font-bold text-foreground">
                            {obligation.amount.toLocaleString('es-ES', {
                              style: 'currency',
                              currency: 'EUR',
                              minimumFractionDigits: 2
                            })}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {obligation.status === 'pending' ? 'A pagar' : 'Pagado'}
                          </p>
                        </div>
                      </div>
                    </Card>
                  );
                })
              )}
            </div>

            {/* Bloque analítico Finaptico */}
            <Card className="p-6 bg-gradient-to-br from-violet-50 to-blue-50 border-violet-500/20">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                📊 Análisis de Impacto Fiscal
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${impactColor}`}>
                      💰 Impacto en tesorería: {fiscalImpact.toFixed(1)}%
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {impactMessage}
                    </p>
                  </div>
                </div>
                
                <div className="pt-3 border-t border-violet-500/10">
                  <p className="text-sm text-muted-foreground">
                    📈 Si mantienes el ritmo actual de facturación, el próximo trimestre 
                    la liquidación será similar. Te avisaré si hay cambios significativos.
                  </p>
                </div>
              </div>
            </Card>

            {/* Mensaje final Finaptico */}
            <Card className="p-6 border-primary/20 bg-white">
              <h3 className="text-lg font-semibold text-foreground mb-3">
                ✨ Resumen
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                He revisado todas las obligaciones fiscales del trimestre. 
                Presentaré las declaraciones en plazo y ya están incluidas en la previsión de tesorería.
                {summaryCards.totalToPay > 0 && treasuryBalance > 0 && fiscalImpact > 30 && (
                  <> El impacto fiscal es elevado, ya he ajustado la previsión de caja para cubrirlo.</>
                )}
                {' '}Si hay cambios, te avisaré. No necesitas hacer nada, yo me encargo de todo.
              </p>
            </Card>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default CalendarioFiscal;

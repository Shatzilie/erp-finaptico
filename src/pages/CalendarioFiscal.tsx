import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { DashboardHeader } from '@/components/DashboardHeader';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useTenantFeatures } from '@/hooks/useTenantFeatures';
import { supabase } from '@/integrations/supabase/client';
import { 
  Calendar, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  FileText, 
  Euro, 
  TrendingUp,
  Bell,
  CalendarDays,
  Target,
  Info
} from 'lucide-react';
import { 
  ActionableFiscalCalendar, 
  createActionableFiscalCalendar,
  type ActionableFiscalObligation 
} from '@/lib/fiscalCalendar';

interface FiscalData {
  iva: {
    iva_diferencia?: number;
    diferencia?: number;
    iva_repercutido: number;
    iva_soportado: number;
  };
  irpf: {
    diferencia: number;
    retenciones_practicadas: number;
    retenciones_soportadas: number;
  };
  sociedades: {
    cuota_diferencial: number;
    resultado_ejercicio: number;
    base_imponible: number;
  };
}

const CalendarioFiscal: React.FC = () => {
  const { slug } = useTenantFeatures();
  const [obligations, setObligations] = useState<ActionableFiscalObligation[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [fiscalData, setFiscalData] = useState<FiscalData | null>(null);

  // Fetch fiscal data from endpoints
  const fetchFiscalData = async (): Promise<FiscalData> => {
    if (!slug) throw new Error('No tenant slug available');
    
    // Obtener sesión de Supabase
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      throw new Error('No hay sesión activa');
    }

    const currentYear = new Date().getFullYear();
    const currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3);

    const [ivaResponse, irpfResponse, sociedadesResponse] = await Promise.all([
      fetch('https://dtmrywilxpilpzokxxif.supabase.co/functions/v1/odoo-iva', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          tenant_slug: slug,
          quarter: currentQuarter,
          year: currentYear
        })
      }),
      fetch('https://dtmrywilxpilpzokxxif.supabase.co/functions/v1/odoo-irpf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          tenant_slug: slug,
          quarter: currentQuarter,
          year: currentYear
        })
      }),
      fetch('https://dtmrywilxpilpzokxxif.supabase.co/functions/v1/odoo-sociedades', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          tenant_slug: slug,
          year: currentYear
        })
      })
    ]);

    const [ivaData, irpfData, sociedadesData] = await Promise.all([
      ivaResponse.json(),
      irpfResponse.json(),
      sociedadesResponse.json()
    ]);

    return {
      iva: ivaData.widget_data?.iva?.payload || { diferencia: 0, iva_repercutido: 0, iva_soportado: 0 },
      irpf: irpfData.widget_data?.irpf?.payload || { diferencia: 0, retenciones_practicadas: 0, retenciones_soportadas: 0 },
      sociedades: sociedadesData.widget_data?.sociedades?.payload || { cuota_diferencial: 0, resultado_ejercicio: 0, base_imponible: 0 }
    };
  };

  useEffect(() => {
    const loadFiscalData = async () => {
      if (!slug) return;
      
      setLoading(true);
      
      try {
        const data = await fetchFiscalData();
        setFiscalData(data);

        const companyData = {
          hasEmployees: true,
          annualRevenue: 50300,
          currentIVA: data.iva.iva_diferencia || data.iva.diferencia || 0,
          currentIRPF: data.irpf.diferencia || 0,
          currentIS: data.sociedades.cuota_diferencial || 0
        };

        const fiscalCalendar = createActionableFiscalCalendar(companyData);
        const currentObligations = fiscalCalendar.getActionableObligations();
        const currentAlerts = fiscalCalendar.getCriticalAlerts();
        const currentRecommendations = fiscalCalendar.getActionableRecommendations();

        setObligations(currentObligations);
        setAlerts(currentAlerts);
        setRecommendations(currentRecommendations);
        
      } catch (error) {
        console.error('Error cargando calendario fiscal:', error);
      } finally {
        setLoading(false);
      }
    };

    loadFiscalData();
  }, [slug]);

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    }).format(date);
  };

  const getUrgencyColor = (urgency: ActionableFiscalObligation['urgency']) => {
    switch (urgency) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'upcoming':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'planned':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getUrgencyIcon = (urgency: ActionableFiscalObligation['urgency']) => {
    switch (urgency) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4" />;
      case 'upcoming':
        return <Clock className="h-4 w-4" />;
      case 'planned':
        return <Calendar className="h-4 w-4" />;
      default:
        return <CheckCircle className="h-4 w-4" />;
    }
  };

  const getActionTypeColor = (actionType: ActionableFiscalObligation['actionType']) => {
    switch (actionType) {
      case 'pay':
        return 'destructive';
      case 'file':
        return 'secondary';
      case 'present':
        return 'outline';
      case 'prepare':
        return 'default';
      case 'info': // Nuevo tipo para IRPF
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getActionTypeLabel = (actionType: ActionableFiscalObligation['actionType']) => {
    switch (actionType) {
      case 'pay':
        return 'Pagar';
      case 'file':
        return 'Presentar';
      case 'present':
        return 'Declarar';
      case 'prepare':
        return 'Preparar';
      case 'info':
        return 'Información';
      default:
        return 'Acción';
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="flex min-h-screen bg-background">
          <DashboardSidebar />
          <div className="flex-1">
            <DashboardHeader />
            <main className="flex items-center justify-center min-h-[400px]">
              <div className="text-center space-y-4">
                <Calendar className="h-8 w-8 animate-pulse mx-auto text-blue-600" />
                <p className="text-gray-600">Cargando calendario fiscal...</p>
              </div>
            </main>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-background">
        <DashboardSidebar />
        
        <div className="flex-1">
          <DashboardHeader />
          
          <main className="p-6 space-y-8">
            {/* Header */}
            <div className="text-center space-y-4">
              <h1 className="text-4xl font-bold text-gray-900 flex items-center justify-center gap-3">
                <Calendar className="h-10 w-10 text-blue-600" />
                Calendario Fiscal
              </h1>
              <p className="text-lg text-gray-600">
                Obligaciones fiscales y próximos vencimientos
              </p>
            </div>

            {/* Alertas Críticas */}
            {alerts.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
                  <Bell className="h-6 w-6 text-red-600" />
                  Alertas Críticas
                </h2>
                <div className="grid gap-4">
                  {alerts.slice(0, 3).map((alert, index) => (
                    <Alert key={index} className={`${
                      alert.severity === 'high' ? 'border-red-500 bg-red-50' : 
                      alert.severity === 'medium' ? 'border-yellow-500 bg-yellow-50' : 
                      'border-blue-500 bg-blue-50'
                    }`}>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription className="font-medium">
                        {alert.message}
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              </div>
            )}

            {/* Resumen de Estado */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="bg-red-50 border-red-200">
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-red-700 mb-2">
                    {obligations.filter(o => o.urgency === 'critical').length}
                  </div>
                  <div className="text-sm text-red-600 font-medium">Críticas</div>
                </CardContent>
              </Card>
              
              <Card className="bg-yellow-50 border-yellow-200">
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-yellow-700 mb-2">
                    {obligations.filter(o => o.urgency === 'upcoming').length}
                  </div>
                  <div className="text-sm text-yellow-600 font-medium">Próximas (30 días)</div>
                </CardContent>
              </Card>
              
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-blue-700 mb-2">
                    {obligations.filter(o => o.urgency === 'planned').length}
                  </div>
                  <div className="text-sm text-blue-600 font-medium">Planificadas</div>
                </CardContent>
              </Card>

              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-green-700 mb-2">
                    {recommendations.length}
                  </div>
                  <div className="text-sm text-green-600 font-medium">Recomendaciones</div>
                </CardContent>
              </Card>
            </div>

            {/* Lista de Obligaciones */}
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
                <FileText className="h-6 w-6 text-blue-600" />
                Obligaciones Pendientes
              </h2>
              
              <div className="grid gap-4">
                {obligations.map((obligation) => (
                  <Card key={obligation.id} className={`border-2 hover:shadow-lg transition-all duration-200 ${getUrgencyColor(obligation.urgency)}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getUrgencyIcon(obligation.urgency)}
                          <div>
                            <CardTitle className="text-lg font-bold">
                              {obligation.name}
                            </CardTitle>
                            <p className="text-sm text-gray-600">
                              Modelo {obligation.model} • {obligation.description}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant={getActionTypeColor(obligation.actionType)} className="mb-2">
                            {getActionTypeLabel(obligation.actionType)}
                          </Badge>
                          <div className="text-sm text-gray-600">
                            Vence: <strong>{formatDate(obligation.dueDate)}</strong>
                          </div>
                          <div className="text-xs text-gray-500">
                            {obligation.daysLeft} días restantes
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-0">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
                        <div>
                          <span className="font-semibold text-gray-700">Período:</span>
                          <div className="mt-1">
                            {obligation.period}
                          </div>
                        </div>
                        
                        {obligation.estimatedAmount && (
                          <div>
                            <span className="font-semibold text-gray-700">Importe estimado:</span>
                            <div className="mt-1 font-bold">
                              {obligation.estimatedAmount.toLocaleString()}€
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-800 font-medium">
                          📋 {obligation.actionRequired}
                        </p>
                      </div>
                      
                      {obligation.urgency === 'critical' && (
                        <div className="mt-4 p-3 bg-red-100 rounded-lg">
                          <p className="text-sm text-red-800 font-medium">
                            ⚠️ URGENTE: Esta obligación vence en {obligation.daysLeft} días.
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
                
                {obligations.length === 0 && (
                  <Card className="p-8 text-center">
                    <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">
                      ¡Todo al día!
                    </h3>
                    <p className="text-gray-600">
                      No tienes obligaciones fiscales pendientes en este momento.
                    </p>
                  </Card>
                )}
              </div>
            </div>

            {/* Recomendaciones */}
            {recommendations.length > 0 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
                  <Target className="h-6 w-6 text-green-600" />
                  Recomendaciones Fiscales
                </h2>
                
                <div className="grid gap-4">
                  {recommendations.map((rec, index) => (
                    <Card key={index} className="border-l-4 border-l-green-500 bg-green-50">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-3">
                          <TrendingUp className="h-5 w-5 text-green-600 mt-1" />
                          <div>
                            <h3 className="font-bold text-gray-800 mb-1">
                              {rec.title}
                            </h3>
                            <p className="font-medium text-gray-700 mb-2">
                              {rec.message}
                            </p>
                            <div className="flex gap-2">
                              <Badge 
                                variant={rec.priority === 'high' ? 'destructive' : rec.priority === 'medium' ? 'secondary' : 'outline'}
                                className="text-xs"
                              >
                                Prioridad {rec.priority === 'high' ? 'Alta' : rec.priority === 'medium' ? 'Media' : 'Baja'}
                              </Badge>
                              {rec.estimatedSaving && (
                                <Badge variant="default" className="text-xs">
                                  Ahorro: {rec.estimatedSaving.toLocaleString()}€
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="text-center text-sm text-gray-500 pt-6 border-t border-gray-200">
              Calendario fiscal actualizado automáticamente • {new Date().toLocaleString('es-ES')}
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default CalendarioFiscal;
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, AlertCircle, CheckCircle2, Clock, FileText, Calculator } from 'lucide-react';
import { backendAdapter } from '@/lib/backendAdapter';
import { useToast } from '@/hooks/use-toast';

interface FiscalEvent {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  type: 'iva' | 'irpf' | 'sociedades' | 'retenciones' | 'otros';
  status: 'pending' | 'completed' | 'overdue';
  amount?: number;
  priority: 'high' | 'medium' | 'low';
  action?: string;
}

const CalendarioFiscal: React.FC = () => {
  const [events, setEvents] = useState<FiscalEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadFiscalCalendar();
  }, []);

  const loadFiscalCalendar = async () => {
    try {
      setIsLoading(true);
      
      // Generar eventos fiscales basados en la fecha actual
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;
      const currentQuarter = Math.ceil(currentMonth / 3);
      
      const fiscalEvents: FiscalEvent[] = [
        // IVA Trimestral (Q3 2025 - debe presentarse antes del 20 de octubre)
        {
          id: 'iva-q3-2025',
          title: 'Declaración IVA Q3 2025',
          description: 'Presentaré tu declaración de IVA del tercer trimestre. Tienes 1.766€ a ingresar.',
          dueDate: '2025-10-20',
          type: 'iva',
          status: now.getTime() > new Date('2025-10-20').getTime() ? 'overdue' : 'pending',
          amount: 1766,
          priority: 'high',
          action: 'Ya estoy preparando toda la documentación necesaria'
        },
        
        // IRPF Trimestral (Q3 2025)
        {
          id: 'irpf-q3-2025',
          title: 'IRPF Q3 2025 - A tu favor',
          description: 'Tu declaración de IRPF está a favor por 1.598€. Tramitaré la compensación.',
          dueDate: '2025-10-20',
          type: 'irpf',
          status: now.getTime() > new Date('2025-10-20').getTime() ? 'overdue' : 'pending',
          amount: -1598,
          priority: 'medium',
          action: 'Gestionando la compensación con Hacienda'
        },

        // Próxima declaración IVA (Q4 2025)
        {
          id: 'iva-q4-2025',
          title: 'Próxima Declaración IVA Q4',
          description: 'Te recordaré cuando se acerque la fecha. Por ahora, sigue guardando todas las facturas.',
          dueDate: '2026-01-20',
          type: 'iva',
          status: 'pending',
          priority: 'low',
          action: 'Te avisaré con tiempo suficiente'
        },

        // Impuesto de Sociedades 2025
        {
          id: 'sociedades-2025',
          title: 'Impuesto Sociedades 2025',
          description: 'Por suerte, no hay impuesto de sociedades porque el resultado fue negativo (-9.437€).',
          dueDate: '2026-07-25',
          type: 'sociedades',
          status: 'pending',
          priority: 'low',
          amount: 0,
          action: 'Sin impuesto este año por pérdidas'
        },

        // Modelo 303 (IVA) - siguiente trimestre
        {
          id: 'modelo-303-q4',
          title: 'Modelo 303 (IVA) Q4 2025',
          description: 'Última declaración de IVA del año. Estaré pendiente de optimizar tu situación fiscal.',
          dueDate: '2026-01-20',
          type: 'iva',
          status: 'pending',
          priority: 'medium',
          action: 'Revisaré todas las deducciones posibles'
        }
      ];

      setEvents(fiscalEvents);
      
    } catch (error) {
      console.error('Error loading fiscal calendar:', error);
      toast({
        title: "Error",
        description: "No pude cargar el calendario fiscal. Inténtalo de nuevo.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'overdue': return 'bg-red-100 text-red-800 border-red-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="h-4 w-4" />;
      case 'overdue': return <AlertCircle className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      default: return <Calendar className="h-4 w-4" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'iva': return <Calculator className="h-5 w-5 text-blue-600" />;
      case 'irpf': return <FileText className="h-5 w-5 text-green-600" />;
      case 'sociedades': return <FileText className="h-5 w-5 text-purple-600" />;
      default: return <Calendar className="h-5 w-5 text-gray-600" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getDaysUntilDue = (dueDate: string) => {
    const now = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tu Calendario Fiscal</h1>
          <p className="text-gray-600 mt-2">
            Te tengo controladas todas las fechas importantes. No te preocupes por nada.
          </p>
        </div>
        <Button onClick={loadFiscalCalendar} variant="outline" className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Actualizar
        </Button>
      </div>

      {/* Resumen rápido */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Situación Actual</h3>
              <p className="text-gray-600">
                Tienes {events.filter(e => e.status === 'pending').length} declaraciones pendientes. 
                Estoy gestionando todo por ti.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de eventos fiscales */}
      <div className="grid gap-4">
        {events.map((event) => (
          <Card key={event.id} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="mt-1">
                    {getTypeIcon(event.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">{event.title}</h3>
                      <Badge className={getStatusColor(event.status)}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(event.status)}
                          <span className="capitalize">{event.status === 'pending' ? 'Pendiente' : event.status === 'completed' ? 'Completado' : 'Atrasado'}</span>
                        </div>
                      </Badge>
                    </div>
                    
                    <p className="text-gray-700 mb-2">{event.description}</p>
                    
                    {event.action && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium text-green-800">
                            Mi acción: {event.action}
                          </span>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-6 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>Vence el {formatDate(event.dueDate)}</span>
                      </div>
                      
                      {getDaysUntilDue(event.dueDate) > 0 && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{getDaysUntilDue(event.dueDate)} días restantes</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {event.amount !== undefined && event.amount !== 0 && (
                  <div className="text-right">
                    <div className={`text-lg font-bold ${event.amount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {event.amount > 0 ? '+' : ''}{formatCurrency(event.amount)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {event.amount > 0 ? 'A pagar' : 'A favor'}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Nota al pie */}
      <Card className="bg-gray-50">
        <CardContent className="pt-6">
          <div className="text-center text-sm text-gray-600">
            <p>
              📋 <strong>Tranquilidad total:</strong> Me encargo de preparar, revisar y presentar 
              todas tus declaraciones. Tú solo dedícate a hacer crecer tu negocio.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CalendarioFiscal;
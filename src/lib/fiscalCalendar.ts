// src/lib/fiscalCalendar.ts - VERSIÓN ACCIONABLE
// ============================
// CALENDARIO FISCAL ENFOCADO EN ACCIONES PRESENTES Y FUTURAS

export interface ActionableFiscalObligation {
  id: string;
  model: string;
  name: string;
  dueDate: Date;
  period: string; // "Q3 2025", "2025", etc.
  urgency: 'critical' | 'upcoming' | 'planned';
  actionType: 'present' | 'file' | 'pay' | 'prepare' | 'info';
  estimatedAmount?: number;
  daysLeft: number;
  description: string;
  actionRequired: string; // Qué hacer específicamente
}

export interface FiscalSummary {
  critical: number;      // Obligaciones críticas (0-7 días)
  upcoming: number;      // Próximas (8-30 días)
  planned: number;       // Futuras (>30 días)
  totalEstimatedCost: number;
  nextDeadline: Date | null;
}

export interface FiscalRecommendation {
  type: 'cash_flow' | 'tax_optimization' | 'compliance' | 'planning';
  priority: 'high' | 'medium' | 'low';
  title: string;
  message: string;
  actionable: boolean;
  estimatedSaving?: number;
}

// 📅 FECHAS FISCALES RELEVANTES (SOLO FUTURAS Y CRÍTICAS)
const CURRENT_FISCAL_OBLIGATIONS_2025 = {
  // Solo obligaciones relevantes desde hoy hacia adelante
  october_2025: {
    vat_q3: { dueDate: '2025-10-20', model: '303', period: 'Q3 2025' },
    irpf_q3: { dueDate: '2025-10-20', model: '115', period: 'Q3 2025' }
  },
  january_2026: {
    vat_q4: { dueDate: '2026-01-30', model: '303', period: 'Q4 2025' },
    irpf_q4: { dueDate: '2026-01-30', model: '115', period: 'Q4 2025' },
    vat_summary: { dueDate: '2026-01-30', model: '390', period: '2025' },
    irpf_summary: { dueDate: '2026-01-31', model: '190', period: '2025' }
  },
  july_2025: {
    corporate_tax: { dueDate: '2025-07-25', model: '200', period: '2024' }
  }
};

export class ActionableFiscalCalendar {
  private currentDate: Date;
  private companyData: {
    hasEmployees: boolean;
    annualRevenue: number;
    currentIVA: number;
    currentIRPF: number;
    currentIS: number;
  };

  constructor(companyData: {
    hasEmployees: boolean;
    annualRevenue: number;
    currentIVA: number;
    currentIRPF: number;
    currentIS: number;
  }) {
    this.currentDate = new Date();
    this.companyData = companyData;
  }

  // 🎯 OBTENER SOLO OBLIGACIONES ACCIONABLES
  getActionableObligations(): ActionableFiscalObligation[] {
    const today = this.currentDate;
    const obligations: ActionableFiscalObligation[] = [];

    // 🧾 IVA Q3 2025 - CRÍTICO (vence 20 octubre)
    const vatQ3Due = new Date('2025-10-20');
    if (vatQ3Due > today) {
      const daysLeft = Math.ceil((vatQ3Due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      obligations.push({
        id: 'vat-q3-2025',
        model: '303',
        name: 'IVA Q3 2025',
        dueDate: vatQ3Due,
        period: 'Q3 2025',
        urgency: daysLeft <= 7 ? 'critical' : daysLeft <= 30 ? 'upcoming' : 'planned',
        actionType: this.companyData.currentIVA > 0 ? 'pay' : 'present',
        estimatedAmount: Math.abs(this.companyData.currentIVA),
        daysLeft,
        description: 'Declaración trimestral del IVA',
        actionRequired: this.companyData.currentIVA > 0 
          ? `Presentar y pagar ${this.companyData.currentIVA.toLocaleString()}€`
          : `Presentar declaración (sin importe a pagar)`
      });
    }

    // 📊 IRPF Q3 2025 - CRÍTICO (vence 20 octubre)  
    if (this.companyData.hasEmployees) {
      const irpfQ3Due = new Date('2025-10-20');
      if (irpfQ3Due > today) {
        const daysLeft = Math.ceil((irpfQ3Due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        obligations.push({
          id: 'irpf-q3-2025',
          model: '115',
          name: 'IRPF Q3 2025',
          dueDate: irpfQ3Due,
          period: 'Q3 2025',
          urgency: daysLeft <= 7 ? 'critical' : daysLeft <= 30 ? 'upcoming' : 'planned',
          actionType: this.companyData.currentIRPF > 0 ? 'pay' : 'info',
          estimatedAmount: Math.abs(this.companyData.currentIRPF),
          daysLeft,
          description: 'Retenciones e ingresos a cuenta del IRPF',
          actionRequired: this.companyData.currentIRPF > 0 
            ? `Presentar y pagar ${this.companyData.currentIRPF.toLocaleString()}€`
            : `A compensar automáticamente en futuras declaraciones: ${Math.abs(this.companyData.currentIRPF).toLocaleString()}€`
        });
      }
    }

    // 🏢 IMPUESTO SOCIEDADES 2024 - Si aún no vencido
    const isAnnualDue = new Date('2025-07-25');
    if (isAnnualDue > today && this.companyData.annualRevenue > 0) {
      const daysLeft = Math.ceil((isAnnualDue.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      obligations.push({
        id: 'is-2024',
        model: '200',
        name: 'Impuesto Sociedades 2024',
        dueDate: isAnnualDue,
        period: '2024',
        urgency: daysLeft <= 7 ? 'critical' : daysLeft <= 30 ? 'upcoming' : 'planned',
        actionType: this.companyData.currentIS > 0 ? 'pay' : 'present',
        estimatedAmount: this.companyData.currentIS,
        daysLeft,
        description: 'Declaración anual del Impuesto sobre Sociedades',
        actionRequired: this.companyData.currentIS > 0 
          ? `Presentar y pagar ${this.companyData.currentIS.toLocaleString()}€`
          : 'Presentar declaración (sin cuota)'
      });
    }

    // 📅 PRÓXIMAS OBLIGACIONES Q4 2025
    const vatQ4Due = new Date('2026-01-30');
    if (vatQ4Due > today) {
      const daysLeft = Math.ceil((vatQ4Due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (daysLeft <= 60) { // Solo mostrar si está en el horizonte de planificación
        obligations.push({
          id: 'vat-q4-2025',
          model: '303',
          name: 'IVA Q4 2025',
          dueDate: vatQ4Due,
          period: 'Q4 2025',
          urgency: 'planned',
          actionType: 'prepare',
          daysLeft,
          description: 'Declaración trimestral del IVA',
          actionRequired: 'Preparar documentación para el cierre del ejercicio'
        });
      }
    }

    // Ordenar por urgencia y fecha
    return obligations.sort((a, b) => {
      const urgencyOrder = { critical: 3, upcoming: 2, planned: 1 };
      if (urgencyOrder[a.urgency] !== urgencyOrder[b.urgency]) {
        return urgencyOrder[b.urgency] - urgencyOrder[a.urgency];
      }
      return a.dueDate.getTime() - b.dueDate.getTime();
    });
  }

  // 📊 RESUMEN EJECUTIVO
  getSummary(): FiscalSummary {
    const obligations = this.getActionableObligations();
    
    const critical = obligations.filter(o => o.urgency === 'critical').length;
    const upcoming = obligations.filter(o => o.urgency === 'upcoming').length;
    const planned = obligations.filter(o => o.urgency === 'planned').length;
    
    const totalEstimatedCost = obligations.reduce((sum, o) => sum + (o.estimatedAmount || 0), 0);
    const nextDeadline = obligations.length > 0 ? obligations[0].dueDate : null;

    return {
      critical,
      upcoming, 
      planned,
      totalEstimatedCost,
      nextDeadline
    };
  }

  // 🧮 CALCULAR OBLIGACIONES REALES A PAGAR (solo positivos)
  getPayableObligations(): number {
    const ivaAmount = this.companyData.currentIVA > 0 ? this.companyData.currentIVA : 0;
    const irpfAmount = this.companyData.currentIRPF > 0 ? this.companyData.currentIRPF : 0; 
    const isAmount = this.companyData.currentIS > 0 ? this.companyData.currentIS : 0;
    
    return ivaAmount + irpfAmount + isAmount;
  }

  // 💡 RECOMENDACIONES ACCIONABLES
  getActionableRecommendations(): FiscalRecommendation[] {
    const recommendations: FiscalRecommendation[] = [];
    const payableAmount = this.getPayableObligations();

    // Recomendaciones de flujo de caja - Solo pagos reales
    if (payableAmount > 1000) {
      recommendations.push({
        type: 'cash_flow',
        priority: 'high',
        title: 'Planificación de Tesorería',
        message: `Tienes ${payableAmount.toLocaleString()}€ en obligaciones próximas a pagar. Asegura liquidez.`,
        actionable: true
      });
    }

    // IRPF a compensar (cambio de título y prioridad)
    if (this.companyData.currentIRPF < -1000) {
      recommendations.push({
        type: 'tax_optimization',
        priority: 'medium', // Cambiado de 'high' a 'medium' para badge azul
        title: 'IRPF a Compensar',
        message: `Tienes ${Math.abs(this.companyData.currentIRPF).toLocaleString()}€ a tu favor. Se compensará automáticamente en futuras declaraciones.`,
        actionable: true,
        estimatedSaving: Math.abs(this.companyData.currentIRPF)
      });
    }

    // Planificación fin de año
    const daysToYearEnd = Math.ceil((new Date('2025-12-31').getTime() - this.currentDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysToYearEnd <= 90) {
      recommendations.push({
        type: 'planning',
        priority: 'medium',
        title: 'Cierre de Ejercicio',
        message: `Quedan ${daysToYearEnd} días para el cierre. Planifica inversiones deducibles.`,
        actionable: true
      });
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  // 🚨 ALERTAS CRÍTICAS (SOLO LO URGENTE)
  getCriticalAlerts(): Array<{
    type: 'overdue' | 'critical' | 'cash_flow';
    message: string;
    actionRequired: string;
    daysLeft: number;
  }> {
    const obligations = this.getActionableObligations();
    const alerts = [];

    // Solo alertas realmente críticas (7 días o menos)
    obligations.forEach(obligation => {
      if (obligation.urgency === 'critical') {
        alerts.push({
          type: 'critical' as const,
          message: `⚠️ ${obligation.name} vence en ${obligation.daysLeft} días`,
          actionRequired: obligation.actionRequired,
          daysLeft: obligation.daysLeft
        });
      }
    });

    // Alerta de flujo de caja si hay pagos importantes próximos
    const nextPayment = obligations.find(o => o.estimatedAmount && o.estimatedAmount > 2000 && o.daysLeft <= 15);
    if (nextPayment) {
      alerts.push({
        type: 'cash_flow' as const,
        message: `💰 Pago importante próximo: ${nextPayment.estimatedAmount?.toLocaleString()}€`,
        actionRequired: 'Verificar disponibilidad de tesorería',
        daysLeft: nextPayment.daysLeft
      });
    }

    return alerts.sort((a, b) => a.daysLeft - b.daysLeft);
  }
}

// 🏭 FACTORY PARA CREAR CALENDARIO CON DATOS REALES
export function createActionableFiscalCalendar(dashboardData: {
  hasEmployees: boolean;
  annualRevenue: number;
  currentIVA: number;    // Del endpoint IVA
  currentIRPF: number;   // Del endpoint IRPF  
  currentIS: number;     // Del endpoint Sociedades
}): ActionableFiscalCalendar {
  return new ActionableFiscalCalendar(dashboardData);
}
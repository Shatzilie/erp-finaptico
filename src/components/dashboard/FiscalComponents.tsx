// src/components/dashboard/FiscalComponents.tsx
// ===============================================
// COMPONENTES FISCALES PARA EL DASHBOARD

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, TrendingDown, Calculator, Receipt, Building,
  AlertTriangle, Info, CheckCircle, Calendar, Euro,
  FileText, Target, Percent
} from 'lucide-react';

import { FiscalData, SmartAlert } from '@/lib/backendAdapter';

// 💶 FORMATEO DE MONEDA
const formatEuro = (amount: number) => {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatPercentage = (value: number) => {
  return `${value.toFixed(1)}%`;
};

// 🚨 COMPONENTE: ALERTAS INTELIGENTES
interface SmartAlertsProps {
  alerts: SmartAlert[];
}

export function SmartAlerts({ alerts }: SmartAlertsProps) {
  if (!alerts || alerts.length === 0) return null;

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'fiscal': return Calculator;
      case 'operational': return Receipt;
      case 'deadline': return Calendar;
      default: return Info;
    }
  };

  const getAlertVariant = (severity: string) => {
    switch (severity) {
      case 'error': return 'destructive';
      case 'warning': return 'default';
      case 'success': return 'default';
      default: return 'default';
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <AlertTriangle className="h-5 w-5" />
        Alertas y Recomendaciones
      </h3>
      
      <div className="grid gap-2">
        {alerts.slice(0, 4).map((alert, index) => {
          const Icon = getAlertIcon(alert.type);
          return (
            <Alert key={index} variant={getAlertVariant(alert.severity)}>
              <Icon className="h-4 w-4" />
              <AlertDescription>
                <div className="flex justify-between items-start">
                  <div>
                    <strong>{alert.title}:</strong> {alert.message}
                  </div>
                  {alert.actionable && (
                    <Badge variant="outline" className="ml-2 text-xs">
                      {alert.action}
                    </Badge>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          );
        })}
      </div>
    </div>
  );
}

// 📊 COMPONENTE: TARJETA IVA
interface IvaCardProps {
  data: FiscalData['iva'];
}

export function IvaCard({ data }: IvaCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'A INGRESAR': return 'text-red-600 bg-red-50';
      case 'A COMPENSAR': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'A INGRESAR': return TrendingUp;
      case 'A COMPENSAR': return TrendingDown;
      default: return CheckCircle;
    }
  };

  const StatusIcon = getStatusIcon(data.status);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Receipt className="h-5 w-5" />
          IVA Q{data.quarter} {data.year}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Repercutido:</span>
            <div className="font-semibold text-blue-600">
              {formatEuro(data.iva_repercutido)}
            </div>
          </div>
          <div>
            <span className="text-muted-foreground">Soportado:</span>
            <div className="font-semibold text-orange-600">
              {formatEuro(data.iva_soportado)}
            </div>
          </div>
        </div>
        
        <div className="border-t pt-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Resultado:</span>
            <Badge className={getStatusColor(data.status)}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {data.status}
            </Badge>
          </div>
          <div className={`text-xl font-bold ${data.iva_diferencia >= 0 ? 'text-red-600' : 'text-green-600'}`}>
            {formatEuro(Math.abs(data.iva_diferencia))}
          </div>
        </div>

        <div className="text-xs text-muted-foreground space-y-1">
          <div>Base ventas: {formatEuro(data.base_imponible_ventas)}</div>
          <div>Base compras: {formatEuro(data.base_imponible_compras)}</div>
        </div>
      </CardContent>
    </Card>
  );
}

// 🏢 COMPONENTE: TARJETA IRPF
interface IrpfCardProps {
  data: FiscalData['irpf'];
}

export function IrpfCard({ data }: IrpfCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'A INGRESAR': return 'text-red-600 bg-red-50';
      case 'A COMPENSAR': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const StatusIcon = data.diferencia >= 0 ? TrendingUp : TrendingDown;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <FileText className="h-5 w-5" />
          IRPF Q{data.quarter} {data.year}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Practicadas:</span>
            <div className="font-semibold text-blue-600">
              {formatEuro(data.retenciones_practicadas)}
            </div>
          </div>
          <div>
            <span className="text-muted-foreground">Soportadas:</span>
            <div className="font-semibold text-green-600">
              {formatEuro(data.retenciones_soportadas)}
            </div>
          </div>
        </div>
        
        <div className="border-t pt-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Diferencia:</span>
            <Badge className={getStatusColor(data.status)}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {data.status}
            </Badge>
          </div>
          <div className={`text-xl font-bold ${data.diferencia >= 0 ? 'text-red-600' : 'text-green-600'}`}>
            {formatEuro(Math.abs(data.diferencia))}
          </div>
        </div>

        {data.diferencia < 0 && (
          <div className="text-xs text-green-700 bg-green-50 p-2 rounded">
            💡 Saldo favorable: puedes compensar en próximos trimestres
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// 🏛️ COMPONENTE: TARJETA SOCIEDADES
interface SociedadesCardProps {
  data: FiscalData['sociedades'];
}

export function SociedadesCard({ data }: SociedadesCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'A PAGAR': return 'text-red-600 bg-red-50';
      case 'A DEVOLVER': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getEmpresaTypeColor = (tipo: string) => {
    return tipo === 'PYME' ? 'text-blue-600 bg-blue-50' : 'text-purple-600 bg-purple-50';
  };

  const StatusIcon = data.cuota_diferencial > 0 ? TrendingUp : data.cuota_diferencial < 0 ? TrendingDown : CheckCircle;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Building className="h-5 w-5" />
          Sociedades {data.year}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Tipo empresa:</span>
          <Badge className={getEmpresaTypeColor(data.empresa_tipo)}>
            {data.empresa_tipo} ({formatPercentage(data.tipo_impositivo)})
          </Badge>
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Resultado ejercicio:</span>
            <span className={`font-semibold ${data.resultado_ejercicio >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatEuro(data.resultado_ejercicio)}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-muted-foreground">Base imponible:</span>
            <span className="font-semibold">
              {formatEuro(data.base_imponible)}
            </span>
          </div>
        </div>
        
        <div className="border-t pt-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Cuota estimada:</span>
            <Badge className={getStatusColor(data.status)}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {data.status}
            </Badge>
          </div>
          <div className={`text-xl font-bold ${data.cuota_diferencial > 0 ? 'text-red-600' : data.cuota_diferencial < 0 ? 'text-green-600' : 'text-gray-600'}`}>
            {data.cuota_diferencial === 0 ? '0€' : formatEuro(Math.abs(data.cuota_diferencial))}
          </div>
        </div>

        {data.resultado_ejercicio < 0 && (
          <div className="text-xs text-blue-700 bg-blue-50 p-2 rounded">
            ℹ️ Pérdidas contables: no tributas en Sociedades este ejercicio
          </div>
        )}

        {data.empresa_tipo === 'PYME' && data.resultado_ejercicio > 200000 && (
          <div className="text-xs text-orange-700 bg-orange-50 p-2 rounded">
            ⚠️ Cerca del límite PYME (300k€). Planifica gastos antes de fin de año.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// 📅 COMPONENTE: PRÓXIMAS OBLIGACIONES
interface ObligationsCardProps {
  currentMonth: number;
  currentYear: number;
}

export function ObligationsCard({ currentMonth, currentYear }: ObligationsCardProps) {
  // Lógica simple para determinar próximas obligaciones
  const getNextObligations = () => {
    const obligations = [];
    
    // IVA trimestral - cada 3 meses
    if (currentMonth % 3 === 1) { // Enero, Abril, Julio, Octubre
      obligations.push({
        model: '303',
        description: 'IVA Trimestral',
        dueDate: `20 de ${getMonthName(currentMonth)}`,
        status: 'pending' as const,
        type: 'iva'
      });
    }
    
    // IRPF trimestral - cada 3 meses  
    if (currentMonth % 3 === 1) {
      obligations.push({
        model: '115',
        description: 'IRPF Trimestral',
        dueDate: `20 de ${getMonthName(currentMonth)}`,
        status: 'pending' as const,
        type: 'irpf'
      });
    }
    
    // Sociedades anual - Julio
    if (currentMonth >= 4 && currentMonth <= 7) {
      obligations.push({
        model: '200',
        description: 'Impuesto Sociedades',
        dueDate: '25 de Julio',
        status: 'pending' as const,
        type: 'sociedades'
      });
    }

    return obligations;
  };

  const getMonthName = (month: number) => {
    const months = ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                   'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return months[month];
  };

  const obligations = getNextObligations();

  if (obligations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Obligaciones Fiscales
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              No hay obligaciones fiscales inmediatas
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Próximas Obligaciones
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {obligations.map((obligation, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
              <div>
                <div className="font-medium text-sm">{obligation.description}</div>
                <div className="text-xs text-muted-foreground">Modelo {obligation.model}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-orange-600">{obligation.dueDate}</div>
                <Badge variant="outline" className="text-xs">
                  Pendiente
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// 📈 COMPONENTE: MEDIDOR DE EFICIENCIA FISCAL
interface TaxEfficiencyProps {
  marginPercentage: number;
  ivaImpact: number;
  irpfImpact: number;
}

export function TaxEfficiencyMeter({ marginPercentage, ivaImpact, irpfImpact }: TaxEfficiencyProps) {
  const getEfficiencyLevel = (percentage: number) => {
    if (percentage >= 40) return { level: 'Excelente', color: 'text-green-600', bg: 'bg-green-500' };
    if (percentage >= 25) return { level: 'Buena', color: 'text-blue-600', bg: 'bg-blue-500' };
    if (percentage >= 10) return { level: 'Regular', color: 'text-yellow-600', bg: 'bg-yellow-500' };
    return { level: 'Mejorable', color: 'text-red-600', bg: 'bg-red-500' };
  };

  const efficiency = getEfficiencyLevel(marginPercentage);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Target className="h-5 w-5" />
          Eficiencia Fiscal
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <div className={`text-3xl font-bold ${efficiency.color}`}>
            {marginPercentage.toFixed(1)}%
          </div>
          <div className="text-sm text-muted-foreground">Margen neto</div>
          <Badge className={efficiency.color}>
            {efficiency.level}
          </Badge>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progreso</span>
            <span>{marginPercentage.toFixed(0)}%</span>
          </div>
          <Progress value={Math.min(marginPercentage, 100)} className="h-2" />
        </div>

        <div className="text-xs space-y-1 text-muted-foreground">
          <div>• IVA impacto: {ivaImpact > 0 ? '-' : '+'}{Math.abs(ivaImpact).toFixed(0)}€</div>
          <div>• IRPF impacto: {irpfImpact > 0 ? '-' : '+'}{Math.abs(irpfImpact).toFixed(0)}€</div>
        </div>
      </CardContent>
    </Card>
  );
}
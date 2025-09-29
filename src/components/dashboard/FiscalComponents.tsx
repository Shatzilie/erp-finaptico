import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { FiscalData } from '@/lib/backendAdapter';

interface FiscalCardProps {
  data: FiscalData;
  title: string;
  type: 'iva' | 'irpf' | 'sociedades';
}

export function FiscalCard({ data, title, type }: FiscalCardProps) {
  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Cargando datos...</p>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'A INGRESAR':
      case 'A PAGAR':
        return 'text-red-600';
      case 'A COMPENSAR':
      case 'A DEVOLVER':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    if (status === 'A INGRESAR' || status === 'A PAGAR') {
      return <TrendingUp className="h-4 w-4 text-red-600" />;
    } else if (status === 'A COMPENSAR' || status === 'A DEVOLVER') {
      return <TrendingDown className="h-4 w-4 text-green-600" />;
    }
    return <AlertCircle className="h-4 w-4 text-gray-600" />;
  };

  const renderIVAContent = () => (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-muted-foreground">IVA Repercutido</p>
          <p className="text-lg font-semibold">{data.iva_repercutido?.toLocaleString('es-ES')}€</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">IVA Soportado</p>
          <p className="text-lg font-semibold">{data.iva_soportado?.toLocaleString('es-ES')}€</p>
        </div>
      </div>
      <div className="pt-3 border-t">
        <p className="text-xs text-muted-foreground">Diferencia</p>
        <p className={`text-xl font-bold ${getStatusColor(data.status)}`}>
          {data.iva_diferencia?.toLocaleString('es-ES')}€
        </p>
      </div>
    </div>
  );

  const renderIRPFContent = () => (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-muted-foreground">Retenciones Practicadas</p>
          <p className="text-lg font-semibold">
            {data.retenciones_practicadas?.toLocaleString('es-ES')}€
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Retenciones Soportadas</p>
          <p className="text-lg font-semibold">
            {data.retenciones_soportadas?.toLocaleString('es-ES')}€
          </p>
        </div>
      </div>
      <div className="pt-3 border-t">
        <p className="text-xs text-muted-foreground">Diferencia</p>
        <p className={`text-xl font-bold ${getStatusColor(data.status)}`}>
          {data.diferencia?.toLocaleString('es-ES')}€
        </p>
      </div>
    </div>
  );

  const renderSociedadesContent = () => (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-muted-foreground">Resultado Ejercicio</p>
          <p className="text-lg font-semibold">
            {data.resultado_ejercicio?.toLocaleString('es-ES')}€
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Base Imponible</p>
          <p className="text-lg font-semibold">
            {data.base_imponible?.toLocaleString('es-ES')}€
          </p>
        </div>
      </div>
      <div className="pt-3 border-t">
        <p className="text-xs text-muted-foreground">Cuota Diferencial</p>
        <p className={`text-xl font-bold ${getStatusColor(data.status)}`}>
          {data.cuota_diferencial?.toLocaleString('es-ES')}€
        </p>
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {title}
          </span>
          <span className="flex items-center gap-1 text-sm">
            {getStatusIcon(data.status)}
            <span className={getStatusColor(data.status)}>{data.status}</span>
          </span>
        </CardTitle>
        {data.period && (
          <p className="text-xs text-muted-foreground">
            {data.period.quarter ? `T${data.period.quarter} ` : ''}
            {data.period.year}
          </p>
        )}
      </CardHeader>
      <CardContent>
        {type === 'iva' && renderIVAContent()}
        {type === 'irpf' && renderIRPFContent()}
        {type === 'sociedades' && renderSociedadesContent()}
      </CardContent>
    </Card>
  );
}
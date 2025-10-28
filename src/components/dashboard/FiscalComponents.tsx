import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Receipt, CheckCircle, XCircle, Info } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const getFiscalStatusLabel = (type: string, value: number | null | undefined) => {
  if (value === null || value === undefined || isNaN(value)) {
    return { label: "Sin datos disponibles", color: "#F3F4F6", textColor: "#4B5563" };
  }

  if (type === "iva") {
    if (value > 0) return { label: "IVA calculado: se presentará con el modelo 303", color: "#EDE9FE", textColor: "#4B5563" };
    if (value === 0) return { label: "Sin IVA a ingresar", color: "#D1FAE5", textColor: "#065F46" };
    if (value < 0) return { label: "IVA a compensar", color: "#DBEAFE", textColor: "#1E3A8A" };
  }

  if (type === "irpf") {
    if (value > 0) return { label: "IRPF pendiente de presentar", color: "#FEF3C7", textColor: "#92400E" };
    return { label: "IRPF presentado y compensado", color: "#D1FAE5", textColor: "#065F46" };
  }

  if (type === "is") {
    if (value > 0) return { label: "IS previsto para cierre anual", color: "#E0E7FF", textColor: "#3730A3" };
    return { label: "Pendiente de cierre anual", color: "#F3F4F6", textColor: "#4B5563" };
  }

  return { label: "Sin información fiscal", color: "#F3F4F6", textColor: "#4B5563" };
};

interface IVAData {
  amount: number;
  iva_repercutido: number;
  iva_soportado: number;
  iva_diferencia: number;
  status: string;
  period: {
    quarter: number;
    year: number;
  };
}

interface IRPFData {
  retenciones_practicadas: number;
  retenciones_soportadas: number;
  diferencia: number;
  status: string;
  period: {
    quarter: number;
    year: number;
  };
}

interface IvaCardProps {
  data: IVAData;
}

interface IrpfCardProps {
  data: IRPFData;
}

export const IvaCard = ({ data }: IvaCardProps) => {
  // Determinar el estado del semáforo
  const getStatusBadge = () => {
    if (data.status === 'A COMPENSAR') {
      return { variant: 'success' as const, icon: CheckCircle, label: 'Al día' };
    } else if (data.status === 'A INGRESAR') {
      return { variant: 'danger' as const, icon: XCircle, label: 'Pendiente' };
    } else {
      return { variant: 'success' as const, icon: CheckCircle, label: 'Neutro' };
    }
  };

  const statusBadge = getStatusBadge();
  const StatusIcon = statusBadge.icon;

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow relative">
      <Badge variant={statusBadge.variant} className="absolute top-4 right-4">
        <StatusIcon className="w-3 h-3 mr-1" />
        {statusBadge.label}
      </Badge>
      
      <div className="flex items-start justify-between mb-4 pr-24">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <p className="text-sm text-gray-600">
              IVA Q{data.period.quarter} {data.period.year}
            </p>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-4 h-4 text-[#6C5CE7] cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-[300px]">
                  <p>Este importe corresponde al IVA acumulado del trimestre. Lo uso para calcular la previsión del modelo 303.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <p className={`text-2xl font-bold ${(data.amount || data.iva_diferencia) < 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(data.amount || data.iva_diferencia, 0)}
          </p>
          <div
            className="mt-1 inline-flex items-center rounded-md px-2 py-1 text-xs font-medium"
            style={{ 
              backgroundColor: getFiscalStatusLabel("iva", data.amount || data.iva_diferencia).color, 
              color: getFiscalStatusLabel("iva", data.amount || data.iva_diferencia).textColor 
            }}
          >
            {getFiscalStatusLabel("iva", data.amount || data.iva_diferencia).label}
          </div>
        </div>
        <div className={`p-3 rounded-full ${(data.amount || data.iva_diferencia) < 0 ? 'bg-green-50' : 'bg-red-50'}`}>
          <Receipt className={`w-6 h-6 ${(data.amount || data.iva_diferencia) < 0 ? 'text-green-600' : 'text-red-600'}`} />
        </div>
      </div>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">IVA Repercutido:</span>
          <span className="font-medium">{formatCurrency(data.iva_repercutido, 0)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">IVA Soportado:</span>
          <span className="font-medium">{formatCurrency(data.iva_soportado, 0)}</span>
        </div>
        <div className="pt-2 border-t">
          <span className={`inline-block px-2 py-1 text-xs rounded-full ${
            data.status === 'A INGRESAR' ? 'bg-red-100 text-red-700' :
            data.status === 'A COMPENSAR' ? 'bg-green-100 text-green-700' :
            'bg-gray-100 text-gray-700'
          }`}>
            {data.status}
          </span>
        </div>
      </div>
    </Card>
  );
};

export const IrpfCard = ({ data }: IrpfCardProps) => {
  // Determinar el estado del semáforo
  const getStatusBadge = () => {
    if (data.status === 'A COMPENSAR') {
      return { variant: 'success' as const, icon: CheckCircle, label: 'Al día' };
    } else if (data.status === 'A INGRESAR') {
      return { variant: 'danger' as const, icon: XCircle, label: 'Pendiente' };
    } else {
      return { variant: 'success' as const, icon: CheckCircle, label: 'Neutro' };
    }
  };

  const statusBadge = getStatusBadge();
  const StatusIcon = statusBadge.icon;

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow relative">
      <Badge variant={statusBadge.variant} className="absolute top-4 right-4">
        <StatusIcon className="w-3 h-3 mr-1" />
        {statusBadge.label}
      </Badge>
      
      <div className="flex items-start justify-between mb-4 pr-24">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <p className="text-sm text-gray-600">
              IRPF Q{data.period.quarter} {data.period.year}
            </p>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-4 h-4 text-[#6C5CE7] cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-[300px]">
                  <p>Refleja la estimación del IRPF trimestral (modelo 130 o retenciones aplicadas). Solo es informativo, no tienes que hacer nada.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <p className={`text-2xl font-bold ${data.diferencia < 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(data.diferencia, 0)}
          </p>
          <div
            className="mt-1 inline-flex items-center rounded-md px-2 py-1 text-xs font-medium"
            style={{ 
              backgroundColor: getFiscalStatusLabel("irpf", data.diferencia).color, 
              color: getFiscalStatusLabel("irpf", data.diferencia).textColor 
            }}
          >
            {getFiscalStatusLabel("irpf", data.diferencia).label}
          </div>
        </div>
        <div className={`p-3 rounded-full ${data.diferencia < 0 ? 'bg-green-50' : 'bg-red-50'}`}>
          <FileText className={`w-6 h-6 ${data.diferencia < 0 ? 'text-green-600' : 'text-red-600'}`} />
        </div>
      </div>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Retenciones Practicadas:</span>
          <span className="font-medium">{formatCurrency(data.retenciones_practicadas, 0)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Retenciones Soportadas:</span>
          <span className="font-medium">{formatCurrency(data.retenciones_soportadas, 0)}</span>
        </div>
        <div className="pt-2 border-t">
          <span className={`inline-block px-2 py-1 text-xs rounded-full ${
            data.status === 'A INGRESAR' ? 'bg-red-100 text-red-700' :
            data.status === 'A COMPENSAR' ? 'bg-green-100 text-green-700' :
            'bg-gray-100 text-gray-700'
          }`}>
            {data.status}
          </span>
        </div>
      </div>
    </Card>
  );
};
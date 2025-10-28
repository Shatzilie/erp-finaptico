import { Card } from "@/components/ui/card";
import { FileText, Receipt, Info } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export const getFiscalStatusLabel = (type: string, value: number | null | undefined, currentDate: Date = new Date()) => {
  const month = currentDate.getMonth() + 1; // 1-12
  const year = currentDate.getFullYear();
  const quarter = Math.ceil(month / 3); // 1-4
  const isCurrentQuarter = quarter === 4; // Octubre-Diciembre 2025

  if (value === null || value === undefined || isNaN(value)) {
    return { label: "Sin datos disponibles", color: "#F3F4F6", textColor: "#4B5563" };
  }

  // IVA (Modelo 303)
  if (type === "iva") {
    if (isCurrentQuarter) {
      return { label: "Trimestre en curso. Aún no se presenta.", color: "#E0E7FF", textColor: "#1E3A8A" };
    }
    if (value > 0) {
      return { label: "IVA calculado: se presentará con el modelo 303", color: "#EDE9FE", textColor: "#4B5563" };
    }
    if (value < 0) {
      return { label: "IVA a compensar", color: "#DBEAFE", textColor: "#1E3A8A" };
    }
    return { label: "Sin IVA a ingresar", color: "#D1FAE5", textColor: "#065F46" };
  }

  // IRPF (Modelo 130)
  if (type === "irpf") {
    if (isCurrentQuarter) {
      return { label: "Trimestre en curso. Cierre en enero.", color: "#E0E7FF", textColor: "#1E3A8A" };
    }
    if (value > 0) {
      return { label: "IRPF pendiente de presentar", color: "#FEF3C7", textColor: "#92400E" };
    }
    return { label: "IRPF presentado y compensado", color: "#D1FAE5", textColor: "#065F46" };
  }

  // Impuesto de Sociedades (Modelo 200)
  if (type === "is") {
    if (month < 7) {
      return { label: `Pendiente de cierre del ejercicio ${year - 1}`, color: "#F3F4F6", textColor: "#4B5563" };
    }
    return { label: "IS previsto para el cierre anual", color: "#E0E7FF", textColor: "#3730A3" };
  }

  return { label: "Sin información fiscal disponible", color: "#F3F4F6", textColor: "#4B5563" };
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
  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
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
      </div>
    </Card>
  );
};

export const IrpfCard = ({ data }: IrpfCardProps) => {
  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
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
      </div>
    </Card>
  );
};

interface SociedadesData {
  resultado_ejercicio: number;
  cuota_diferencial: number;
  status: string;
  period: {
    year: number;
  };
  annual_summary: {
    beneficio_bruto: number;
    impuesto_provision: number;
    beneficio_neto: number;
  };
}

interface SociedadesCardProps {
  data: SociedadesData;
}

export const SociedadesCard = ({ data }: SociedadesCardProps) => {
  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <p className="text-sm text-gray-600">
              Impuesto de Sociedades {data.period.year}
            </p>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-4 h-4 text-[#6C5CE7] cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-[300px]">
                  <p>Este dato muestra la previsión del Impuesto de Sociedades anual. Se actualiza automáticamente con los resultados contables.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <p className={`text-2xl font-bold ${data.cuota_diferencial < 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(data.cuota_diferencial, 0)}
          </p>
          <div
            className="mt-1 inline-flex items-center rounded-md px-2 py-1 text-xs font-medium"
            style={{ 
              backgroundColor: getFiscalStatusLabel("is", data.cuota_diferencial).color, 
              color: getFiscalStatusLabel("is", data.cuota_diferencial).textColor 
            }}
          >
            {getFiscalStatusLabel("is", data.cuota_diferencial).label}
          </div>
        </div>
        <div className={`p-3 rounded-full ${data.cuota_diferencial < 0 ? 'bg-green-50' : 'bg-red-50'}`}>
          <FileText className={`w-6 h-6 ${data.cuota_diferencial < 0 ? 'text-green-600' : 'text-red-600'}`} />
        </div>
      </div>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Resultado ejercicio:</span>
          <span className="font-medium">{formatCurrency(data.resultado_ejercicio, 0)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Beneficio bruto:</span>
          <span className="font-medium">{formatCurrency(data.annual_summary.beneficio_bruto, 0)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Provisión impuesto:</span>
          <span className="font-medium">{formatCurrency(data.annual_summary.impuesto_provision, 0)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Beneficio neto:</span>
          <span className="font-medium">{formatCurrency(data.annual_summary.beneficio_neto, 0)}</span>
        </div>
      </div>
    </Card>
  );
};
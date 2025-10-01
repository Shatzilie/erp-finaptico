import { Card } from "@/components/ui/card";
import { FileText, Receipt } from "lucide-react";

interface IVAData {
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

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

export const IvaCard = ({ data }: IvaCardProps) => {
  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm text-gray-600 mb-1">
            IVA Q{data.period.quarter} {data.period.year}
          </p>
          <p className={`text-2xl font-bold ${data.iva_diferencia < 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(data.iva_diferencia)}
          </p>
        </div>
        <div className={`p-3 rounded-full ${data.iva_diferencia < 0 ? 'bg-green-50' : 'bg-red-50'}`}>
          <Receipt className={`w-6 h-6 ${data.iva_diferencia < 0 ? 'text-green-600' : 'text-red-600'}`} />
        </div>
      </div>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">IVA Repercutido:</span>
          <span className="font-medium">{formatCurrency(data.iva_repercutido)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">IVA Soportado:</span>
          <span className="font-medium">{formatCurrency(data.iva_soportado)}</span>
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
  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm text-gray-600 mb-1">
            IRPF Q{data.period.quarter} {data.period.year}
          </p>
          <p className={`text-2xl font-bold ${data.diferencia < 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(data.diferencia)}
          </p>
        </div>
        <div className={`p-3 rounded-full ${data.diferencia < 0 ? 'bg-green-50' : 'bg-red-50'}`}>
          <FileText className={`w-6 h-6 ${data.diferencia < 0 ? 'text-green-600' : 'text-red-600'}`} />
        </div>
      </div>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Retenciones Practicadas:</span>
          <span className="font-medium">{formatCurrency(data.retenciones_practicadas)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Retenciones Soportadas:</span>
          <span className="font-medium">{formatCurrency(data.retenciones_soportadas)}</span>
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
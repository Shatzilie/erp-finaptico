import { Card } from "@/components/ui/card";
import { FileText, Receipt } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";

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
          <p className="text-sm text-gray-600 mb-1">
            IVA Q{data.period.quarter} {data.period.year}
          </p>
          <p className={`text-2xl font-bold ${(data.amount || data.iva_diferencia) < 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(data.amount || data.iva_diferencia, 0)}
          </p>
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
  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm text-gray-600 mb-1">
            IRPF Q{data.period.quarter} {data.period.year}
          </p>
          <p className={`text-2xl font-bold ${data.diferencia < 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(data.diferencia, 0)}
          </p>
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
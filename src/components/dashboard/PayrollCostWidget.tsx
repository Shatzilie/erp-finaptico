import { Card } from "@/components/ui/card";
import { Users, Info } from "lucide-react";
import { useDashboardData } from "@/hooks/useDashboardData";
import { formatCurrency } from "@/lib/formatters";
import { useNavigate } from "react-router-dom";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface PayrollCostWidgetProps {
  tenantId: string;
}

export const PayrollCostWidget = ({ tenantId }: PayrollCostWidgetProps) => {
  const navigate = useNavigate();
  const { data: dashboardData } = useDashboardData(tenantId);
  
  const payrollData = dashboardData?.payroll;

  const handleClick = () => {
    if (tenantId) {
      navigate(`/${tenantId}/payroll`);
    }
  };

  if (!payrollData) {
    return null;
  }

  const count = payrollData.employeeCount || 0;
  const quarterText = `Q${payrollData.quarter || 4} ${payrollData.year || 2025}`;
  
  let statusText = '';
  let statusColor = '';

  if (count === 0) {
    statusText = '⚠️ Sin nóminas procesadas';
    statusColor = 'text-yellow-600';
  } else if (count === 1) {
    statusText = `✓ ${count} empleado`;
    statusColor = 'text-green-600';
  } else {
    statusText = `✓ ${count} empleados`;
    statusColor = 'text-green-600';
  }

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={handleClick}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <p className="text-sm text-gray-600">
              Coste Laboral ({quarterText})
            </p>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-4 h-4 text-[#6C5CE7] cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-[300px]">
                  <p>Refleja el coste laboral trimestral de la empresa, incluyendo salarios brutos, netos y retenciones de IRPF.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <p className="text-2xl font-bold">
            {formatCurrency(payrollData.quarterly || 0, 0)}
          </p>
        </div>
        <div className="bg-purple-50 p-3 rounded-full">
          <Users className="w-6 h-6 text-purple-600" />
        </div>
      </div>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Total Bruto:</span>
          <span className="font-medium">{formatCurrency(payrollData.totalBruto || 0)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Total Neto:</span>
          <span className="font-medium">{formatCurrency(payrollData.totalNeto || 0)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">IRPF Retenido:</span>
          <span className="font-medium">{formatCurrency(payrollData.irpfRetenido || 0)}</span>
        </div>
        <div className="pt-2 border-t">
          <span className={`text-xs font-medium ${statusColor}`}>
            {statusText}
          </span>
        </div>
      </div>
    </Card>
  );
};

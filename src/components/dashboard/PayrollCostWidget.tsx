import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Loader2, Users } from "lucide-react";
import { useAuthenticatedFetch } from "@/hooks/useAuthenticatedFetch";
import { useTenantAccess } from "@/hooks/useTenantAccess";
import { formatCurrency } from "@/lib/formatters";
import { handleApiError } from "@/lib/apiErrorHandler";
import { useNavigate } from "react-router-dom";

interface PayrollData {
  totals: {
    total_gross: number;
    total_net: number;
    total_irpf: number;
  };
  count: number;
}

export const PayrollCostWidget = () => {
  const { tenantSlug } = useTenantAccess();
  const { fetchWithTimeout } = useAuthenticatedFetch();
  const navigate = useNavigate();
  const [payrollData, setPayrollData] = useState<PayrollData | null>(null);
  const [displayMonth, setDisplayMonth] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadPayrollData = async () => {
      if (!tenantSlug) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const currentDate = new Date();
        let year = currentDate.getFullYear();
        let month = currentDate.getMonth() + 1; // 1-12

        // Intentar mes actual primero
        let data = await fetchWithTimeout('odoo-payroll', {
          tenant_slug: tenantSlug,
          action: 'get_payslips',
          params: { year, month }
        });

        let payload = data.widget_data?.payroll?.payload;

        // Si no hay nóminas en el mes actual, probar el mes anterior
        if (payload && payload.count === 0) {
          month = month - 1;
          if (month === 0) {
            month = 12;
            year = year - 1;
          }

          data = await fetchWithTimeout('odoo-payroll', {
            tenant_slug: tenantSlug,
            action: 'get_payslips',
            params: { year, month }
          });

          payload = data.widget_data?.payroll?.payload;
        }

        if (mounted && payload) {
          setPayrollData(payload);

          // Formatear nombre del mes en español
          const monthNames = [
            'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
            'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
          ];
          setDisplayMonth(`${monthNames[month - 1]} ${year}`);
        }
      } catch (error) {
        if (mounted) {
          handleApiError(error, 'Coste Laboral');
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadPayrollData();

    return () => {
      mounted = false;
    };
  }, [tenantSlug]);

  const handleClick = () => {
    if (tenantSlug) {
      navigate(`/${tenantSlug}/payroll`);
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={handleClick}>
        <div className="flex items-center justify-center h-32">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </Card>
    );
  }

  const count = payrollData?.count || 0;
  let statusText = '';
  let statusColor = '';

  if (count === 0) {
    statusText = '⚠️ Sin nóminas procesadas';
    statusColor = 'text-yellow-600';
  } else if (count === 1) {
    statusText = '✓ 1 nómina procesada';
    statusColor = 'text-green-600';
  } else {
    statusText = `✓ ${count} nóminas procesadas`;
    statusColor = 'text-green-600';
  }

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={handleClick}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm text-gray-600 mb-1">
            💼 Coste Laboral ({displayMonth})
          </p>
          <p className="text-2xl font-bold">
            {formatCurrency(payrollData?.totals.total_gross || 0, 0)}
          </p>
        </div>
        <div className="bg-purple-50 p-3 rounded-full">
          <Users className="w-6 h-6 text-purple-600" />
        </div>
      </div>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Total Bruto:</span>
          <span className="font-medium">{formatCurrency(payrollData?.totals.total_gross || 0)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Total Neto:</span>
          <span className="font-medium">{formatCurrency(payrollData?.totals.total_net || 0)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">IRPF Retenido:</span>
          <span className="font-medium">{formatCurrency(payrollData?.totals.total_irpf || 0)}</span>
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

import { useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, FileText } from "lucide-react";
import KpiBoard from "@/components/dashboard/KpiBoard";
import ChartsSection, { ChartsSectionRef } from "@/components/dashboard/ChartsSection";
import RevenueExpensesChart from "@/components/dashboard/RevenueExpensesChart";
import { FiscalCalendarWidget } from "@/components/dashboard/FiscalCalendarWidget";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { handleApiError } from '@/lib/apiErrorHandler';
import { DashboardHeader } from '@/components/DashboardHeader';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useTenantAccess } from '@/hooks/useTenantAccess';
import { useDashboardData } from '@/hooks/useDashboardData';
import { SyncNow } from '@/components/SyncNow';
import { FreshnessBadge } from '@/components/FreshnessBadge';

interface MonthlyData {
  month: string;
  total: number;
  currency: string;
}

interface ChartsData {
  revenue_history: MonthlyData[];
  expenses_history: MonthlyData[];
}

const Dashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const { tenantSlug, isLoading: isTenantLoading } = useTenantAccess();
  const { data: dashboardData, isLoading: isLoadingDashboard, refresh, isRefreshing } = useDashboardData(tenantSlug);
  const chartsSectionRef = useRef<ChartsSectionRef>(null);

  const chartsData: ChartsData = {
    revenue_history: dashboardData?.revenue_history || [],
    expenses_history: dashboardData?.expenses_history || []
  };

  const isLoadingCharts = isTenantLoading || isLoadingDashboard;

  const handleGeneratePDF = async () => {
    if (!tenantSlug) {
      toast({
        title: "Error",
        description: "No se pudo identificar tu empresa",
        variant: "destructive"
      });
      return;
    }

    try {
      // Capturar gráficas
      console.log('📸 Capturando gráficas del dashboard...');
      toast({
        title: "Capturando gráficas...",
        description: "Por favor espera mientras se prepara el informe"
      });

      const charts = await chartsSectionRef.current?.captureCharts();
      
      if (!charts) {
        console.warn('⚠️ No se pudieron capturar las gráficas, continuando sin ellas');
      }

      // Llamar al backend con las gráficas capturadas
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('Sesión expirada');
      }

      console.log('📤 Enviando solicitud al backend con gráficas...');
      
      const response = await fetch(
        `https://dtmrywilxpilpzokxxif.supabase.co/functions/v1/financial-report-pdf`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tenant_slug: tenantSlug,
            ...(charts && {
              revenue_chart_url: charts.revenue_chart_url,
              expenses_chart_url: charts.expenses_chart_url,
              comparison_chart_url: charts.comparison_chart_url
            })
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Error ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success || !result.html_base64) {
        throw new Error('Respuesta inválida del servidor');
      }

      // Decodificar y mostrar HTML
      const htmlContent = decodeURIComponent(escape(atob(result.html_base64)));

      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.write(htmlContent);
        newWindow.document.close();
        
        console.log('✅ PDF generado correctamente');
        
        toast({
          title: "Informe generado",
          description: "Se ha abierto el informe en una nueva pestaña"
        });
      } else {
        toast({
          title: "Advertencia",
          description: "Por favor, permite ventanas emergentes para ver el informe",
          variant: "destructive"
        });
      }

    } catch (error: any) {
      console.error('❌ Error al generar PDF:', error);
      handleApiError(error, 'Generación de PDF');
    }
  };

  if (!isAuthenticated || !user || isTenantLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-background">
        <DashboardSidebar />
        
        <div className="flex-1">
          <DashboardHeader />
          
          <main className="p-6">
            <div className="max-w-7xl mx-auto space-y-8">
              {/* Botones de acción */}
              <div className="flex justify-between items-center">
                <FreshnessBadge cachedAt={dashboardData?.cached_at} />
                <div className="flex gap-3">
                  <Button 
                    onClick={handleGeneratePDF}
                    disabled={!tenantSlug}
                    variant="default"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Generar Informe PDF
                  </Button>
                  <SyncNow 
                    onRefresh={refresh}
                    isRefreshing={isRefreshing}
                  />
                </div>
              </div>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Indicadores Clave</h2>
                <KpiBoard tenantId={tenantSlug} />
              </section>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <FiscalCalendarWidget />
              </div>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Análisis Histórico Detallado</h2>
                <ChartsSection ref={chartsSectionRef} data={chartsData} isLoading={isLoadingCharts} />
              </section>
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default Dashboard;
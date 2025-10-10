import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Loader2, FileText } from "lucide-react";
import { backendAdapter } from "@/lib/backendAdapter";
import KpiBoard from "@/components/dashboard/KpiBoard";
import ChartsSection from "@/components/dashboard/ChartsSection";
import { FiscalCalendarWidget } from "@/components/dashboard/FiscalCalendarWidget";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuthenticatedFetch } from '@/hooks/useAuthenticatedFetch';
import { handleApiError } from '@/lib/apiErrorHandler';
import { DashboardHeader } from '@/components/DashboardHeader';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useTenantAccess } from '@/hooks/useTenantAccess';

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
  const navigate = useNavigate();
  const { toast } = useToast();
  const { fetchWithTimeout } = useAuthenticatedFetch();
  const { tenantSlug, isLoading: isTenantLoading } = useTenantAccess();
  const [chartsData, setChartsData] = useState<ChartsData>({
    revenue_history: [],
    expenses_history: []
  });
  const [isLoadingCharts, setIsLoadingCharts] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const fetchChartsData = async () => {
      if (!tenantSlug) {
        console.log("No tenantSlug disponible");
        setIsLoadingCharts(false);
        return;
      }

      try {
        setIsLoadingCharts(true);

        const dashboardData = await backendAdapter.fetchDashboardData(tenantSlug);
        
        setChartsData({
          revenue_history: dashboardData.revenue_history || [],
          expenses_history: dashboardData.expenses_history || []
        });

      } catch (error) {
        console.error('Error loading dashboard data');
        setChartsData({
          revenue_history: [],
          expenses_history: []
        });
      } finally {
        setIsLoadingCharts(false);
      }
    };

    fetchChartsData();
  }, [tenantSlug]);

  const handleSyncNow = async () => {
    if (!tenantSlug) {
      return;
    }

    try {
      setIsSyncing(true);
      window.location.reload();
    } catch (error) {
      console.error('Sync error');
    } finally {
      setIsSyncing(false);
    }
  };

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
      setIsGeneratingPDF(true);
      
      const htmlContent = await fetchWithTimeout<string>(
        'financial-report-pdf',
        { tenant_slug: tenantSlug },
        { timeout: 45000, retries: 0 }
      );

      if (typeof htmlContent !== 'string') {
        throw new Error('Invalid PDF response');
      }

      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.write(htmlContent);
        newWindow.document.close();
        
        console.log('✅ PDF generated successfully');
        
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
      handleApiError(error, 'Generación de PDF');
    } finally {
      setIsGeneratingPDF(false);
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
              <div className="flex justify-end gap-3">
                <Button 
                  onClick={handleGeneratePDF}
                  disabled={isGeneratingPDF}
                  variant="default"
                >
                  {isGeneratingPDF ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generando...
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4 mr-2" />
                      Generar Informe PDF
                    </>
                  )}
                </Button>
                <Button 
                  onClick={handleSyncNow}
                  disabled={isSyncing}
                  variant="outline"
                >
                  {isSyncing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sincronizando...
                    </>
                  ) : (
                    "Sincronizar Ahora"
                  )}
                </Button>
              </div>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Indicadores Clave</h2>
                <KpiBoard tenantId={tenantSlug} />
              </section>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <FiscalCalendarWidget />
              </div>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Análisis Histórico</h2>
                <ChartsSection data={chartsData} isLoading={isLoadingCharts} />
              </section>
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default Dashboard;
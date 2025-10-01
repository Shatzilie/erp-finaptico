import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { backendAdapter } from "@/lib/backendAdapter";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import KpiBoard from "@/components/dashboard/KpiBoard";
import ChartsSection from "@/components/dashboard/ChartsSection";
import { Button } from "@/components/ui/button";

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
  const { user, tenant, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [chartsData, setChartsData] = useState<ChartsData>({
    revenue_history: [],
    expenses_history: []
  });
  const [isLoadingCharts, setIsLoadingCharts] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchChartsData = async () => {
      if (!tenant?.id) {
        setIsLoadingCharts(false);
        return;
      }

      try {
        setIsLoadingCharts(true);

        const [revenueResponse, expensesResponse] = await Promise.all([
          backendAdapter.fetchRevenue(tenant.id),
          backendAdapter.fetchExpenses(tenant.id)
        ]);

        const revenueHistory = revenueResponse?.widget_data?.revenue?.payload?.monthly_history || [];
        const expensesHistory = expensesResponse?.widget_data?.expenses?.payload?.monthly_history || [];

        setChartsData({
          revenue_history: revenueHistory,
          expenses_history: expensesHistory
        });

      } catch (error) {
        console.error("Error fetching charts data:", error);
      } finally {
        setIsLoadingCharts(false);
      }
    };

    fetchChartsData();
  }, [tenant?.id]);

  const handleSyncNow = async () => {
    if (!tenant?.slug) {
      console.error("No tenant slug available");
      return;
    }

    try {
      setIsSyncing(true);
      await backendAdapter.triggerSync(tenant.slug);
      
      window.location.reload();
    } catch (error) {
      console.error("Error during sync:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !tenant) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader 
        userName={user.email || "Usuario"}
        tenantName={tenant.name || "Mi Empresa"}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard Financiero</h1>
            <p className="text-gray-600 mt-1">Resumen de tu actividad empresarial</p>
          </div>
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

        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Indicadores Clave</h2>
            <KpiBoard tenantId={tenant.id} />
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Análisis Histórico</h2>
            <ChartsSection data={chartsData} isLoading={isLoadingCharts} />
          </section>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
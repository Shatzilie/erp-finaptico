import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Loader2, LogOut } from "lucide-react";
import { backendAdapter } from "@/lib/backendAdapter";
import KpiBoard from "@/components/dashboard/KpiBoard";
import ChartsSection from "@/components/dashboard/ChartsSection";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface MonthlyData {
  month: string;
  total: number;
  currency: string;
}

interface ChartsData {
  revenue_history: MonthlyData[];
  expenses_history: MonthlyData[];
}

const USER_TENANT_MAP: Record<string, string> = {
  "6caa2623-8ae3-41e3-85b0-9a8fdde56fd2": "young-minds",
  "93ffe32a-b9f3-474c-afae-0bb69cf7e87e": "blacktar"
};

const Dashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [chartsData, setChartsData] = useState<ChartsData>({
    revenue_history: [],
    expenses_history: []
  });
  const [isLoadingCharts, setIsLoadingCharts] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  const tenantSlug = user?.id ? USER_TENANT_MAP[user.id] : undefined;

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
        console.log("Cargando datos del dashboard para tenant:", tenantSlug);

        const dashboardData = await backendAdapter.fetchDashboardData(tenantSlug);
        
        setChartsData({
          revenue_history: dashboardData.revenue_history || [],
          expenses_history: dashboardData.expenses_history || []
        });

      } catch (error) {
        console.error("Error fetching charts data:", error);
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
      console.error("No tenant slug available");
      return;
    }

    try {
      setIsSyncing(true);
      console.log("Sincronización manual con tenant:", tenantSlug);
      window.location.reload();
    } catch (error) {
      console.error("Error during sync:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard Financiero</h1>
              <p className="text-sm text-gray-600">{user.email}</p>
            </div>
            <div className="flex gap-3">
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
              <Button 
                onClick={handleLogout}
                variant="ghost"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Indicadores Clave</h2>
            <KpiBoard tenantId={tenantSlug} />
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
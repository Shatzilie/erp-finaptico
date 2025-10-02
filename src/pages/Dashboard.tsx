import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Loader2, LogOut } from "lucide-react";
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

const Dashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [tenantName, setTenantName] = useState<string>("");
  const [chartsData, setChartsData] = useState<ChartsData>({
    revenue_history: [],
    expenses_history: []
  });
  const [isLoadingCharts, setIsLoadingCharts] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const fetchTenantFromProfile = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase.rpc('get_user_tenant', {
          user_uuid: user.id
        });

        if (error) {
          console.error("Error fetching tenant:", error);
          return;
        }
        
        if (data && data.length > 0) {
          setTenantId(data[0].tenant_id);
          setTenantName(data[0].tenant_name);
        }
      } catch (error) {
        console.error("Error fetching tenant:", error);
      }
    };

    fetchTenantFromProfile();
  }, [user]);

  const handleSyncNow = () => {
    setIsSyncing(true);
    setTimeout(() => {
      window.location.reload();
    }, 1000);
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

  if (!tenantId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600">Cargando información de la empresa...</p>
        </div>
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
              <p className="text-sm text-gray-600">{tenantName || user.email}</p>
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
            <KpiBoard tenantId={tenantId} />
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
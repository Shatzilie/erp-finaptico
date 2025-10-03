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

const Dashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [tenantSlug, setTenantSlug] = useState<string | null>(null);
  const [chartsData, setChartsData] = useState<ChartsData>({
    revenue_history: [],
    expenses_history: []
  });
  const [isLoadingCharts, setIsLoadingCharts] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  // Obtener el tenant_slug del usuario autenticado
  useEffect(() => {
    const fetchUserTenant = async () => {
      if (!user?.id) return;

      try {
        console.log("🔍 Buscando tenant para user:", user.id);

        // Buscar en user_tenant_access
        const { data: accessData, error: accessError } = await supabase
          .from('user_tenant_access')
          .select(`
            tenant_id,
            tenants (
              slug,
              name
            )
          `)
          .eq('user_id', user.id)
          .single();

        if (accessError) {
          console.error("❌ Error buscando tenant:", accessError);
          setError("No se pudo encontrar tu empresa. Contacta con soporte.");
          return;
        }

        if (!accessData?.tenants) {
          console.error("❌ No hay tenant asociado al usuario");
          setError("No tienes acceso a ninguna empresa. Contacta con soporte.");
          return;
        }

        const slug = (accessData.tenants as any).slug;
        console.log("✅ Tenant encontrado:", slug);
        setTenantSlug(slug);

      } catch (error) {
        console.error("❌ Error inesperado:", error);
        setError("Error al cargar tu empresa. Intenta recargar la página.");
      }
    };

    fetchUserTenant();
  }, [user]);

  useEffect(() => {
    const fetchChartsData = async () => {
      if (!tenantSlug) {
        console.log("⏳ Esperando tenant_slug...");
        return;
      }

      try {
        setIsLoadingCharts(true);
        setError(null);
        console.log("📊 Cargando datos del dashboard para tenant:", tenantSlug);

        // Cargar datos completos del dashboard
        const dashboardData = await backendAdapter.fetchDashboardData(tenantSlug);
        
        console.log("✅ Datos recibidos:", {
          revenue_history_length: dashboardData.revenue_history?.length || 0,
          expenses_history_length: dashboardData.expenses_history?.length || 0,
          revenue_history: dashboardData.revenue_history,
          expenses_history: dashboardData.expenses_history
        });

        // Actualizar estado con los datos históricos
        setChartsData({
          revenue_history: dashboardData.revenue_history || [],
          expenses_history: dashboardData.expenses_history || []
        });

      } catch (error) {
        console.error("❌ Error fetching charts data:", error);
        setError("Error al cargar los datos del dashboard");
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
      console.log("🔄 Sincronización manual con tenant:", tenantSlug);
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

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <p className="text-red-600 font-semibold">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  if (!tenantSlug) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-2">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-gray-600">Cargando tu empresa...</p>
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
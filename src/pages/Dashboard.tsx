import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { KpiBoard } from "@/components/dashboard/KpiBoard";
import { ChartsSection } from "@/components/dashboard/ChartsSection";
import { FiscalWidgets } from "@/components/dashboard/FiscalComponents";
import { Card } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

// Mapeo temporal de usuarios a tenants
const USER_TENANT_MAP: Record<string, { tenantId: string; tenantName: string; slug: string }> = {
  // Young Minds Big Ideas
  "6caa2623-8ae3-41e3-85b0-9a8fdde56fd2": {
    tenantId: "c4002f55-f7d5-4dd4-9942-d7ca65a551fd",
    tenantName: "Young Minds Big Ideas, S.L.",
    slug: "young-minds"
  },
  // Blacktar Engineering Works
  "93ffe32a-b9f3-474c-afae-0bb69cf7e87e": {
    tenantId: "b345026a-a04d-4ede-9a61-b604d797b191",
    tenantName: "Blacktar Engineering Works, S.L.",
    slug: "blacktar"
  }
};

export default function Dashboard() {
  const { user } = useAuth();
  const [tenantInfo, setTenantInfo] = useState<{
    tenantId: string;
    tenantName: string;
    slug: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    const mapped = USER_TENANT_MAP[user.id];
    
    if (mapped) {
      console.log("✅ Usuario mapeado:", mapped);
      setTenantInfo(mapped);
    } else {
      console.error("❌ Usuario no encontrado en mapeo:", user.id);
      setError(`Usuario ${user.id} no tiene tenant asignado`);
    }
    
    setIsLoading(false);
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !tenantInfo) {
    return (
      <div className="container mx-auto p-6">
        <Card className="p-6">
          <div className="flex items-center gap-3 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <div>
              <p className="font-semibold">Error de configuración</p>
              <p className="text-sm text-muted-foreground">
                {error || "No se pudo determinar el tenant del usuario"}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                User ID: {user?.id}
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">{tenantInfo.tenantName}</p>
        </div>
      </div>

      <KpiBoard tenantSlug={tenantInfo.slug} />
      
      <ChartsSection tenantSlug={tenantInfo.slug} />
      
      <FiscalWidgets tenantSlug={tenantInfo.slug} />
    </div>
  );
}
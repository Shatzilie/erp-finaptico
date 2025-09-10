import { useParams, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardHeader } from '@/components/DashboardHeader';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { TrendingUp, DollarSign, FileText } from 'lucide-react';

type ChangeType = 'positive' | 'negative' | 'neutral';

interface DashboardCard {
  title: string;
  description: string;
  value: string;
  change: string;
  changeType: ChangeType;
  icon: any;
}

interface Tenant {
  name: string;
}

const DashboardContent = () => {
  const { tenant: tenantSlug } = useParams<{ tenant: string }>();
  const { user } = useAuth();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unauthorized, setUnauthorized] = useState(false);

  useEffect(() => {
    async function getSessionAndAuthorize() {
      if (!tenantSlug || !user) return;
      
      try {
        // First, get the user's profile and tenant_id
        const { data: profileData, error: profileError } = await (supabase as any)
          .from('profiles')
          .select('tenant_id')
          .eq('user_id', user.id)
          .single();

        if (profileError || !profileData) {
          throw new Error('PROFILE_NOT_FOUND');
        }

        // Then, get the tenant information
        const { data: tenantData, error: tenantError } = await (supabase as any)
          .from('tenants')
          .select('slug, name')
          .eq('id', profileData.tenant_id)
          .single();

        if (tenantError || !tenantData) {
          throw new Error('TENANT_NOT_FOUND');
        }

        // Verify user belongs to the requested tenant
        if (tenantData.slug !== tenantSlug) {
          setUnauthorized(true);
          throw new Error('FORBIDDEN');
        }

        // If authorized, set the tenant data
        setTenant({ name: tenantData.name });
      } catch (err: any) {
        if (err.message === 'FORBIDDEN') {
          setUnauthorized(true);
          setError('No tienes acceso a este tenant');
        } else {
          setError('Error al verificar permisos');
        }
      } finally {
        setLoading(false);
      }
    }

    getSessionAndAuthorize();
  }, [tenantSlug, user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Cargando...</CardTitle>
            <CardDescription>Verificando permisos y obteniendo información del tenant</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (unauthorized) {
    return <Navigate to="/login" replace />;
  }

  if (error || !tenant) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Acceso denegado</CardTitle>
            <CardDescription>
              {error || `No tienes permisos para acceder al tenant "${tenantSlug}".`}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const cards: DashboardCard[] = [
    {
      title: 'Tesorería',
      description: 'Estado actual de caja y bancos',
      value: '€125.430,50',
      change: '+2.1%',
      changeType: 'positive',
      icon: DollarSign,
    },
    {
      title: 'Ingresos vs Gastos',
      description: 'Comparativa del mes actual',
      value: '€45.280,00',
      change: '+8.3%',
      changeType: 'positive',
      icon: TrendingUp,
    },
    {
      title: 'Estado IVA',
      description: 'Situación tributaria actual',
      value: '€12.450,75',
      change: 'Pendiente',
      changeType: 'neutral',
      icon: FileText,
    },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />
      
      <div className="flex-1">
        <DashboardHeader />
        
        <main className="p-6">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-2">
              Dashboard Principal
            </h2>
            <p className="text-muted-foreground">
              Resumen financiero de {tenant.name}
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {cards.map((card, index) => {
              const Icon = card.icon;
              return (
                <Card key={index} className="bg-gradient-card shadow-card hover:shadow-elevated transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {card.title}
                    </CardTitle>
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground mb-1">
                      {card.value}
                    </div>
                    <div className="flex items-center gap-1">
                      <span
                        className={`text-xs font-medium ${
                          card.changeType === 'positive'
                            ? 'text-profit'
                            : card.changeType === 'negative'
                            ? 'text-loss'
                            : 'text-muted-foreground'
                        }`}
                      >
                        {card.change}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {card.changeType !== 'neutral' 
                          ? 'vs mes anterior'
                          : ''}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {card.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
};

export default function Dashboard() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Euro, TrendingUp, FileText, Clock, RefreshCw, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useTenantAccess } from '@/hooks/useTenantAccess';
import { useAuthenticatedFetch } from '@/hooks/useAuthenticatedFetch';
import { handleApiError } from '@/lib/apiErrorHandler';
import { formatCurrency } from '@/lib/formatters';

type InvoicingData = {
  monthly_revenue: number;
  quarterly_revenue: number;
  annual_revenue: number;
  outstanding_invoices_count: number;
  outstanding_invoices_amount?: number;
  total_invoices: number;
};

export default function InvoicingPage() {
  const { tenantSlug, isLoading: tenantLoading, error: tenantError } = useTenantAccess();
  const [data, setData] = useState<InvoicingData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { fetchWithTimeout } = useAuthenticatedFetch();

  // Mock data como fallback
  const mockData: InvoicingData = {
    monthly_revenue: 4840,
    quarterly_revenue: 14782.5,
    annual_revenue: 50300.66,
    outstanding_invoices_count: 0,
    outstanding_invoices_amount: 0,
    total_invoices: 15
  };

  const fetchRevenueData = async () => {
    if (!tenantSlug) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await fetchWithTimeout(
        'odoo-revenue',
        { 
          tenant_slug: tenantSlug,
          date_from: undefined,
          date_to: undefined
        },
        { timeout: 30000, retries: 1 }
      );

      if (result.ok && result.widget_data?.revenue?.payload) {
        setData(result.widget_data.revenue.payload);
        console.log('✅ Revenue data loaded successfully');
      } else {
        throw new Error('Invalid revenue response structure');
      }
    } catch (error: any) {
      handleApiError(error, 'Facturación');
      setError('No se pudieron cargar los datos de facturación');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tenantSlug) {
      fetchRevenueData();
    }
  }, [tenantSlug]);

  // Validar tenant loading
  if (tenantLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600">Cargando información del tenant...</p>
        </div>
      </div>
    );
  }

  // Validar tenant error
  if (tenantError || !tenantSlug) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-red-500 text-center">
          <p className="font-semibold">Error cargando tenant</p>
          <p>{tenantError || 'No se pudo obtener el tenant'}</p>
        </div>
      </div>
    );
  }

  // Si hay error, mostrar datos mock
  const displayData = data || mockData;

  const kpiCards = [
    {
      title: "Facturación Mensual",
      value: displayData.monthly_revenue,
      icon: Euro,
      description: "Ingresos del mes actual",
      color: "text-green-600"
    },
    {
      title: "Facturación Trimestral", 
      value: displayData.quarterly_revenue,
      icon: TrendingUp,
      description: "Ingresos del trimestre",
      color: "text-blue-600"
    },
    {
      title: "Facturación Anual",
      value: displayData.annual_revenue,
      icon: TrendingUp,
      description: "Ingresos del año",
      color: "text-purple-600"
    },
    {
      title: "Facturas Pendientes",
      value: displayData.outstanding_invoices_count,
      icon: Clock,
      description: "Facturas emitidas aún sin cobrar",
      color: "text-orange-600",
      isCount: true
    },
    {
      title: "Total Facturas",
      value: displayData.total_invoices,
      icon: FileText,
      description: "Facturas emitidas este año",
      color: "text-gray-600",
      isCount: true
    }
  ];

  return (
    <div className="container mx-auto px-6 py-8 max-w-7xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Facturación</h1>
          <p className="text-muted-foreground mt-2">
            Gestión y seguimiento de ingresos y facturas
          </p>
        </div>
        
        <Button 
          onClick={fetchRevenueData} 
          disabled={loading}
          variant="outline"
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Actualizando...' : 'Actualizar datos'}
        </Button>
      </div>

      {error && (
        <Card className="mb-6 border-destructive">
          <CardContent className="p-4">
            <p className="text-destructive">Error: {error}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {kpiCards.map((card, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {card.title}
              </CardTitle>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  card.isCount ? card.value.toString() : formatCurrency(card.value)
                )}
              </div>
              <CardDescription className="text-xs text-muted-foreground">
                {card.description}
              </CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>

      {!loading && !data && !error && (
        <Card className="mt-8">
          <CardContent className="p-8 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay datos disponibles</h3>
            <p className="text-muted-foreground mb-4">
              Haz clic en "Actualizar datos" para cargar la información de facturación.
            </p>
            <Button onClick={fetchRevenueData} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Cargar datos
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
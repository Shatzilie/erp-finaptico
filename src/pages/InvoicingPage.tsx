import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Euro, TrendingUp, FileText, Clock, RefreshCw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

type InvoicingData = {
  monthly_revenue: number;
  quarterly_revenue: number;
  annual_revenue: number;
  outstanding_invoices_count: number;
  total_invoices: number;
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount);
};

export default function InvoicingPage() {
  const { tenant } = useParams<{ tenant: string }>();
  const [data, setData] = useState<InvoicingData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRevenueData = async () => {
    if (!tenant) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/functions/v1/odoo-revenue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-lovable-secret': 'lovable_sync_2024_LP%#tGxa@Q'
        },
        body: JSON.stringify({
          tenant_slug: tenant
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Revenue API Response:', result);

      if (result.ok && result.widget_data?.revenue?.payload) {
        setData(result.widget_data.revenue.payload);
      } else {
        throw new Error(result.error || 'Invalid response format');
      }
    } catch (error) {
      console.error('Error fetching revenue data:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch revenue data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRevenueData();
  }, [tenant]);

  const kpiCards = [
    {
      title: "Facturación Mensual",
      value: data?.monthly_revenue || 0,
      icon: Euro,
      description: "Ingresos del mes actual",
      color: "text-green-600"
    },
    {
      title: "Facturación Trimestral", 
      value: data?.quarterly_revenue || 0,
      icon: TrendingUp,
      description: "Ingresos del trimestre",
      color: "text-blue-600"
    },
    {
      title: "Facturación Anual",
      value: data?.annual_revenue || 0,
      icon: TrendingUp,
      description: "Ingresos del año",
      color: "text-purple-600"
    },
    {
      title: "Facturas Pendientes",
      value: data?.outstanding_invoices_count || 0,
      icon: Clock,
      description: "Facturas por cobrar",
      color: "text-orange-600",
      isCount: true
    },
    {
      title: "Total Facturas",
      value: data?.total_invoices || 0,
      icon: FileText,
      description: "Facturas totales",
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
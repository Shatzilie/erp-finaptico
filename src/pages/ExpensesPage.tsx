import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingCart, TrendingDown, FileText, Clock, RefreshCw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';

type ExpensesData = {
  monthly_expenses: number;
  quarterly_expenses: number;
  annual_expenses: number;
  pending_invoices_count: number;
  total_invoices: number;
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount);
};

const getTenantId = (tenant: string) => {
  const tenantMap: Record<string, string> = {
    'young-minds': 'c4002f55-f7d5-4dd4-9942-d7ca65a551fd',
    'blacktar': 'otro-uuid-aqui' // Add real UUID when available
  };
  return tenantMap[tenant] || tenant;
};

export default function ExpensesPage() {
  const { tenant } = useParams<{ tenant: string }>();
  const [data, setData] = useState<ExpensesData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mock data como fallback
  const mockData: ExpensesData = {
    monthly_expenses: 529,
    quarterly_expenses: 6640.08,
    annual_expenses: 24883.68,
    pending_invoices_count: 7,
    total_invoices: 148
  };

  const fetchExpensesData = async () => {
    if (!tenant) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('Calling expenses API for tenant:', tenant);
      
      // Obtener sesión de Supabase
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error('No hay sesión activa');
      }

      const response = await fetch('https://dtmrywilxpilpzokxxif.supabase.co/functions/v1/odoo-expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          tenant_slug: getTenantId(tenant || '')
        })
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const responseText = await response.text();
      console.log('Raw response:', responseText);
      
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        console.error('Response was:', responseText);
        throw new Error('La respuesta no es JSON válido');
      }

      console.log('Parsed result:', result);
      
      if (result.ok && result.widget_data?.expenses?.payload) {
        setData(result.widget_data.expenses.payload);
      } else {
        throw new Error(result.error || 'Formato de respuesta inválido');
      }
    } catch (error) {
      console.error('Error completo:', error);
      setError(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpensesData();
  }, [tenant]);

  // Si hay error, mostrar datos mock
  const displayData = data || mockData;

  const kpiCards = [
    {
      title: "Gastos de este mes",
      value: displayData.monthly_expenses,
      icon: ShoppingCart,
      description: "Has gastado este mes",
      color: "text-red-600"
    },
    {
      title: "Gastos del trimestre", 
      value: displayData.quarterly_expenses,
      icon: TrendingDown,
      description: "Total gastado en el trimestre",
      color: "text-orange-600"
    },
    {
      title: "Gastos del año",
      value: displayData.annual_expenses,
      icon: TrendingDown,
      description: "Has gastado este año",
      color: "text-purple-600"
    },
    {
      title: "Facturas por pagar",
      value: displayData.pending_invoices_count,
      icon: Clock,
      description: "Estoy controlando los pagos pendientes",
      color: "text-yellow-600",
      isCount: true
    },
    {
      title: "Facturas de gastos",
      value: displayData.total_invoices,
      icon: FileText,
      description: "Total de facturas registradas",
      color: "text-gray-600",
      isCount: true
    }
  ];

  return (
    <div className="container mx-auto px-6 py-8 max-w-7xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Control de Gastos</h1>
          <p className="text-muted-foreground mt-2">
            Estoy controlando todos tus gastos y facturas de proveedores para optimizar tu fiscalidad
          </p>
        </div>
        
        <Button 
          onClick={fetchExpensesData} 
          disabled={loading}
          variant="outline"
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Actualizando datos...' : 'Actualizar datos'}
        </Button>
      </div>

      {error && (
        <Card className="mb-6 border-destructive">
          <CardContent className="p-4">
            <p className="text-destructive">
              No puedo conectar con Odoo ahora mismo. Te muestro los últimos datos disponibles.
            </p>
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
            <h3 className="text-lg font-semibold mb-2">Cargando tus datos de gastos</h3>
            <p className="text-muted-foreground mb-4">
              Estoy conectando con Odoo para traerte la información más actualizada de tus gastos.
            </p>
            <Button onClick={fetchExpensesData} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Cargar datos
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
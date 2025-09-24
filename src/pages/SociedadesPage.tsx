import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Building, TrendingUp, TrendingDown, Calculator, Percent, Euro, RefreshCw, Loader2 } from 'lucide-react';
import { FreshnessBadge } from '@/components/FreshnessBadge';
import { SyncNow } from '@/components/SyncNow';
import { useTenantFeatures } from '@/hooks/useTenantFeatures';

interface SociedadesData {
  resultado_ejercicio: number;
  base_imponible: number;
  tipo_impositivo: number;
  cuota_integra: number;
  cuota_diferencial: number;
  status: string;
  empresa_tipo: string;
  ingresos_anuales: number;
  period: {
    year: number;
    date_from: string;
    date_to: string;
  };
}

// Utilidad para formatear moneda
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount);
};

const generateYearOptions = () => {
  const currentYear = new Date().getFullYear();
  const years = [];
  // Mostrar desde el año actual hasta 5 años atrás
  for (let year = currentYear; year >= currentYear - 5; year--) {
    years.push({ value: year, label: year.toString() });
  }
  return years;
};

const years = generateYearOptions();

// Función para verificar si un período está en el futuro
const isPeriodInFuture = (year: number) => {
  const currentYear = new Date().getFullYear();
  return year > currentYear;
};

export default function SociedadesPage() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [data, setData] = useState<SociedadesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const { slug } = useTenantFeatures();

  const fetchSociedadesData = async (year?: number) => {
    console.log(`🎯 fetchSociedadesData llamada con: ${year}`);
    
    const response = await fetch('https://dtmrywilxpilpzokxxif.supabase.co/functions/v1/odoo-sociedades', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-lovable-secret': 'lovable_sync_2024_LP%#tGxa@Q'
      },
      body: JSON.stringify({
        tenant_slug: 'c4002f55-f7d5-4dd4-9942-d7ca65a551fd',
        year: year || new Date().getFullYear()
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    const result = await response.json();
    console.log('🔍 Respuesta de la API Sociedades:', result);
    return result.widget_data.sociedades.payload;
  };

  const handleYearChange = async (newYear: number) => {
    console.log(`🔄 Cambiando a año ${newYear}`);
    setLoading(true);
    try {
      const newData = await fetchSociedadesData(newYear);
      console.log('📊 Nuevos datos Sociedades:', newData);
      setData(newData);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('❌ Error actualizando datos Sociedades:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log(`🔄 useEffect triggered for ${selectedYear}`);
    fetchSociedadesData(selectedYear)
      .then(result => {
        setData(result);
        setLastUpdated(new Date());
        setLoading(false);
      })
      .catch(error => {
        console.error('❌ Error initial load:', error);
        setLoading(false);
      });
  }, []); // Solo en mount inicial

  const handleRefresh = () => {
    handleYearChange(selectedYear);
  };

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'A DEVOLVER':
        return 'default'; // Verde
      case 'A PAGAR':
        return 'destructive'; // Rojo
      case 'NEUTRO':
        return 'secondary'; // Gris
      default:
        return 'secondary';
    }
  };

  const getDiferenciaColor = (diferencia: number) => {
    if (diferencia < 0) return 'text-green-600'; // A devolver
    if (diferencia > 0) return 'text-red-600';   // A pagar
    return 'text-gray-600'; // Neutro
  };

  const isInFuture = isPeriodInFuture(selectedYear);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Impuesto de Sociedades</h2>
        <div className="flex items-center space-x-2">
          {lastUpdated && (
            <FreshnessBadge 
              seconds={Math.floor((new Date().getTime() - lastUpdated.getTime()) / 1000)} 
            />
          )}
          <SyncNow slug={slug} onSyncComplete={() => handleRefresh()} />
        </div>
      </div>

      {/* Selector de Año */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">Seleccionar Período</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col space-y-2">
            <label className="text-sm font-medium">Año</label>
            <Select 
              value={selectedYear.toString()} 
              onValueChange={(value) => {
                const newYear = parseInt(value);
                setSelectedYear(newYear);
                handleYearChange(newYear);
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Seleccionar año" />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year.value} value={year.value.toString()}>
                    {year.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* KPIs Principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resultado del Ejercicio</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                formatCurrency(data?.resultado_ejercicio || 0)
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Base Imponible</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                formatCurrency(data?.base_imponible || 0)
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cuota Diferencial</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getDiferenciaColor(data?.cuota_diferencial || 0)}`}>
              {loading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                formatCurrency(Math.abs(data?.cuota_diferencial || 0))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estado</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              {loading ? (
                <Skeleton className="h-6 w-20" />
              ) : (
                <Badge variant={getStatusColor(data?.status || 'NEUTRO')}>
                  {data?.status || 'NEUTRO'}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Avisos para períodos futuros */}
      {isInFuture && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-yellow-800">
              <Building className="h-4 w-4" />
              <p className="text-sm">
                <strong>Período futuro:</strong> Los datos mostrados son estimaciones o ceros ya que el año {selectedYear} aún no ha finalizado.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resumen detallado */}
      {!loading && data && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Building className="h-5 w-5" />
              <span>Resumen Impuesto de Sociedades {selectedYear}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tipo Impositivo:</span>
                  <span className="font-medium">{data.tipo_impositivo}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cuota Íntegra:</span>
                  <span className="font-medium">{formatCurrency(data.cuota_integra)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tipo de Empresa:</span>
                  <span className="font-medium">{data.empresa_tipo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ingresos Anuales:</span>
                  <span className="font-medium">{formatCurrency(data.ingresos_anuales)}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Período:</span>
                  <span className="font-medium">
                    {data.period?.date_from} - {data.period?.date_to}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Año fiscal:</span>
                  <span className="font-medium">{data.period?.year}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
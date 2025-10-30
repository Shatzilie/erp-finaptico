import { useState, useEffect } from 'react';
import { useSuperAdmin } from '@/hooks/useSuperAdmin';
import { useAuthenticatedFetch } from '@/hooks/useAuthenticatedFetch';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Building2, AlertCircle, RefreshCw, ExternalLink, Search, Filter, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { handleApiError } from '@/lib/apiErrorHandler';
import { toast } from '@/hooks/use-toast';

interface ClientData {
  tenant_id: string;
  tenant_slug: string;
  tenant_name: string;
  tesoreria_total: number;
  facturacion_mes: number;
  facturacion_anual: number;
  alerta_estado: string;
  ult_sync_min: number;
}

interface ClientsResponse {
  ok: boolean;
  clients: ClientData[];
  total_clients: number;
}

type SortField = 'tenant_name' | 'tesoreria_total' | 'facturacion_mes' | 'facturacion_anual' | 'alerta_estado' | 'ult_sync_min';
type StatusFilter = 'all' | '🟢' | '🟡' | '🔴';

const formatTimeAgo = (minutes: number): string => {
  if (minutes < 60) {
    return `hace ${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  return `hace ${hours} ${hours === 1 ? 'hora' : 'horas'}`;
};

const getAlertOrder = (emoji: string): number => {
  if (emoji === '🔴') return 0;
  if (emoji === '🟡') return 1;
  return 2; // 🟢
};

const getAlertBadgeVariant = (emoji: string): "default" | "secondary" | "destructive" => {
  if (emoji === '🔴') return 'destructive';
  if (emoji === '🟡') return 'secondary';
  return 'default';
};

const getTesoBadgeVariant = (amount: number): "default" | "secondary" | "destructive" => {
  if (amount < 1000) return 'destructive';
  if (amount < 5000) return 'secondary';
  return 'default';
};

export default function AdminClientsPage() {
  const { isSuperAdmin } = useSuperAdmin();
  const { fetchWithTimeout } = useAuthenticatedFetch();
  const navigate = useNavigate();

  const [data, setData] = useState<ClientData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('alerta_estado');
  const [sortAsc, setSortAsc] = useState(true);
  
  // Filtros
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [revenueRange, setRevenueRange] = useState([0, 500000]);
  const [showFilters, setShowFilters] = useState(false);
  
  // Sincronización masiva
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);

  const fetchClientsData = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await fetchWithTimeout<ClientsResponse>(
        'admin-clients-overview',
        {},
        { timeout: 30000, retries: 1 }
      );

      if (result.ok && Array.isArray(result.clients)) {
        setData(result.clients);
      } else {
        throw new Error('Invalid response structure from admin-clients-overview');
      }
    } catch (err: any) {
      handleApiError(err, 'Resumen de Clientes');
      setError('No se pudieron cargar los datos de los clientes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSuperAdmin) {
      fetchClientsData();
    }
  }, [isSuperAdmin]);

  // Redirigir si no es super-admin
  if (!isSuperAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Acceso denegado. Esta página es solo para administradores de Finaptico.
          </AlertDescription>
        </Alert>
        <Button 
          onClick={() => navigate('/young-minds/dashboard')} 
          className="mt-4"
        >
          Volver al Dashboard
        </Button>
      </div>
    );
  }

  const syncAllClients = async () => {
    setSyncing(true);
    setSyncProgress(0);
    
    try {
      // Simulamos progreso (el backend puede no devolver progreso real)
      const progressInterval = setInterval(() => {
        setSyncProgress(prev => Math.min(prev + 10, 90));
      }, 300);
      
      const result = await fetchWithTimeout(
        'admin-sync-all-clients',
        {},
        { timeout: 120000, retries: 0 }
      );
      
      clearInterval(progressInterval);
      setSyncProgress(100);
      
      if (result.ok) {
        toast({
          title: "Sincronización completada",
          description: `Se sincronizaron ${data.length} clientes correctamente`,
        });
        fetchClientsData();
      } else {
        throw new Error('Error en la sincronización');
      }
    } catch (err: any) {
      handleApiError(err, 'Sincronización masiva');
      toast({
        title: "Error en sincronización",
        description: "No se pudieron sincronizar todos los clientes",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncProgress(0), 1000);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  // Aplicar filtros
  const filteredData = data.filter(client => {
    // Filtro por estado
    if (statusFilter !== 'all' && client.alerta_estado !== statusFilter) {
      return false;
    }
    
    // Filtro por búsqueda
    if (searchQuery && !client.tenant_name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    // Filtro por rango de ingresos
    if (client.facturacion_mes < revenueRange[0] || client.facturacion_mes > revenueRange[1]) {
      return false;
    }
    
    return true;
  });

  const sortedData = [...filteredData].sort((a, b) => {
    let comparison = 0;

    switch (sortField) {
      case 'tenant_name':
        comparison = a.tenant_name.localeCompare(b.tenant_name);
        break;
      case 'tesoreria_total':
        comparison = a.tesoreria_total - b.tesoreria_total;
        break;
      case 'facturacion_mes':
        comparison = a.facturacion_mes - b.facturacion_mes;
        break;
      case 'facturacion_anual':
        comparison = a.facturacion_anual - b.facturacion_anual;
        break;
      case 'alerta_estado':
        comparison = getAlertOrder(a.alerta_estado) - getAlertOrder(b.alerta_estado);
        break;
      case 'ult_sync_min':
        comparison = a.ult_sync_min - b.ult_sync_min;
        break;
    }

    return sortAsc ? comparison : -comparison;
  });

  return (
    <TooltipProvider>
      <div className="container mx-auto py-8 px-4 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
              <Building2 className="h-8 w-8" />
              Resumen de Clientes
            </h1>
            <p className="text-muted-foreground">Vista consolidada de todos tus clientes</p>
          </div>

          <Button 
            onClick={syncAllClients} 
            disabled={syncing || loading} 
            className="gap-2"
          >
            {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            {syncing ? 'Sincronizando...' : 'Sincronizar todos'}
          </Button>
        </div>

        {/* Progress Bar */}
        {syncing && (
          <Card className="p-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Sincronizando clientes...</span>
                <span>{syncProgress}%</span>
              </div>
              <Progress value={syncProgress} />
            </div>
          </Card>
        )}

        {/* Filtros */}
        <Card>
          <CardHeader className="cursor-pointer" onClick={() => setShowFilters(!showFilters)}>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtros
              </CardTitle>
              <Badge variant="secondary">{filteredData.length} de {data.length}</Badge>
            </div>
          </CardHeader>
          
          {showFilters && (
            <CardContent className="space-y-4">
              {/* Filtro por estado */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Estado</label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={statusFilter === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatusFilter('all')}
                  >
                    Todos
                  </Button>
                  <Button
                    variant={statusFilter === '🟢' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatusFilter('🟢')}
                  >
                    🟢 Activo
                  </Button>
                  <Button
                    variant={statusFilter === '🟡' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatusFilter('🟡')}
                  >
                    🟡 Alerta
                  </Button>
                  <Button
                    variant={statusFilter === '🔴' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatusFilter('🔴')}
                  >
                    🔴 Error
                  </Button>
                </div>
              </div>

              {/* Buscador */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Buscar cliente</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Nombre del cliente..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Slider de ingresos */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Ingresos mensuales: {formatCurrency(revenueRange[0])} - {formatCurrency(revenueRange[1])}
                </label>
                <Slider
                  min={0}
                  max={500000}
                  step={5000}
                  value={revenueRange}
                  onValueChange={setRevenueRange}
                  className="w-full"
                />
              </div>
            </CardContent>
          )}
        </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={fetchClientsData}>
              Reintentar
            </Button>
          </AlertDescription>
        </Alert>
      )}

        {/* Table Card */}
        <Card>
          <CardHeader>
            <CardTitle>Clientes ({sortedData.length})</CardTitle>
            <CardDescription>Estado financiero consolidado de cada cliente</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="w-full h-16" />
                ))}
              </div>
            ) : data.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <Building2 className="h-16 w-16 text-muted-foreground/50" />
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-semibold">No hay clientes configurados</h3>
                  <p className="text-sm text-muted-foreground">Los clientes aparecerán aquí una vez configurados</p>
                </div>
              </div>
            ) : sortedData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <Search className="h-16 w-16 text-muted-foreground/50" />
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-semibold">No se encontraron resultados</h3>
                  <p className="text-sm text-muted-foreground">Intenta ajustar los filtros de búsqueda</p>
                </div>
              </div>
            ) : (
            <>
                {/* Desktop Table */}
                <div className="hidden md:block rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead 
                          className="cursor-pointer hover:bg-muted/50 transition-colors w-[200px]"
                          onClick={() => handleSort('tenant_name')}
                        >
                          <div className="flex items-center gap-1">
                            Cliente 
                            {sortField === 'tenant_name' && (
                              <span className="text-primary">{sortAsc ? '↑' : '↓'}</span>
                            )}
                          </div>
                        </TableHead>
                        
                        <TableHead 
                          className="cursor-pointer hover:bg-muted/50 transition-colors w-[150px]"
                          onClick={() => handleSort('tesoreria_total')}
                        >
                          <Tooltip delayDuration={200}>
                            <TooltipTrigger asChild>
                              <div className="flex items-center gap-1 w-full">
                                Tesorería Total
                                {sortField === 'tesoreria_total' && (
                                  <span className="text-primary">{sortAsc ? '↑' : '↓'}</span>
                                )}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="top" sideOffset={8} className="pointer-events-none">
                              Suma de todas las cuentas bancarias
                            </TooltipContent>
                          </Tooltip>
                        </TableHead>
                        
                        <TableHead 
                          className="cursor-pointer hover:bg-muted/50 transition-colors w-[150px]"
                          onClick={() => handleSort('facturacion_mes')}
                        >
                          <Tooltip delayDuration={200}>
                            <TooltipTrigger asChild>
                              <div className="flex items-center gap-1 w-full">
                                Ingresos Mensuales
                                {sortField === 'facturacion_mes' && (
                                  <span className="text-primary">{sortAsc ? '↑' : '↓'}</span>
                                )}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="top" sideOffset={8} className="pointer-events-none">
                              Facturación del mes en curso
                            </TooltipContent>
                          </Tooltip>
                        </TableHead>
                        
                        <TableHead 
                          className="cursor-pointer hover:bg-muted/50 transition-colors w-[150px]"
                          onClick={() => handleSort('facturacion_anual')}
                        >
                          <Tooltip delayDuration={200}>
                            <TooltipTrigger asChild>
                              <div className="flex items-center gap-1 w-full">
                                Ingresos Anuales
                                {sortField === 'facturacion_anual' && (
                                  <span className="text-primary">{sortAsc ? '↑' : '↓'}</span>
                                )}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="top" sideOffset={8} className="pointer-events-none">
                              Facturación total del año fiscal actual
                            </TooltipContent>
                          </Tooltip>
                        </TableHead>
                        
                        <TableHead 
                          className="cursor-pointer hover:bg-muted/50 transition-colors w-[100px]"
                          onClick={() => handleSort('alerta_estado')}
                        >
                          <Tooltip delayDuration={200}>
                            <TooltipTrigger asChild>
                              <div className="flex items-center gap-1 w-full">
                                Estado
                                {sortField === 'alerta_estado' && (
                                  <span className="text-primary">{sortAsc ? '↑' : '↓'}</span>
                                )}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="top" sideOffset={8} className="pointer-events-none">
                              🟢 Activo | 🟡 Caché expirado | 🔴 Sin datos
                            </TooltipContent>
                          </Tooltip>
                        </TableHead>
                        
                        <TableHead 
                          className="cursor-pointer hover:bg-muted/50 transition-colors w-[120px]"
                          onClick={() => handleSort('ult_sync_min')}
                        >
                          <Tooltip delayDuration={200}>
                            <TooltipTrigger asChild>
                              <div className="flex items-center gap-1 w-full">
                                Última Sync
                                {sortField === 'ult_sync_min' && (
                                  <span className="text-primary">{sortAsc ? '↑' : '↓'}</span>
                                )}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="top" sideOffset={8} className="pointer-events-none">
                              Minutos desde la última sincronización con Odoo
                            </TooltipContent>
                          </Tooltip>
                        </TableHead>
                        
                        <TableHead className="w-[130px]">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedData.map((client) => (
                        <TableRow key={client.tenant_id} className="hover:bg-muted/50 transition-colors">
                          <TableCell className="font-semibold">
                            {client.tenant_name}
                          </TableCell>
                          <TableCell>
                            <Badge variant={getTesoBadgeVariant(client.tesoreria_total)}>
                              {formatCurrency(client.tesoreria_total)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {formatCurrency(client.facturacion_mes)}
                          </TableCell>
                          <TableCell>
                            <span className="font-semibold text-lg">
                              {formatCurrency(client.facturacion_anual)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getAlertBadgeVariant(client.alerta_estado)}>
                              {client.alerta_estado}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatTimeAgo(client.ult_sync_min)}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/${client.tenant_slug}/dashboard`)}
                              className="gap-1"
                            >
                              Ver detalle
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-4">
                  {sortedData.map((client) => (
                    <Card key={client.tenant_id} className="hover:shadow-lg transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{client.tenant_name}</CardTitle>
                          <Badge variant={getAlertBadgeVariant(client.alerta_estado)}>
                            {client.alerta_estado}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Tesorería:</span>
                          <Badge variant={getTesoBadgeVariant(client.tesoreria_total)}>
                            {formatCurrency(client.tesoreria_total)}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Ingresos Mes:</span>
                          <span className="font-semibold">{formatCurrency(client.facturacion_mes)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Ingresos Año:</span>
                          <span className="font-semibold text-lg">{formatCurrency(client.facturacion_anual)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Última sync:</span>
                          <span className="text-sm">{formatTimeAgo(client.ult_sync_min)}</span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/${client.tenant_slug}/dashboard`)}
                          className="w-full mt-2 gap-1"
                        >
                          Ver detalle
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}

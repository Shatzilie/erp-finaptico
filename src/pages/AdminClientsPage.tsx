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
import { Building2, AlertCircle, RefreshCw, ExternalLink } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { handleApiError } from '@/lib/apiErrorHandler';

interface ClientData {
  tenant_id: string;
  tenant_slug: string;
  tenant_name: string;
  tesoreria_total: number;
  facturacion_mes: number;
  alerta_estado: string;
  ult_sync_min: number;
}

interface ClientsResponse {
  ok: boolean;
  clients: ClientData[];
  total_clients: number;
}

type SortField = 'tenant_name' | 'tesoreria_total' | 'facturacion_mes' | 'alerta_estado' | 'ult_sync_min';

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

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const sortedData = [...data].sort((a, b) => {
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
    <div className="container mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Building2 className="h-8 w-8" />
            Resumen de Clientes
          </h1>
          <p className="text-muted-foreground">Vista consolidada de todos tus clientes</p>
        </div>

        <Button onClick={fetchClientsData} disabled variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Sincronizar todos
        </Button>
      </div>

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
          <CardTitle>Clientes ({data.length})</CardTitle>
          <CardDescription>Estado financiero consolidado de cada cliente</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="w-full h-16" />
              ))}
            </div>
          ) : data.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>No hay clientes configurados</AlertDescription>
            </Alert>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSort('tenant_name')}
                      >
                        Cliente {sortField === 'tenant_name' && (sortAsc ? '↑' : '↓')}
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSort('tesoreria_total')}
                      >
                        Tesorería {sortField === 'tesoreria_total' && (sortAsc ? '↑' : '↓')}
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSort('facturacion_mes')}
                      >
                        Fact. Mes {sortField === 'facturacion_mes' && (sortAsc ? '↑' : '↓')}
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSort('alerta_estado')}
                      >
                        Alerta {sortField === 'alerta_estado' && (sortAsc ? '↑' : '↓')}
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSort('ult_sync_min')}
                      >
                        Últ. sync {sortField === 'ult_sync_min' && (sortAsc ? '↑' : '↓')}
                      </TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedData.map((client) => (
                      <TableRow key={client.tenant_id}>
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
                  <Card key={client.tenant_id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{client.tenant_name}</CardTitle>
                        <Badge variant={getAlertBadgeVariant(client.alerta_estado)}>
                          {client.alerta_estado}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Tesorería:</span>
                        <Badge variant={getTesoBadgeVariant(client.tesoreria_total)}>
                          {formatCurrency(client.tesoreria_total)}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Fact. Mes:</span>
                        <span className="font-semibold">{formatCurrency(client.facturacion_mes)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Últ. sync:</span>
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
  );
}

import { useState, useEffect } from 'react';
import { useAuthenticatedFetch } from '@/hooks/useAuthenticatedFetch';
import { useSuperAdmin } from '@/hooks/useSuperAdmin';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { RefreshCw, TrendingUp, AlertTriangle, Activity } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface FunctionMetric {
  function_name: string;
  calls_per_hour: number;
  total_calls_24h: number;
  error_count: number;
  error_rate: number;
  avg_latency_ms: number;
  p95_latency_ms: number;
}

interface CacheStatus {
  cache_key: string;
  fresh_count: number;
  stale_count: number;
  expired_count: number;
  total_count: number;
}

interface RecentLog {
  timestamp: string;
  function_name: string;
  user_id: string;
  status_code: number;
  latency_ms: number;
  details: any;
}

interface MonitoringData {
  ok: boolean;
  period_hours: number;
  metrics: FunctionMetric[];
  cache_status: CacheStatus[];
  recent_logs: RecentLog[];
  summary: {
    total_calls_24h: number;
    total_errors_24h: number;
    active_functions: number;
  };
}

type SortField = 'function_name' | 'calls_per_hour' | 'total_calls_24h' | 'error_count' | 'error_rate' | 'avg_latency_ms' | 'p95_latency_ms';
type SortDirection = 'asc' | 'desc';

export default function Monitoring() {
  const { isSuperAdmin } = useSuperAdmin();
  const { fetchWithTimeout } = useAuthenticatedFetch();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [data, setData] = useState<MonitoringData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('calls_per_hour');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [countdown, setCountdown] = useState(60);

  const numberFormatter = new Intl.NumberFormat('es-ES', { 
    minimumFractionDigits: 0,
    maximumFractionDigits: 2 
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await fetchWithTimeout<MonitoringData>(
        'admin-edge-functions-stats',
        {},
        { timeout: 30000 }
      );
      setData(response);
      setCountdown(60); // Reset countdown
    } catch (error: any) {
      console.error('Error fetching monitoring data:', error);
      toast({
        variant: 'destructive',
        title: 'Error al cargar datos',
        description: error.message || 'No se pudieron cargar las métricas',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isSuperAdmin) {
      navigate('/login');
      return;
    }
    fetchData();
  }, [isSuperAdmin]);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          fetchData();
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setCountdown(60);
    fetchData();
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const filteredAndSortedMetrics = data?.metrics
    ? [...data.metrics]
        .filter((metric) =>
          metric.function_name.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => {
          const aValue = a[sortField];
          const bValue = b[sortField];
          const modifier = sortDirection === 'asc' ? 1 : -1;
          return aValue < bValue ? -modifier : aValue > bValue ? modifier : 0;
        })
    : [];

  const formatTimestamp = (timestamp: string | null) => {
    if (!timestamp) return 'N/A';
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return 'N/A';
      return new Intl.DateTimeFormat('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }).format(date);
    } catch {
      return 'N/A';
    }
  };

  const getStatusBadge = (status: number) => {
    if (status >= 200 && status < 300) {
      return <Badge className="bg-green-500">{status}</Badge>;
    } else if (status >= 400 && status < 500) {
      return <Badge className="bg-yellow-500">{status}</Badge>;
    } else {
      return <Badge className="bg-red-500">{status}</Badge>;
    }
  };

  const getCacheBadge = (fresh: number, stale: number, expired: number) => {
    if (fresh > stale && fresh > expired) {
      return <Badge className="bg-green-500">Fresh</Badge>;
    } else if (stale > fresh && stale > expired) {
      return <Badge className="bg-yellow-500">Stale</Badge>;
    } else {
      return <Badge className="bg-red-500">Expired</Badge>;
    }
  };

  if (!isSuperAdmin) {
    return null;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Monitorización de Edge Functions</h1>
          <p className="text-muted-foreground mt-1">
            Métricas en tiempo real del sistema
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            Auto-refresh en {countdown}s
          </span>
          <Button onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refrescar ahora
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {isLoading && !data ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-12 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : data ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Llamadas 24h</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {numberFormatter.format(data.summary.total_calls_24h)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Errores 24h</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${data.summary.total_errors_24h > 0 ? 'text-red-500' : ''}`}>
                {numberFormatter.format(data.summary.total_errors_24h)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Funciones Activas</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {numberFormatter.format(data.summary.active_functions)}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {/* Metrics Table */}
      <Card>
        <CardHeader>
          <CardTitle>Métricas por Función</CardTitle>
          <Input
            placeholder="Buscar función..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </CardHeader>
        <CardContent>
          {isLoading && !data ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : data && filteredAndSortedMetrics.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="cursor-pointer" onClick={() => handleSort('function_name')}>
                      Función {sortField === 'function_name' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => handleSort('calls_per_hour')}>
                      Llamadas/h {sortField === 'calls_per_hour' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => handleSort('total_calls_24h')}>
                      Total 24h {sortField === 'total_calls_24h' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => handleSort('error_count')}>
                      Errores {sortField === 'error_count' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => handleSort('error_rate')}>
                      % Error {sortField === 'error_rate' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => handleSort('avg_latency_ms')}>
                      Latencia media {sortField === 'avg_latency_ms' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => handleSort('p95_latency_ms')}>
                      P95 {sortField === 'p95_latency_ms' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedMetrics.map((metric) => (
                    <TableRow
                      key={metric.function_name}
                      className={metric.error_rate > 5 ? 'bg-red-50 dark:bg-red-950/20' : ''}
                    >
                      <TableCell className="font-medium">{metric.function_name}</TableCell>
                      <TableCell>{numberFormatter.format(metric.calls_per_hour)}</TableCell>
                      <TableCell>{numberFormatter.format(metric.total_calls_24h)}</TableCell>
                      <TableCell>{numberFormatter.format(metric.error_count)}</TableCell>
                      <TableCell>{numberFormatter.format(metric.error_rate)}%</TableCell>
                      <TableCell>{numberFormatter.format(metric.avg_latency_ms)} ms</TableCell>
                      <TableCell>{numberFormatter.format(metric.p95_latency_ms)} ms</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No hay datos disponibles
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cache Status */}
      {data && data.cache_status && data.cache_status.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Estado de Caché</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cache Key</TableHead>
                    <TableHead>Fresh</TableHead>
                    <TableHead>Stale</TableHead>
                    <TableHead>Expired</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.cache_status.map((cache) => (
                    <TableRow key={cache.cache_key}>
                      <TableCell className="font-medium">{cache.cache_key}</TableCell>
                      <TableCell>{numberFormatter.format(cache.fresh_count)}</TableCell>
                      <TableCell>{numberFormatter.format(cache.stale_count)}</TableCell>
                      <TableCell>{numberFormatter.format(cache.expired_count)}</TableCell>
                      <TableCell>{numberFormatter.format(cache.total_count)}</TableCell>
                      <TableCell>
                        {getCacheBadge(cache.fresh_count, cache.stale_count, cache.expired_count)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Logs */}
      {data && data.recent_logs && data.recent_logs.length > 0 && (
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="logs">
            <AccordionTrigger className="text-lg font-semibold">
              Ver últimos 100 logs
            </AccordionTrigger>
            <AccordionContent>
              <div className="max-h-[400px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Función</TableHead>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Latencia</TableHead>
                      <TableHead>Detalles</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.recent_logs.filter(log => log.timestamp).map((log, index) => (
                      <TableRow key={index}>
                        <TableCell className="text-xs">
                          {formatTimestamp(log.timestamp)}
                        </TableCell>
                        <TableCell className="font-medium">{log.function_name}</TableCell>
                        <TableCell className="text-xs">{log.user_id.substring(0, 8)}...</TableCell>
                        <TableCell>{getStatusBadge(log.status_code)}</TableCell>
                        <TableCell>{numberFormatter.format(log.latency_ms)} ms</TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                          {typeof log.details === 'object' 
                            ? JSON.stringify(log.details) 
                            : log.details}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}
    </div>
  );
}

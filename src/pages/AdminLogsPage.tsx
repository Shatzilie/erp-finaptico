import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTenantAccess } from '@/hooks/useTenantAccess';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  FileText, 
  Download, 
  Filter, 
  X, 
  AlertCircle, 
  ChevronLeft, 
  ChevronRight,
  CalendarIcon,
  Copy,
  Check
} from 'lucide-react';
import { format, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import Papa from 'papaparse';
import { cn } from '@/lib/utils';

interface AuditLog {
  id: string;
  created_at: string;
  user_id: string;
  action: string;
  resource_type: string;
  status_code: number | null;
  execution_time_ms: number | null;
  details: any;
  data_summary: any;
}

const ENDPOINTS = [
  'Todos',
  'odoo-dashboard-bundle',
  'odoo-dashboard',
  'odoo-expenses',
  'odoo-revenue',
  'odoo-iva',
  'odoo-irpf',
  'odoo-sociedades',
  'odoo-payroll'
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'success', label: 'Success (200-299)' },
  { value: 'client_error', label: 'Client Error (400-499)' },
  { value: 'server_error', label: 'Server Error (500+)' }
];

export default function AdminLogsPage() {
  const { tenantId, tenantSlug, isLoading: tenantLoading } = useTenantAccess();
  const { toast } = useToast();

  // Estados de filtros
  const [dateFrom, setDateFrom] = useState<Date>(subDays(new Date(), 7));
  const [dateTo, setDateTo] = useState<Date>(new Date());
  const [endpointFilter, setEndpointFilter] = useState('Todos');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const ITEMS_PER_PAGE = 100;

  // Fetch logs
  const { data: logsData, isLoading: logsLoading, refetch } = useQuery({
    queryKey: ['admin-logs', tenantId, dateFrom, dateTo, endpointFilter, statusFilter, page],
    queryFn: async () => {
      if (!tenantId) throw new Error('No tenant ID');

      let query = supabase
        .from('audit_log')
        .select('*', { count: 'exact' })
        .eq('tenant_id', tenantId)
        .gte('created_at', dateFrom.toISOString())
        .lte('created_at', dateTo.toISOString())
        .order('created_at', { ascending: false })
        .range((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE - 1);

      // Filtro de endpoint
      if (endpointFilter !== 'Todos') {
        query = query.eq('resource_type', endpointFilter);
      }

      // Filtro de status
      if (statusFilter === 'success') {
        query = query.gte('status_code', 200).lt('status_code', 300);
      } else if (statusFilter === 'client_error') {
        query = query.gte('status_code', 400).lt('status_code', 500);
      } else if (statusFilter === 'server_error') {
        query = query.gte('status_code', 500);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      return { logs: data || [], totalCount: count || 0 };
    },
    enabled: !!tenantId,
    staleTime: 5 * 60 * 1000
  });

  // Limpiar filtros
  const handleClearFilters = () => {
    setDateFrom(subDays(new Date(), 7));
    setDateTo(new Date());
    setEndpointFilter('Todos');
    setStatusFilter('all');
    setPage(1);
  };

  // Export CSV
  const handleExportCSV = async () => {
    try {
      if (!tenantId) return;

      // Fetch todos los logs sin límite
      let query = supabase
        .from('audit_log')
        .select('*')
        .eq('tenant_id', tenantId)
        .gte('created_at', dateFrom.toISOString())
        .lte('created_at', dateTo.toISOString())
        .order('created_at', { ascending: false });

      if (endpointFilter !== 'Todos') {
        query = query.eq('resource_type', endpointFilter);
      }

      if (statusFilter === 'success') {
        query = query.gte('status_code', 200).lt('status_code', 300);
      } else if (statusFilter === 'client_error') {
        query = query.gte('status_code', 400).lt('status_code', 500);
      } else if (statusFilter === 'server_error') {
        query = query.gte('status_code', 500);
      }

      const { data, error } = await query;

      if (error) throw error;

      const csvData = (data || []).map(log => ({
        Fecha: format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss', { locale: es }),
        Usuario: log.user_id || 'Sistema',
        Endpoint: log.resource_type,
        Status: log.status_code || 'N/A',
        'Duración (ms)': log.execution_time_ms || 'N/A',
        Acción: log.action,
        Error: log.details?.error || '-'
      }));

      const csv = Papa.unparse(csvData);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `logs_finaptico_${tenantSlug}_${format(new Date(), 'yyyy-MM-dd')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: 'CSV exportado',
        description: `Se exportaron ${csvData.length} registros`
      });
    } catch (error: any) {
      toast({
        title: 'Error al exportar',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  // Copiar JSON al portapapeles
  const handleCopyJSON = () => {
    if (!selectedLog) return;
    
    const jsonData = {
      request: selectedLog.data_summary,
      response: selectedLog.details,
      error: selectedLog.details?.error || null
    };

    navigator.clipboard.writeText(JSON.stringify(jsonData, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Obtener color del badge según status
  const getStatusBadgeVariant = (status: number | null): "default" | "secondary" | "destructive" => {
    if (!status) return "secondary";
    if (status >= 200 && status < 300) return "default";
    if (status >= 400 && status < 500) return "secondary";
    return "destructive";
  };

  if (tenantLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Skeleton className="w-20 h-20 rounded-full" />
      </div>
    );
  }

  // Verificar permisos de admin (simplificado por ahora)
  // TODO: Implementar verificación real con tabla user_roles
  if (!tenantId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Acceso denegado. Solo administradores pueden ver esta página.</AlertDescription>
        </Alert>
      </div>
    );
  }

  const logs = logsData?.logs || [];
  const totalCount = logsData?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <FileText className="h-8 w-8" />
          Logs de Auditoría
        </h1>
        <p className="text-muted-foreground">Monitoreo de llamadas a Edge Functions y errores del sistema</p>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
          <CardDescription>Filtra los logs por fecha, endpoint y estado</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Fecha desde */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Desde</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(dateFrom, 'dd/MM/yyyy', { locale: es })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateFrom}
                    onSelect={(date) => date && setDateFrom(date)}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Fecha hasta */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Hasta</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(dateTo, 'dd/MM/yyyy', { locale: es })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateTo}
                    onSelect={(date) => date && setDateTo(date)}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Endpoint */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Endpoint</label>
              <Select value={endpointFilter} onValueChange={setEndpointFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ENDPOINTS.map(endpoint => (
                    <SelectItem key={endpoint} value={endpoint}>{endpoint}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Estado</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button onClick={() => refetch()}>
              <Filter className="mr-2 h-4 w-4" />
              Aplicar filtros
            </Button>
            <Button variant="outline" onClick={handleClearFilters}>
              <X className="mr-2 h-4 w-4" />
              Limpiar filtros
            </Button>
            <Button variant="outline" onClick={handleExportCSV} className="ml-auto">
              <Download className="mr-2 h-4 w-4" />
              Exportar CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de logs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Registros de auditoría</CardTitle>
            <span className="text-sm text-muted-foreground">
              Mostrando {Math.min((page - 1) * ITEMS_PER_PAGE + 1, totalCount)}-{Math.min(page * ITEMS_PER_PAGE, totalCount)} de {totalCount} resultados
            </span>
          </div>
        </CardHeader>
        <CardContent>
          {logsLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="w-full h-12" />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>No hay logs para los filtros seleccionados</AlertDescription>
            </Alert>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha/Hora</TableHead>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Endpoint</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Duración</TableHead>
                      <TableHead>Error</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-mono text-sm">
                          {format(new Date(log.created_at), 'dd MMM yyyy, HH:mm:ss', { locale: es })}
                        </TableCell>
                        <TableCell className="text-sm">
                          {log.user_id || 'Sistema'}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {log.resource_type}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(log.status_code)}>
                            {log.status_code || 'N/A'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {log.execution_time_ms ? `${log.execution_time_ms} ms` : '-'}
                        </TableCell>
                        <TableCell className="max-w-xs truncate text-sm">
                          {log.details?.error || '-'}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedLog(log);
                              setIsDialogOpen(true);
                            }}
                          >
                            Ver detalle
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Paginación */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Anterior
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Página {page} de {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Siguiente
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialog de detalle */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalle del Log</DialogTitle>
            <DialogDescription>
              {selectedLog && format(new Date(selectedLog.created_at), 'dd MMMM yyyy, HH:mm:ss', { locale: es })}
            </DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyJSON}
                >
                  {copied ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Copiado
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-4 w-4" />
                      Copiar JSON
                    </>
                  )}
                </Button>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Request Payload</h4>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs">
                  {JSON.stringify(selectedLog.data_summary, null, 2)}
                </pre>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Response Preview</h4>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs">
                  {JSON.stringify(selectedLog.details, null, 2)}
                </pre>
              </div>

              {selectedLog.details?.error && (
                <div>
                  <h4 className="font-semibold mb-2">Error Message</h4>
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="font-mono text-xs">
                      {selectedLog.details.error}
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

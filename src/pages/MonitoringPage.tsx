import { useTenantAccess } from '@/hooks/useTenantAccess';
import { useMonitoringData } from '@/hooks/useMonitoringData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export default function MonitoringPage() {
  const { role, isLoading: roleLoading } = useTenantAccess();
  const { data, isLoading, error, refetch } = useMonitoringData();

  // Check admin role
  if (roleLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-[400px]" />
          ))}
        </div>
      </div>
    );
  }

  if (role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            Solo los administradores pueden acceder al dashboard de monitoreo.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const lastUpdate = new Date().toLocaleString('es-ES');

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Monitoring Dashboard</h1>
          <p className="text-muted-foreground">Última actualización: {lastUpdate}</p>
        </div>
        <Button onClick={() => refetch()} variant="outline" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            No se pudieron cargar las métricas: {error.message}
          </AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-[400px]" />
          ))}
        </div>
      ) : data ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* User Activity (24h) */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>User Activity (24h)</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Actions</TableHead>
                    <TableHead>Last Activity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.user_activity?.map((user: any) => (
                    <TableRow key={user.user_id}>
                      <TableCell className="font-medium">{user.email}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{user.total_requests}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(user.last_access).toLocaleString('es-ES')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Rate Limit Exceeded (7d) */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>Rate Limit Exceeded (7d)</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Endpoint</TableHead>
                    <TableHead>Count</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.rate_limit_exceeded?.length > 0 ? (
                    data.rate_limit_exceeded.map((item: any, idx: number) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{item.email}</TableCell>
                        <TableCell className="text-sm">{item.endpoint}</TableCell>
                        <TableCell>
                          <Badge variant="destructive">{item.exceeded_count}</Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground">
                        No rate limits exceeded
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Endpoint Performance (24h) */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>Endpoint Performance (24h)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.endpoint_performance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="endpoint" angle={-45} textAnchor="end" height={100} />
                  <YAxis label={{ value: 'ms', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Bar dataKey="avg_ms" fill="#8884d8" name="Avg Duration (ms)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Actions by Type (24h) */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>Actions by Type (24h)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data.actions_by_type}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.action}: ${entry.total_count}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="total_count"
                  >
                    {data.actions_by_type?.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Sync Stats (7d) */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>Sync Stats (7d)</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Success</TableHead>
                    <TableHead>Failed</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.sync_stats?.map((stat: any) => (
                    <TableRow key={stat.tenant_id}>
                      <TableCell className="font-medium">{stat.tenant_name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{stat.total_syncs}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                          {stat.successful_syncs}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="destructive">{stat.failed_syncs}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Current Rate Limits */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>Current Rate Limits</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Endpoint</TableHead>
                    <TableHead>Count</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.current_rate_limits?.slice(0, 10).map((limit: any, idx: number) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{limit.email}</TableCell>
                      <TableCell className="text-sm">{limit.endpoint}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{limit.request_count}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={limit.status === 'ok' ? 'default' : 'destructive'}
                          className={limit.status === 'ok' ? 'bg-green-500 hover:bg-green-600' : ''}
                        >
                          {limit.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}

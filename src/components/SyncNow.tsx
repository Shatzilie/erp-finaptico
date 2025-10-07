import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useAuthenticatedFetch } from '@/hooks/useAuthenticatedFetch';
import { handleApiError } from '@/lib/apiErrorHandler';

interface SyncNowProps {
  slug: string;
  onSyncComplete?: () => void;
}

export function SyncNow({ slug, onSyncComplete }: SyncNowProps) {
  const [loading, setLoading] = useState(false);
  const { fetchWithTimeout } = useAuthenticatedFetch();

  const handleSync = async () => {
    setLoading(true);
    try {
      const data = await fetchWithTimeout(
        'odoo-sync',
        { tenant_slug: slug },
        { timeout: 60000, retries: 0 }
      );

      if (data.ok) {
        console.log('✅ Sincronización completada');
        onSyncComplete?.();
      } else {
        throw new Error('Error en la sincronización');
      }
    } catch (error: any) {
      handleApiError(error, 'Sincronización');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      disabled={loading} 
      onClick={handleSync}
      variant="default"
      className="gap-2"
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {loading ? 'Sincronizando…' : 'Sincronizar ahora'}
    </Button>
  );
}
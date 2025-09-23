import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface SyncNowProps {
  slug: string;
  onSyncComplete?: () => void;
}

export function SyncNow({ slug, onSyncComplete }: SyncNowProps) {
  const [loading, setLoading] = useState(false);

  const handleSync = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('odoo-sync', {
        body: {
          baseUrl: 'https://young-minds-big-ideas-sl.odoo.com',
          db: 'young-minds-big-ideas-sl',
          username: 'finances@ymbi.eu',
          password: '@77313325kK@'
        }
      });
      
      if (error) {
        console.error('Sync error:', error);
        alert('Error en la sincronización');
      } else {
        console.log('Sync completed successfully');
        onSyncComplete?.();
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      alert('Error inesperado');
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
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

// Nueva interfaz
interface SyncNowPropsNew {
  onRefresh: () => void;
  isRefreshing: boolean;
  slug?: never;
  onSyncComplete?: never;
}

// Interfaz legacy (deprecated)
interface SyncNowPropsLegacy {
  slug: string;
  onSyncComplete?: () => void;
  onRefresh?: never;
  isRefreshing?: never;
}

type SyncNowProps = SyncNowPropsNew | SyncNowPropsLegacy;

export function SyncNow(props: SyncNowProps) {
  // Nueva versión con React Query
  if ('onRefresh' in props && props.onRefresh) {
    return (
      <Button 
        disabled={props.isRefreshing} 
        onClick={props.onRefresh}
        variant="outline"
        className="gap-2"
      >
        {props.isRefreshing && <Loader2 className="h-4 w-4 animate-spin" />}
        {props.isRefreshing ? 'Sincronizando…' : 'Sincronizar ahora'}
      </Button>
    );
  }

  // Versión legacy (deprecated) - mostrar solo el botón sin funcionalidad por ahora
  return (
    <Button 
      disabled={true}
      variant="outline"
      className="gap-2"
    >
      Sincronizar ahora
    </Button>
  );
}
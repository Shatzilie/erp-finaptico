import { Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface FreshnessBadgeProps {
  cachedAt?: string;
  seconds?: number; // Deprecated: para retrocompatibilidad
}

export const FreshnessBadge: React.FC<FreshnessBadgeProps> = ({ cachedAt, seconds }) => {
  const calculateMinutes = (timestamp?: string): number => {
    if (!timestamp) return 0;
    const cachedTime = new Date(timestamp).getTime();
    const now = Date.now();
    return Math.floor((now - cachedTime) / (1000 * 60));
  };

  // Usar cachedAt si está disponible, sino usar seconds (retrocompatibilidad)
  const minutes = cachedAt ? calculateMinutes(cachedAt) : Math.floor((seconds || 0) / 60);

  const getVariant = () => {
    if (minutes < 5) return 'default';
    if (minutes <= 60) return 'secondary';
    return 'destructive';
  };

  // Para retrocompatibilidad con seconds
  if (seconds !== undefined && !cachedAt) {
    const formatTime = (seconds: number): string => {
      if (seconds < 60) {
        return `${seconds}s`;
      } else if (seconds < 3600) {
        const minutes = Math.floor(seconds / 60);
        return `${minutes} min`;
      } else {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return minutes > 0 ? `${hours}h ${minutes}min` : `${hours}h`;
      }
    };

    return (
      <Badge variant="secondary" className="gap-1.5 text-xs font-medium">
        <Clock className="h-3 w-3" />
        Datos hace {formatTime(seconds)}
      </Badge>
    );
  }

  if (!cachedAt) {
    return (
      <Badge variant="secondary" className="gap-1.5 text-xs font-medium">
        <Clock className="h-3 w-3" />
        Sin datos
      </Badge>
    );
  }

  return (
    <Badge variant={getVariant()} className="gap-1.5 text-xs font-medium">
      <Clock className="h-3 w-3" />
      Actualizado hace {minutes} min
    </Badge>
  );
};
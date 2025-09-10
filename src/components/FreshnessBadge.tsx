import { Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface FreshnessBadgeProps {
  seconds: number;
}

export const FreshnessBadge: React.FC<FreshnessBadgeProps> = ({ seconds }) => {
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
};
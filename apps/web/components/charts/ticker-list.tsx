'use client';

import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

interface Props {
  tickers: string[];
  onRemove: (ticker: string) => void;
  colors: string[];
}

export function TickerList({ tickers, onRemove, colors }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {tickers.map((t, i) => (
        <Badge
          key={t}
          style={{
            backgroundColor: colors[i % colors.length],
            color: 'white',
          }}
          className="flex items-center gap-1 pr-1"
        >
          {t}
          <X className="w-3 h-3 cursor-pointer" onClick={() => onRemove(t)} />
        </Badge>
      ))}
    </div>
  );
}

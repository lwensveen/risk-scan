'use client';

import { Button } from '@/components/ui/button';

interface Props {
  onCSV: () => void;
  onPNG: () => void;
}

export function ExportButtons({ onCSV, onPNG }: Props) {
  return (
    <div className="flex gap-2 mt-2">
      <Button onClick={onCSV} variant="outline" size="sm">
        Export CSV
      </Button>
      <Button onClick={onPNG} variant="outline" size="sm">
        Export PNG
      </Button>
    </div>
  );
}

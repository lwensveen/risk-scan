'use client';

import { Input } from '@/components/ui/input';
import { useCallback } from 'react';

interface Props {
  value: string;
  onChange: (val: string) => void;
  onSubmit: () => void;
}

export function TickerInput({ value, onChange, onSubmit }: Props) {
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') onSubmit();
    },
    [onSubmit]
  );

  return (
    <Input
      placeholder="Add custom ticker (e.g. ARCC)"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={handleKeyDown}
      className="max-w-sm"
    />
  );
}

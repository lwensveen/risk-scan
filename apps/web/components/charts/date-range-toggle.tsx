'use client';

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

interface Props {
  value: 30 | 60 | 90;
  onChange: (v: 30 | 60 | 90) => void;
}

export function DateRangeToggle({ value, onChange }: Props) {
  return (
    <ToggleGroup
      type="single"
      value={String(value)}
      onValueChange={(v) => onChange(Number(v) as 30 | 60 | 90)}
    >
      <ToggleGroupItem value="30">30d</ToggleGroupItem>
      <ToggleGroupItem value="60">60d</ToggleGroupItem>
      <ToggleGroupItem value="90">90d</ToggleGroupItem>
    </ToggleGroup>
  );
}

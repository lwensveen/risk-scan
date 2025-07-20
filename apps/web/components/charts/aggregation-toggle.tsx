'use client';

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

interface Props {
  value: 'count' | 'avg';
  onChange: (v: 'count' | 'avg') => void;
}

export function AggregationToggle({ value, onChange }: Props) {
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(v) => onChange(v as 'count' | 'avg')}
    >
      <ToggleGroupItem value="count">Count</ToggleGroupItem>
      <ToggleGroupItem value="avg">Average</ToggleGroupItem>
    </ToggleGroup>
  );
}

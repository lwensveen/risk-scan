'use client';

import { useEffect, useState } from 'react';
import { RiskFlag } from '@risk-scan/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const apiBase = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:3001';

export default function FlagsPage() {
  const [flags, setFlags] = useState<RiskFlag[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${apiBase}/flags/latest`)
      .then((r) => r.json())
      .then(setFlags)
      .catch((e) => setErr(e.message));
  }, []);

  if (err) {
    return (
      <div className="p-6 max-w-xl mx-auto">
        <Alert variant="destructive">
          <AlertTitle>Error loading flags</AlertTitle>
          <AlertDescription>{err}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!flags) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-4">
        <Skeleton className="w-full h-24" />
        <Skeleton className="w-full h-48" />
        <Skeleton className="w-full h-36" />
      </div>
    );
  }

  const grouped: Record<string, RiskFlag[]> = {};
  for (const f of flags) {
    (grouped[f.category] = grouped[f.category] || []).push(f);
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {Object.entries(grouped).map(([category, items]) => (
        <Card key={category}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{category}</span>
              <Badge variant="secondary">{items.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {items.map((f) => (
              <div
                key={`${f.ticker}-${f.ts}`}
                className="flex flex-col md:flex-row md:items-center md:justify-between gap-2"
              >
                <span className="font-mono text-sm md:w-28">{f.ticker}</span>

                <div className="flex flex-wrap gap-1">
                  {f.flags.map((flag) => (
                    <Badge key={flag} variant="outline" className="text-xs">
                      {flag}
                    </Badge>
                  ))}
                </div>

                <span className="text-xs text-muted-foreground md:text-right md:w-32">
                  {new Date(Number(f.ts)).toLocaleDateString()}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

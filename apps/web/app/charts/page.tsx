'use client';

import { useEffect, useRef, useState } from 'react';
import { RiskFlag } from '@risk-scan/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DateRangeToggle } from '@/components/charts/date-range-toggle';
import { TickerInput } from '@/components/charts/ticker-input';
import { TickerList } from '@/components/charts/ticker-list';
import { AggregationToggle } from '@/components/charts/aggregation-toggle';
import { ExportButtons } from '@/components/charts/export-buttons';
import { ErrorAlert } from '@/components/charts/error-alert';
import { ChartCard } from '@/components/charts/chart-card';
import {
  ChartRow,
  COLOR_PALETTE,
  exportToCSV,
  exportToPNG,
  groupFlagsByCategory,
  groupFlagsByDate,
  parseQueryTickers,
  stringifyTickers,
} from '@/lib/chart-utils';
import { useDebounce } from '@/lib/debounce';

export default function ChartsPage() {
  const search =
    typeof window !== 'undefined'
      ? (new URLSearchParams(window.location.search).get('tickers') ??
        undefined)
      : undefined;
  const [inputTicker, setInputTicker] = useState('SIVB');
  const [selectedTickers, setSelectedTickers] = useState<string[]>(
    parseQueryTickers(search)
  );
  const [range, setRange] = useState<30 | 60 | 90>(30);
  const [aggregation, setAggregation] = useState<'count' | 'avg'>('count');
  const [chartData, setChartData] = useState<{
    merged?: ChartRow[];
    categories?: Record<string, ChartRow[]>;
  }>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);
  const debouncedTickers = useDebounce(selectedTickers, 300);

  useEffect(() => {
    const controller = new AbortController();
    const fetchFlags = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE}/api/flags?tickers=${debouncedTickers.join(',')}&range=${range}`,
          { signal: controller.signal }
        );
        const flags: RiskFlag[] = await res.json();
        const merged = groupFlagsByDate(flags, debouncedTickers, aggregation);
        const categories = groupFlagsByCategory(
          flags,
          debouncedTickers,
          aggregation
        );
        setChartData({ merged, categories });
        history.replaceState(
          null,
          '',
          `?tickers=${stringifyTickers(debouncedTickers)}`
        );
      } catch (e: any) {
        if (e.name !== 'AbortError') setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    if (debouncedTickers.length) fetchFlags();
    return () => controller.abort();
  }, [debouncedTickers, range, aggregation]);

  const handleAddTicker = () => {
    const next = inputTicker.toUpperCase().trim();
    if (next && !selectedTickers.includes(next)) {
      setSelectedTickers((t) => [...t, next]);
      setInputTicker('');
    }
  };

  const handleRemoveTicker = (ticker: string) => {
    setSelectedTickers((t) => t.filter((x) => x !== ticker));
  };

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Flag Trend Comparison</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <TickerInput
              value={inputTicker}
              onChange={setInputTicker}
              onSubmit={handleAddTicker}
            />
            <TickerList
              tickers={selectedTickers}
              onRemove={handleRemoveTicker}
              colors={COLOR_PALETTE}
            />
            <DateRangeToggle value={range} onChange={setRange} />
            <AggregationToggle value={aggregation} onChange={setAggregation} />
          </div>
          <ExportButtons
            onCSV={() => exportToCSV(chartData.merged ?? [], selectedTickers)}
            onPNG={() => exportToPNG(chartRef)}
          />
          {error && <ErrorAlert message={error} />}
          {loading || !chartData.merged ? (
            <Skeleton className="w-full h-[300px]" />
          ) : (
            <div ref={chartRef}>
              <ChartCard
                title="Total Flags"
                tickers={selectedTickers}
                data={chartData.merged}
                colors={COLOR_PALETTE}
              />
            </div>
          )}
        </CardContent>
      </Card>
      {(chartData.categories &&
        Object.entries(chartData.categories).map(([cat, data]) => (
          <ChartCard
            key={cat}
            title={cat}
            tickers={selectedTickers}
            data={data}
            colors={COLOR_PALETTE}
          />
        ))) ||
        null}
    </main>
  );
}

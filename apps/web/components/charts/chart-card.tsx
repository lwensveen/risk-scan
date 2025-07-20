'use client';

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface Props {
  title: string;
  data: { date: string; [ticker: string]: number | string }[];
  tickers: string[];
  colors: string[];
}

export function ChartCard({ title, data, tickers, colors }: Props) {
  return (
    <div className="bg-white dark:bg-zinc-950 p-4 rounded-md">
      <h2 className="text-lg font-medium mb-2">{title}</h2>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data} margin={{ left: 20, right: 20 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          {tickers.map((ticker, i) => (
            <Area
              key={ticker}
              type="monotone"
              dataKey={ticker}
              stroke={colors[i % colors.length]}
              fillOpacity={0.15}
              fill={colors[i % colors.length]}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type ThemeImageProps = {
  srcLight: string;
  srcDark: string;
  alt: string;
  width: number;
  height: number;
  priority?: boolean;
};

const ThemeImage = ({ srcLight, srcDark, ...rest }: ThemeImageProps) => (
  <>
    <Image {...rest} src={srcLight} className="block dark:hidden" />
    <Image {...rest} src={srcDark} className="hidden dark:block" />
  </>
);

export default function Home() {
  return (
    <main className="max-w-6xl mx-auto p-6 space-y-8">
      <header className="flex items-center justify-between">
        <ThemeImage
          srcLight="/logo-dark.svg"
          srcDark="/logo-light.svg"
          alt="RiskScan Logo"
          width={160}
          height={32}
          priority
        />
        <Button>Run Daily ETL</Button>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Risk Flags</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="font-mono text-sm">BXP</span>
              <Badge variant="destructive">LEVERAGE</Badge>
            </div>
            <div className="flex justify-between">
              <span className="font-mono text-sm">HBAN</span>
              <Badge>LIQUIDITY</Badge>
            </div>
            <div className="flex justify-between">
              <span className="font-mono text-sm">USDC</span>
              <Badge variant="outline">DEPEG RISK</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>ETL Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Last run: <span className="text-foreground">6:30 AM</span>
            </p>
            <p className="text-sm text-muted-foreground">
              Duration: <span className="text-foreground">2m 12s</span>
            </p>
            <p className="text-sm text-muted-foreground">
              Next run:{' '}
              <span className="text-foreground">Tomorrow 6:30 AM</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-foreground">
              API: <Badge variant="success">Up</Badge>
            </p>
            <p className="text-sm text-foreground">
              Redis: <Badge variant="success">Connected</Badge>
            </p>
            <p className="text-sm text-foreground">
              DB: <Badge variant="success">Healthy</Badge>
            </p>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

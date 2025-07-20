'use client';

import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';

export function ModeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex gap-2">
      <Button
        variant={theme === 'light' ? 'default' : 'ghost'}
        onClick={() => setTheme('light')}
      >
        Light
      </Button>
      <Button
        variant={theme === 'dark' ? 'default' : 'ghost'}
        onClick={() => setTheme('dark')}
      >
        Dark
      </Button>
      <Button
        variant={theme === 'system' ? 'default' : 'ghost'}
        onClick={() => setTheme('system')}
      >
        System
      </Button>
    </div>
  );
}

'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function ErrorAlert({ message }: { message: string }) {
  return (
    <Alert variant="destructive" className="mt-4">
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}

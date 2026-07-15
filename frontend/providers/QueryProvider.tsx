'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ReactNode, useState } from 'react';

export function QueryProvider({ children }: { children: ReactNode }) {
const [queryClient] = useState(
  () =>
    new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 60 * 1000, // 1 min
          gcTime: 5 * 60 * 1000, // 5 min
          retry: (failureCount, error: any) => {
            const status = error?.response?.status;
            // Never retry rate-limit or client errors — retrying a 429 just
            // adds more requests against an already-exhausted limit.
            if (status === 429 || (status >= 400 && status < 500)) return false;
            return failureCount < 1;
          },
          refetchOnWindowFocus: false,
        },
        mutations: {
          retry: 0,
        },
      },
    }),
);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}
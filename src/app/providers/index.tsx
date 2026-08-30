import { QueryClientProvider } from "@tanstack/react-query"
import type { FC, ReactNode } from "react"
import { Suspense } from "react"

import { ErrorBoundary } from "./error-boundary"
import { ThemeProvider } from "./theme-provider"

import { queryClient, ReactQueryDevtools } from "@/shared/lib"

export { ErrorBoundary }

interface IAppProvidersProps {
  children: ReactNode
}

export const AppProviders: FC<IAppProvidersProps> = ({ children }) => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="system" storageKey="ui-theme">
          {children}
          <Suspense fallback={null}>
            <ReactQueryDevtools initialIsOpen={false} />
          </Suspense>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

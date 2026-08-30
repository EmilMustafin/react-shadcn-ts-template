import { AlertCircleIcon, RefreshCwIcon, RotateCcwIcon } from "lucide-react"
import { Component, type ErrorInfo, type ReactNode } from "react"
import { Translation } from "react-i18next"

import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/shared/ui/empty"

interface IErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface IErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<IErrorBoundaryProps, IErrorBoundaryState> {
  constructor(props: IErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): IErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("ErrorBoundary caught an error:", error, errorInfo)

    this.props.onError?.(error, errorInfo)
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null })
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <Translation>
          {(t) => (
            <div className="bg-background flex min-h-screen w-screen items-center justify-center">
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <AlertCircleIcon className="text-destructive" />
                  </EmptyMedia>
                  <EmptyTitle>{t("errorBoundary.title")}</EmptyTitle>
                  <EmptyDescription>{t("errorBoundary.description")}</EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  {this.state.error && (
                    <Alert variant="destructive">
                      <AlertCircleIcon />
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription className="break-all">
                        {this.state.error.message}
                      </AlertDescription>
                    </Alert>
                  )}
                  <div className="flex gap-2">
                    <Button onClick={this.handleReset} variant="outline">
                      <RotateCcwIcon />
                      {t("errorBoundary.tryAgain")}
                    </Button>
                    <Button onClick={() => window.location.reload()}>
                      <RefreshCwIcon />
                      {t("errorBoundary.reloadPage")}
                    </Button>
                  </div>
                </EmptyContent>
              </Empty>
            </div>
          )}
        </Translation>
      )
    }

    return this.props.children
  }
}

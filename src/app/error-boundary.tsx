import { ReactNode, Component, ErrorInfo } from "react";
import * as Sentry from "@sentry/react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Global Error Boundary component
 * Catches React errors and prevents app crash
 * Integrates with Sentry for error tracking
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught error:", error, errorInfo);
    Sentry.captureException(error, {
      contexts: { react: { componentStack: errorInfo.componentStack } },
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-center bg-background">
            <div className="max-w-md">
              <h1 className="text-2xl font-bold text-foreground mb-2">
                Terjadi Kesalahan
              </h1>
              <p className="text-sm text-muted-foreground mb-6">
                Aplikasi mengalami masalah. Silakan muat ulang halaman atau coba
                beberapa saat lagi.
              </p>
              {(
                <details className="text-left bg-muted p-4 rounded-md mb-6">
                  <summary className="cursor-pointer font-mono text-xs font-semibold">
                    Error Details
                  </summary>
                  <pre className="mt-2 text-xs overflow-auto max-h-48 bg-background p-2 rounded">
                    {this.state.error?.message}
                  </pre>
                </details>
              )}
              <button
                onClick={() => window.location.reload()}
                className="w-full px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition"
              >
                Muat Ulang Halaman
              </button>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

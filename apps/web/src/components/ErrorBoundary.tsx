import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import logoMark from "../assets/gis-academy-logo.svg";

type Props = {
  children: ReactNode;
  fallback?: ReactNode;
};

type State = {
  hasError: boolean;
  error: Error | null;
};

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <main className="error-page">
          <div className="error-page-inner">
            <div className="not-found-brand">
              <div className="brand-mark brand-mark--lg">
                <img src={logoMark} alt="" />
              </div>
              <span className="not-found-brand-name">Knowledge Hub</span>
            </div>

            <div className="error-page-icon" aria-hidden="true">
              <AlertTriangle size={56} strokeWidth={1.4} />
            </div>

            <div className="not-found-copy">
              <h1>Something went wrong.</h1>
              <p>
                An unexpected error occurred. Our team has been notified. You can
                try refreshing the page, or go back to the dashboard.
              </p>
              {this.state.error && (
                <details className="error-detail">
                  <summary>Error details</summary>
                  <code>{this.state.error.message}</code>
                </details>
              )}
            </div>

            <div className="not-found-actions">
              <button
                className="secondary-button not-found-back-btn"
                onClick={this.handleReset}
                type="button"
              >
                <RefreshCw size={17} />
                Try again
              </button>
              <a href="/dashboard" className="primary-button not-found-home-btn">
                Back to dashboard
              </a>
            </div>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}

// src/components/ErrorBoundary.tsx
// Reusable error boundary for catching and displaying React errors

"use client";

import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Error boundary component that catches JavaScript errors in child components.
 * Displays a fallback UI instead of crashing the entire app.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    const { hasError } = this.state;
    const { fallback, children } = this.props;

    if (hasError) {
      if (fallback) {
        return fallback;
      }

      return (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-6 text-center">
          <h2 className="mb-2 text-lg font-semibold text-destructive">
            Something went wrong
          </h2>
          <p className="mb-4 text-sm text-muted-foreground">
            An unexpected error occurred. Please try refreshing the page.
          </p>
          <button
            type="button"
            onClick={this.handleRetry}
            className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Try Again
          </button>
        </div>
      );
    }

    return children;
  }
}

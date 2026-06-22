"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { logError } from "@/lib/logging/production-logger";
import RmsErrorState from "./RmsErrorState";

type Props = {
  children: ReactNode;
  context?: string;
  fallbackTitle?: string;
};

type State = {
  error: Error | null;
};

export default class RmsErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    logError("RMS error boundary caught error", {
      context: this.props.context ?? "rms-error-boundary",
      error,
      meta: { componentStack: info.componentStack },
    });
  }

  private retry = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-[40vh] items-center justify-center p-6">
          <div className="w-full max-w-lg space-y-4">
            <RmsErrorState
              title={this.props.fallbackTitle ?? "Ett oväntat fel inträffade"}
              message={
                this.state.error.message ||
                "Ladda om sidan eller försök igen om en stund."
              }
              onRetry={this.retry}
            />
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

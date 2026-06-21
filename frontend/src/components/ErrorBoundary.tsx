import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ErrorState } from './ui/ErrorState';
import { ServerCrash } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <ErrorState
          title="Something Went Wrong"
          message="Our team has been notified of this issue. Please try again later."
          icon={<ServerCrash size={48} />}
          showHomeButton={true}
          showReloadButton={true}
        />
      );
    }

    return this.props.children;
  }
}

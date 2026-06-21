import React from 'react';
import { useNavigate } from 'react-router-dom';
import { StateLayout } from './StateLayout';
import { ServerErrorIllustration } from './illustrations/ServerErrorIllustration';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  illustration?: React.ReactNode;
  onRetry?: () => void;
  retrying?: boolean;
  showHomeButton?: boolean;
  showReloadButton?: boolean;
  actions?: React.ReactNode;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Oops, something went wrong',
  message = 'We encountered an unexpected error. Please try again later.',
  illustration,
  onRetry,
  retrying = false,
  showHomeButton = false,
  showReloadButton = false,
  actions,
}) => {
  const navigate = useNavigate();

  const primaryBtn = onRetry ? (
    <button
      onClick={onRetry}
      disabled={retrying}
      className="btn-primary"
    >
      {retrying ? (
        <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
      ) : (
        'Try Again'
      )}
    </button>
  ) : showReloadButton ? (
    <button
      onClick={() => window.location.reload()}
      className="btn-primary"
    >
      Reload Page
    </button>
  ) : null;

  const secondaryBtn = showHomeButton ? (
    <button
      onClick={() => navigate('/')}
      className="btn-outline"
    >
      Go Home
    </button>
  ) : actions;

  return (
    <StateLayout
      illustration={illustration || <ServerErrorIllustration />}
      title={title}
      description={message}
      primaryAction={primaryBtn}
      secondaryAction={secondaryBtn}
    />
  );
};

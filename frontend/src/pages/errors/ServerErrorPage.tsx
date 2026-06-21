import React from 'react';
import { useNavigate } from 'react-router-dom';
import { StateLayout } from '../../components/ui/StateLayout';
import { ServerErrorIllustration } from '../../components/ui/illustrations/ServerErrorIllustration';

export const ServerErrorPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[var(--cream)] flex items-center justify-center p-6">
      <StateLayout
        illustration={<ServerErrorIllustration />}
        title="Oops, kitchen mishap!"
        description="Something went wrong in our kitchen while preparing your request. Our chefs are already cleaning it up."
        primaryAction={
          <button onClick={() => window.location.reload()} className="btn-primary w-full sm:w-auto">
            Try Again
          </button>
        }
        secondaryAction={
          <button onClick={() => navigate('/')} className="btn-outline w-full sm:w-auto">
            Return Home
          </button>
        }
      />
    </div>
  );
};

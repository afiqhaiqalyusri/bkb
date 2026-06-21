import React from 'react';
import { useNavigate } from 'react-router-dom';
import { StateLayout } from '../../components/ui/StateLayout';
import { ClosedSignIllustration } from '../../components/ui/illustrations/ClosedSignIllustration';

export const ServiceUnavailablePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[var(--cream)] flex items-center justify-center p-6">
      <StateLayout
        illustration={<ClosedSignIllustration />}
        title="We're taking a short break"
        description="Our kitchen is temporarily closed for maintenance. We'll be back online to serve you shortly!"
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

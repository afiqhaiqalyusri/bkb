import React from 'react';
import { useNavigate } from 'react-router-dom';
import { StateLayout } from '../../components/ui/StateLayout';
import { RestrictedIllustration } from '../../components/ui/illustrations/RestrictedIllustration';

export const AccessDeniedPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[var(--cream)] flex items-center justify-center p-6">
      <StateLayout
        illustration={<RestrictedIllustration />}
        title="Restricted Area"
        description="This area is strictly for staff. It looks like you don't have the keys to this part of the kitchen."
        primaryAction={
          <button onClick={() => navigate('/')} className="btn-primary w-full sm:w-auto">
            Return Home
          </button>
        }
      />
    </div>
  );
};

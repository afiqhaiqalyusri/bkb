import React from 'react';
import { useNavigate } from 'react-router-dom';
import { StateLayout } from '../../components/ui/StateLayout';
import { RestrictedIllustration } from '../../components/ui/illustrations/RestrictedIllustration';

export const UnauthorizedPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[var(--cream)] flex items-center justify-center p-6">
      <StateLayout
        illustration={<RestrictedIllustration />}
        title="Hold on a second!"
        description="You need to sign in before you can place an order or view your rewards."
        primaryAction={
          <button onClick={() => navigate('/login')} className="btn-primary w-full sm:w-auto">
            Sign In
          </button>
        }
        secondaryAction={
          <button onClick={() => navigate('/register')} className="btn-outline w-full sm:w-auto">
            Create Account
          </button>
        }
      />
    </div>
  );
};

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { StateLayout } from '../../components/ui/StateLayout';
import { NotFoundIllustration } from '../../components/ui/illustrations/NotFoundIllustration';

export const OrderNotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[var(--cream)] flex items-center justify-center p-6">
      <StateLayout
        illustration={<NotFoundIllustration />}
        title="Order Not Found"
        description="We couldn't locate this order in our system. It might have been placed under a different account or the tracking link has expired."
        primaryAction={
          <button onClick={() => navigate('/history')} className="btn-primary w-full sm:w-auto">
            View My Orders
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

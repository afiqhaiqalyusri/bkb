import React from 'react';
import { useNavigate } from 'react-router-dom';
import { StateLayout } from '../../components/ui/StateLayout';
import { NotFoundIllustration } from '../../components/ui/illustrations/NotFoundIllustration';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[var(--cream)] flex items-center justify-center p-6">
      <StateLayout
        illustration={<NotFoundIllustration />}
        title="Oopsie! Something's missing..."
        description="Looks like this item isn't on today's menu. The page you were looking for doesn't exist, isn't available, or was loading incorrectly."
        primaryAction={
          <button onClick={() => navigate('/')} className="btn-primary w-full sm:w-auto">
            Browse Menu
          </button>
        }
      />
    </div>
  );
};

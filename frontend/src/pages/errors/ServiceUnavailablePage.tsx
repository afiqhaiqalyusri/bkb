import React from 'react';
import { ErrorState } from '../../components/ui/ErrorState';
import { Settings } from 'lucide-react';

export const ServiceUnavailablePage: React.FC = () => {
  return (
    <ErrorState
      title="We'll Be Back Soon"
      message="The service is temporarily unavailable."
      icon={<Settings size={48} className="animate-spin-slow" />}
      showHomeButton={true}
      showReloadButton={true}
    />
  );
};

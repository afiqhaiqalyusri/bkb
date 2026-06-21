import React from 'react';
import { ErrorState } from '../../components/ui/ErrorState';
import { ServerCrash } from 'lucide-react';

export const ServerErrorPage: React.FC = () => {
  return (
    <ErrorState
      title="Something Went Wrong"
      message="Our team has been notified. Please try again later."
      icon={<ServerCrash size={48} />}
      showHomeButton={true}
      showReloadButton={true}
    />
  );
};

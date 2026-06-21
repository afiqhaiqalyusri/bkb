import React from 'react';
import { StateLayout } from './StateLayout';
import { EmptyBagIllustration } from './illustrations/EmptyBagIllustration';

export interface EmptyStateProps {
  title: string;
  description: string;
  illustration?: React.ReactNode;
  action?: React.ReactNode;
  icon?: any; // Kept for backwards compatibility but ignored
}

export const EmptyState: React.FC<EmptyStateProps> = ({ 
  title, 
  description, 
  illustration,
  action 
}) => {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4">
      <StateLayout
        illustration={illustration || <EmptyBagIllustration />}
        title={title}
        description={description}
        primaryAction={action}
      />
    </div>
  );
};

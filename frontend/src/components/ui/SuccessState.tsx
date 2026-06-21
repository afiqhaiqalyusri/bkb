import React from 'react';
import { StateLayout } from './StateLayout';
import { SuccessIllustration } from './illustrations/SuccessIllustration';

export interface SuccessStateProps {
  title: string;
  message: string;
  illustration?: React.ReactNode;
  primaryAction?: React.ReactNode;
  secondaryAction?: React.ReactNode;
}

export const SuccessState: React.FC<SuccessStateProps> = ({ 
  title, 
  message, 
  illustration,
  primaryAction,
  secondaryAction 
}) => {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4">
      <StateLayout
        illustration={illustration || <SuccessIllustration />}
        title={title}
        description={message}
        primaryAction={primaryAction}
        secondaryAction={secondaryAction}
      />
    </div>
  );
};

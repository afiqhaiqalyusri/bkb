import { useEffect } from 'react';
import { useBlocker } from 'react-router-dom';
import { useConfirmation } from '../components/ConfirmationProvider';

export const useUnsavedChangesBlocker = (isDirty: boolean) => {
  const { confirm } = useConfirmation();

  // Block route changes within the application
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty && currentLocation.pathname !== nextLocation.pathname
  );

  useEffect(() => {
    const handleBlockedNavigation = async () => {
      if (blocker.state === 'blocked') {
        const leave = await confirm({
          title: 'Unsaved Changes Detected',
          message: 'You have unsaved changes that will be lost if you leave this page.',
          confirmLabel: 'Leave Without Saving',
          cancelLabel: 'Stay on Page',
          type: 'warning'
        });

        if (leave) {
          blocker.proceed();
        } else {
          blocker.reset();
        }
      }
    };
    handleBlockedNavigation();
  }, [blocker.state, blocker.proceed, blocker.reset, confirm]);

  // Block browser tab closing or refreshes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  return blocker;
};

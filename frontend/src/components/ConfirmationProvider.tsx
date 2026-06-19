import React, { createContext, useContext, useState, useRef } from 'react';
import { ConfirmationDialog } from './ConfirmationDialog';

interface ConfirmOptions {
  title: string;
  message: string;
  details?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  type?: 'info' | 'warning' | 'danger';
  metadata?: React.ReactNode;
}

interface ConfirmationContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmationContext = createContext<ConfirmationContextType | null>(null);

export const ConfirmationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dialogConfig, setDialogConfig] = useState<(ConfirmOptions & { isOpen: boolean }) | null>(null);
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = (options: ConfirmOptions): Promise<boolean> => {
    setDialogConfig({ ...options, isOpen: true });
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
    });
  };

  const handleConfirm = () => {
    setDialogConfig(prev => prev ? { ...prev, isOpen: false } : null);
    if (resolveRef.current) resolveRef.current(true);
  };

  const handleCancel = () => {
    setDialogConfig(prev => prev ? { ...prev, isOpen: false } : null);
    if (resolveRef.current) resolveRef.current(false);
  };

  return (
    <ConfirmationContext.Provider value={{ confirm }}>
      {children}
      {dialogConfig && (
        <ConfirmationDialog
          isOpen={dialogConfig.isOpen}
          title={dialogConfig.title}
          message={dialogConfig.message}
          details={dialogConfig.details}
          confirmLabel={dialogConfig.confirmLabel}
          cancelLabel={dialogConfig.cancelLabel}
          type={dialogConfig.type}
          metadata={dialogConfig.metadata}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </ConfirmationContext.Provider>
  );
};

export const useConfirmation = () => {
  const context = useContext(ConfirmationContext);
  if (!context) {
    throw new Error('useConfirmation must be used within a ConfirmationProvider');
  }
  return context;
};

import React, { useEffect } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}

export const Modal: React.FC<Props> = ({ isOpen, onClose, children, title }) => {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()}
        style={{ padding: '24px', maxWidth: '560px', margin: '0 auto' }}>
        {/* Drag Handle (mobile) */}
        <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.15)',
          margin: '0 auto 20px', display: 'block' }} />
        {title && (
          <h2 style={{ fontSize: '1.25rem', marginBottom: 20, fontFamily: 'Poppins, sans-serif' }}>
            {title}
          </h2>
        )}
        {children}
      </div>
    </div>
  );
};

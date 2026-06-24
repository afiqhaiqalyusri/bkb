import React from 'react';

interface ChangePasswordModalProps {
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  oldPassword: string;
  setOldPassword: (val: string) => void;
  newPassword: string;
  setNewPassword: (val: string) => void;
  confirmPassword: string;
  setConfirmPassword: (val: string) => void;
  submittingPassword: boolean;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  onClose,
  onSubmit,
  oldPassword,
  setOldPassword,
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  submittingPassword,
}) => {
  return (
    <div className="premium-modal-backdrop" onClick={onClose}>
      <form
        onSubmit={onSubmit}
        onClick={e => e.stopPropagation()}
        className="premium-modal-card"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: 'linear-gradient(135deg, rgba(255,107,0,0.1) 0%, rgba(255,138,61,0.15) 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--primary)', flexShrink: 0
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontFamily: 'Outfit', fontWeight: 900, fontSize: '1.25rem', color: 'var(--text-primary)', margin: 0, lineHeight: 1.2 }}>
              Change Password
            </h3>
            <p style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
              Update your security credentials
            </p>
          </div>
          <button type="button" onClick={onClose} className="premium-close-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        
        <div className="premium-input-group">
          <label className="premium-input-label">Current Password</label>
          <div className="premium-input-wrapper">
            <span className="premium-input-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            </span>
            <input
              type="password"
              value={oldPassword}
              onChange={e => setOldPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="premium-input"
            />
          </div>
        </div>

        <div className="premium-input-group">
          <label className="premium-input-label">New Password</label>
          <div className="premium-input-wrapper">
            <span className="premium-input-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            </span>
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              required
              placeholder="At least 6 characters"
              className="premium-input"
            />
          </div>
        </div>

        <div className="premium-input-group">
          <label className="premium-input-label">Confirm New Password</label>
          <div className="premium-input-wrapper">
            <span className="premium-input-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            </span>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
              placeholder="Re-enter your new password"
              className="premium-input"
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
          <button type="button" onClick={onClose} className="premium-btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={submittingPassword} className="premium-btn-primary">
            {submittingPassword ? 'Updating...' : 'Change Password'}
          </button>
        </div>
      </form>
    </div>
  );
};

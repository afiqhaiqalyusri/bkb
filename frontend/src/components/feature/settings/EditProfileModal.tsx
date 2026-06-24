import React from 'react';

interface EditProfileModalProps {
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  profileName: string;
  setProfileName: (val: string) => void;
  profileEmail: string;
  setProfileEmail: (val: string) => void;
  profilePhone: string;
  setProfilePhone: (val: string) => void;
  submittingProfile: boolean;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  onClose,
  onSubmit,
  profileName,
  setProfileName,
  profileEmail,
  setProfileEmail,
  profilePhone,
  setProfilePhone,
  submittingProfile,
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
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontFamily: 'Outfit', fontWeight: 900, fontSize: '1.25rem', color: 'var(--text-primary)', margin: 0, lineHeight: 1.2 }}>
              Edit Profile
            </h3>
            <p style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
              Update your personal details below
            </p>
          </div>
          <button type="button" onClick={onClose} className="premium-close-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        
        <div className="premium-input-group">
          <label className="premium-input-label">Full Name</label>
          <div className="premium-input-wrapper">
            <span className="premium-input-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            </span>
            <input
              type="text"
              value={profileName}
              onChange={e => setProfileName(e.target.value)}
              required
              placeholder="Enter your full name"
              className="premium-input"
            />
          </div>
        </div>

        <div className="premium-input-group">
          <label className="premium-input-label">Email Address</label>
          <div className="premium-input-wrapper">
            <span className="premium-input-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
            </span>
            <input
              type="email"
              value={profileEmail}
              onChange={e => setProfileEmail(e.target.value)}
              required
              placeholder="name@example.com"
              className="premium-input"
            />
          </div>
        </div>

        <div className="premium-input-group">
          <label className="premium-input-label">Phone Number</label>
          <div className="premium-input-wrapper">
            <span className="premium-input-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
            </span>
            <input
              type="text"
              value={profilePhone}
              onChange={e => setProfilePhone(e.target.value || '')}
              placeholder="e.g. +60123456789"
              className="premium-input"
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
          <button type="button" onClick={onClose} className="premium-btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={submittingProfile} className="premium-btn-primary">
            {submittingProfile ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </form>
    </div>
  );
};

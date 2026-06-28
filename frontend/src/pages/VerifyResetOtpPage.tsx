import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { BkbLogo } from '../components/ui/BkbLogo';
import { Mail, ArrowLeft, ArrowRight, Key } from 'lucide-react';
import { AuthLayout } from '../components/layout/AuthLayout';

export const VerifyResetOtpPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');

  useEffect(() => {
    const stateEmail = location.state?.email;
    if (stateEmail) {
      setEmail(stateEmail);
    }
  }, [location]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) return;
    // Go to Screen 3 (ResetPasswordPage) passing the token in the URL query string
    navigate(`/reset-password?token=${encodeURIComponent(token.trim())}`);
  };

  return (
    <AuthLayout>
      <div style={{ width: '100%', maxWidth: '380px' }} className="animate-fade-in-up">
        {/* Logo */}
        <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'center' }}>
          <BkbLogo size={44} showText={true} />
        </div>

        <div className="card" style={{ padding: '28px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              background: 'rgba(255,107,0,0.08)',
              color: 'var(--primary)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px'
            }}
          >
            <Key size={24} />
          </div>

          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)' }}>Verify Reset Token</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '6px', lineHeight: 1.45 }}>
              We've sent a password reset link {email ? <>to <strong>{email}</strong></> : 'to your email'}. <br />
              Click the link in the email, or paste the token from the link below.
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <label htmlFor="token-input" style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                Reset Token / Code
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', display: 'flex' }}>
                  <Key size={16} />
                </span>
                <input
                  id="token-input"
                  type="text"
                  placeholder="Paste the reset token here"
                  required
                  value={token}
                  onChange={e => setToken(e.target.value)}
                  className="input-field"
                  style={{ paddingLeft: '40px' }}
                />
              </div>
            </div>

            <button type="submit" className="btn-primary" disabled={!token.trim()}>
              Verify Token <ArrowRight size={16} style={{ marginLeft: '4px' }} />
            </button>
          </form>

          <div style={{ marginTop: '20px', borderTop: '1px solid var(--border)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button
              onClick={() => navigate('/login')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px'
              }}
            >
              <ArrowLeft size={14} /> Back to Login
            </button>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
};

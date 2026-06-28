import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth.service';
import { BkbLogo } from '../components/ui/BkbLogo';
import toast from 'react-hot-toast';
import { Mail, ArrowLeft, ArrowRight } from 'lucide-react';
import { FullScreenLoader } from '../components/ui/FullScreenLoader';
import { AuthLayout } from '../components/layout/AuthLayout';

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email.');
      return;
    }

    setLoading(true);
    try {
      await authService.forgotPassword(email.toLowerCase());
      toast.success('If an account exists, a password reset link has been sent to your email.');
      // Proceed to verify-reset-otp page (Screen 2)
      navigate('/verify-reset-otp', { state: { email: email.toLowerCase() } });
    } catch (err: any) {
      // Always treat successfully to prevent email enumeration, but log internally
      toast.success('If an account exists, a password reset link has been sent to your email.');
      navigate('/verify-reset-otp', { state: { email: email.toLowerCase() } });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      {loading && (
        <FullScreenLoader
          message="Sending reset email..."
          subtitle="Generating temporary session security keys..."
        />
      )}

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
            <Mail size={24} />
          </div>

          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)' }}>Reset Password</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '6px', lineHeight: 1.45 }}>
              Enter your email address and we'll send you a link to reset your password.
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <label htmlFor="email-input" style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', display: 'flex' }}>
                  <Mail size={16} />
                </span>
                <input
                  id="email-input"
                  type="email"
                  placeholder="name@example.com"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="input-field"
                  style={{ paddingLeft: '40px' }}
                />
              </div>
            </div>

            <button type="submit" className="btn-primary">
              Send Reset Code <ArrowRight size={16} style={{ marginLeft: '4px' }} />
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

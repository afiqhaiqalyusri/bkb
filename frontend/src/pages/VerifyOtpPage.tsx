import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../services/auth.service';
import { useAuthStore } from '../store/authStore';
import { BkbLogo } from '../components/ui/BkbLogo';
import toast from 'react-hot-toast';
import { FullScreenLoader } from '../components/ui/FullScreenLoader';
import { Mail, ArrowLeft, RefreshCw } from 'lucide-react';
import { AuthLayout } from '../components/layout/AuthLayout';

export const VerifyOtpPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setAuth } = useAuthStore();

  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [resendCooldown, setResendCooldown] = useState(60);

  // References to input nodes for auto-tabbing
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Read email from location state or fallback to query params
    const stateEmail = location.state?.email;
    if (stateEmail) {
      setEmail(stateEmail);
    } else {
      const params = new URLSearchParams(location.search);
      const queryEmail = params.get('email');
      if (queryEmail) {
        setEmail(queryEmail);
      } else {
        toast.error('Email parameter missing. Please register first.');
        navigate('/register');
      }
    }
  }, [location, navigate]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown(prev => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleChange = (value: string, index: number) => {
    if (isNaN(Number(value))) return; // Only allow numbers

    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (pastedData.length === 6 && !isNaN(Number(pastedData))) {
      const newOtp = pastedData.split('');
      setOtp(newOtp);
      inputRefs.current[5]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length !== 6) {
      toast.error('Please enter the 6-digit code.');
      return;
    }

    setLoading(true);
    try {
      const res = await authService.verifyEmail(email, code);
      const { user: loggedUser, accessToken, refreshToken } = res.data;
      setAuth(loggedUser, accessToken, refreshToken);
      toast.success('Email verified! Welcome to BKB Club! 🎉', { duration: 3000 });
      navigate('/menu', { replace: true });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid or expired code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;

    setLoading(true);
    try {
      await authService.resendVerification(email);
      setResendCooldown(60);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      toast.success('A new 6-digit code has been sent to your email.');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to resend code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      {loading && (
        <FullScreenLoader
          message="Verifying code..."
          subtitle="Activating your account..."
        />
      )}

      <div style={{ width: '100%', maxWidth: '380px' }} className="animate-fade-in-up">
        {/* Logo */}
        <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'center' }}>
          <BkbLogo size={44} showText={true} />
        </div>

        <div className="card" style={{ padding: '28px', textAlign: 'center' }}>
          {/* Icon */}
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

          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)' }}>Verify Email Address</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '6px', lineHeight: 1.4 }}>
            Enter the 6-digit verification code sent to <br />
            <strong style={{ color: 'var(--text-primary)' }}>{email}</strong>
          </p>

          <form onSubmit={handleSubmit} style={{ marginTop: '24px' }}>
            {/* 6 digits input grid */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '24px' }}>
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  ref={el => (inputRefs.current[idx] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleChange(e.target.value, idx)}
                  onKeyDown={e => handleKeyDown(e, idx)}
                  onPaste={idx === 0 ? handlePaste : undefined}
                  style={{
                    width: '44px',
                    height: '48px',
                    textAlign: 'center',
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: 'var(--secondary-bg)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    transition: 'all 0.15s ease'
                  }}
                  onFocus={e => {
                    e.target.style.borderColor = 'var(--primary)';
                    e.target.style.boxShadow = '0 0 0 2px rgba(255,107,0,0.1)';
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = 'var(--border)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              ))}
            </div>

            <button type="submit" className="btn-primary">
              Verify Code
            </button>
          </form>

          {/* Resend Cooldown Action */}
          <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Didn't receive the email?{' '}
              {resendCooldown > 0 ? (
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Resend in {resendCooldown}s</span>
              ) : (
                <button
                  onClick={handleResend}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--primary)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: 0,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <RefreshCw size={12} /> Resend OTP
                </button>
              )}
            </div>

            <button
              onClick={() => navigate('/login')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                marginTop: '12px',
                borderTop: '1px solid var(--border)',
                paddingTop: '16px'
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

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '../services/auth.service';
import { BkbLogo } from '../components/ui/BkbLogo';
import toast from 'react-hot-toast';
import { Lock, Eye, EyeOff, Check, ArrowRight } from 'lucide-react';
import { AuthLayout } from '../components/layout/AuthLayout';

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') ?? '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  // Redirect if no token
  useEffect(() => {
    if (!token) {
      toast.error('Invalid or missing reset token.');
      navigate('/login', { replace: true });
    }
  }, [token, navigate]);

  // Password policy (mirror backend)
  const hasMinLength = newPassword.length >= 12;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasLowercase = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);
  const isPasswordValid = hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSpecial;
  const isConfirmMatch = newPassword === confirmPassword;
  const canSubmit = isPasswordValid && isConfirmMatch && !loading;

  const getStrengthLabel = () => {
    const score = [hasMinLength, hasUppercase, hasLowercase, hasNumber, hasSpecial].filter(Boolean).length;
    if (score <= 2) return { label: 'Weak', color: 'var(--danger)' };
    if (score <= 4) return { label: 'Medium', color: 'var(--warning)' };
    return { label: 'Strong', color: 'var(--success)' };
  };
  const strength = getStrengthLabel();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    try {
      await authService.resetPassword(token, newPassword);
      setDone(true);
      toast.success('Password reset successfully!', { duration: 3000 });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Reset link is invalid or has expired. Please request a new one.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div style={{ width: '100%', maxWidth: 400 }} className="animate-fade-in-up">
        {/* Logo */}
        <div style={{ marginBottom: 28, display: 'flex', justifyContent: 'center' }}>
          <BkbLogo size={48} showText={true} />
        </div>

        <div className="card" style={{ padding: '28px' }}>
          {done ? (
            /* ── Success state ── */
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: 16 }}>✅</div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>Password Reset!</h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 28 }}>
                Your password has been updated successfully.<br />
                All existing sessions have been signed out for your security.
              </p>
              <button
                onClick={() => navigate('/login', { replace: true })}
                className="btn-primary"
              >
                <ArrowRight size={16} style={{ marginRight: '4px' }} /> Back to Login
              </button>
            </div>
          ) : (
            /* ── Form ── */
            <>
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <div style={{ fontSize: '2.2rem', marginBottom: 12 }}>🔒</div>
                <h1 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px' }}>
                  Create New Password
                </h1>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Must be at least 12 characters with uppercase, lowercase, number and special character.
                </p>
              </div>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                {/* New Password */}
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: 6 }}>
                    New Password *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', display: 'flex', zIndex: 2 }}>
                      <Lock size={16} />
                    </div>
                    <input
                      id="new-password-input"
                      type={showPw ? 'text' : 'password'}
                      placeholder="••••••••••••"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      className="input-field"
                      style={{ paddingLeft: '40px', paddingRight: '40px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(p => !p)}
                      style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', padding: 4, zIndex: 3 }}
                    >
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  {/* Strength meter */}
                  {newPassword && (
                    <div style={{ marginTop: 12, background: 'var(--background)', borderRadius: 'var(--radius-md)', padding: 12, border: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Password Strength:</span>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: strength.color }}>{strength.label}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 3, height: 4, marginBottom: 10 }}>
                        {[0, 1, 2].map(i => (
                          <div key={i} style={{ flex: 1, borderRadius: 2, background: (strength.label === 'Weak' && i === 0) ? 'var(--danger)' : (strength.label === 'Medium' && i <= 1) ? 'var(--warning)' : strength.label === 'Strong' ? 'var(--success)' : 'var(--border)' }} />
                        ))}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 10px' }}>
                        {[
                          { cond: hasMinLength, label: 'Min 12 characters' },
                          { cond: hasUppercase, label: 'Uppercase letter' },
                          { cond: hasLowercase, label: 'Lowercase letter' },
                          { cond: hasNumber, label: 'Number' },
                          { cond: hasSpecial, label: 'Special character' },
                        ].map((c, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.66rem', color: c.cond ? 'var(--success)' : 'var(--text-secondary)', fontWeight: 600 }}>
                            {c.cond ? <Check size={10} strokeWidth={4} /> : <div style={{ width: 8, height: 1, background: 'var(--text-secondary)' }} />}
                            {c.label}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: 6 }}>
                    Confirm Password *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', display: 'flex', zIndex: 2 }}>
                      <Lock size={16} />
                    </div>
                    <input
                      id="confirm-password-input"
                      type={showConfirmPw ? 'text' : 'password'}
                      placeholder="••••••••••••"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      className="input-field"
                      style={{ paddingLeft: '40px', paddingRight: '40px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPw(p => !p)}
                      style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', padding: 4, zIndex: 3 }}
                    >
                      {showConfirmPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                    {confirmPassword && (
                      <div style={{ position: 'absolute', right: 40, top: '50%', transform: 'translateY(-50%)', display: 'flex' }}>
                        {isConfirmMatch
                          ? <span style={{ color: 'var(--success)', fontSize: '0.72rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 2 }}><Check size={14} /> Match</span>
                          : <span style={{ color: 'var(--danger)', fontSize: '0.72rem', fontWeight: 700 }}>Mismatch</span>
                        }
                      </div>
                    )}
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="btn-primary"
                  style={{ marginTop: 8 }}
                >
                  {loading
                    ? <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2, borderColor: '#fff', borderTopColor: 'transparent' }} />
                    : <><Lock size={16} style={{ marginRight: 4 }} /> Reset Password</>
                  }
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem', textAlign: 'center', marginTop: 12 }}
                >
                  ← Back to Login
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </AuthLayout>
  );
};

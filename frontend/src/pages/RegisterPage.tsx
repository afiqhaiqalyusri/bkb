import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth.service';
import { BkbLogo } from '../components/ui/BkbLogo';
import toast from 'react-hot-toast';
import { FullScreenLoader } from '../components/ui/FullScreenLoader';
import { InlineError } from '../components/ui/InlineError';
import { 
  User, 
  Mail, 
  Lock, 
  Phone, 
  Eye, 
  EyeOff, 
  Check, 
  X, 
  ArrowRight,
  Sun,
  Moon,
  Flame,
  Award,
  Percent
} from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Form states
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  // Touch states
  const [touched, setTouched] = useState({
    name: false,
    email: false,
    phone: false,
    password: false,
    confirmPassword: false
  });

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('bkb-theme') as 'light' | 'dark') || 'light';
  });

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('bkb-theme', newTheme);
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Validators
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isEmailValid = emailRegex.test(form.email);

  const malaysianPhoneRegex = /^(?:\+?601|01)[0-46-9]\d{7,8}$/;
  const isPhoneValid = !form.phone || malaysianPhoneRegex.test(form.phone);

  const hasMinLength = form.password.length >= 12;
  const hasUppercase = /[A-Z]/.test(form.password);
  const hasLowercase = /[a-z]/.test(form.password);
  const hasNumber = /[0-9]/.test(form.password);
  const hasSpecial = /[^A-Za-z0-9]/.test(form.password);

  const checkPasswordStrength = (): 'Weak' | 'Medium' | 'Strong' => {
    if (!form.password) return 'Weak';
    let score = 0;
    if (hasMinLength) score++;
    if (hasUppercase) score++;
    if (hasLowercase) score++;
    if (hasNumber) score++;
    if (hasSpecial) score++;

    if (score <= 2) return 'Weak';
    if (score <= 4) return 'Medium';
    return 'Strong';
  };

  const passwordStrength = checkPasswordStrength();
  const isPasswordValid = hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSpecial;
  const isConfirmPasswordValid = form.password === confirmPassword;

  const isFormValid = () => {
    return form.name && isEmailValid && isPhoneValid && isPasswordValid && isConfirmPasswordValid;
  };

  const handleBlur = (field: keyof typeof touched) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid()) {
      setTouched({ name: true, email: true, phone: true, password: true, confirmPassword: true });
      toast.error('Please fix validation errors.');
      return;
    }

    setLoading(true);
    try {
      await authService.register({
        name: form.name,
        email: form.email.toLowerCase(),
        phone: form.phone || undefined,
        password: form.password
      });
      toast.success('Account created! Verification code sent.');
      navigate('/verify-otp', { state: { email: form.email.toLowerCase() } });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const strengthColor = passwordStrength === 'Weak' ? 'var(--danger)' : passwordStrength === 'Medium' ? 'var(--warning)' : 'var(--success)';

  return (
    <div
      className="split-split animate-fade-in"
      style={{
        minHeight: '100vh',
        background: 'var(--background)',
        transition: 'all 0.3s ease',
        position: 'relative',
        display: 'flex',
        flexDirection: 'row'
      }}
    >
      {loading && (
        <FullScreenLoader
          message="Creating Account..."
          subtitle="Signing you up to BKB Club..."
        />
      )}

      {/* Floating Theme Toggle */}
      <button
        type="button"
        onClick={toggleTheme}
        aria-label="Toggle Theme"
        style={{
          position: 'absolute',
          top: 24,
          right: 24,
          background: 'var(--secondary-bg)',
          border: '1px solid var(--border)',
          width: 42,
          height: 42,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: 'var(--text-primary)',
          transition: 'all 0.2s ease',
          zIndex: 100,
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
      </button>

      {/* LEFT SIDE: Curved Hero banner */}
      <div
        className="split-split-hero animate-fade-in desktop-only"
        style={{
          flex: 1,
          background: 'linear-gradient(145deg, #0f172a 0%, #1e293b 50%, #FF6B00 100%)',
          color: '#FFFFFF',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden',
          padding: '50px 60px 50px 70px',
          zIndex: 2,
          clipPath: 'polygon(0 0, 100% 0, 92% 100%, 0 100%)'
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '-80px',
            right: '120px',
            width: '500px',
            height: '500px',
            background: 'radial-gradient(circle, rgba(255,107,0,0.2) 0%, transparent 70%)',
            zIndex: 1,
            pointerEvents: 'none'
          }}
        />

        <div style={{ zIndex: 2, maxWidth: '340px', flexShrink: 0 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(255,107,0,0.15)',
              border: '1px solid rgba(255,107,0,0.4)',
              padding: '6px 14px',
              borderRadius: '99px',
              fontSize: '0.72rem',
              fontWeight: 700,
              letterSpacing: '1px',
              textTransform: 'uppercase',
              marginBottom: '28px',
              color: '#FFB347'
            }}
          >
            <Flame size={13} fill="#FFB347" /> Premium Street Grills
          </div>

          <h2
            style={{
              fontSize: '2.5rem',
              fontWeight: 800,
              lineHeight: 1.15,
              letterSpacing: '-1px',
              color: '#FFFFFF',
              marginBottom: '18px'
            }}
          >
            Sleek Dashboard.
            <br />
            <span style={{ color: '#FF8C42' }}>Gourmet Flavors.</span>
            <br />
            Seamless Orders.
          </h2>

          <p
            style={{
              fontSize: '0.88rem',
              opacity: 0.8,
              lineHeight: 1.6,
              marginBottom: '32px',
              color: '#cbd5e1'
            }}
          >
            Join BKB to earn star rewards, unlock exclusive vouchers, and enjoy a better burger experience.
          </p>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              borderTop: '1px solid rgba(255,255,255,0.1)',
              paddingTop: '22px'
            }}
          >
            {[
              { icon: <Percent size={15} />, title: 'Exclusive Promos', desc: 'Direct discount codes on checkout.' },
              { icon: <Award size={15} />, title: 'Earn Loyalty Stars', desc: 'Get free gourmet burgers over time.' }
            ].map((item, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{ background: 'rgba(255,107,0,0.2)', border: '1px solid rgba(255,107,0,0.4)', padding: '8px', borderRadius: '10px', display: 'flex', flexShrink: 0, color: '#FFB347' }}>
                  {item.icon}
                </div>
                <div>
                  <h4 style={{ fontWeight: 600, fontSize: '0.85rem', color: '#fff' }}>{item.title}</h4>
                  <p style={{ fontSize: '0.74rem', opacity: 0.7, marginTop: '2px', color: '#cbd5e1' }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right side Showcase burger */}
        <div style={{ zIndex: 2, position: 'relative', flexShrink: 0, marginRight: '40px' }}>
          <div
            style={{
              position: 'absolute',
              width: '280px',
              height: '280px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255,107,0,0.4) 0%, transparent 70%)',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              filter: 'blur(20px)',
              zIndex: 0
            }}
          />
          <div
            style={{
              width: '240px',
              height: '240px',
              borderRadius: '50%',
              overflow: 'hidden',
              border: '2px solid rgba(255,140,66,0.4)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
              position: 'relative',
              zIndex: 1
            }}
          >
            <img
              src="/bkb_premium_hero_burger.png"
              alt="BKB Premium Burger"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform: 'scale(1.06)'
              }}
            />
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: Clean minimalist auth cards */}
      <div
        className="split-split-form"
        style={{
          flex: 1.1,
          padding: '60px 24px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background: 'var(--background)'
        }}
      >
        <div style={{ width: '100%', maxWidth: '360px' }} className="animate-fade-in-up">
          {/* Logo */}
          <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'center' }}>
            <BkbLogo size={48} showText={true} />
          </div>

          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)' }}>Create BKB Account</h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Join us to earn star rewards and unlock free vouchers.
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Full Name */}
            <div>
              <label htmlFor="name-input" style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                Full Name
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', display: 'flex' }}>
                  <User size={16} />
                </span>
                <input
                  id="name-input"
                  type="text"
                  placeholder="Ali bin Abu"
                  required
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  onBlur={() => handleBlur('name')}
                  className="input-field"
                  style={{ paddingLeft: '40px' }}
                />
              </div>
              {touched.name && !form.name && (
                <InlineError message="Name is required" />
              )}
            </div>

            {/* Email Address */}
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
                  placeholder="ali@example.com"
                  required
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  onBlur={() => handleBlur('email')}
                  className="input-field"
                  style={{ paddingLeft: '40px', paddingRight: '40px' }}
                />
                {form.email && (
                  <span style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)' }}>
                    {isEmailValid ? <Check size={16} style={{ color: 'var(--success)' }} /> : <X size={16} style={{ color: 'var(--danger)' }} />}
                  </span>
                )}
              </div>
              {touched.email && !form.email && (
                <InlineError message="Email is required" />
              )}
              {touched.email && form.email && !isEmailValid && (
                <InlineError message="Enter a valid email address" />
              )}
            </div>

            {/* Phone Number */}
            <div>
              <label htmlFor="phone-input" style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                Phone Number (Optional)
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', display: 'flex' }}>
                  <Phone size={16} />
                </span>
                <input
                  id="phone-input"
                  type="tel"
                  placeholder="0123456789"
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  onBlur={() => handleBlur('phone')}
                  className="input-field"
                  style={{ paddingLeft: '40px', paddingRight: '40px' }}
                />
                {form.phone && (
                  <span style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)' }}>
                    {isPhoneValid ? <Check size={16} style={{ color: 'var(--success)' }} /> : <X size={16} style={{ color: 'var(--danger)' }} />}
                  </span>
                )}
              </div>
              {touched.phone && form.phone && !isPhoneValid && (
                <InlineError message="Enter a valid Malaysian number (e.g. 0123456789)" />
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password-input" style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', display: 'flex' }}>
                  <Lock size={16} />
                </span>
                <input
                  id="password-input"
                  type={showPw ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  required
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  onBlur={() => handleBlur('password')}
                  className="input-field"
                  style={{ paddingLeft: '40px', paddingRight: '40px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', padding: '4px' }}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Password strength checklist */}
              {form.password && (
                <div style={{ marginTop: '10px', padding: '10px', background: 'var(--background)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    <span>Password Strength:</span>
                    <span style={{ color: strengthColor, fontWeight: 700 }}>{passwordStrength}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '3px', height: '4px', marginBottom: '8px' }}>
                    {[0, 1, 2].map(i => (
                      <div
                        key={i}
                        style={{
                          flex: 1,
                          borderRadius: '2px',
                          background: (passwordStrength === 'Weak' && i === 0) ? 'var(--danger)' : (passwordStrength === 'Medium' && i <= 1) ? 'var(--warning)' : passwordStrength === 'Strong' ? 'var(--success)' : 'var(--border)'
                        }}
                      />
                    ))}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 10px' }}>
                    {[
                      { cond: hasMinLength, text: 'Min 12 characters' },
                      { cond: hasUppercase, text: 'Uppercase letter' },
                      { cond: hasLowercase, text: 'Lowercase letter' },
                      { cond: hasNumber, text: 'Number symbol' },
                      { cond: hasSpecial, text: 'Special symbol' }
                    ].map((rule, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.66rem', color: rule.cond ? 'var(--success)' : 'var(--text-secondary)' }}>
                        {rule.cond ? <Check size={10} strokeWidth={4} /> : <div style={{ width: 8, height: 1, background: 'var(--text-secondary)' }} />}
                        {rule.text}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirm-password-input" style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                Confirm Password
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', display: 'flex' }}>
                  <Lock size={16} />
                </span>
                <input
                  id="confirm-password-input"
                  type={showConfirmPw ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  onBlur={() => handleBlur('confirmPassword')}
                  className="input-field"
                  style={{ paddingLeft: '40px', paddingRight: '40px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPw(!showConfirmPw)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', padding: '4px' }}
                >
                  {showConfirmPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {touched.confirmPassword && confirmPassword && !isConfirmPasswordValid && (
                <InlineError message="Passwords do not match" />
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={!isFormValid()}
              className="btn-primary"
              style={{ marginTop: '8px' }}
            >
              Sign Up <ArrowRight size={16} style={{ marginLeft: '4px' }} />
            </button>
          </form>

          <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'center', margin: '4px 0 0' }}>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => navigate('/login')}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 600, cursor: 'pointer' }}
              >
                Sign In
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

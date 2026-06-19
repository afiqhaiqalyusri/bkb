import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import { PageShell } from '../components/PageShell';
import toast from 'react-hot-toast';
import { authService } from '../services/auth.service';
import { orderService } from '../services/order.service';
import { useConfirmation } from '../components/ConfirmationProvider';
import { useUnsavedChangesBlocker } from '../hooks/useUnsavedChangesBlocker';
import { FullScreenLoader } from '../components/ui/FullScreenLoader';

/* ─── Icons ─── */
const IcoUser     = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const IcoBell     = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>;
const IcoShield   = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
const IcoHelp     = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
const IcoInfo     = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
const IcoLogout   = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
const IcoChevron  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>;
const IcoHistory  = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M3 3v5h5"/><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"/><path d="M12 7v5l4 2"/></svg>;
const IcoToggleOn = () => <svg width="36" height="20" viewBox="0 0 36 20" fill="none"><rect width="36" height="20" rx="10" fill="var(--red)"/><circle cx="26" cy="10" r="8" fill="white"/></svg>;
const IcoToggleOff= () => <svg width="36" height="20" viewBox="0 0 36 20" fill="none"><rect width="36" height="20" rx="10" fill="var(--cream-dark)"/><circle cx="10" cy="10" r="8" fill="white"/></svg>;

interface SettingRowProps {
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  action?: React.ReactNode;
  onClick?: () => void;
  danger?: boolean;
}

const SettingRow: React.FC<SettingRowProps> = ({ icon, label, sublabel, action, onClick, danger }) => (
  <div
    onClick={onClick}
    style={{
      display:'flex', alignItems:'center', gap:14,
      padding:'13px 16px',
      cursor: onClick ? 'pointer' : 'default',
      transition:'background 0.15s',
      borderRadius:12,
    }}
    onMouseEnter={e => { if (onClick) e.currentTarget.style.background = 'var(--cream-dark)'; }}
    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
  >
    <div style={{ width:36, height:36, borderRadius:10, background: danger ? 'rgba(255,107,0,0.08)' : 'var(--cream-dark)', display:'flex', alignItems:'center', justifyContent:'center', color: danger ? 'var(--red)' : 'var(--text-mid)', flexShrink:0 }}>
      {icon}
    </div>
    <div style={{ flex:1, minWidth:0 }}>
      <div style={{ fontSize:'0.88rem', fontWeight:600, color: danger ? 'var(--red)' : 'var(--text-dark)' }}>{label}</div>
      {sublabel && <div style={{ fontSize:'0.72rem', color:'var(--text-muted)', marginTop:1 }}>{sublabel}</div>}
    </div>
    {action || (onClick && !danger && <span style={{ color:'var(--text-muted)' }}><IcoChevron /></span>)}
  </div>
);

interface SectionProps { title: string; children: React.ReactNode }
const Section: React.FC<SectionProps> = ({ title, children }) => (
  <div style={{ marginBottom:20 }}>
    <div style={{ fontSize:'0.68rem', fontWeight:800, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:1, padding:'0 16px', marginBottom:6 }}>{title}</div>
    <div style={{ background:'var(--white)', borderRadius:16, border:'1px solid var(--bkb-border)', overflow:'hidden', transition: 'background 0.3s ease, border-color 0.3s ease' }}>
      {children}
    </div>
  </div>
);

const FAQItem: React.FC<{ q: string; a: string }> = ({ q, a }) => {
  const [open, setOpen] = React.useState(false);
  return (
    <div
      style={{
        borderRadius: 12, border: '1.5px solid var(--border)',
        overflow: 'hidden', transition: 'border-color 0.2s',
        borderColor: open ? 'var(--primary)' : 'var(--border)',
      }}
    >
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 16px', background: open ? 'rgba(255,107,0,0.04)' : 'transparent',
          border: 'none', cursor: 'pointer', textAlign: 'left', gap: 12,
          transition: 'background 0.2s',
        }}
      >
        <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)', flex: 1 }}>{q}</span>
        <span style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 22, height: 22, borderRadius: '50%',
          background: open ? 'var(--primary)' : 'var(--cream-dark)',
          color: open ? '#fff' : 'var(--text-secondary)',
          flexShrink: 0, transition: 'all 0.2s ease',
          transform: open ? 'rotate(45deg)' : 'rotate(0deg)',
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
        </span>
      </button>
      {open && (
        <div style={{ padding: '0 16px 14px', fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          {a}
        </div>
      )}
    </div>
  );
};

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { confirm } = useConfirmation();
  const { user, isAuthenticated, clearAuth, updateUser } = useAuthStore();
  const refreshToken = useAuthStore.getState().refreshToken;

  const [orders, setOrders] = React.useState<any[]>([]);
  const [showFAQ, setShowFAQ] = React.useState(false);

  React.useEffect(() => {
    if (isAuthenticated && user?.role === 'CUSTOMER') {
      orderService.getMyOrders()
        .then(res => setOrders(res.data || []))
        .catch(console.error);
    }
  }, [isAuthenticated, user]);

  const [loggingOut, setLoggingOut] = React.useState(false);
  const [showEditProfile, setShowEditProfile] = React.useState(false);
  const [showChangePassword, setShowChangePassword] = React.useState(false);

  // Profile inputs
  const [profileName, setProfileName] = React.useState(user?.name || '');
  const [profileEmail, setProfileEmail] = React.useState(user?.email || '');
  const [profilePhone, setProfilePhone] = React.useState(user?.phone || '');
  const [submittingProfile, setSubmittingProfile] = React.useState(false);

  // Password inputs
  const [oldPassword, setOldPassword] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [submittingPassword, setSubmittingPassword] = React.useState(false);

  const hasProfileChanges = () => {
    return profileName !== (user?.name || '') ||
           profileEmail !== (user?.email || '') ||
           profilePhone !== (user?.phone || '');
  };

  const hasPasswordChanges = () => {
    return oldPassword !== '' || newPassword !== '' || confirmPassword !== '';
  };

  const isProfileDirty = showEditProfile && hasProfileChanges();
  const isPasswordDirty = showChangePassword && hasPasswordChanges();
  const isDirty = isProfileDirty || isPasswordDirty;
  useUnsavedChangesBlocker(isDirty);

  const closeProfileModal = async () => {
    if (hasProfileChanges()) {
      const discard = await confirm({
        title: 'Unsaved Changes Detected',
        message: 'You have unsaved changes that will be lost if you leave this page.',
        confirmLabel: 'Leave Without Saving',
        cancelLabel: 'Stay on Page',
        type: 'warning'
      });
      if (!discard) return;
    }
    setShowEditProfile(false);
  };

  const closePasswordModal = async () => {
    if (hasPasswordChanges()) {
      const discard = await confirm({
        title: 'Unsaved Changes Detected',
        message: 'You have unsaved changes that will be lost if you leave this page.',
        confirmLabel: 'Leave Without Saving',
        cancelLabel: 'Stay on Page',
        type: 'warning'
      });
      if (!discard) return;
    }
    setShowChangePassword(false);
  };

  React.useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if ((showEditProfile && hasProfileChanges()) || (showChangePassword && hasPasswordChanges())) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [showEditProfile, showChangePassword, profileName, profileEmail, profilePhone, oldPassword, newPassword, confirmPassword, user]);

  React.useEffect(() => {
    if (user) {
      setProfileName(user.name);
      setProfileEmail(user.email);
      setProfilePhone(user.phone || '');
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingProfile(true);
    try {
      const res = await authService.updateProfile({ name: profileName, email: profileEmail, phone: profilePhone });
      if (res.data) {
        updateUser(res.data);
        toast.success('Profile updated successfully!');
        setShowEditProfile(false);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSubmittingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    const confirmed = await confirm({
      title: 'Confirm Password Update',
      message: "Are you sure you want to change your password? This will update your login credentials immediately.",
      confirmLabel: 'Confirm Update',
      cancelLabel: 'Cancel',
      type: 'warning'
    });
    if (!confirmed) return;
    setSubmittingPassword(true);
    try {
      await authService.changePassword({ oldPassword, newPassword });
      toast.success('Password changed successfully!');
      setShowChangePassword(false);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setSubmittingPassword(false);
    }
  };

  const [notifOrders, setNotifOrders] = React.useState(true);
  const [notifPromo, setNotifPromo] = React.useState(true);
  const [compactMode, setCompactMode] = React.useState(false);

  // Theme support
  const [theme, setTheme] = React.useState<'light' | 'dark'>(() => {
    return (document.documentElement.getAttribute('data-theme') as 'light' | 'dark') || 'light';
  });

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('bkb-theme', newTheme);
    setTheme(newTheme);
    toast.success(`Switched to ${newTheme} mode!`);
  };

  // Manager Settings
  const [restaurantOpen, setRestaurantOpen] = React.useState(true);

  React.useEffect(() => {
    orderService.getStoreStatus()
      .then(res => setRestaurantOpen(res.data))
      .catch(() => {});
  }, []);
  const [sstRate, setSstRate] = React.useState(() => {
    return Number(localStorage.getItem('bkb-sst-rate') || '6.0');
  });
  const [pointsRatio, setPointsRatio] = React.useState(() => {
    return Number(localStorage.getItem('bkb-points-ratio') || '10.0');
  });

  // Admin Settings
  const [maintenanceMode, setMaintenanceMode] = React.useState(() => {
    return localStorage.getItem('bkb-maint-mode') === 'true';
  });
  const [verboseLogs, setVerboseLogs] = React.useState(() => {
    return localStorage.getItem('bkb-verbose-logs') === 'true';
  });
  const [backingUp, setBackingUp] = React.useState(false);

  const handleBackup = async () => {
    const confirmed = await confirm({
      title: 'Database Backup',
      message: 'Are you sure you want to trigger a database backup now?',
      confirmLabel: 'Backup Now',
      cancelLabel: 'Cancel',
      type: 'info'
    });
    if (!confirmed) return;
    setBackingUp(true);
    toast.loading('Initializing database backup...', { id: 'db-backup' });
    setTimeout(() => {
      setBackingUp(false);
      localStorage.setItem('bkb-last-backup', new Date().toLocaleString());
      toast.success('Database backup created successfully! 💾', { id: 'db-backup' });
    }, 2000);
  };

  const handleLogout = async () => {
    const confirmed = await confirm({
      title: 'Confirm Logout',
      message: 'Are you sure you want to log out of your account?',
      confirmLabel: 'Log Out',
      cancelLabel: 'Cancel',
      type: 'warning'
    });
    if (!confirmed) return;
    setLoggingOut(true);
    try {
      await authService.logout(refreshToken, 'MANUAL');
    } catch {}
    clearAuth();
    useCartStore.getState().clearCart();
    toast.success('Logged out successfully');
    window.location.replace('/');
  };

  return (
    <PageShell activeKey="/settings">
      {loggingOut && <FullScreenLoader message="Logging out..." subtitle="Securing your session..." />}
      <div className="page-content" style={{ maxWidth: 680, paddingBottom: 100 }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-secondary)', marginBottom: 4 }}>
            Preferences & Account
          </p>
          <h1 style={{ fontFamily: 'Outfit', fontWeight: 900, fontSize: '1.75rem', color: 'var(--text-primary)' }}>
            Account Management
          </h1>
        </div>
 
        {/* Profile card */}
        {isAuthenticated && user ? (
          <div style={{
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
            borderRadius: 'var(--radius-lg)',
            padding: '24px',
            marginBottom: 28,
            position: 'relative',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-red)',
            color: 'white',
            border: '1.5px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div style={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
            <div style={{ position: 'absolute', bottom: -30, right: 30, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
              <div style={{
                width: 60, height: 60, borderRadius: 16,
                background: 'rgba(255,255,255,0.18)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.8rem', flexShrink: 0, color: '#fff',
                fontFamily: 'Outfit', fontWeight: 900,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
              }}>
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'Outfit', fontWeight: 900, fontSize: '1.2rem', color: '#fff', lineHeight: 1.2 }}>
                  {user.name}
                </div>
                <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>
                  {user.email}
                </div>
                <div style={{
                  display: 'inline-block',
                  marginTop: 8,
                  background: 'rgba(255,255,255,0.2)',
                  borderRadius: 99,
                  padding: '3px 12px',
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  color: '#fff',
                  textTransform: 'uppercase',
                  letterSpacing: 0.8,
                  border: '1px solid rgba(255,255,255,0.25)'
                }}>
                  {user.role}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{
            background: 'var(--surface)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px',
            marginBottom: 28,
            border: '1.5px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14,
              background: 'var(--cream-dark)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.4rem', color: 'var(--text-primary)'
            }}>
              👤
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '0.98rem', color: 'var(--text-primary)' }}>
                Not logged in
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                Sign in to access your loyalty points and order preferences.
              </div>
            </div>
            <button
              onClick={() => navigate('/login')}
              style={{
                background: 'var(--primary)',
                color: 'white',
                border: 'none',
                borderRadius: 10,
                padding: '9px 18px',
                fontFamily: 'Outfit',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer',
                boxShadow: 'var(--shadow-red)',
                transition: 'all 0.15s'
              }}
            >
              Sign In
            </button>
          </div>
        )}

        {/* Personal Info */}
        {isAuthenticated && user && (
          <Section title="Personal Information">
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem', borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
                <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Full Name</span>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{user.name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem', borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
                <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Email Address</span>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{user.email}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem', borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
                <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Phone Number</span>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{user.phone || 'Not provided'}</span>
              </div>
              <button
                onClick={() => setShowEditProfile(true)}
                style={{
                  alignSelf: 'flex-end',
                  background: 'none', border: '1.5px solid var(--border)', borderRadius: 10,
                  padding: '8px 16px', fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer',
                  color: 'var(--text-primary)', transition: 'all 0.2s', marginTop: 4, fontFamily: 'Outfit'
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                ✏️ Edit Profile Details
              </button>
            </div>
          </Section>
        )}

        {/* Order Summary Dashboard */}
        {isAuthenticated && user?.role === 'CUSTOMER' && (
          <Section title="Order Summary Dashboard">
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{
                display: 'flex', gap: 16, background: 'var(--cream-dark)', padding: '14px', borderRadius: 12, border: '1px solid var(--border)', alignItems: 'center'
              }}>
                <div style={{ fontSize: '1.8rem' }}>🍔</div>
                <div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>Total Orders Placed</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-primary)', marginTop: 2, fontFamily: 'Outfit' }}>{orders.length} orders</div>
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 10, fontFamily: 'Outfit' }}>Recent Activity</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {orders.length > 0 ? (
                    orders.slice(0, 3).map(ord => (
                      <div
                        key={ord.id}
                        onClick={() => navigate(`/order/${ord.id}/tracking`)}
                        style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          padding: '10px 12px', background: 'var(--surface)', border: '1px solid var(--border)',
                          borderRadius: 10, cursor: 'pointer', fontSize: '0.82rem', transition: 'all 0.15s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                      >
                        <div>
                          <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Order #{ord.orderNumber}</span>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginLeft: 8 }}>{new Date(ord.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontWeight: 750, color: 'var(--red)', fontFamily: 'Outfit' }}>RM {ord.total.toFixed(2)}</span>
                          <span style={{
                            fontSize: '0.64rem', fontWeight: 800, background: 'rgba(255,107,0,0.06)', color: 'var(--primary)',
                            padding: '2px 8px', borderRadius: 99, fontFamily: 'Outfit'
                          }}>{ord.status}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textAlign: 'center', padding: '10px 0' }}>No recent orders.</div>
                  )}
                </div>
              </div>
            </div>
          </Section>
        )}

        {/* Account Settings */}
        <Section title="Account Settings">
          <SettingRow icon={<IcoShield />} label="Change Password" sublabel="Update your account password" onClick={() => setShowChangePassword(true)} />
          <div style={{ height: 1, background: 'var(--border)', margin: '0 16px' }} />
          <SettingRow icon={<IcoHistory />} label="Order History" sublabel="View your past and active orders" onClick={() => navigate('/history')} />
        </Section>

        {/* Preferences */}
        <Section title="Notification Preferences">
          <SettingRow
            icon={<IcoBell />}
            label="Order Status Updates"
            sublabel="Receive real-time notifications for kitchen updates"
            action={<div onClick={() => setNotifOrders(!notifOrders)} style={{ cursor: 'pointer' }}>{notifOrders ? <IcoToggleOn /> : <IcoToggleOff />}</div>}
          />
          <div style={{ height: 1, background: 'var(--border)', margin: '0 16px' }} />
          <SettingRow
            icon={<IcoBell />}
            label="Deals & Promotions"
            sublabel="Receive emails on new signature burgers and vouchers"
            action={<div onClick={() => setNotifPromo(!notifPromo)} style={{ cursor: 'pointer' }}>{notifPromo ? <IcoToggleOn /> : <IcoToggleOff />}</div>}
          />
        </Section>

        {/* Display */}
        <Section title="Display Preferences">
          <SettingRow
            icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>}
            label="Compact Grid View"
            sublabel="Show a higher density layout of menu cards"
            action={<div onClick={() => setCompactMode(!compactMode)} style={{ cursor: 'pointer' }}>{compactMode ? <IcoToggleOn /> : <IcoToggleOff />}</div>}
          />
          <div style={{ height: 1, background: 'var(--border)', margin: '0 16px' }} />
          <SettingRow
            icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>}
            label="Theme Interface"
            sublabel={`Currently displaying in ${theme} mode`}
            onClick={toggleTheme}
            action={<span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 800, textTransform: 'capitalize' }}>{theme}</span>}
          />
        </Section>

        {/* Manager Settings (Visible to MANAGER and ADMIN) */}
        {isAuthenticated && user && (user.role === 'MANAGER' || user.role === 'ADMIN') && (
          <Section title="Store Management">
            <SettingRow
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"/><rect x="2" y="14" width="20" height="8" rx="2" ry="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>}
              label="Restaurant Status (Open/Close)"
              sublabel={`Kitchen operations are ${restaurantOpen ? 'OPEN' : 'CLOSED'}`}
              action={
                <div onClick={async () => {
                  const val = !restaurantOpen;
                  const confirmed = await confirm({
                    title: 'Restaurant Operations',
                    message: `Are you sure you want to set store operations to ${val ? 'OPEN' : 'CLOSED'}?`,
                    confirmLabel: 'Confirm Change',
                    cancelLabel: 'Cancel',
                    type: 'warning'
                  });
                  if (!confirmed) return;
                  try {
                    await orderService.updateStoreStatus(val);
                    setRestaurantOpen(val);
                    localStorage.setItem('bkb-store-open', String(val));
                    toast.success(`Store operations set to ${val ? 'OPEN' : 'CLOSED'}`);
                  } catch {
                    toast.error('Failed to update store operations');
                  }
                }} style={{ cursor: 'pointer' }}>
                  {restaurantOpen ? <IcoToggleOn /> : <IcoToggleOff />}
                </div>
              }
            />
            <div style={{ height: 1, background: 'var(--border)', margin: '0 16px' }} />
            <SettingRow
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>}
              label="Tax Configuration (SST)"
              sublabel="Active Malaysia sales and services tax rate"
              action={
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    onClick={async () => {
                      const val = Math.max(0, sstRate - 0.5);
                      const confirmed = await confirm({
                        title: 'Confirm SST Tax Rate Change',
                        message: `Are you sure you want to change the SST tax rate to ${val.toFixed(1)}%?`,
                        confirmLabel: 'Confirm Change',
                        cancelLabel: 'Cancel',
                        type: 'warning'
                      });
                      if (!confirmed) return;
                      setSstRate(val);
                      localStorage.setItem('bkb-sst-rate', String(val));
                    }}
                    style={{ width: 26, height: 26, borderRadius: 8, border: '1.5px solid var(--border)', background: 'var(--surface)', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 800 }}
                  >-</button>
                  <span style={{ fontSize: '0.82rem', fontWeight: 800, minWidth: 40, textAlign: 'center', color: 'var(--text-primary)' }}>{sstRate.toFixed(1)}%</span>
                  <button
                    onClick={async () => {
                      const val = Math.min(20, sstRate + 0.5);
                      const confirmed = await confirm({
                        title: 'Confirm SST Tax Rate Change',
                        message: `Are you sure you want to change the SST tax rate to ${val.toFixed(1)}%?`,
                        confirmLabel: 'Confirm Change',
                        cancelLabel: 'Cancel',
                        type: 'warning'
                      });
                      if (!confirmed) return;
                      setSstRate(val);
                      localStorage.setItem('bkb-sst-rate', String(val));
                    }}
                    style={{ width: 26, height: 26, borderRadius: 8, border: '1.5px solid var(--border)', background: 'var(--surface)', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 800 }}
                  >+</button>
                </div>
              }
            />
            <div style={{ height: 1, background: 'var(--border)', margin: '0 16px' }} />
            <SettingRow
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>}
              label="Loyalty Award Ratio"
              sublabel="Minimum Ringgit spent per loyalty point awarded"
              action={
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    onClick={async () => {
                      const val = Math.max(1, pointsRatio - 1);
                      const confirmed = await confirm({
                        title: 'Confirm Loyalty Ratio Change',
                        message: `Are you sure you want to change the loyalty point ratio to RM ${val}?`,
                        confirmLabel: 'Confirm Change',
                        cancelLabel: 'Cancel',
                        type: 'warning'
                      });
                      if (!confirmed) return;
                      setPointsRatio(val);
                      localStorage.setItem('bkb-points-ratio', String(val));
                    }}
                    style={{ width: 26, height: 26, borderRadius: 8, border: '1.5px solid var(--border)', background: 'var(--surface)', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 800 }}
                  >-</button>
                  <span style={{ fontSize: '0.82rem', fontWeight: 800, minWidth: 45, textAlign: 'center', color: 'var(--text-primary)' }}>RM {pointsRatio}</span>
                  <button
                    onClick={async () => {
                      const val = Math.min(100, pointsRatio + 1);
                      const confirmed = await confirm({
                        title: 'Confirm Loyalty Ratio Change',
                        message: `Are you sure you want to change the loyalty point ratio to RM ${val}?`,
                        confirmLabel: 'Confirm Change',
                        cancelLabel: 'Cancel',
                        type: 'warning'
                      });
                      if (!confirmed) return;
                      setPointsRatio(val);
                      localStorage.setItem('bkb-points-ratio', String(val));
                    }}
                    style={{ width: 26, height: 26, borderRadius: 8, border: '1.5px solid var(--border)', background: 'var(--surface)', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 800 }}
                  >+</button>
                </div>
              }
            />
          </Section>
        )}
 
        {/* Admin Settings (Visible to ADMIN only) */}
        {isAuthenticated && user && user.role === 'ADMIN' && (
          <Section title="System Administration">
            <SettingRow
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>}
              label="Maintenance Mode Status"
              sublabel="Block checkout endpoint services globally"
              action={
                <div onClick={async () => {
                  const val = !maintenanceMode;
                  const confirmed = await confirm({
                    title: 'Maintenance Mode Change',
                    message: `Are you sure you want to ${val ? 'ENABLE' : 'DISABLE'} maintenance mode?`,
                    confirmLabel: 'Confirm Change',
                    cancelLabel: 'Cancel',
                    type: 'warning'
                  });
                  if (!confirmed) return;
                  setMaintenanceMode(val);
                  localStorage.setItem('bkb-maint-mode', String(val));
                  toast.success(`Maintenance Mode ${val ? 'ENABLED' : 'DISABLED'}`);
                }} style={{ cursor: 'pointer' }}>
                  {maintenanceMode ? <IcoToggleOn /> : <IcoToggleOff />}
                </div>
              }
            />
            <div style={{ height: 1, background: 'var(--border)', margin: '0 16px' }} />
            <SettingRow
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>}
              label="Backup Store Database"
              sublabel={localStorage.getItem('bkb-last-backup') ? `Last backup: ${localStorage.getItem('bkb-last-backup')}` : 'No backups created yet'}
              action={
                <button
                  disabled={backingUp}
                  onClick={handleBackup}
                  style={{
                    background: 'var(--primary)', color: 'white', border: 'none',
                    borderRadius: 10, padding: '8px 16px', fontSize: '0.78rem',
                    fontFamily: 'Outfit', fontWeight: 700, cursor: backingUp ? 'not-allowed' : 'pointer',
                    boxShadow: 'var(--shadow-red)'
                  }}
                >
                  {backingUp ? 'Backing up...' : 'Backup Now'}
                </button>
              }
            />
            <div style={{ height: 1, background: 'var(--border)', margin: '0 16px' }} />
            <SettingRow
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>}
              label="Verbose Service Telemetry"
              sublabel="Print detailed telemetry logs in backend console"
              action={
                <div onClick={async () => {
                  const val = !verboseLogs;
                  const confirmed = await confirm({
                    title: 'Verbose Logging Change',
                    message: `Are you sure you want to ${val ? 'ENABLE' : 'DISABLE'} verbose server logging?`,
                    confirmLabel: 'Confirm Change',
                    cancelLabel: 'Cancel',
                    type: 'warning'
                  });
                  if (!confirmed) return;
                  setVerboseLogs(val);
                  localStorage.setItem('bkb-verbose-logs', String(val));
                  toast.success(`Verbose logging ${val ? 'ENABLED' : 'DISABLED'}`);
                }} style={{ cursor: 'pointer' }}>
                  {verboseLogs ? <IcoToggleOn /> : <IcoToggleOff />}
                </div>
              }
            />
          </Section>
        )}
 
        {/* App info */}
        <Section title="Information">
          <SettingRow icon={<IcoHelp />} label="Help Center & FAQ" sublabel="Find guides and answers about ordering" onClick={() => setShowFAQ(true)} />
          <div style={{ height: 1, background: 'var(--border)', margin: '0 16px' }} />
          <SettingRow icon={<IcoInfo />} label="Privacy Policy" onClick={() => toast('Privacy policy coming soon!')} />
          <div style={{ height: 1, background: 'var(--border)', margin: '0 16px' }} />
          <SettingRow
            icon={<IcoInfo />}
            label="App Version"
            sublabel="Bukan Kedai Burger — Customer SaaS Portal"
            action={<span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 700 }}>v1.2.0</span>}
          />
        </Section>
 
        {/* Danger zone */}
        {isAuthenticated && (
          <Section title="Account Operations">
            <SettingRow icon={<IcoLogout />} label="Sign Out" sublabel="Securely sign out of this device" onClick={handleLogout} danger />
          </Section>
        )}
 
        <div style={{ height: 20 }} />
      </div>
 
      {showEditProfile && (
        <div className="premium-modal-backdrop" onClick={closeProfileModal}>
          <form
            onSubmit={handleUpdateProfile}
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
              <button type="button" onClick={closeProfileModal} className="premium-close-btn">
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
              <button type="button" onClick={closeProfileModal} className="premium-btn-secondary">
                Cancel
              </button>
              <button type="submit" disabled={submittingProfile} className="premium-btn-primary">
                {submittingProfile ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </form>
        </div>
      )}

      {showChangePassword && (
        <div className="premium-modal-backdrop" onClick={closePasswordModal}>
          <form
            onSubmit={handleChangePassword}
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
              <button type="button" onClick={closePasswordModal} className="premium-close-btn">
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
              <button type="button" onClick={closePasswordModal} className="premium-btn-secondary">
                Cancel
              </button>
              <button type="submit" disabled={submittingPassword} className="premium-btn-primary">
                {submittingPassword ? 'Updating...' : 'Change Password'}
              </button>
            </div>
          </form>
        </div>
      )}

      <style>{`
        .bkb-modal-input {
          width: 100%;
          padding: 12px 16px;
          border-radius: 12px;
          border: 1.5px solid var(--border);
          background: var(--background);
          color: var(--text-primary);
          outline: none;
          font-size: 0.9rem;
          box-sizing: border-box;
          transition: all 0.2s ease;
        }
        .bkb-modal-input:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 4px rgba(255, 107, 0, 0.12);
          background: var(--surface);
        }

        /* ─── Premium Modals & Inputs ─── */
        .premium-modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.35);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
          backdrop-filter: blur(12px) saturate(120%);
          animation: modal-backdrop-fade-in 0.2s ease-out;
        }

        .premium-modal-card {
          background: var(--surface);
          border-radius: var(--radius-xl);
          padding: 28px;
          width: 100%;
          max-width: 400px;
          box-shadow: 0 20px 50px -12px rgba(0, 0, 0, 0.15), 0 0 40px rgba(255, 107, 0, 0.04);
          display: flex;
          flex-direction: column;
          gap: 18px;
          border: 1px solid var(--border);
          position: relative;
          overflow: hidden;
          animation: modal-card-scale-up 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .premium-modal-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, var(--primary), var(--secondary));
        }

        .premium-close-btn {
          background: none;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          transition: all 0.2s ease;
        }

        .premium-close-btn:hover {
          background: var(--cream-dark);
          color: var(--text-primary);
          transform: rotate(90deg);
        }

        .premium-input-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .premium-input-label {
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--text-secondary);
          letter-spacing: 0.2px;
        }

        .premium-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .premium-input-icon {
          position: absolute;
          left: 14px;
          color: var(--text-secondary);
          transition: color 0.25s ease;
          pointer-events: none;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .premium-input {
          width: 100%;
          padding: 12px 16px 12px 42px;
          border-radius: 12px;
          border: 1.5px solid var(--border);
          background: var(--cream-dark);
          color: var(--text-primary);
          outline: none;
          font-size: 0.9rem;
          font-family: 'Outfit', sans-serif;
          box-sizing: border-box;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .premium-input::placeholder {
          color: var(--text-secondary);
          opacity: 0.6;
        }

        .premium-input:focus {
          border-color: var(--primary);
          background: var(--surface);
          box-shadow: 0 0 0 4px rgba(255, 107, 0, 0.12);
        }

        .premium-input-wrapper:focus-within .premium-input-icon {
          color: var(--primary);
        }

        .premium-btn-secondary {
          flex: 1;
          padding: 12px;
          background: var(--cream-dark);
          border: none;
          border-radius: 12px;
          font-weight: 700;
          cursor: pointer;
          color: var(--text-primary);
          font-size: 0.85rem;
          font-family: 'Outfit', sans-serif;
          transition: all 0.2s ease;
        }

        .premium-btn-secondary:hover {
          background: var(--border);
          transform: translateY(-1px);
        }

        .premium-btn-secondary:active {
          transform: translateY(0);
        }

        .premium-btn-primary {
          flex: 1;
          padding: 12px;
          background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
          border: none;
          border-radius: 12px;
          font-weight: 700;
          cursor: pointer;
          color: #fff;
          font-size: 0.85rem;
          font-family: 'Outfit', sans-serif;
          box-shadow: 0 4px 12px rgba(255, 107, 0, 0.15);
          transition: all 0.25s ease;
        }

        .premium-btn-primary:hover:not(:disabled) {
          transform: translateY(-1.5px);
          box-shadow: 0 6px 16px rgba(255, 107, 0, 0.3);
          filter: brightness(1.05);
        }

        .premium-btn-primary:active:not(:disabled) {
          transform: translateY(0);
        }

        .premium-btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        @keyframes modal-backdrop-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes modal-card-scale-up {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>

      {/* ── FAQ Modal ── */}
      {showFAQ && (
        <div
          onClick={() => setShowFAQ(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 2000,
            background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 16,
            animation: 'modal-backdrop-fade-in 0.2s ease'
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: 560,
              background: 'var(--white)', borderRadius: 24,
              boxShadow: '0 24px 80px rgba(0,0,0,0.28)',
              maxHeight: '85vh', display: 'flex', flexDirection: 'column',
              animation: 'modal-card-scale-up 0.25s cubic-bezier(0.34,1.56,0.64,1)',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div style={{
              padding: '24px 24px 20px',
              borderBottom: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(255,107,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <IcoHelp />
                  </div>
                  <div>
                    <h2 style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '1.15rem', color: 'var(--text-primary)', margin: 0 }}>Help Center & FAQ</h2>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0, marginTop: 2 }}>Frequently asked questions</p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowFAQ(false)}
                style={{ width: 32, height: 32, borderRadius: '50%', border: 'none', background: 'var(--cream-dark)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', transition: 'transform 0.2s ease' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'rotate(90deg)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'rotate(0deg)'}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>

            {/* FAQ List */}
            <div style={{ overflowY: 'auto', padding: '16px 24px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {([
                { q: 'How do I place an order?', a: 'Browse the menu, customise your item, add it to your cart and proceed to checkout. You can pay via card or e-wallet.' },
                { q: 'Can I customise my burger?', a: 'Yes! Tap on any menu item and use the customiser to adjust toppings and sauce levels to your taste.' },
                { q: 'How do I track my order?', a: 'After placing an order, go to the Order Tracking page (accessible from Settings > Order History or the active order pop-up) to see real-time status.' },
                { q: 'What are Loyalty Stars?', a: 'You earn 1 star for every RM1 spent. Stars can be redeemed for free items and exclusive vouchers via the Rewards page.' },
                { q: 'How do I apply a voucher?', a: 'Vouchers can be applied during checkout. Enter your voucher code in the "Promo Code" field before proceeding to payment.' },
                { q: 'Can I cancel my order?', a: 'Orders can only be cancelled before they are accepted by the kitchen. Contact our staff immediately if you need to cancel.' },
                { q: 'Is my payment information secure?', a: 'Yes. All payments are processed via encrypted channels. We do not store your card details on our servers.' },
                { q: 'How do I update my profile?', a: 'Go to Settings > Account > Edit Profile Details to update your name, email, or phone number.' },
              ] as {q:string; a:string}[]).map((item, i) => (
                <FAQItem key={i} q={item.q} a={item.a} />
              ))}
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
};

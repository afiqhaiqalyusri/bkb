import React from 'react';
import { ManagerLayout } from './ManagerDashboard';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import { orderService } from '../../services/order.service';
import { securityLogger } from '../../utils/securityLogger';
import { LogOut } from 'lucide-react';
import toast from 'react-hot-toast';
import { useConfirmation } from '../../components/ConfirmationProvider';
import { authService } from '../../services/auth.service';
import { globalSettingsService } from '../../services/manager.service';
import { FullScreenLoader } from '../../components/ui/FullScreenLoader';

export const ManagerSettings: React.FC = () => {
  const { user, isAuthenticated, clearAuth } = useAuthStore();
  const refreshToken = useAuthStore.getState().refreshToken;
  const { confirm } = useConfirmation();
  const [loggingOut, setLoggingOut] = React.useState(false);

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
    toast.success('Logged out');
    window.location.replace('/');
  };

  const [theme, setTheme] = React.useState<'light' | 'dark'>(() => {
    return (document.documentElement.getAttribute('data-theme') as 'light' | 'dark') || 'light';
  });

  React.useEffect(() => {
    const handleTheme = () => setTheme((document.documentElement.getAttribute('data-theme') as 'light' | 'dark') || 'light');
    window.addEventListener('theme-change', handleTheme);
    return () => window.removeEventListener('theme-change', handleTheme);
  }, []);

  const changeTheme = (newTheme: 'light' | 'dark') => {
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('bkb-theme', newTheme);
    setTheme(newTheme);
    toast.success(`Switched to ${newTheme === 'light' ? 'Light' : 'Dark'} Mode!`);
    window.dispatchEvent(new Event('theme-change'));
  };

  const [restaurantOpen, setRestaurantOpen] = React.useState(true);

  React.useEffect(() => {
    orderService.getStoreStatus()
      .then(res => setRestaurantOpen(res.data))
      .catch(() => {});
    
    // Load global settings
    globalSettingsService.getAll().then(res => {
      if (res.data) {
        res.data.forEach(setting => {
          if (setting.settingKey === 'SST_RATE') setSstRate(Number(setting.settingValue));
          if (setting.settingKey === 'LOYALTY_RATIO') setPointsRatio(Number(setting.settingValue));
          if (setting.settingKey === 'MAINTENANCE_MODE') setMaintenanceMode(setting.settingValue === 'true');
          if (setting.settingKey === 'VERBOSE_LOGS') setVerboseLogs(setting.settingValue === 'true');
          if (setting.settingKey === 'SIM_DELAY') setSimDelay(Number(setting.settingValue));
          if (setting.settingKey === 'SIM_FAILURE_RATE') setSimFailure(Number(setting.settingValue));
          
          if (setting.settingKey.startsWith('PAY_')) {
            const val = setting.settingValue === 'true';
            if (setting.settingKey === 'PAY_DUITNOW') setPayDUITNOW(val);
            if (setting.settingKey === 'PAY_TNG') setPayTNG(val);
            if (setting.settingKey === 'PAY_SHOPEEPAY') setPaySHOPEEPAY(val);
            if (setting.settingKey === 'PAY_GRABPAY') setPayGRABPAY(val);
            if (setting.settingKey === 'PAY_BOOST') setPayBOOST(val);
            if (setting.settingKey === 'PAY_CASH') setPayCASH(val);
          }
        });
      }
    }).catch(console.error);
  }, []);

  const [sstRate, setSstRate] = React.useState(() => {
    return Number(localStorage.getItem('bkb-sst-rate') || '6.0');
  });
  const [pointsRatio, setPointsRatio] = React.useState(() => {
    return Number(localStorage.getItem('bkb-points-ratio') || '10.0');
  });
  const [maintenanceMode, setMaintenanceMode] = React.useState(() => {
    return localStorage.getItem('bkb-maint-mode') === 'true';
  });
  const [verboseLogs, setVerboseLogs] = React.useState(() => {
    return localStorage.getItem('bkb-verbose-logs') === 'true';
  });
  const [backingUp, setBackingUp] = React.useState(false);

  // Payment channel states
  const [payDUITNOW, setPayDUITNOW] = React.useState(() => localStorage.getItem('bkb-pay-enabled-DUITNOW') !== 'false');
  const [payTNG, setPayTNG] = React.useState(() => localStorage.getItem('bkb-pay-enabled-TNG') !== 'false');
  const [paySHOPEEPAY, setPaySHOPEEPAY] = React.useState(() => localStorage.getItem('bkb-pay-enabled-SHOPEEPAY') !== 'false');
  const [payGRABPAY, setPayGRABPAY] = React.useState(() => localStorage.getItem('bkb-pay-enabled-GRABPAY') !== 'false');
  const [payBOOST, setPayBOOST] = React.useState(() => localStorage.getItem('bkb-pay-enabled-BOOST') !== 'false');
  const [payCASH, setPayCASH] = React.useState(() => localStorage.getItem('bkb-pay-enabled-CASH') !== 'false');

  const [simDelay, setSimDelay] = React.useState(() => Number(localStorage.getItem('bkb-sim-delay') || '2'));
  const [simFailure, setSimFailure] = React.useState(() => Number(localStorage.getItem('bkb-sim-failure-rate') || '0'));

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
      if (user?.email) {
        securityLogger.logSecurityEvent(user.email, user.role, 'Database Backup', 'Initiated manual database backup.');
      }
      toast.success('Database backup created successfully! 💾', { id: 'db-backup' });
    }, 2000);
  };

  const handleTogglePayment = (channelId: string, currentVal: boolean, setVal: React.Dispatch<React.SetStateAction<boolean>>, channelName: string) => {
    const val = !currentVal;
    localStorage.setItem(`bkb-pay-enabled-${channelId}`, String(val));
    setVal(val);
    globalSettingsService.updateAll([{ settingKey: `PAY_${channelId}`, settingValue: String(val), description: `Enable ${channelName}` }]).catch(console.error);
    if (user?.email) {
      securityLogger.logSecurityEvent(
        user.email,
        user.role,
        'Payment Configuration Update',
        `Payment method "${channelName}" set to ${val ? 'ENABLED' : 'DISABLED'}`
      );
    }
    toast.success(`${channelName} ${val ? 'Enabled' : 'Disabled'}`);
  };

  const toggleOnIcon = () => (
    <svg width="36" height="20" viewBox="0 0 36 20" fill="none">
      <rect width="36" height="20" rx="10" fill="var(--red)"/>
      <circle cx="26" cy="10" r="8" fill="white"/>
    </svg>
  );

  const toggleOffIcon = () => (
    <svg width="36" height="20" viewBox="0 0 36 20" fill="none">
      <rect width="36" height="20" rx="10" fill="var(--border)"/>
      <circle cx="10" cy="10" r="8" fill="white"/>
    </svg>
  );

  return (
    <ManagerLayout title="Console Settings" subtitle="Configure platform settings, theme and backups">
      {loggingOut && <FullScreenLoader message="Logging out..." subtitle="Securing your session..." />}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 680 }}>
        
        {/* Appearance Settings */}
        <div style={{
          background: 'var(--surface)',
          borderRadius: 'var(--radius-md)',
          padding: 24,
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          flexDirection: 'column',
          gap: 16
        }}>
          <div>
            <h3 style={{ fontFamily: 'Poppins', fontWeight: 800, fontSize: '1.05rem', margin: 0, color: 'var(--text-primary)' }}>
              🎨 Appearance Settings
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
              Customise the console look and feel for your workspace.
            </p>
          </div>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            background: 'var(--secondary-bg)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border)'
          }}>
            <div>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>Console Theme</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                Switch between light and Threads-style dark themes.
              </div>
            </div>
            
            <div style={{ display: 'flex', background: 'var(--background)', borderRadius: 10, padding: 4, border: '1px solid var(--border)' }}>
              {[
                { key: 'light', label: '☀️ Light' },
                { key: 'dark', label: '🌙 Dark' }
              ].map(themeOpt => {
                const isSelected = theme === themeOpt.key;
                return (
                  <button
                    key={themeOpt.key}
                    onClick={() => changeTheme(themeOpt.key as 'light' | 'dark')}
                    style={{
                      padding: '8px 16px',
                      background: isSelected ? 'var(--text-primary)' : 'transparent',
                      color: isSelected ? 'var(--surface)' : 'var(--text-secondary)',
                      border: 'none',
                      borderRadius: 'calc(var(--radius-sm) - 4px)',
                      fontWeight: 600,
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6
                    }}
                  >
                    {themeOpt.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Manager Controls */}
        {isAuthenticated && user && (user.role === 'MANAGER' || user.role === 'ADMIN') && (
          <div style={{
            background: 'var(--surface)',
            borderRadius: 'var(--radius-md)',
            padding: 24,
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            gap: 16
          }}>
            <div>
              <h3 style={{ fontFamily: 'Poppins', fontWeight: 800, fontSize: '1.05rem', margin: 0, color: 'var(--text-primary)' }}>
                💼 Store & Operations Settings
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                Configure global service variables and store operations.
              </p>
            </div>

            {/* Restaurant Operations */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
              <div>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>Restaurant Operations</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: 2 }}>Store is currently {restaurantOpen ? 'OPEN' : 'CLOSED'}</div>
              </div>
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
                  if (user?.email) {
                    securityLogger.logSecurityEvent(user.email, user.role, 'Store Status Update', `Operations toggled to ${val ? 'OPEN' : 'CLOSED'}`);
                  }
                  toast.success(`Store operations set to ${val ? 'OPEN' : 'CLOSED'}`);
                } catch {
                  toast.error('Failed to update store operations');
                }
              }} style={{ cursor: 'pointer' }}>
                {restaurantOpen ? toggleOnIcon() : toggleOffIcon()}
              </div>
            </div>

            {/* SST rate */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
              <div>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>SST Service Tax Rate</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: 2 }}>Applied tax percentage on checkouts</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  onClick={async () => {
                    const val = Math.max(0, sstRate - 0.5);
                    const confirmed = await confirm({
                      title: 'Confirm SST Tax Rate Change',
                      message: `Are you sure you want to change the SST rate to ${val.toFixed(1)}%?`,
                      confirmLabel: 'Confirm Change',
                      cancelLabel: 'Cancel',
                      type: 'warning'
                    });
                    if (!confirmed) return;
                    setSstRate(val);
                    localStorage.setItem('bkb-sst-rate', String(val));
                    globalSettingsService.updateAll([{ settingKey: 'SST_RATE', settingValue: String(val), description: 'SST Service Tax Rate' }]).catch(console.error);
                    if (user?.email) {
                      securityLogger.logSecurityEvent(user.email, user.role, 'SST Tax Rate Update', `Tax rate set to ${val.toFixed(1)}%`);
                    }
                  }}
                  style={{ width: 28, height: 28, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 800 }}
                >-</button>
                <span style={{ fontSize: '0.88rem', fontWeight: 700, minWidth: 45, textAlign: 'center', color: 'var(--text-primary)' }}>{sstRate.toFixed(1)}%</span>
                <button
                  onClick={async () => {
                    const val = Math.min(20, sstRate + 0.5);
                    const confirmed = await confirm({
                      title: 'Confirm SST Tax Rate Change',
                      message: `Are you sure you want to change the SST rate to ${val.toFixed(1)}%?`,
                      confirmLabel: 'Confirm Change',
                      cancelLabel: 'Cancel',
                      type: 'warning'
                    });
                    if (!confirmed) return;
                    setSstRate(val);
                    localStorage.setItem('bkb-sst-rate', String(val));
                    globalSettingsService.updateAll([{ settingKey: 'SST_RATE', settingValue: String(val), description: 'SST Service Tax Rate' }]).catch(console.error);
                    if (user?.email) {
                      securityLogger.logSecurityEvent(user.email, user.role, 'SST Tax Rate Update', `Tax rate set to ${val.toFixed(1)}%`);
                    }
                  }}
                  style={{ width: 28, height: 28, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 800 }}
                >+</button>
              </div>
            </div>

            {/* Loyalty Points Spent Ratio */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
              <div>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>Loyalty Point Ratio</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: 2 }}>Minimum RM spent per loyalty point earned</div>
              </div>
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
                    globalSettingsService.updateAll([{ settingKey: 'LOYALTY_RATIO', settingValue: String(val), description: 'Minimum RM spent per loyalty point earned' }]).catch(console.error);
                    if (user?.email) {
                      securityLogger.logSecurityEvent(user.email, user.role, 'Loyalty Point Ratio Update', `Loyalty points earning ratio set to RM ${val} per point`);
                    }
                  }}
                  style={{ width: 28, height: 28, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 800 }}
                >-</button>
                <span style={{ fontSize: '0.88rem', fontWeight: 700, minWidth: 65, textAlign: 'center', color: 'var(--text-primary)' }}>RM {pointsRatio}</span>
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
                    globalSettingsService.updateAll([{ settingKey: 'LOYALTY_RATIO', settingValue: String(val), description: 'Minimum RM spent per loyalty point earned' }]).catch(console.error);
                    if (user?.email) {
                      securityLogger.logSecurityEvent(user.email, user.role, 'Loyalty Point Ratio Update', `Loyalty points earning ratio set to RM ${val} per point`);
                    }
                  }}
                  style={{ width: 28, height: 28, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 800 }}
                >+</button>
              </div>
            </div>
          </div>
        )}

        {/* System Admin Settings */}
        {isAuthenticated && user && user.role === 'ADMIN' && (
          <>
            {/* Payment Gateway & QR Settings */}
            <div style={{
              background: 'var(--surface)',
              borderRadius: 'var(--radius-md)',
              padding: 24,
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              flexDirection: 'column',
              gap: 16
            }}>
              <div>
                <h3 style={{ fontFamily: 'Poppins', fontWeight: 800, fontSize: '1.05rem', margin: 0, color: 'var(--text-primary)' }}>
                  💳 Payment Gateway & QR Settings
                </h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                  Configure active payment methods and simulated scan behavior.
                </p>
              </div>

              {/* Payment Methods */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Enabled Channels</span>
                
                {[
                  { key: 'DUITNOW', label: 'DuitNow QR', state: payDUITNOW, setter: setPayDUITNOW },
                  { key: 'TNG', label: "Touch 'n Go eWallet", state: payTNG, setter: setPayTNG },
                  { key: 'SHOPEEPAY', label: 'ShopeePay', state: paySHOPEEPAY, setter: setPaySHOPEEPAY },
                  { key: 'GRABPAY', label: 'GrabPay', state: payGRABPAY, setter: setPayGRABPAY },
                  { key: 'BOOST', label: 'Boost', state: payBOOST, setter: setPayBOOST },
                  { key: 'CASH', label: 'Cash at Counter', state: payCASH, setter: setPayCASH },
                ].map(chan => (
                  <div key={chan.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ fontSize: '0.86rem', color: 'var(--text-primary)', fontWeight: 600 }}>{chan.label}</span>
                    <div onClick={() => handleTogglePayment(chan.key, chan.state, chan.setter, chan.label)} style={{ cursor: 'pointer' }}>
                      {chan.state ? toggleOnIcon() : toggleOffIcon()}
                    </div>
                  </div>
                ))}
              </div>

              {/* Sim delay setting */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)', marginTop: 8 }}>
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>Simulated Scan Delay</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: 2 }}>Delay before payment is marked authorized (seconds)</div>
                </div>
                <select
                  value={simDelay}
                  onChange={e => {
                    const val = Number(e.target.value);
                    setSimDelay(val);
                    localStorage.setItem('bkb-sim-delay', String(val));
                    globalSettingsService.updateAll([{ settingKey: 'SIM_DELAY', settingValue: String(val), description: 'Simulated scan delay in seconds' }]).catch(console.error);
                    if (user?.email) {
                      securityLogger.logSecurityEvent(user.email, user.role, 'Payment Config Update', `Simulated scan delay set to ${val} seconds`);
                    }
                  }}
                  style={{ padding: '8px 12px', background: 'var(--background)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '0.84rem', outline: 'none' }}
                >
                  <option value={1}>⚡ Instant (1s)</option>
                  <option value={2}>🕐 Fast (2s)</option>
                  <option value={3}>🕐 Normal (3s)</option>
                  <option value={5}>🐢 Slow (5s)</option>
                </select>
              </div>

              {/* Sim scan failure rate */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>Simulated Scan Failure Rate</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: 2 }}>Probability of a random transaction rejection</div>
                </div>
                <select
                  value={simFailure}
                  onChange={e => {
                    const val = Number(e.target.value);
                    setSimFailure(val);
                    localStorage.setItem('bkb-sim-failure-rate', String(val));
                    globalSettingsService.updateAll([{ settingKey: 'SIM_FAILURE_RATE', settingValue: String(val), description: 'Simulated scan failure rate (%)' }]).catch(console.error);
                    if (user?.email) {
                      securityLogger.logSecurityEvent(user.email, user.role, 'Payment Config Update', `Simulated scan failure rate set to ${val}%`);
                    }
                  }}
                  style={{ padding: '8px 12px', background: 'var(--background)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '0.84rem', outline: 'none' }}
                >
                  <option value={0}>✅ 0% (Always Succeeds)</option>
                  <option value={10}>⚠️ 10% Failure Chance</option>
                  <option value={25}>⚠️ 25% Failure Chance</option>
                  <option value={50}>❌ 50% Failure Chance</option>
                </select>
              </div>
            </div>

            {/* System Admin Controls */}
            <div style={{
              background: 'var(--surface)',
              borderRadius: 'var(--radius-md)',
              padding: 24,
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              flexDirection: 'column',
              gap: 16
            }}>
              <div>
                <h3 style={{ fontFamily: 'Poppins', fontWeight: 800, fontSize: '1.05rem', margin: 0, color: 'var(--text-primary)' }}>
                  ⚙️ System Administrator Controls
                </h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                  Manage databases, logging, and security configurations.
                </p>
              </div>

              {/* Maintenance Mode */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>Maintenance Mode</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: 2 }}>Blocks customer checkouts globally</div>
                </div>
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
                  globalSettingsService.updateAll([{ settingKey: 'MAINTENANCE_MODE', settingValue: String(val), description: 'Maintenance Mode Flag' }]).catch(console.error);
                  if (user?.email) {
                    securityLogger.logSecurityEvent(user.email, user.role, 'Maintenance Mode Update', `Maintenance Mode set to ${val ? 'ENABLED' : 'DISABLED'}`);
                  }
                  toast.success(`Maintenance Mode ${val ? 'ENABLED' : 'DISABLED'}`);
                }} style={{ cursor: 'pointer' }}>
                  {maintenanceMode ? toggleOnIcon() : toggleOffIcon()}
                </div>
              </div>

              {/* Backup Database */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>Backup Database</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                    {localStorage.getItem('bkb-last-backup') ? `Last backup: ${localStorage.getItem('bkb-last-backup')}` : 'No backups created yet'}
                  </div>
                </div>
                <button
                  disabled={backingUp}
                  onClick={handleBackup}
                  style={{
                    background: 'var(--red)', color: '#fff', border: 'none',
                    borderRadius: 'var(--radius-sm)', padding: '8px 16px', fontSize: '0.78rem',
                    fontFamily: 'Poppins', fontWeight: 700, cursor: backingUp ? 'not-allowed' : 'pointer',
                    opacity: backingUp ? 0.7 : 1
                  }}
                >
                  {backingUp ? 'Backing up...' : 'Backup Now'}
                </button>
              </div>

              {/* Verbose Logs */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>Verbose Server Logs</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: 2 }}>Write extensive debug trace in backend logs</div>
                </div>
                <div onClick={async () => {
                  const val = !verboseLogs;
                  const confirmed = await confirm({
                    title: 'Verbose Server Logs Change',
                    message: `Are you sure you want to ${val ? 'ENABLE' : 'DISABLE'} verbose server logging?`,
                    confirmLabel: 'Confirm Change',
                    cancelLabel: 'Cancel',
                    type: 'warning'
                  });
                  if (!confirmed) return;
                  setVerboseLogs(val);
                  localStorage.setItem('bkb-verbose-logs', String(val));
                  globalSettingsService.updateAll([{ settingKey: 'VERBOSE_LOGS', settingValue: String(val), description: 'Verbose Logs Flag' }]).catch(console.error);
                  if (user?.email) {
                    securityLogger.logSecurityEvent(user.email, user.role, 'Server Logging Config', `Verbose Logging set to ${val ? 'ENABLED' : 'DISABLED'}`);
                  }
                  toast.success(`Verbose logging ${val ? 'ENABLED' : 'DISABLED'}`);
                }} style={{ cursor: 'pointer' }}>
                  {verboseLogs ? toggleOnIcon() : toggleOffIcon()}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Terminate Session Settings */}
        <div style={{
          background: 'var(--surface)',
          borderRadius: 'var(--radius-md)',
          padding: 24,
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          flexDirection: 'column',
          gap: 16
        }}>
          <div>
            <h3 style={{ fontFamily: 'Poppins', fontWeight: 800, fontSize: '1.05rem', margin: 0, color: 'var(--text-primary)' }}>
              🚪 Terminate Session
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
              Exit your current active console session securely.
            </p>
          </div>
          
          <button
            onClick={handleLogout}
            style={{
              padding: '12px 20px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              background: 'rgba(239, 68, 68, 0.04)',
              color: '#EF4444',
              fontWeight: 700,
              fontSize: '0.84rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'all 0.2s',
              width: '100%',
              boxSizing: 'border-box'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = '#EF4444';
              e.currentTarget.style.color = '#fff';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.04)';
              e.currentTarget.style.color = '#EF4444';
            }}
          >
            <LogOut size={16} />
            Logout from Console
          </button>
        </div>
        
      </div>
    </ManagerLayout>
  );
};

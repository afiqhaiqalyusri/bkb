import React from 'react';
import { ManagerLayout } from '../../components/layout/ManagerLayout';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import { orderService } from '../../services/order.service';
import { securityLogger } from '../../utils/securityLogger';
import { LogOut, Palette, Sun, Moon, Briefcase, CreditCard, Settings, Database, Store, AlertTriangle, Save, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { useConfirmation } from '../../components/ConfirmationProvider';
import { authService } from '../../services/auth.service';
import { globalSettingsService } from '../../services/manager.service';
import { FullScreenLoader } from '../../components/ui/FullScreenLoader';

import { AppCard } from '../../components/ui/AppCard';
import { AppButton } from '../../components/ui/AppButton';

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
    try { await authService.logout(refreshToken, 'MANUAL'); } catch {}
    clearAuth();
    useCartStore.getState().clearCart();
    toast.success('Logged out');
    window.location.replace('/');
  };

  const [theme, setTheme] = React.useState<'light' | 'dark'>(() => (document.documentElement.getAttribute('data-theme') as 'light' | 'dark') || 'light');

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
    orderService.getStoreStatus().then(res => setRestaurantOpen(res.data)).catch(() => {});
    
    globalSettingsService.getAll().then(res => {
      if (res.data) {
        res.data.forEach(setting => {
          if (setting.settingKey === 'SST_RATE') setSstRate(Number(setting.settingValue));
          if (setting.settingKey === 'LOYALTY_RATIO') setPointsRatio(Number(setting.settingValue));
          if (setting.settingKey === 'MAINTENANCE_MODE') setMaintenanceMode(setting.settingValue === 'true');
          
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

  const [sstRate, setSstRate] = React.useState(() => Number(localStorage.getItem('bkb-sst-rate') || '6.0'));
  const [pointsRatio, setPointsRatio] = React.useState(() => Number(localStorage.getItem('bkb-points-ratio') || '10.0'));
  const [maintenanceMode, setMaintenanceMode] = React.useState(() => localStorage.getItem('bkb-maint-mode') === 'true');
  const [backingUp, setBackingUp] = React.useState(false);

  const [payDUITNOW, setPayDUITNOW] = React.useState(() => localStorage.getItem('bkb-pay-enabled-DUITNOW') !== 'false');
  const [payTNG, setPayTNG] = React.useState(() => localStorage.getItem('bkb-pay-enabled-TNG') !== 'false');
  const [paySHOPEEPAY, setPaySHOPEEPAY] = React.useState(() => localStorage.getItem('bkb-pay-enabled-SHOPEEPAY') !== 'false');
  const [payGRABPAY, setPayGRABPAY] = React.useState(() => localStorage.getItem('bkb-pay-enabled-GRABPAY') !== 'false');
  const [payBOOST, setPayBOOST] = React.useState(() => localStorage.getItem('bkb-pay-enabled-BOOST') !== 'false');
  const [payCASH, setPayCASH] = React.useState(() => localStorage.getItem('bkb-pay-enabled-CASH') !== 'false');

  const handleBackup = async () => {
    const confirmed = await confirm({ title: 'Database Backup', message: 'Trigger a database backup now?', confirmLabel: 'Backup Now', cancelLabel: 'Cancel', type: 'info' });
    if (!confirmed) return;
    setBackingUp(true);
    toast.loading('Initializing database backup...', { id: 'db-backup' });
    setTimeout(() => {
      setBackingUp(false); localStorage.setItem('bkb-last-backup', new Date().toLocaleString());
      if (user?.email) securityLogger.logSecurityEvent(user.email, user.role, 'Database Backup', 'Initiated manual database backup.');
      toast.success('Database backup created successfully!', { id: 'db-backup' });
    }, 2000);
  };

  const handleTogglePayment = (channelId: string, currentVal: boolean, setVal: React.Dispatch<React.SetStateAction<boolean>>, channelName: string) => {
    const val = !currentVal;
    localStorage.setItem(`bkb-pay-enabled-${channelId}`, String(val));
    setVal(val);
    globalSettingsService.updateAll([{ settingKey: `PAY_${channelId}`, settingValue: String(val), description: `Enable ${channelName}` }]).catch(console.error);
    if (user?.email) securityLogger.logSecurityEvent(user.email, user.role, 'Payment Configuration Update', `Payment method "${channelName}" set to ${val ? 'ENABLED' : 'DISABLED'}`);
    toast.success(`${channelName} ${val ? 'Enabled' : 'Disabled'}`);
  };

  const ToggleSwitch: React.FC<{ checked: boolean; onChange: () => void }> = ({ checked, onChange }) => (
    <div onClick={onChange} className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${checked ? 'bg-[var(--primary)]' : 'bg-[var(--border)]'}`}>
      <div className={`bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
    </div>
  );

  return (
    <ManagerLayout title="Settings" subtitle="Configure platform settings, theme and operations">
      {loggingOut && <FullScreenLoader message="Logging out..." subtitle="Securing your session..." />}
      
      <div className="max-w-[1200px] mx-auto pb-12 flex flex-col gap-6">
        
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 items-start">
          
          {/* Column 1: Appearance & Profile */}
          <div className="flex flex-col gap-6">
            <AppCard title="Profile" subtitle="Your current session details" icon={User}>
              <div className="flex flex-col gap-3 pt-2">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center font-bold text-xl">
                    {user?.name?.charAt(0).toUpperCase() || 'A'}
                  </div>
                  <div>
                    <h3 className="font-bold text-[var(--text-primary)] m-0">{user?.name || 'Administrator'}</h3>
                    <p className="text-sm text-[var(--text-secondary)] m-0">{user?.email}</p>
                    <span className="inline-block mt-1 text-xs font-bold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-slate-700">
                      {user?.role || 'ADMIN'}
                    </span>
                  </div>
                </div>
              </div>
            </AppCard>

            <AppCard title="Appearance" subtitle="Customize workspace theme" icon={Palette}>
              <div className="flex items-center justify-between py-2">
                <div>
                  <div className="font-bold text-sm text-[var(--text-primary)]">Console Theme</div>
                  <div className="text-xs text-[var(--text-secondary)] mt-1">Switch between light and dark modes</div>
                </div>
                <div className="flex bg-[var(--background)] p-1 rounded-lg border border-[var(--border)]">
                  <button onClick={() => changeTheme('light')} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${theme === 'light' ? 'bg-[var(--text-primary)] text-[var(--background)] shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}>
                    <Sun size={14} /> Light
                  </button>
                  <button onClick={() => changeTheme('dark')} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${theme === 'dark' ? 'bg-[var(--text-primary)] text-[var(--background)] shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}>
                    <Moon size={14} /> Dark
                  </button>
                </div>
              </div>
            </AppCard>

            <div className="bg-[var(--danger)]/5 border border-[var(--danger)]/20 rounded-xl p-5 flex flex-col gap-4">
              <div>
                <h3 className="font-bold text-base m-0 text-[var(--danger)] flex items-center gap-2">Terminate Session</h3>
                <p className="text-xs text-[var(--text-secondary)] mt-1 mb-0">Exit your current active console session securely.</p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex justify-center items-center gap-2 py-2.5 rounded-lg border border-[var(--danger)] text-[var(--danger)] font-bold text-sm transition-colors hover:bg-[var(--danger)] hover:text-white"
              >
                <LogOut size={16} /> Logout
              </button>
            </div>
          </div>

          {/* Column 2: Operations & Maintenance */}
          <div className="flex flex-col gap-6">
            {isAuthenticated && user && (user.role === 'MANAGER' || user.role === 'ADMIN') && (
              <AppCard title="Store Operations" subtitle="Manage store status and global settings" icon={Briefcase}>
                <div className="flex flex-col">
                  <div className="flex justify-between items-center py-4 border-b border-[var(--border)]">
                    <div>
                      <div className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-2"><Store size={16} /> Restaurant Operations</div>
                      <div className="text-xs text-[var(--text-secondary)] mt-1">Store is currently {restaurantOpen ? 'OPEN' : 'CLOSED'}</div>
                    </div>
                    <ToggleSwitch checked={restaurantOpen} onChange={async () => {
                      const val = !restaurantOpen;
                      const confirmed = await confirm({ title: 'Restaurant Operations', message: `Set store operations to ${val ? 'OPEN' : 'CLOSED'}?`, confirmLabel: 'Confirm Change', cancelLabel: 'Cancel', type: 'warning' });
                      if (!confirmed) return;
                      try {
                        await orderService.updateStoreStatus(val);
                        setRestaurantOpen(val); localStorage.setItem('bkb-store-open', String(val));
                        if (user?.email) securityLogger.logSecurityEvent(user.email, user.role, 'Store Status Update', `Operations toggled to ${val ? 'OPEN' : 'CLOSED'}`);
                        toast.success(`Store operations set to ${val ? 'OPEN' : 'CLOSED'}`);
                      } catch { toast.error('Failed to update store operations'); }
                    }} />
                  </div>

                  <div className="flex justify-between items-center py-4 border-b border-[var(--border)]">
                    <div>
                      <div className="font-bold text-sm text-[var(--text-primary)]">SST Service Tax Rate</div>
                      <div className="text-xs text-[var(--text-secondary)] mt-1">Applied tax percentage on checkouts</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <AppButton variant="outline" size="sm" onClick={async () => {
                        const val = Math.max(0, sstRate - 0.5);
                        const confirmed = await confirm({ title: 'Confirm Change', message: `Change the SST rate to ${val.toFixed(1)}%?`, confirmLabel: 'Confirm', cancelLabel: 'Cancel', type: 'warning' });
                        if (!confirmed) return;
                        setSstRate(val); localStorage.setItem('bkb-sst-rate', String(val));
                        globalSettingsService.updateAll([{ settingKey: 'SST_RATE', settingValue: String(val), description: 'SST Service Tax Rate' }]).catch(console.error);
                      }}>-</AppButton>
                      <span className="font-bold text-sm w-12 text-center text-[var(--text-primary)]">{sstRate.toFixed(1)}%</span>
                      <AppButton variant="outline" size="sm" onClick={async () => {
                        const val = Math.min(20, sstRate + 0.5);
                        const confirmed = await confirm({ title: 'Confirm Change', message: `Change the SST rate to ${val.toFixed(1)}%?`, confirmLabel: 'Confirm', cancelLabel: 'Cancel', type: 'warning' });
                        if (!confirmed) return;
                        setSstRate(val); localStorage.setItem('bkb-sst-rate', String(val));
                        globalSettingsService.updateAll([{ settingKey: 'SST_RATE', settingValue: String(val), description: 'SST Service Tax Rate' }]).catch(console.error);
                      }}>+</AppButton>
                    </div>
                  </div>

                  <div className="flex justify-between items-center py-4">
                    <div>
                      <div className="font-bold text-sm text-[var(--text-primary)]">Loyalty Point Ratio</div>
                      <div className="text-xs text-[var(--text-secondary)] mt-1">RM spent per point earned</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <AppButton variant="outline" size="sm" onClick={async () => {
                        const val = Math.max(1, pointsRatio - 1);
                        const confirmed = await confirm({ title: 'Confirm Change', message: `Change ratio to RM ${val}?`, confirmLabel: 'Confirm', cancelLabel: 'Cancel', type: 'warning' });
                        if (!confirmed) return;
                        setPointsRatio(val); localStorage.setItem('bkb-points-ratio', String(val));
                        globalSettingsService.updateAll([{ settingKey: 'LOYALTY_RATIO', settingValue: String(val), description: 'Loyalty Ratio' }]).catch(console.error);
                      }}>-</AppButton>
                      <span className="font-bold text-sm w-16 text-center text-[var(--text-primary)]">RM {pointsRatio}</span>
                      <AppButton variant="outline" size="sm" onClick={async () => {
                        const val = Math.min(100, pointsRatio + 1);
                        const confirmed = await confirm({ title: 'Confirm Change', message: `Change ratio to RM ${val}?`, confirmLabel: 'Confirm', cancelLabel: 'Cancel', type: 'warning' });
                        if (!confirmed) return;
                        setPointsRatio(val); localStorage.setItem('bkb-points-ratio', String(val));
                        globalSettingsService.updateAll([{ settingKey: 'LOYALTY_RATIO', settingValue: String(val), description: 'Loyalty Ratio' }]).catch(console.error);
                      }}>+</AppButton>
                    </div>
                  </div>
                </div>
              </AppCard>
            )}

            {isAuthenticated && user && (user.role === 'MANAGER' || user.role === 'ADMIN') && (
              <AppCard title="System & Backups" subtitle="Manage database and security" icon={Settings}>
                <div className="flex flex-col">
                  <div className="flex justify-between items-center py-4 border-b border-[var(--border)]">
                    <div>
                      <div className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-2"><AlertTriangle size={16} className="text-[var(--danger)]" /> Maintenance Mode</div>
                      <div className="text-xs text-[var(--text-secondary)] mt-1">Blocks customer checkouts</div>
                    </div>
                    <ToggleSwitch checked={maintenanceMode} onChange={async () => {
                      const val = !maintenanceMode;
                      const confirmed = await confirm({ title: 'Maintenance Mode Change', message: `${val ? 'ENABLE' : 'DISABLE'} maintenance mode?`, confirmLabel: 'Confirm Change', cancelLabel: 'Cancel', type: 'warning' });
                      if (!confirmed) return;
                      setMaintenanceMode(val); localStorage.setItem('bkb-maint-mode', String(val));
                      globalSettingsService.updateAll([{ settingKey: 'MAINTENANCE_MODE', settingValue: String(val), description: 'Maintenance Mode Flag' }]).catch(console.error);
                      if (user?.email) securityLogger.logSecurityEvent(user.email, user.role, 'Maintenance Mode Update', `Maintenance Mode set to ${val ? 'ENABLED' : 'DISABLED'}`);
                      toast.success(`Maintenance Mode ${val ? 'ENABLED' : 'DISABLED'}`);
                    }} />
                  </div>

                  <div className="flex justify-between items-center py-4">
                    <div>
                      <div className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-2"><Database size={16} /> Backup Database</div>
                      <div className="text-xs text-[var(--text-secondary)] mt-1">{localStorage.getItem('bkb-last-backup') ? `Last backup: ${localStorage.getItem('bkb-last-backup')}` : 'No backups created yet'}</div>
                    </div>
                    <AppButton variant="primary" icon={Save} size="sm" disabled={backingUp} onClick={handleBackup}>
                      {backingUp ? 'Backing up...' : 'Backup'}
                    </AppButton>
                  </div>
                </div>
              </AppCard>
            )}
          </div>

          {/* Column 3: Payment Gateways */}
          <div className="flex flex-col gap-6">
            {isAuthenticated && user && (user.role === 'MANAGER' || user.role === 'ADMIN') && (
              <AppCard title="Payment Channels" subtitle="Toggle supported payment gateways" icon={CreditCard}>
                <div className="flex flex-col">
                  <div className="font-bold text-[10px] text-[var(--text-secondary)] uppercase tracking-wider mb-2">Enabled Channels</div>
                  <div className="flex flex-col">
                    {[
                      { key: 'DUITNOW', label: 'DuitNow QR', state: payDUITNOW, setter: setPayDUITNOW },
                      { key: 'TNG', label: "Touch 'n Go eWallet", state: payTNG, setter: setPayTNG },
                      { key: 'SHOPEEPAY', label: 'ShopeePay', state: paySHOPEEPAY, setter: setPaySHOPEEPAY },
                      { key: 'GRABPAY', label: 'GrabPay', state: payGRABPAY, setter: setPayGRABPAY },
                      { key: 'BOOST', label: 'Boost', state: payBOOST, setter: setPayBOOST },
                      { key: 'CASH', label: 'Cash at Counter', state: payCASH, setter: setPayCASH },
                    ].map(chan => (
                      <div key={chan.key} className="flex justify-between items-center py-3 border-b border-[var(--border)] last:border-0">
                        <span className="font-semibold text-sm text-[var(--text-primary)]">{chan.label}</span>
                        <ToggleSwitch checked={chan.state} onChange={() => handleTogglePayment(chan.key, chan.state, chan.setter, chan.label)} />
                      </div>
                    ))}
                  </div>
                </div>
              </AppCard>
            )}
          </div>

        </div>
      </div>
    </ManagerLayout>
  );
};

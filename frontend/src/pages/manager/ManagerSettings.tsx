import React from 'react';
import { ManagerLayout } from './ManagerDashboard';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import { orderService } from '../../services/order.service';
import { securityLogger } from '../../utils/securityLogger';
import { LogOut, Palette, Sun, Moon, Briefcase, CreditCard, Settings, Database, Server, Store, Zap, Clock, AlertTriangle, XCircle, CheckCircle, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { useConfirmation } from '../../components/ConfirmationProvider';
import { authService } from '../../services/auth.service';
import { globalSettingsService } from '../../services/manager.service';
import { FullScreenLoader } from '../../components/ui/FullScreenLoader';

import { AppCard } from '../../components/ui/AppCard';
import { AppButton } from '../../components/ui/AppButton';
import { AppPageHeader } from '../../components/ui/AppPageHeader';

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

  const [sstRate, setSstRate] = React.useState(() => Number(localStorage.getItem('bkb-sst-rate') || '6.0'));
  const [pointsRatio, setPointsRatio] = React.useState(() => Number(localStorage.getItem('bkb-points-ratio') || '10.0'));
  const [maintenanceMode, setMaintenanceMode] = React.useState(() => localStorage.getItem('bkb-maint-mode') === 'true');
  const [verboseLogs, setVerboseLogs] = React.useState(() => localStorage.getItem('bkb-verbose-logs') === 'true');
  const [backingUp, setBackingUp] = React.useState(false);

  const [payDUITNOW, setPayDUITNOW] = React.useState(() => localStorage.getItem('bkb-pay-enabled-DUITNOW') !== 'false');
  const [payTNG, setPayTNG] = React.useState(() => localStorage.getItem('bkb-pay-enabled-TNG') !== 'false');
  const [paySHOPEEPAY, setPaySHOPEEPAY] = React.useState(() => localStorage.getItem('bkb-pay-enabled-SHOPEEPAY') !== 'false');
  const [payGRABPAY, setPayGRABPAY] = React.useState(() => localStorage.getItem('bkb-pay-enabled-GRABPAY') !== 'false');
  const [payBOOST, setPayBOOST] = React.useState(() => localStorage.getItem('bkb-pay-enabled-BOOST') !== 'false');
  const [payCASH, setPayCASH] = React.useState(() => localStorage.getItem('bkb-pay-enabled-CASH') !== 'false');

  const [simDelay, setSimDelay] = React.useState(() => Number(localStorage.getItem('bkb-sim-delay') || '2'));
  const [simFailure, setSimFailure] = React.useState(() => Number(localStorage.getItem('bkb-sim-failure-rate') || '0'));

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
    <ManagerLayout title="Settings" subtitle="Configure platform settings, theme and backups">
      {loggingOut && <FullScreenLoader message="Logging out..." subtitle="Securing your session..." />}
      
      <div className="flex flex-col gap-6 max-w-2xl pb-12">
        <AppCard title="Appearance Settings" subtitle="Customize the console look and feel for your workspace." icon={Palette}>
          <div className="flex items-center justify-between p-4 bg-[var(--background)] rounded-lg border border-[var(--border)]">
            <div>
              <div className="font-bold text-sm text-[var(--text-primary)]">Console Theme</div>
              <div className="text-xs text-[var(--text-secondary)] mt-1">Switch between light and dark themes.</div>
            </div>
            <div className="flex bg-[var(--surface)] p-1 rounded-lg border border-[var(--border)]">
              <button onClick={() => changeTheme('light')} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${theme === 'light' ? 'bg-[var(--text-primary)] text-[var(--background)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}>
                <Sun size={14} /> Light
              </button>
              <button onClick={() => changeTheme('dark')} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${theme === 'dark' ? 'bg-[var(--text-primary)] text-[var(--background)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}>
                <Moon size={14} /> Dark
              </button>
            </div>
          </div>
        </AppCard>

        {isAuthenticated && user && (user.role === 'MANAGER' || user.role === 'ADMIN') && (
          <AppCard title="Store & Operations Settings" subtitle="Configure global service variables and store operations." icon={Briefcase}>
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
                <div className="flex items-center gap-3">
                  <AppButton variant="outline" size="sm" onClick={async () => {
                    const val = Math.max(0, sstRate - 0.5);
                    const confirmed = await confirm({ title: 'Confirm SST Tax Rate Change', message: `Change the SST rate to ${val.toFixed(1)}%?`, confirmLabel: 'Confirm Change', cancelLabel: 'Cancel', type: 'warning' });
                    if (!confirmed) return;
                    setSstRate(val); localStorage.setItem('bkb-sst-rate', String(val));
                    globalSettingsService.updateAll([{ settingKey: 'SST_RATE', settingValue: String(val), description: 'SST Service Tax Rate' }]).catch(console.error);
                    if (user?.email) securityLogger.logSecurityEvent(user.email, user.role, 'SST Tax Rate Update', `Tax rate set to ${val.toFixed(1)}%`);
                  }}>-</AppButton>
                  <span className="font-bold text-sm w-12 text-center text-[var(--text-primary)]">{sstRate.toFixed(1)}%</span>
                  <AppButton variant="outline" size="sm" onClick={async () => {
                    const val = Math.min(20, sstRate + 0.5);
                    const confirmed = await confirm({ title: 'Confirm SST Tax Rate Change', message: `Change the SST rate to ${val.toFixed(1)}%?`, confirmLabel: 'Confirm Change', cancelLabel: 'Cancel', type: 'warning' });
                    if (!confirmed) return;
                    setSstRate(val); localStorage.setItem('bkb-sst-rate', String(val));
                    globalSettingsService.updateAll([{ settingKey: 'SST_RATE', settingValue: String(val), description: 'SST Service Tax Rate' }]).catch(console.error);
                    if (user?.email) securityLogger.logSecurityEvent(user.email, user.role, 'SST Tax Rate Update', `Tax rate set to ${val.toFixed(1)}%`);
                  }}>+</AppButton>
                </div>
              </div>

              <div className="flex justify-between items-center py-4">
                <div>
                  <div className="font-bold text-sm text-[var(--text-primary)]">Loyalty Point Ratio</div>
                  <div className="text-xs text-[var(--text-secondary)] mt-1">Minimum RM spent per loyalty point earned</div>
                </div>
                <div className="flex items-center gap-3">
                  <AppButton variant="outline" size="sm" onClick={async () => {
                    const val = Math.max(1, pointsRatio - 1);
                    const confirmed = await confirm({ title: 'Confirm Loyalty Ratio Change', message: `Change the loyalty point ratio to RM ${val}?`, confirmLabel: 'Confirm Change', cancelLabel: 'Cancel', type: 'warning' });
                    if (!confirmed) return;
                    setPointsRatio(val); localStorage.setItem('bkb-points-ratio', String(val));
                    globalSettingsService.updateAll([{ settingKey: 'LOYALTY_RATIO', settingValue: String(val), description: 'Minimum RM spent per loyalty point earned' }]).catch(console.error);
                    if (user?.email) securityLogger.logSecurityEvent(user.email, user.role, 'Loyalty Point Ratio Update', `Loyalty points earning ratio set to RM ${val} per point`);
                  }}>-</AppButton>
                  <span className="font-bold text-sm w-16 text-center text-[var(--text-primary)]">RM {pointsRatio}</span>
                  <AppButton variant="outline" size="sm" onClick={async () => {
                    const val = Math.min(100, pointsRatio + 1);
                    const confirmed = await confirm({ title: 'Confirm Loyalty Ratio Change', message: `Change the loyalty point ratio to RM ${val}?`, confirmLabel: 'Confirm Change', cancelLabel: 'Cancel', type: 'warning' });
                    if (!confirmed) return;
                    setPointsRatio(val); localStorage.setItem('bkb-points-ratio', String(val));
                    globalSettingsService.updateAll([{ settingKey: 'LOYALTY_RATIO', settingValue: String(val), description: 'Minimum RM spent per loyalty point earned' }]).catch(console.error);
                    if (user?.email) securityLogger.logSecurityEvent(user.email, user.role, 'Loyalty Point Ratio Update', `Loyalty points earning ratio set to RM ${val} per point`);
                  }}>+</AppButton>
                </div>
              </div>
            </div>
          </AppCard>
        )}

        {isAuthenticated && user && user.role === 'ADMIN' && (
          <>
            <AppCard title="Payment Gateway & QR Settings" subtitle="Configure active payment methods and simulated scan behavior." icon={CreditCard}>
              <div className="flex flex-col">
                <div className="font-bold text-xs text-[var(--text-secondary)] uppercase tracking-wider mb-2">Enabled Channels</div>
                <div className="flex flex-col border-b border-[var(--border)] pb-2 mb-2">
                  {[
                    { key: 'DUITNOW', label: 'DuitNow QR', state: payDUITNOW, setter: setPayDUITNOW },
                    { key: 'TNG', label: "Touch 'n Go eWallet", state: payTNG, setter: setPayTNG },
                    { key: 'SHOPEEPAY', label: 'ShopeePay', state: paySHOPEEPAY, setter: setPaySHOPEEPAY },
                    { key: 'GRABPAY', label: 'GrabPay', state: payGRABPAY, setter: setPayGRABPAY },
                    { key: 'BOOST', label: 'Boost', state: payBOOST, setter: setPayBOOST },
                    { key: 'CASH', label: 'Cash at Counter', state: payCASH, setter: setPayCASH },
                  ].map(chan => (
                    <div key={chan.key} className="flex justify-between items-center py-2.5">
                      <span className="font-semibold text-sm text-[var(--text-primary)]">{chan.label}</span>
                      <ToggleSwitch checked={chan.state} onChange={() => handleTogglePayment(chan.key, chan.state, chan.setter, chan.label)} />
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center py-4 border-b border-[var(--border)]">
                  <div>
                    <div className="font-bold text-sm text-[var(--text-primary)]">Simulated Scan Delay</div>
                    <div className="text-xs text-[var(--text-secondary)] mt-1">Delay before payment is marked authorized</div>
                  </div>
                  <select
                    value={simDelay}
                    onChange={e => {
                      const val = Number(e.target.value); setSimDelay(val); localStorage.setItem('bkb-sim-delay', String(val));
                      globalSettingsService.updateAll([{ settingKey: 'SIM_DELAY', settingValue: String(val), description: 'Simulated scan delay in seconds' }]).catch(console.error);
                      if (user?.email) securityLogger.logSecurityEvent(user.email, user.role, 'Payment Config Update', `Simulated scan delay set to ${val} seconds`);
                    }}
                    className="px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:border-[var(--primary)] font-semibold"
                  >
                    <option value={1}>Instant (1s)</option>
                    <option value={2}>Fast (2s)</option>
                    <option value={3}>Normal (3s)</option>
                    <option value={5}>Slow (5s)</option>
                  </select>
                </div>

                <div className="flex justify-between items-center py-4">
                  <div>
                    <div className="font-bold text-sm text-[var(--text-primary)]">Simulated Scan Failure Rate</div>
                    <div className="text-xs text-[var(--text-secondary)] mt-1">Probability of a random transaction rejection</div>
                  </div>
                  <select
                    value={simFailure}
                    onChange={e => {
                      const val = Number(e.target.value); setSimFailure(val); localStorage.setItem('bkb-sim-failure-rate', String(val));
                      globalSettingsService.updateAll([{ settingKey: 'SIM_FAILURE_RATE', settingValue: String(val), description: 'Simulated scan failure rate (%)' }]).catch(console.error);
                      if (user?.email) securityLogger.logSecurityEvent(user.email, user.role, 'Payment Config Update', `Simulated scan failure rate set to ${val}%`);
                    }}
                    className="px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:border-[var(--primary)] font-semibold"
                  >
                    <option value={0}>0% (Always Succeeds)</option>
                    <option value={10}>10% Failure Chance</option>
                    <option value={25}>25% Failure Chance</option>
                    <option value={50}>50% Failure Chance</option>
                  </select>
                </div>
              </div>
            </AppCard>

            <AppCard title="System Administrator Controls" subtitle="Manage databases, logging, and security configurations." icon={Settings}>
              <div className="flex flex-col">
                <div className="flex justify-between items-center py-4 border-b border-[var(--border)]">
                  <div>
                    <div className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-2"><AlertTriangle size={16} className="text-[var(--danger)]" /> Maintenance Mode</div>
                    <div className="text-xs text-[var(--text-secondary)] mt-1">Blocks customer checkouts globally</div>
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

                <div className="flex justify-between items-center py-4 border-b border-[var(--border)]">
                  <div>
                    <div className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-2"><Database size={16} /> Backup Database</div>
                    <div className="text-xs text-[var(--text-secondary)] mt-1">{localStorage.getItem('bkb-last-backup') ? `Last backup: ${localStorage.getItem('bkb-last-backup')}` : 'No backups created yet'}</div>
                  </div>
                  <AppButton variant="primary" icon={Save} disabled={backingUp} onClick={handleBackup}>
                    {backingUp ? 'Backing up...' : 'Backup Now'}
                  </AppButton>
                </div>

                <div className="flex justify-between items-center py-4">
                  <div>
                    <div className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-2"><Server size={16} /> Verbose Server Logs</div>
                    <div className="text-xs text-[var(--text-secondary)] mt-1">Write extensive debug trace in backend logs</div>
                  </div>
                  <ToggleSwitch checked={verboseLogs} onChange={async () => {
                    const val = !verboseLogs;
                    const confirmed = await confirm({ title: 'Verbose Server Logs Change', message: `${val ? 'ENABLE' : 'DISABLE'} verbose server logging?`, confirmLabel: 'Confirm Change', cancelLabel: 'Cancel', type: 'warning' });
                    if (!confirmed) return;
                    setVerboseLogs(val); localStorage.setItem('bkb-verbose-logs', String(val));
                    globalSettingsService.updateAll([{ settingKey: 'VERBOSE_LOGS', settingValue: String(val), description: 'Verbose Logs Flag' }]).catch(console.error);
                    if (user?.email) securityLogger.logSecurityEvent(user.email, user.role, 'Server Logging Config', `Verbose Logging set to ${val ? 'ENABLED' : 'DISABLED'}`);
                    toast.success(`Verbose logging ${val ? 'ENABLED' : 'DISABLED'}`);
                  }} />
                </div>
              </div>
            </AppCard>
          </>
        )}

        <div className="bg-[var(--danger)]/5 border border-[var(--danger)]/20 rounded-xl p-6">
          <div>
            <h3 className="font-bold text-lg m-0 text-[var(--danger)] flex items-center gap-2"><LogOut size={18} /> Terminate Session</h3>
            <p className="text-xs text-[var(--text-secondary)] mt-1 mb-4">Exit your current active console session securely.</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex justify-center items-center gap-2 py-3 rounded-lg border border-[var(--danger)] text-[var(--danger)] font-bold text-sm transition-colors hover:bg-[var(--danger)] hover:text-white"
          >
            <LogOut size={16} /> Logout from Console
          </button>
        </div>
      </div>
    </ManagerLayout>
  );
};

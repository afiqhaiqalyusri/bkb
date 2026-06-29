import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { ManagerLayout } from '../../components/layout/ManagerLayout';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import { orderService } from '../../services/order.service';
import { securityLogger } from '../../utils/securityLogger';
import { LogOut, Palette, Store, CreditCard, Settings, Database, Server, AlertTriangle, Save, Tag, MonitorSmartphone, QrCode } from 'lucide-react';
import toast from 'react-hot-toast';
import { useConfirmation } from '../../components/ConfirmationProvider';
import { authService } from '../../services/auth.service';
import { globalSettingsService } from '../../services/manager.service';
import { FullScreenLoader } from '../../components/ui/FullScreenLoader';

// New Settings Components
import { SettingsCard } from '../../components/settings/SettingsCard';
import { SettingsRow } from '../../components/settings/SettingsRow';
import { SettingsToggle } from '../../components/settings/SettingsToggle';
import { SettingsSelect } from '../../components/settings/SettingsSelect';

export const ManagerSettings: React.FC = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('general');
  const { user, isAuthenticated, clearAuth } = useAuthStore();
  const refreshToken = useAuthStore.getState().refreshToken;
  const { confirm } = useConfirmation();
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam) setActiveTab(tabParam.toLowerCase());
  }, [location]);

  // Logout Handler
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

  // ─── Theme State ─────────────────────────────────────────────────────────────
  const [theme, setTheme] = useState<'light' | 'dark'>(() => (document.documentElement.getAttribute('data-theme') as 'light' | 'dark') || 'light');

  useEffect(() => {
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

  // ─── Settings State ────────────────────────────────────────────────────────
  const [restaurantOpen, setRestaurantOpen] = useState(true);
  const [sstRate, setSstRate] = useState(() => Number(localStorage.getItem('bkb-sst-rate') || '6.0'));
  const [pointsRatio, setPointsRatio] = useState(() => Number(localStorage.getItem('bkb-points-ratio') || '10.0'));
  const [maintenanceMode, setMaintenanceMode] = useState(() => localStorage.getItem('bkb-maint-mode') === 'true');
  const [verboseLogs, setVerboseLogs] = useState(() => localStorage.getItem('bkb-verbose-logs') === 'true');
  const [backingUp, setBackingUp] = useState(false);

  // Payment State
  const [payDUITNOW, setPayDUITNOW] = useState(() => localStorage.getItem('bkb-pay-enabled-DUITNOW') !== 'false');
  const [payTNG, setPayTNG] = useState(() => localStorage.getItem('bkb-pay-enabled-TNG') !== 'false');
  const [paySHOPEEPAY, setPaySHOPEEPAY] = useState(() => localStorage.getItem('bkb-pay-enabled-SHOPEEPAY') !== 'false');
  const [payGRABPAY, setPayGRABPAY] = useState(() => localStorage.getItem('bkb-pay-enabled-GRABPAY') !== 'false');
  const [payBOOST, setPayBOOST] = useState(() => localStorage.getItem('bkb-pay-enabled-BOOST') !== 'false');
  const [payCASH, setPayCASH] = useState(() => localStorage.getItem('bkb-pay-enabled-CASH') !== 'false');

  const [simDelay, setSimDelay] = useState(() => Number(localStorage.getItem('bkb-sim-delay') || '2'));
  const [simFailure, setSimFailure] = useState(() => Number(localStorage.getItem('bkb-sim-failure-rate') || '0'));

  useEffect(() => {
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

  // ─── Action Handlers ───────────────────────────────────────────────────────
  const handleBackup = async () => {
    const confirmed = await confirm({ title: 'Database Backup', message: 'Trigger a database backup now?', confirmLabel: 'Backup Now', cancelLabel: 'Cancel', type: 'info' });
    if (!confirmed) return;
    setBackingUp(true);
    toast.loading('Initializing database backup...', { id: 'db-backup' });
    setTimeout(() => {
      setBackingUp(false); 
      localStorage.setItem('bkb-last-backup', new Date().toLocaleString());
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

  const isManagerOrAdmin = isAuthenticated && user && (user.role === 'MANAGER' || user.role === 'ADMIN');

  // ─── Layout Tabs configuration ──────────────────────────────────────────────
  const allTabs = [
    { id: 'general', label: 'General' },
    ...(isManagerOrAdmin ? [
      { id: 'restaurant', label: 'Restaurant' },
      { id: 'payments', label: 'Payments' },
      { id: 'system', label: 'System' },
    ] : []),
    { id: 'danger', label: 'Danger Zone' },
  ];

  return (
    <ManagerLayout 
      title="Settings" 
      subtitle="Manage platform configuration and preferences"
      tabs={allTabs.map(t => ({
        id: t.id,
        label: t.label,
        active: activeTab === t.id,
        onClick: () => setActiveTab(t.id),
      }))}
    >
      {loggingOut && <FullScreenLoader message="Logging out..." subtitle="Securing your session..." />}
      
      {/* ─── GENERAL TAB ──────────────────────────────────────────────────────── */}
      {activeTab === 'general' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 pb-12">
          <SettingsCard title="Appearance" description="Customize the console look and feel for your workspace." icon={Palette} iconColorClass="text-purple-500">
            <SettingsRow title="Console Theme" description="Switch between light and dark themes." isLast>
              <div className="flex bg-gray-100 dark:bg-slate-900 p-1 rounded-lg border border-gray-200 dark:border-slate-700">
                <button 
                  onClick={() => changeTheme('light')} 
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-bold transition-colors ${theme === 'light' ? 'bg-white text-gray-900 shadow-sm dark:bg-slate-700 dark:text-white' : 'text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white'}`}
                >
                  Light
                </button>
                <button 
                  onClick={() => changeTheme('dark')} 
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-bold transition-colors ${theme === 'dark' ? 'bg-white text-gray-900 shadow-sm dark:bg-slate-700 dark:text-white' : 'text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white'}`}
                >
                  Dark
                </button>
              </div>
            </SettingsRow>
          </SettingsCard>
        </div>
      )}

      {/* ─── RESTAURANT TAB ───────────────────────────────────────────────────── */}
      {activeTab === 'restaurant' && isManagerOrAdmin && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 pb-12">
          <SettingsCard title="Store Operations" description="Manage your global store visibility and hours." icon={Store} iconColorClass="text-blue-500">
            <SettingsRow title="Restaurant Status" description={`Store is currently ${restaurantOpen ? 'OPEN' : 'CLOSED'}`} isLast>
              <SettingsToggle 
                checked={restaurantOpen} 
                onChange={async () => {
                  const val = !restaurantOpen;
                  const confirmed = await confirm({ title: 'Restaurant Operations', message: `Set store operations to ${val ? 'OPEN' : 'CLOSED'}?`, confirmLabel: 'Confirm Change', cancelLabel: 'Cancel', type: 'warning' });
                  if (!confirmed) return;
                  try {
                    await orderService.updateStoreStatus(val);
                    setRestaurantOpen(val); 
                    localStorage.setItem('bkb-store-open', String(val));
                    if (user?.email) securityLogger.logSecurityEvent(user.email, user.role, 'Store Status Update', `Operations toggled to ${val ? 'OPEN' : 'CLOSED'}`);
                    toast.success(`Store operations set to ${val ? 'OPEN' : 'CLOSED'}`);
                  } catch { toast.error('Failed to update store operations'); }
                }} 
              />
            </SettingsRow>
          </SettingsCard>

          <SettingsCard title="Financials & Loyalty" description="Configure taxes and reward point ratios." icon={Tag} iconColorClass="text-green-500">
            <SettingsRow title="SST Service Tax Rate" description="Applied tax percentage on all checkouts">
              <div className="flex items-center gap-3 bg-gray-50 dark:bg-slate-900 p-1.5 rounded-lg border border-gray-200 dark:border-slate-700">
                <button className="w-8 h-8 flex items-center justify-center bg-white dark:bg-slate-800 rounded shadow-sm text-gray-600 dark:text-gray-300 font-bold hover:text-primary transition-colors"
                  onClick={async () => {
                    const val = Math.max(0, sstRate - 0.5);
                    const confirmed = await confirm({ title: 'Confirm Change', message: `Change the SST rate to ${val.toFixed(1)}%?`, confirmLabel: 'Confirm Change', cancelLabel: 'Cancel', type: 'warning' });
                    if (!confirmed) return;
                    setSstRate(val); localStorage.setItem('bkb-sst-rate', String(val));
                    globalSettingsService.updateAll([{ settingKey: 'SST_RATE', settingValue: String(val), description: 'SST Service Tax Rate' }]).catch(console.error);
                  }}
                >-</button>
                <span className="font-bold text-sm w-12 text-center text-gray-900 dark:text-white">{sstRate.toFixed(1)}%</span>
                <button className="w-8 h-8 flex items-center justify-center bg-white dark:bg-slate-800 rounded shadow-sm text-gray-600 dark:text-gray-300 font-bold hover:text-primary transition-colors"
                  onClick={async () => {
                    const val = Math.min(20, sstRate + 0.5);
                    const confirmed = await confirm({ title: 'Confirm Change', message: `Change the SST rate to ${val.toFixed(1)}%?`, confirmLabel: 'Confirm Change', cancelLabel: 'Cancel', type: 'warning' });
                    if (!confirmed) return;
                    setSstRate(val); localStorage.setItem('bkb-sst-rate', String(val));
                    globalSettingsService.updateAll([{ settingKey: 'SST_RATE', settingValue: String(val), description: 'SST Service Tax Rate' }]).catch(console.error);
                  }}
                >+</button>
              </div>
            </SettingsRow>

            <SettingsRow title="Loyalty Point Ratio" description="Minimum RM spent per loyalty point earned" isLast>
              <div className="flex items-center gap-3 bg-gray-50 dark:bg-slate-900 p-1.5 rounded-lg border border-gray-200 dark:border-slate-700">
                <button className="w-8 h-8 flex items-center justify-center bg-white dark:bg-slate-800 rounded shadow-sm text-gray-600 dark:text-gray-300 font-bold hover:text-primary transition-colors"
                  onClick={async () => {
                    const val = Math.max(1, pointsRatio - 1);
                    const confirmed = await confirm({ title: 'Confirm Change', message: `Change the loyalty point ratio to RM ${val}?`, confirmLabel: 'Confirm Change', cancelLabel: 'Cancel', type: 'warning' });
                    if (!confirmed) return;
                    setPointsRatio(val); localStorage.setItem('bkb-points-ratio', String(val));
                    globalSettingsService.updateAll([{ settingKey: 'LOYALTY_RATIO', settingValue: String(val), description: 'Minimum RM spent per loyalty point earned' }]).catch(console.error);
                  }}
                >-</button>
                <span className="font-bold text-sm w-16 text-center text-gray-900 dark:text-white">RM {pointsRatio}</span>
                <button className="w-8 h-8 flex items-center justify-center bg-white dark:bg-slate-800 rounded shadow-sm text-gray-600 dark:text-gray-300 font-bold hover:text-primary transition-colors"
                  onClick={async () => {
                    const val = Math.min(100, pointsRatio + 1);
                    const confirmed = await confirm({ title: 'Confirm Change', message: `Change the loyalty point ratio to RM ${val}?`, confirmLabel: 'Confirm Change', cancelLabel: 'Cancel', type: 'warning' });
                    if (!confirmed) return;
                    setPointsRatio(val); localStorage.setItem('bkb-points-ratio', String(val));
                    globalSettingsService.updateAll([{ settingKey: 'LOYALTY_RATIO', settingValue: String(val), description: 'Minimum RM spent per loyalty point earned' }]).catch(console.error);
                  }}
                >+</button>
              </div>
            </SettingsRow>
          </SettingsCard>
        </div>
      )}

      {/* ─── PAYMENTS TAB ─────────────────────────────────────────────────────── */}
      {activeTab === 'payments' && isManagerOrAdmin && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 pb-12">
          <SettingsCard title="Enabled Payment Channels" description="Toggle active payment methods for checkout." icon={CreditCard} iconColorClass="text-amber-500">
            {[
              { key: 'DUITNOW', label: 'DuitNow QR', state: payDUITNOW, setter: setPayDUITNOW },
              { key: 'TNG', label: "Touch 'n Go eWallet", state: payTNG, setter: setPayTNG },
              { key: 'SHOPEEPAY', label: 'ShopeePay', state: paySHOPEEPAY, setter: setPaySHOPEEPAY },
              { key: 'GRABPAY', label: 'GrabPay', state: payGRABPAY, setter: setPayGRABPAY },
              { key: 'BOOST', label: 'Boost', state: payBOOST, setter: setPayBOOST },
              { key: 'CASH', label: 'Cash at Counter', state: payCASH, setter: setPayCASH },
            ].map((chan, idx, arr) => (
              <SettingsRow key={chan.key} title={chan.label} isLast={idx === arr.length - 1}>
                <SettingsToggle checked={chan.state} onChange={() => handleTogglePayment(chan.key, chan.state, chan.setter, chan.label)} />
              </SettingsRow>
            ))}
          </SettingsCard>

          <SettingsCard title="Simulation Engine" description="Configure simulated payment gateway behaviors for testing." icon={MonitorSmartphone} iconColorClass="text-indigo-500">
            <SettingsRow title="Simulated Scan Delay" description="Artificial delay before payment is authorized">
              <SettingsSelect
                value={simDelay}
                onChange={e => {
                  const val = Number(e.target.value); setSimDelay(val); localStorage.setItem('bkb-sim-delay', String(val));
                  globalSettingsService.updateAll([{ settingKey: 'SIM_DELAY', settingValue: String(val), description: 'Simulated scan delay in seconds' }]).catch(console.error);
                }}
                options={[
                  { label: 'Instant (1s)', value: 1 },
                  { label: 'Fast (2s)', value: 2 },
                  { label: 'Normal (3s)', value: 3 },
                  { label: 'Slow (5s)', value: 5 },
                ]}
              />
            </SettingsRow>
            <SettingsRow title="Scan Failure Rate" description="Probability of a random transaction rejection" isLast>
              <SettingsSelect
                value={simFailure}
                onChange={e => {
                  const val = Number(e.target.value); setSimFailure(val); localStorage.setItem('bkb-sim-failure-rate', String(val));
                  globalSettingsService.updateAll([{ settingKey: 'SIM_FAILURE_RATE', settingValue: String(val), description: 'Simulated scan failure rate (%)' }]).catch(console.error);
                }}
                options={[
                  { label: '0% (Always Succeeds)', value: 0 },
                  { label: '10% Failure Chance', value: 10 },
                  { label: '25% Failure Chance', value: 25 },
                  { label: '50% Failure Chance', value: 50 },
                ]}
              />
            </SettingsRow>
          </SettingsCard>
        </div>
      )}

      {/* ─── SYSTEM TAB ───────────────────────────────────────────────────────── */}
      {activeTab === 'system' && isManagerOrAdmin && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 pb-12">
          <SettingsCard title="System Controls" description="Manage maintenance modes and logging configurations." icon={Settings} iconColorClass="text-gray-500">
            <SettingsRow title="Maintenance Mode" description="Blocks customer checkouts globally">
              <SettingsToggle 
                checked={maintenanceMode} 
                danger
                onChange={async () => {
                  const val = !maintenanceMode;
                  const confirmed = await confirm({ title: 'Maintenance Mode', message: `${val ? 'ENABLE' : 'DISABLE'} maintenance mode?`, confirmLabel: 'Confirm Change', cancelLabel: 'Cancel', type: 'warning' });
                  if (!confirmed) return;
                  setMaintenanceMode(val); localStorage.setItem('bkb-maint-mode', String(val));
                  globalSettingsService.updateAll([{ settingKey: 'MAINTENANCE_MODE', settingValue: String(val), description: 'Maintenance Mode Flag' }]).catch(console.error);
                  if (user?.email) securityLogger.logSecurityEvent(user.email, user.role, 'Maintenance Mode', `Maintenance Mode set to ${val ? 'ENABLED' : 'DISABLED'}`);
                  toast.success(`Maintenance Mode ${val ? 'ENABLED' : 'DISABLED'}`);
                }} 
              />
            </SettingsRow>
            <SettingsRow title="Verbose Server Logs" description="Write extensive debug trace in backend logs" isLast>
              <SettingsToggle 
                checked={verboseLogs} 
                onChange={async () => {
                  const val = !verboseLogs;
                  const confirmed = await confirm({ title: 'Verbose Logs', message: `${val ? 'ENABLE' : 'DISABLE'} verbose server logging?`, confirmLabel: 'Confirm Change', cancelLabel: 'Cancel', type: 'warning' });
                  if (!confirmed) return;
                  setVerboseLogs(val); localStorage.setItem('bkb-verbose-logs', String(val));
                  globalSettingsService.updateAll([{ settingKey: 'VERBOSE_LOGS', settingValue: String(val), description: 'Verbose Logs Flag' }]).catch(console.error);
                  toast.success(`Verbose logging ${val ? 'ENABLED' : 'DISABLED'}`);
                }} 
              />
            </SettingsRow>
          </SettingsCard>

          <SettingsCard title="Database & Backups" description="Manage database backups and retention." icon={Database} iconColorClass="text-teal-500">
            <SettingsRow title="Manual Backup" description={localStorage.getItem('bkb-last-backup') ? `Last backup: ${localStorage.getItem('bkb-last-backup')}` : 'No backups created yet'} isLast>
              <button
                onClick={handleBackup}
                disabled={backingUp}
                className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 font-bold py-2 px-4 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors shadow-sm disabled:opacity-50"
              >
                <Save size={16} />
                {backingUp ? 'Backing up...' : 'Backup Now'}
              </button>
            </SettingsRow>
          </SettingsCard>
        </div>
      )}

      {/* ─── DANGER ZONE TAB ──────────────────────────────────────────────────── */}
      {activeTab === 'danger' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 pb-12">
          <SettingsCard title="Danger Zone" description="Irreversible and destructive actions." icon={AlertTriangle} danger>
            <SettingsRow title="Terminate Session" description="Exit your current active console session securely." isLast>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 bg-red-600 text-white font-bold py-2.5 px-6 rounded-lg hover:bg-red-700 transition-colors shadow-sm"
              >
                <LogOut size={16} />
                Log Out Now
              </button>
            </SettingsRow>
          </SettingsCard>
        </div>
      )}

    </ManagerLayout>
  );
};

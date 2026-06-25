import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, Users, TrendingUp, ShoppingBag,
  AlertTriangle, ArrowUp, Flame, Download, Calendar, DollarSign, FileText,
  Menu, Database, Trash2, Award, BarChart3, Package, Settings, AlertCircle, 
  CreditCard, ChevronRight, MessageSquare, ShieldCheck, CheckCircle2, Inbox
} from 'lucide-react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { reportService } from '../../services/report.service';
import { inventoryService } from '../../services/inventory.service';
import { reportService as managerReportService, staffService } from '../../services/manager.service';
import { formatRM } from '../../utils/formatCurrency';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { KPISkeleton, ChartSkeleton, TableSkeleton } from '../../components/ui/SkeletonLoader';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';
import { BkbLogo } from '../../components/ui/BkbLogo';

// UI Components
import { AppCard } from '../../components/ui/AppCard';
import { AppStatCard } from '../../components/ui/AppStatCard';
import { AppTable, Column } from '../../components/ui/AppTable';
import { AppBadge } from '../../components/ui/AppBadge';
import { AppButton } from '../../components/ui/AppButton';
import { AppPageHeader } from '../../components/ui/AppPageHeader';
import { AppEmptyState } from '../../components/ui/AppEmptyState';

// ─── Minimalist Side Navigation ──────────────────────────────
const NAV_ITEMS = [
  { path: '/manager',             label: 'Overview',      icon: LayoutDashboard },
  { path: '/manager/menu',        label: 'Menu',          icon: ShoppingBag },
  { path: '/manager/inventory',   label: 'Inventory',     icon: Database },
  { path: '/manager/waste',       label: 'Waste Log',     icon: Trash2 },
  { path: '/manager/users',       label: 'Users',         icon: Users },
  { path: '/manager/loyalty',     label: 'Loyalty',       icon: Award },
];

export const ManagerSidebar: React.FC<{ collapsed?: boolean; onClose?: () => void }> = ({ collapsed, onClose }) => {
  const location = useLocation();
  const { user } = useAuthStore();

  const filteredNavItems = NAV_ITEMS.filter(item => {
    if ((item as any).adminOnly && user?.role !== 'ADMIN') {
      return false;
    }
    return true;
  });

  return (
    <aside style={{
      width: collapsed ? 0 : 240,
      minHeight: '100vh',
      background: 'var(--bkb-sidebar-bg)',
      display: 'flex',
      flexDirection: 'column',
      transition: 'width 0.3s ease',
      overflow: 'hidden',
      flexShrink: 0,
      borderRight: '1px solid var(--bkb-border)',
      position: 'sticky',
      top: 0,
    }}>
      <div style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <BkbLogo size={28} showText={false} color="var(--primary)" />
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '1rem', color: 'var(--text-primary)', fontWeight: 800, letterSpacing: '-0.5px' }}>BKB</span>
          <span style={{ fontSize: '0.65rem', color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Manager Console</span>
        </div>
      </div>

      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '0 16px', gap: 8, marginTop: 12 }}>
        {filteredNavItems.map(item => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path ||
            (item.path !== '/manager' && location.pathname.startsWith(item.path));
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onClose}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                textDecoration: 'none',
                padding: '12px 16px',
                borderRadius: '8px',
                background: isActive ? 'rgba(255,107,0,0.1)' : 'transparent',
                color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                fontWeight: isActive ? 700 : 500,
                transition: 'all 0.2s',
              }}
            >
              <Icon size={18} />
              <span style={{ fontSize: '0.85rem' }}>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div style={{ padding: '24px 16px', borderTop: '1px solid var(--bkb-border)' }}>
        <Link to="/manager/settings" style={{
          display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none',
          padding: '12px 16px', borderRadius: '8px',
          color: 'var(--text-secondary)', fontWeight: 500, transition: 'all 0.2s'
        }}>
          <Settings size={18} />
          <span style={{ fontSize: '0.85rem' }}>Settings</span>
        </Link>
      </div>
    </aside>
  );
};

// ─── Consolidated Manager Layout ─────────────────────────────
interface ManagerLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  tabs?: { id: string; label: string; active: boolean; onClick: () => void }[];
}

export const ManagerLayout: React.FC<ManagerLayoutProps> = ({ children, title, subtitle, tabs }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuthStore();

  useEffect(() => {
    window.history.pushState(null, '', window.location.href);
    const preventBack = () => {
      window.history.pushState(null, '', window.location.href);
      toast('Navigation disabled for security', { id: 'nav-lock-manager', icon: '🛡️' }); // Kept one shield for system alert
    };
    window.addEventListener('popstate', preventBack);
    return () => window.removeEventListener('popstate', preventBack);
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--background)',
      display: 'flex',
      flexDirection: 'row',
      color: 'var(--text-primary)',
      overflow: 'hidden',
    }}>
      <div style={{ display: 'block' }} className="manager-sidebar-desktop-layout">
        <ManagerSidebar />
      </div>

      {sidebarOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex' }}
          onClick={() => setSidebarOpen(false)}
        >
          <div onClick={e => e.stopPropagation()}>
            <ManagerSidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100vh' }}>
        <header style={{
          height: 70, padding: '0 24px', display: 'flex', alignItems: 'center',
          borderBottom: '1px solid var(--border)', background: 'var(--surface)', flexShrink: 0,
        }}>
          <button
            className="manager-menu-btn-layout"
            onClick={() => setSidebarOpen(true)}
            style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', marginRight: 16, display: 'none', alignItems: 'center' }}
          >
            <Menu size={22} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <h1 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {title}
            </h1>
          </div>

          {tabs && tabs.length > 0 && (
            <div style={{ display: 'flex', gap: 24, marginLeft: 40 }} className="manager-tabs-scroller">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={tab.onClick}
                  style={{
                    background: 'none', border: 'none',
                    color: tab.active ? 'var(--primary)' : 'var(--text-secondary)',
                    fontWeight: tab.active ? 600 : 500, fontSize: '0.85rem',
                    cursor: 'pointer', position: 'relative', padding: '24px 0',
                    transition: 'color 0.2s',
                  }}
                >
                  {tab.label}
                  {tab.active && (
                    <span style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: 'var(--primary)', borderRadius: '3px 3px 0 0' }} />
                  )}
                </button>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginLeft: 'auto' }}>
            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{user?.name || 'Manager'}</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{user?.role === 'ADMIN' ? 'Administrator' : 'Store Manager'}</span>
            </div>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--primary)', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
              {user?.name ? user.name.charAt(0).toUpperCase() : 'M'}
            </div>
          </div>
        </header>

        <div style={{ flex: 1, overflowY: 'auto', padding: '32px 24px', background: 'var(--background)' }}>
          {children}
        </div>
      </div>

      <style>{`
        .manager-tabs-scroller { overflow-x: auto; white-space: nowrap; -scrollbar-width: none; }
        .manager-tabs-scroller::-webkit-scrollbar { display: none; }
        @media (min-width: 900px) {
          .manager-sidebar-desktop-layout { display: block !important; }
          .manager-menu-btn-layout { display: none !important; }
        }
        @media (max-width: 899px) {
          .manager-sidebar-desktop-layout { display: none !important; }
          .manager-menu-btn-layout { display: flex !important; }
        }
      `}</style>
    </div>
  );
};

// 1. Overview Tab Content
const OverviewContent: React.FC<{
  report: any;
  lowStock: any[];
  onRefresh: () => void;
  loading: boolean;
  onNavigate: (tab: string) => void;
}> = ({ report, lowStock, loading, onNavigate }) => {
  if (loading) return <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}><KPISkeleton count={4} /></div>;

  const execData = report;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <AppStatCard title="Revenue" value={formatRM(execData?.revenue?.value ?? 0)} icon={DollarSign} trend={parseFloat(execData?.revenue?.percentChange || '0')} />
        <AppStatCard title="Estimated Profit" value={formatRM(execData?.profit?.value ?? 0)} icon={TrendingUp} trend={parseFloat(execData?.profit?.percentChange || '0')} colorClass="text-green-500" />
        <AppStatCard title="Total Orders" value={execData?.orders?.value ?? 0} icon={ShoppingBag} trend={parseFloat(execData?.orders?.percentChange || '0')} colorClass="text-blue-500" />
        <AppStatCard title="Unique Customers" value={execData?.customers?.value ?? 0} icon={Users} trend={parseFloat(execData?.customers?.percentChange || '0')} colorClass="text-purple-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AppCard title="Peak Hours" subtitle="Busiest time of day (orders)">
          <div style={{ height: 260 }}>
            {(!execData?.peakHours || execData.peakHours.length === 0) ? (
              <AppEmptyState title="No data available" icon={BarChart3} />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={execData.peakHours.map((d:any) => ({ name: d.hour, Orders: d.orderCount }))}>
                  <defs>
                    <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={12} tickLine={false} />
                  <YAxis stroke="var(--text-secondary)" fontSize={12} tickLine={false} />
                  <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px' }} />
                  <Area type="monotone" dataKey="Orders" stroke="var(--primary)" fillOpacity={1} fill="url(#colorOrders)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </AppCard>

        <AppCard title="Inventory Alerts" subtitle="Items requiring restock" headerAction={
          <AppButton variant="ghost" size="sm" onClick={() => window.location.href = '/manager/inventory'}>Manage</AppButton>
        }>
          {lowStock.length === 0 ? (
            <AppEmptyState title="All stock levels healthy" icon={CheckCircle2} />
          ) : (
            <div className="flex flex-col gap-3">
              {lowStock.slice(0, 5).map((item) => (
                <div key={item.id} className="flex justify-between items-center py-2 border-b border-[var(--border)] last:border-0">
                  <div>
                    <div className="font-semibold text-[var(--text-primary)] text-sm">{item.itemName}</div>
                    <div className="text-xs text-[var(--text-secondary)]">{item.category}</div>
                  </div>
                  <AppBadge variant={item.status === 'CRITICAL' ? 'danger' : 'warning'} text={`${item.currentStock}/${item.minStock} ${item.unit}`} />
                </div>
              ))}
            </div>
          )}
        </AppCard>
      </div>

      {report?.topItems && report.topItems.length > 0 && (
        <AppCard title="Top Selling Items" subtitle="Best performing food items" headerAction={
          <AppButton variant="ghost" size="sm" onClick={() => onNavigate('reports')}>Full Report</AppButton>
        }>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {report.topItems.slice(0, 6).map((item: any, idx: number) => (
              <div key={idx} className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-[rgba(0,0,0,0.03)] flex items-center justify-center font-bold text-[var(--text-secondary)]">#{idx + 1}</div>
                <div>
                  <div className="font-semibold text-sm">{item.itemName}</div>
                  <div className="text-xs text-[var(--text-secondary)]">{item.totalQuantity} sold · {formatRM(item.totalRevenue)}</div>
                </div>
              </div>
            ))}
          </div>
        </AppCard>
      )}
    </div>
  );
};

// 2. Reports Tab Content
const ReportsContent: React.FC = () => {
  const getTodayStr = () => new Date().toISOString().split('T')[0];
  const getMonthStartStr = () => new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

  const [from, setFrom] = useState(getMonthStartStr());
  const [to, setTo] = useState(getTodayStr());
  const [report, setReport] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [staffPerformance, setStaffPerformance] = useState<any[]>([]);

  useEffect(() => { loadReport(); }, []);

  const loadReport = () => {
    setLoading(true);
    Promise.all([
      reportService.getDailySales(from, to),
      reportService.getStaffPerformance(from, to)
    ]).then(([salesRes, staffRes]) => {
      setReport(salesRes.data);
      setStaffPerformance(staffRes.data || []);
    }).catch(() => toast.error('Failed to load reports')).finally(() => setLoading(false));
  };

  const handleExport = () => {
    reportService.exportCsv(from, to).then(res => {
      const blob = new Blob([res.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `bkb-sales-report.csv`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
    });
  };

  const salesCols: Column<any>[] = [
    { header: 'Rank', render: (item: any) => report?.topItems ? `#${report.topItems.indexOf(item) + 1}` : '', width: '60px' },
    { header: 'Item', accessor: 'itemName' },
    { header: 'Units Sold', accessor: 'totalQuantity', align: 'center' },
    { header: 'Revenue', render: (item) => formatRM(item.totalRevenue), align: 'right' },
  ];

  const staffCols: Column<any>[] = [
    { header: 'Staff Member', accessor: 'staffName' },
    { header: 'Orders Completed', accessor: 'ordersCompleted', align: 'right' },
  ];

  if (loading) return <TableSkeleton rows={5} />;

  return (
    <div className="flex flex-col gap-6">
      <AppCard>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Calendar size={18} className="text-[var(--primary)]" />
            <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="border border-[var(--border)] rounded px-3 py-1.5 text-sm bg-[var(--background)]" />
            <span className="text-sm text-[var(--text-secondary)]">to</span>
            <input type="date" value={to} onChange={e => setTo(e.target.value)} className="border border-[var(--border)] rounded px-3 py-1.5 text-sm bg-[var(--background)]" />
            <AppButton onClick={loadReport} size="sm">Apply</AppButton>
          </div>
          <AppButton variant="outline" size="sm" icon={Download} onClick={handleExport}>Export CSV</AppButton>
        </div>
      </AppCard>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <AppStatCard title="Total Revenue" value={formatRM(report?.totalRevenue ?? 0)} icon={DollarSign} colorClass="text-[var(--primary)]" />
        <AppStatCard title="Total Orders" value={report?.totalOrders ?? 0} icon={FileText} colorClass="text-blue-500" />
        <AppStatCard title="Avg Order Value" value={formatRM(report?.avgOrderValue ?? 0)} icon={TrendingUp} colorClass="text-purple-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AppCard title="Top Selling Items">
          {(!report?.topItems || report.topItems.length === 0) ? (
            <AppEmptyState title="No sales data" icon={BarChart3} />
          ) : (
            <AppTable columns={salesCols} data={report.topItems} keyExtractor={(item) => item.itemName} />
          )}
        </AppCard>

        <AppCard title="Staff Performance">
          {(!staffPerformance || staffPerformance.length === 0) ? (
            <AppEmptyState title="No staff data" icon={Users} />
          ) : (
            <AppTable columns={staffCols} data={staffPerformance} keyExtractor={(item) => item.staffName} />
          )}
        </AppCard>
      </div>
    </div>
  );
};

// 3. Audit Logs Tab Content
const AuditLogsContent: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    staffService.getSecurityLogs(0, 100).then(res => {
      if (res.data?.content) setLogs(res.data.content);
    }).finally(() => setLoading(false));
  }, []);

  const cols: Column<any>[] = [
    { header: 'Timestamp', render: (l: any) => new Date(l.createdAt).toLocaleString('en-MY') },
    { header: 'User', render: (l: any) => l.userEmail || 'System' },
    { header: 'Role', render: (l: any) => <AppBadge variant={l.userRole === 'ADMIN' ? 'danger' : 'info'} text={l.userRole || 'SYSTEM'} /> },
    { header: 'Event', accessor: 'action' },
    { header: 'Details', accessor: 'details' },
    { header: 'IP', render: (l: any) => l.ipAddress || '-' },
  ];

  if (loading) return <TableSkeleton rows={8} />;

  return (
    <AppCard noPadding>
      <AppTable columns={cols} data={logs} keyExtractor={(l: any) => l.id || String(Math.random())} emptyMessage={<AppEmptyState title="No audit logs" icon={ShieldCheck} />} />
    </AppCard>
  );
};

// 4. Menu Analytics Tab Content
const MenuAnalyticsContent: React.FC = () => {
  const [analytics, setAnalytics] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const from = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const to = new Date().toISOString().split('T')[0];
    reportService.getMenuAnalytics(from, to).then(res => setAnalytics(res.data)).finally(() => setLoading(false));
  }, []);

  const cols: Column<any>[] = [
    { header: 'Item', accessor: 'itemName' },
    { header: 'Units', accessor: 'totalSold' },
    { header: 'Revenue', render: (i) => formatRM(i.totalRevenue), align: 'right' },
    { header: 'Profit', render: (i) => <span className="text-[var(--bkb-success)] font-bold">{formatRM(i.estimatedProfit)}</span>, align: 'right' },
  ];

  if (loading) return <TableSkeleton rows={8} />;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <AppCard title="Best Performers">
        <AppTable columns={cols} data={analytics?.topSellers || []} keyExtractor={(i) => i.itemName} emptyMessage={<AppEmptyState title="No data" />} />
      </AppCard>
      <AppCard title="Needs Attention">
        <AppTable columns={cols} data={analytics?.worstSellers || []} keyExtractor={(i) => i.itemName} emptyMessage={<AppEmptyState title="No data" />} />
      </AppCard>
    </div>
  );
};

// 5. Customer Insights Tab Content
const CustomerInsightsContent: React.FC = () => {
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    managerReportService.getCustomerInsights().then(res => setInsights(res.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <TableSkeleton rows={8} />;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <AppStatCard title="Total Customers" value={insights?.totalUniqueCustomers || 0} icon={Users} colorClass="text-blue-500" />
        <AppStatCard title="Repeat Customers" value={insights?.repeatCustomers || 0} icon={TrendingUp} colorClass="text-green-500" />
        <AppStatCard title="Avg Customer LTV" value={formatRM(insights?.averageCustomerLtv || 0)} icon={DollarSign} colorClass="text-purple-500" />
        <AppStatCard title="Avg Rating" value={`${insights?.averageRating || 0} / 5`} icon={Award} colorClass="text-orange-500" />
      </div>

      <AppCard title="Recent Customer Feedback">
        {(!insights?.recentFeedback || insights.recentFeedback.length === 0) ? (
          <AppEmptyState title="No feedback yet" icon={MessageSquare} />
        ) : (
          <div className="flex flex-col gap-4">
            {insights.recentFeedback.map((fb: any, idx: number) => (
              <div key={idx} className="p-4 border border-[var(--border)] rounded-lg bg-[var(--background)]">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{fb.customerName}</span>
                    <span className="text-xs bg-[var(--surface)] px-2 py-1 rounded text-[var(--text-secondary)]">Order #{fb.orderNumber}</span>
                  </div>
                  <span className="text-xs text-[var(--text-secondary)]">{fb.date}</span>
                </div>
                <div className="flex items-center gap-1 mb-2 text-yellow-400">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} className={i < fb.rating ? 'text-yellow-400' : 'text-[var(--border)]'}>★</span>
                  ))}
                </div>
                {fb.feedback && <p className="text-sm text-[var(--text-primary)] m-0">{fb.feedback}</p>}
              </div>
            ))}
          </div>
        )}
      </AppCard>
    </div>
  );
};

export const ManagerDashboard: React.FC = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('overview');
  const { user } = useAuthStore();
  const [report, setReport] = useState<any>(null);
  const [lowStock, setLowStock] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam) setActiveTab(tabParam.toLowerCase());
  }, [location]);

  const loadData = () => {
    const today = new Date().toISOString().split('T')[0];
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    Promise.all([
      reportService.getExecutiveDashboard(monthStart, today),
      inventoryService.getLowStock(),
    ]).then(([repRes, lowRes]) => {
      setReport(repRes.data);
      setLowStock(lowRes.data);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const rawTabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'reports', label: 'Sales Reports' },
    { id: 'menu', label: 'Menu Analytics' },
    { id: 'insights', label: 'Customer Insights' },
    { id: 'logs', label: 'Audit Logs' },
  ];
  const dashboardTabs = rawTabs;

  return (
    <ManagerLayout
      title="Dashboard"
      tabs={dashboardTabs.map(t => ({
        id: t.id, label: t.label, active: activeTab === t.id, onClick: () => setActiveTab(t.id)
      }))}
    >
      {activeTab === 'overview' && <OverviewContent report={report} lowStock={lowStock} onRefresh={loadData} loading={loading} onNavigate={setActiveTab} />}
      {activeTab === 'reports' && <ReportsContent />}
      {activeTab === 'menu' && <MenuAnalyticsContent />}
      {activeTab === 'insights' && <CustomerInsightsContent />}
      {activeTab === 'logs' && <AuditLogsContent />}
    </ManagerLayout>
  );
};

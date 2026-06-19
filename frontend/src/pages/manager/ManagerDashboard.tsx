import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, Users, TrendingUp, ShoppingBag,
  AlertTriangle, ArrowUp, Flame, Download, Calendar, DollarSign, FileText,
  Menu, Database, Trash2, Award
} from 'lucide-react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { reportService } from '../../services/report.service';
import { inventoryService } from '../../services/inventory.service';
import { formatRM } from '../../utils/formatCurrency';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { KPISkeleton, ChartSkeleton, TableSkeleton } from '../../components/ui/SkeletonLoader';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';
import { staffService } from '../../services/manager.service';
import { BkbLogo } from '../../components/ui/BkbLogo';

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
      width: collapsed ? 0 : 90,
      minHeight: '100vh',
      background: '#27201E',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      transition: 'width 0.3s ease',
      overflow: 'hidden',
      flexShrink: 0,
      borderRight: '1px solid rgba(255,255,255,0.06)',
      position: 'sticky',
      top: 0,
    }}>
      {/* Mini Logo */}
      <div style={{ padding: '24px 0 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
        <BkbLogo size={28} showText={false} color="var(--primary)" />
        <span style={{ fontSize: '0.55rem', color: 'var(--primary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Console</span>
      </div>

      {/* Nav List */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, width: '100%' }}>
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
                flexDirection: 'column',
                alignItems: 'center',
                gap: 5,
                textDecoration: 'none',
                width: '100%',
                padding: '6px 0',
                transition: 'all 0.2s',
              }}
            >
              <div style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: isActive ? '#FFF' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isActive ? 'var(--red)' : 'rgba(255,255,255,0.5)',
                boxShadow: isActive ? '0 8px 24px rgba(0,0,0,0.15)' : 'none',
                transition: 'all 0.2s',
              }}>
                <Icon size={18} />
              </div>
              <span style={{
                fontSize: '0.58rem',
                fontWeight: isActive ? 800 : 500,
                color: isActive ? '#FFF' : 'rgba(255,255,255,0.4)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Profile */}
      <div style={{ padding: '16px 0 24px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Link to="/manager/settings" style={{
          width: 38,
          height: 38,
          borderRadius: '50%',
          background: 'var(--cream-dark)',
          border: '1.5px solid rgba(255,255,255,0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.8rem',
          fontWeight: 800,
          color: 'var(--text-primary)',
          textDecoration: 'none',
          overflow: 'hidden'
        }}>
          {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
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
      toast('Navigation disabled for security', { icon: '🔒', id: 'nav-lock-manager' });
    };
    window.addEventListener('popstate', preventBack);
    return () => window.removeEventListener('popstate', preventBack);
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      background: '#27201E',
      display: 'flex',
      flexDirection: 'row',
      color: 'var(--text-primary)',
      overflow: 'hidden',
    }}>
      {/* Desktop sidebar */}
      <div style={{ display: 'block' }} className="manager-sidebar-desktop-layout">
        <ManagerSidebar />
      </div>

      {/* Mobile sidebar overlay */}
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

      {/* Main Container */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        height: '100vh',
      }}>
        {/* Top Header Navigation */}
        <header style={{
          height: 70,
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          background: 'transparent',
          flexShrink: 0,
        }}>
          <button
            className="manager-menu-btn-layout"
            onClick={() => setSidebarOpen(true)}
            style={{ background: 'none', border: 'none', color: '#FFF', cursor: 'pointer', marginRight: 16, display: 'none', alignItems: 'center' }}
          >
            <Menu size={22} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <h1 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#FFF', textTransform: 'uppercase', fontFamily: 'Poppins', letterSpacing: '0.5px' }}>
              {title}
            </h1>
          </div>

          {/* Sub Navigation Tabs */}
          {tabs && tabs.length > 0 && (
            <div style={{ display: 'flex', gap: 20, marginLeft: 30 }} className="manager-tabs-scroller">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={tab.onClick}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: tab.active ? '#FFF' : 'rgba(255,255,255,0.5)',
                    fontWeight: tab.active ? 700 : 500,
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    position: 'relative',
                    padding: '8px 0',
                    transition: 'color 0.2s',
                  }}
                >
                  {tab.label}
                  {tab.active && (
                    <span style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: 2.5,
                      background: 'var(--red)',
                      borderRadius: 99
                    }} />
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Role Label */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
            <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)', fontWeight: 700 }} className="mode-text-layout">
              {user?.role === 'ADMIN' ? 'Admin Console' : 'Manager Console'}
            </span>
          </div>
        </header>

        {/* Content Body Rounded Card */}
        <div style={{
          flex: 1,
          background: 'var(--surface)',
          borderRadius: '24px 24px 0 0',
          margin: '0 16px 0 16px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          borderTop: '1px solid var(--border)',
          borderLeft: '1px solid var(--border)',
          borderRight: '1px solid var(--border)',
          position: 'relative',
        }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
            {children}
          </div>
        </div>
      </div>

      <style>{`
        .manager-tabs-scroller {
          overflow-x: auto;
          white-space: nowrap;
          -scrollbar-width: none;
        }
        .manager-tabs-scroller::-webkit-scrollbar {
          display: none;
        }
        @media (min-width: 900px) {
          .manager-sidebar-desktop-layout { display: block !important; }
          .manager-menu-btn-layout { display: none !important; }
        }
        @media (max-width: 899px) {
          .manager-sidebar-desktop-layout { display: none !important; }
          .manager-menu-btn-layout { display: flex !important; }
          .avatar-stack-layout { display: none !important; }
          .mode-text-layout { font-size: 0.65rem; }
        }
      `}</style>
    </div>
  );
};

// ─── Consolidated Dashboard View Components ─────────────────

// 1. Overview Tab Content
const OverviewContent: React.FC<{
  report: any;
  lowStock: any[];
  onRefresh: () => void;
  loading: boolean;
  onNavigate: (tab: string) => void;
}> = ({ report, lowStock, onRefresh, loading, onNavigate }) => {
  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <KPISkeleton count={5} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 24 }}>
          <ChartSkeleton />
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)', padding: 24, boxShadow: 'var(--shadow-sm)',
            display: 'flex', flexDirection: 'column', gap: 14
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div className="shimmer-wave" style={{ height: 14, width: '40%', borderRadius: 4 }} />
                <div className="shimmer-wave" style={{ height: 8, width: '60%', borderRadius: 4 }} />
              </div>
            </div>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: i === 3 ? 'none' : '1px solid var(--border)' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div className="shimmer-wave" style={{ height: 12, width: '50%', borderRadius: 4 }} />
                  <div className="shimmer-wave" style={{ height: 8, width: '30%', borderRadius: 4 }} />
                </div>
                <div className="shimmer-wave" style={{ width: 80, height: 20, borderRadius: 4 }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const todayStr = new Date().toLocaleDateString('sv-SE');
  const todayData = report?.dailyRevenue?.find((d: any) => d.date === todayStr);

  const kpis = [
    {
      icon: <TrendingUp size={22} />,
      label: "Today's Revenue",
      value: formatRM(todayData?.revenue ?? 0),
      sub: `${todayData?.orders ?? 0} orders`,
    },
    {
      icon: <ShoppingBag size={22} />,
      label: 'Monthly Revenue',
      value: formatRM(report?.totalRevenue ?? 0),
      sub: `${report?.totalOrders ?? 0} total orders`,
    },
    {
      icon: <Flame size={22} />,
      label: 'Avg Order Value',
      value: formatRM(report?.avgOrderValue ?? 0),
      sub: 'This month',
    },
    {
      icon: <AlertTriangle size={22} />,
      label: 'Low Stock Alerts',
      value: String(lowStock.length),
      sub: lowStock.length > 0 ? 'Need attention' : 'All good ✓',
    },
  ];

  const chartData = report?.dailyRevenue?.slice(-14).map((d: any) => ({
    name: d.date.substring(8, 10),
    Revenue: d.revenue,
    Orders: d.orders,
  })) || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        {kpis.map((kpi, i) => (
          <div key={i} style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            boxShadow: 'var(--shadow-sm)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {kpi.label}
              </span>
              <div style={{ color: 'var(--text-secondary)', opacity: 0.8 }}>
                {kpi.icon}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'Poppins', letterSpacing: '-0.5px' }}>
                {kpi.value}
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ 
                  display: 'inline-block', width: 6, height: 6, borderRadius: '50%',
                  background: kpi.label.includes('Low Stock') ? (lowStock.length > 0 ? '#EF4444' : '#22C55E') : 'var(--text-secondary)'
                }} />
                {kpi.sub}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Chart and Stock Alert Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 24 }}>
        {/* Area Chart */}
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)', padding: 24, boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'Poppins' }}>Revenue Trend</h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Daily revenue over the last 14 days</p>
            </div>
            <ArrowUp size={16} style={{ color: '#22C55E' }} />
          </div>
          <div style={{ height: 220 }}>
            {chartData.length === 0 ? (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>No data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--red)" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="var(--red)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={10} tickLine={false} />
                  <YAxis stroke="var(--text-secondary)" fontSize={10} tickLine={false} />
                  <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 11 }} />
                  <Area type="monotone" dataKey="Revenue" stroke="var(--red)" strokeWidth={1.5} fill="url(#revGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)', padding: 24, boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'Poppins' }}>Inventory Alerts</h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Ingredient levels requiring restock attention</p>
            </div>
            <Link to="/manager/inventory" style={{ fontSize: '0.75rem', color: 'var(--red)', textDecoration: 'none', fontWeight: 700 }}>
              Manage →
            </Link>
          </div>
          {lowStock.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 180, color: 'var(--text-secondary)' }}>
              <div style={{ fontSize: '2.2rem', marginBottom: 6, color: '#22C55E' }}>✓</div>
              <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 600 }}>All stock levels are healthy</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0, maxHeight: 220, overflowY: 'auto' }}>
              {lowStock.map((item: any, idx: number) => (
                <div key={item.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '12px 0',
                  borderBottom: idx === lowStock.length - 1 ? 'none' : '1px solid var(--border)',
                }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--text-primary)' }}>{item.itemName}</div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', marginTop: 2 }}>{item.category}</div>
                  </div>
                  <span style={{
                    fontSize: '0.72rem', fontWeight: 700, padding: '3px 8px', borderRadius: 4,
                    background: item.status === 'CRITICAL' ? 'rgba(239,68,68,0.08)' : 'rgba(245,158,11,0.08)',
                    color: item.status === 'CRITICAL' ? '#EF4444' : '#F59E0B',
                    border: item.status === 'CRITICAL' ? '1px solid rgba(239,68,68,0.2)' : '1px solid rgba(245,158,11,0.2)'
                  }}>
                    {item.currentStock}/{item.minStock} {item.unit}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Top Performers Row */}
      {report?.topItems && report.topItems.length > 0 && (
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)', padding: 24, boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'Poppins' }}>Top Selling Items</h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Best performing food items this month</p>
            </div>
            <button onClick={() => onNavigate('reports')} style={{ background: 'none', border: 'none', fontSize: '0.75rem', color: 'var(--red)', cursor: 'pointer', fontWeight: 700 }}>
              Full Report →
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14 }}>
            {report.topItems.slice(0, 6).map((item: any, idx: number) => (
              <div key={idx} style={{
                background: 'var(--secondary-bg)', borderRadius: 'var(--radius-sm)', padding: '14px 16px',
                border: '1px solid var(--border)',
              }}>
                <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'Poppins', opacity: 0.8 }}>#{idx + 1}</div>
                <div style={{ fontWeight: 600, fontSize: '0.82rem', marginTop: 4, color: 'var(--text-primary)' }}>{item.itemName}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: 6, fontWeight: 500 }}>
                  {item.totalQuantity} sold · {formatRM(item.totalRevenue)}
                </div>
              </div>
            ))}
          </div>
        </div>
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

  useEffect(() => { loadReport(); }, []);

  const loadReport = () => {
    setLoading(true);
    reportService.getDailySales(from, to)
      .then(res => setReport(res.data))
      .catch(() => toast.error('Failed to load sales reports'))
      .finally(() => setLoading(false));
  };

  const handleExport = () => {
    reportService.exportCsv(from, to)
      .then(res => {
        const blob = new Blob([res.data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bkb-sales-report-${from}-to-${to}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        toast.success('Report exported');
      })
      .catch(() => toast.error('Failed to export CSV'));
  };

  const kpis = [
    { icon: <DollarSign size={20} />, label: 'Total Revenue', value: formatRM(report?.totalRevenue ?? 0), color: '#E8450A' },
    { icon: <FileText size={20} />, label: 'Total Orders', value: String(report?.totalOrders ?? 0), color: 'var(--bkb-orange)' },
    { icon: <TrendingUp size={20} />, label: 'Avg Order Value', value: formatRM(report?.avgOrderValue ?? 0), color: '#8B5CF6' },
  ];

  const revenueChartData = report?.dailyRevenue?.map((d: any) => ({
    date: d.date.substring(5, 10),
    Revenue: d.revenue,
    Orders: d.orders,
  })) || [];

  return (
    <div>
      {/* Date Filter */}
      <div style={{
        background: 'var(--cream-dark)', border: '1px solid var(--border)',
        borderRadius: 16, padding: '16px 20px', marginBottom: 24,
        display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
          <Calendar size={18} style={{ color: 'var(--red)' }} />
          <input type="date" value={from} onChange={e => setFrom(e.target.value)}
            style={{ padding: '8px 12px', background: 'var(--background)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: '0.85rem' }} />
          <span style={{ color: 'var(--text-secondary)' }}>to</span>
          <input type="date" value={to} onChange={e => setTo(e.target.value)}
            style={{ padding: '8px 12px', background: 'var(--background)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: '0.85rem' }} />
          <button className="bkb-btn-primary" onClick={loadReport} style={{ padding: '8px 16px', fontSize: '0.85rem' }}>Apply</button>
        </div>
        <button className="bkb-btn-ghost" onClick={handleExport} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px' }}>
          <Download size={16} /> Export CSV
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <KPISkeleton count={3} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 20 }}>
            <ChartSkeleton />
            <TableSkeleton rows={5} />
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
            {kpis.map((kpi, i) => (
              <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '20px', display: 'flex', alignItems: 'center', gap: 16, boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: `${kpi.color}18`, color: kpi.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{kpi.icon}</div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{kpi.label}</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: 4 }}>{kpi.value}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 20 }}>
            {/* Revenue Trend */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, boxShadow: 'var(--shadow-sm)' }}>
              <h3 style={{ margin: '0 0 20px', fontSize: '0.95rem', fontWeight: 700 }}>Revenue Trend</h3>
              <div style={{ height: 300 }}>
                {revenueChartData.length === 0 ? (
                  <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>No trend data</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueChartData}>
                      <defs>
                        <linearGradient id="colorRevenue2" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--red)" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="var(--red)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                      <XAxis dataKey="date" stroke="var(--text-secondary)" fontSize={11} />
                      <YAxis stroke="var(--text-secondary)" fontSize={11} />
                      <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 12 }} />
                      <Area type="monotone" dataKey="Revenue" stroke="var(--red)" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue2)" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Top Selling Items */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', boxShadow: 'var(--shadow-sm)' }}>
              <h3 style={{ margin: '0 0 20px', fontSize: '0.95rem', fontWeight: 700 }}>🏆 Top Selling Items</h3>
              {!report?.topItems || report.topItems.length === 0 ? (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', minHeight: 250 }}>No sales data available</div>
              ) : (
                <div style={{ flex: 1, overflowY: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
                        {['Item', 'Units', 'Revenue'].map(h => (
                          <th key={h} style={{ padding: '8px 12px 12px', textAlign: h === 'Revenue' ? 'right' : 'left' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {report.topItems.map((item: any, idx: number) => (
                        <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '12px', fontWeight: 600, fontSize: '0.88rem' }}>
                            <span style={{ color: 'var(--red)', fontWeight: 800, marginRight: 8 }}>#{idx + 1}</span>{item.itemName}
                          </td>
                          <td style={{ padding: '12px', textAlign: 'left', fontSize: '0.88rem' }}>{item.totalQuantity}</td>
                          <td style={{ padding: '12px', textAlign: 'right', fontWeight: 700, fontSize: '0.88rem' }}>{formatRM(item.totalRevenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// 3. Audit Logs Tab Content (ADMIN only)
const AuditLogsContent: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    staffService.getSecurityLogs(0, 100)
      .then(res => {
        if (res.data && res.data.content) {
          setLogs(res.data.content);
        }
      })
      .catch(() => toast.error('Failed to load system audit logs'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <TableSkeleton rows={8} />;
  }

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 650 }}>
          <thead>
            <tr style={{ background: 'var(--cream-dark)', borderBottom: '1px solid var(--border)' }}>
              {['Timestamp', 'User', 'Role', 'Event', 'Details', 'IP Address'].map(h => (
                <th key={h} style={{ padding: '14px 18px', fontSize: '0.76rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>No audit logs recorded yet.</td></tr>
            ) : (
              logs.map((log, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid var(--border)', fontSize: '0.84rem' }}>
                  <td style={{ padding: '14px 18px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                    {new Date(log.createdAt).toLocaleString('en-MY')}
                  </td>
                  <td style={{ padding: '14px 18px', fontWeight: 600, color: 'var(--text-primary)' }}>{log.userEmail || 'System'}</td>
                  <td style={{ padding: '14px 18px' }}>
                    <span style={{
                      fontSize: '0.68rem', fontWeight: 800, padding: '2px 6px', borderRadius: 4,
                      background: log.userRole === 'ADMIN' ? 'rgba(255,107,0,0.08)' : (log.userRole === 'SYSTEM' || !log.userRole ? 'rgba(59,130,246,0.08)' : 'var(--cream-dark)'),
                      color: log.userRole === 'ADMIN' ? 'var(--red)' : (log.userRole === 'SYSTEM' || !log.userRole ? '#2563eb' : 'var(--text-secondary)')
                    }}>{log.userRole || 'SYSTEM'}</span>
                  </td>
                  <td style={{ padding: '14px 18px', fontWeight: 700, color: 'var(--text-primary)' }}>{log.action}</td>
                  <td style={{ padding: '14px 18px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{log.details}</td>
                  <td style={{ padding: '14px 18px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{log.ipAddress || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ─── Unified Dashboard Main Component ────────────────────────
export const ManagerDashboard: React.FC = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('overview');
  const { user } = useAuthStore();

  const [report, setReport] = useState<any>(null);
  const [lowStock, setLowStock] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Sync tab state from query parameter ?tab=
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam) {
      setActiveTab(tabParam.toLowerCase());
    }
  }, [location]);

  const loadData = () => {
    const today = new Date().toISOString().split('T')[0];
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    Promise.all([
      reportService.getDailySales(monthStart, today),
      inventoryService.getLowStock(),
    ]).then(([repRes, lowRes]) => {
      setReport(repRes.data);
      setLowStock(lowRes.data);
    }).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter tabs by role — ADMIN sees Audit Logs, MANAGER sees Overview + Reports only
  const rawTabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'reports', label: 'Sales Reports' },
    { id: 'logs', label: 'Audit Logs', adminOnly: true },
  ];

  const dashboardTabs = rawTabs.filter(t => !t.adminOnly || user?.role === 'ADMIN');

  return (
    <ManagerLayout
      title="Dashboard"
      tabs={dashboardTabs.map(t => ({
        id: t.id,
        label: t.label,
        active: activeTab === t.id,
        onClick: () => setActiveTab(t.id)
      }))}
    >
      {activeTab === 'overview' && (
        <OverviewContent
          report={report}
          lowStock={lowStock}
          onRefresh={loadData}
          loading={loading}
          onNavigate={(tab) => setActiveTab(tab)}
        />
      )}
      {activeTab === 'reports' && <ReportsContent />}
      {activeTab === 'logs' && <AuditLogsContent />}
    </ManagerLayout>
  );
};

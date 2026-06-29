import React, { useState, useEffect } from 'react';
import {
  Users, TrendingUp, ShoppingBag, Download, Calendar, DollarSign, FileText,
  BarChart3, Package, AlertCircle, MessageSquare, ShieldCheck, CheckCircle2, ArrowRight
} from 'lucide-react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { useLocation } from 'react-router-dom';
import { reportService } from '../../services/report.service';
import { inventoryService } from '../../services/inventory.service';
import { reportService as managerReportService, staffService } from '../../services/manager.service';
import { formatRM } from '../../utils/formatCurrency';
import { KPISkeleton, TableSkeleton } from '../../components/ui/SkeletonLoader';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

// Layout & Dashboard Components
import { ManagerLayout } from '../../components/layout/ManagerLayout';
import { StatCard } from '../../components/dashboard/StatCard';
import { DashboardCard } from '../../components/dashboard/DashboardCard';
import { ChartCard } from '../../components/dashboard/ChartCard';
import { StatusBadge } from '../../components/dashboard/StatusBadge';
import { SectionHeader } from '../../components/dashboard/SectionHeader';

// Legacy UI Components (kept for complex tables)
import { AppTable, Column } from '../../components/ui/AppTable';
import { AppEmptyState } from '../../components/ui/AppEmptyState';

// ─── 1. Overview Tab ──────────────────────────────────────────────────────────
const OverviewContent: React.FC<{
  report: any;
  lowStock: any[];
  onRefresh: () => void;
  loading: boolean;
  onNavigate: (tab: string) => void;
}> = ({ report, lowStock, loading, onNavigate }) => {
  if (loading) return <div className="space-y-6"><KPISkeleton count={4} /></div>;

  const execData = report;

  return (
    <div className="space-y-6">
      
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary to-red-dark rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 bg-black opacity-10 rounded-full blur-2xl"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-3xl font-bold mb-2">Welcome back to BKB Console</h2>
            <p className="text-orange-100 mb-6 max-w-lg">Here's what's happening with your restaurant today. Review performance, manage inventory, and keep track of your team.</p>
            <div className="flex gap-4">
              <button onClick={() => onNavigate('reports')} className="bg-white text-primary px-5 py-2.5 rounded-lg font-bold text-sm hover:bg-orange-50 transition-colors shadow-sm">
                View Full Report
              </button>
            </div>
          </div>
          
          <div className="flex gap-6 bg-black/20 p-5 rounded-xl backdrop-blur-sm border border-white/10">
            <div>
              <p className="text-orange-200 text-xs font-semibold uppercase tracking-wider mb-1">Today's Revenue</p>
              <p className="text-3xl font-bold">{formatRM(execData?.revenue?.value ?? 0)}</p>
            </div>
            <div className="w-px bg-white/20"></div>
            <div>
              <p className="text-orange-200 text-xs font-semibold uppercase tracking-wider mb-1">Today's Orders</p>
              <p className="text-3xl font-bold">{execData?.orders?.value ?? 0}</p>
            </div>
          </div>
        </div>
      </div>

      <SectionHeader title="Executive Summary" subtitle="Key performance indicators for the current period" />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Revenue" 
          value={formatRM(execData?.revenue?.value ?? 0)} 
          icon={DollarSign} 
          trend={parseFloat(execData?.revenue?.percentChange || '0')} 
          trendLabel="vs last month"
          iconBgColor="rgba(34, 197, 94, 0.1)"
          iconColor="#22c55e"
        />
        <StatCard 
          title="Estimated Profit" 
          value={formatRM(execData?.profit?.value ?? 0)} 
          icon={TrendingUp} 
          trend={parseFloat(execData?.profit?.percentChange || '0')} 
          trendLabel="vs last month"
          iconBgColor="rgba(59, 130, 246, 0.1)"
          iconColor="#3b82f6"
        />
        <StatCard 
          title="Total Orders" 
          value={execData?.orders?.value ?? 0} 
          icon={ShoppingBag} 
          trend={parseFloat(execData?.orders?.percentChange || '0')} 
          trendLabel="vs last month"
          iconBgColor="rgba(168, 85, 247, 0.1)"
          iconColor="#a855f7"
        />
        <StatCard 
          title="Unique Customers" 
          value={execData?.customers?.value ?? 0} 
          icon={Users} 
          trend={parseFloat(execData?.customers?.percentChange || '0')} 
          trendLabel="vs last month"
          iconBgColor="rgba(255, 107, 0, 0.1)"
          iconColor="var(--primary)"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ChartCard title="Order Volume Trend" subtitle="Peak hours for the current period">
            {(!execData?.peakHours || execData.peakHours.length === 0) ? (
              <AppEmptyState title="No data available" icon={BarChart3} />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={execData.peakHours.map((d: any) => ({ name: d.hour, Orders: d.orderCount }))} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                  />
                  <Area type="monotone" dataKey="Orders" stroke="var(--primary)" fillOpacity={1} fill="url(#colorOrders)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>

        <div>
          <DashboardCard>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-gray-900 dark:text-white">Inventory Alerts</h3>
              <button onClick={() => window.location.href = '/manager/inventory'} className="text-sm font-semibold text-primary hover:text-red-dark">Manage</button>
            </div>
            
            {lowStock.length === 0 ? (
              <AppEmptyState title="All stock healthy" icon={CheckCircle2} />
            ) : (
              <div className="space-y-4">
                {lowStock.slice(0, 5).map((item) => (
                  <div key={item.id} className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-slate-700 last:border-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${item.status === 'CRITICAL' ? 'bg-red-100 text-red-600 dark:bg-red-900/30' : 'bg-amber-100 text-amber-600 dark:bg-amber-900/30'}`}>
                        <AlertCircle size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">{item.itemName}</p>
                        <p className="text-xs text-gray-500 dark:text-slate-400">{item.category}</p>
                      </div>
                    </div>
                    <StatusBadge 
                      status={item.status === 'CRITICAL' ? 'danger' : 'warning'} 
                      label={`${item.currentStock}/${item.minStock} ${item.unit}`} 
                    />
                  </div>
                ))}
              </div>
            )}
          </DashboardCard>
        </div>
      </div>

      {report?.topItems && report.topItems.length > 0 && (
        <DashboardCard>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">Top Selling Items</h3>
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Best performing food items</p>
            </div>
            <button onClick={() => onNavigate('reports')} className="text-sm font-semibold text-primary hover:text-red-dark flex items-center gap-1">
              Full Report <ArrowRight size={16} />
            </button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {report.topItems.slice(0, 6).map((item: any, idx: number) => (
              <div key={idx} className="bg-gray-50 dark:bg-slate-900/50 rounded-xl p-4 flex items-center gap-4 hover:bg-orange-50 dark:hover:bg-slate-800 transition-colors cursor-pointer group">
                <div className="w-12 h-12 rounded-full bg-white dark:bg-slate-800 shadow-sm border border-gray-100 dark:border-slate-700 flex items-center justify-center font-bold text-primary group-hover:scale-110 transition-transform">
                  #{idx + 1}
                </div>
                <div>
                  <div className="font-bold text-sm text-gray-900 dark:text-white">{item.itemName}</div>
                  <div className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{item.totalQuantity} sold · <span className="font-semibold text-gray-700 dark:text-slate-300">{formatRM(item.totalRevenue)}</span></div>
                </div>
              </div>
            ))}
          </div>
        </DashboardCard>
      )}
    </div>
  );
};

// ─── 2. Reports Tab ───────────────────────────────────────────────────────────
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
      const a = document.createElement('a');
      a.href = url;
      a.download = `bkb-sales-report.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    });
  };

  const salesCols: Column<any>[] = [
    { header: 'Rank', render: (item: any) => report?.topItems ? <span className="font-bold text-gray-500">#{report.topItems.indexOf(item) + 1}</span> : '', width: '60px' },
    { header: 'Item', accessor: 'itemName' },
    { header: 'Units Sold', accessor: 'totalQuantity', align: 'center' },
    { header: 'Revenue', render: (item) => <span className="font-semibold">{formatRM(item.totalRevenue)}</span>, align: 'right' },
  ];

  const staffCols: Column<any>[] = [
    { header: 'Staff Member', accessor: 'staffName' },
    { header: 'Orders Completed', accessor: 'ordersCompleted', align: 'right' },
  ];

  if (loading) return <TableSkeleton rows={5} />;

  return (
    <div className="space-y-6">
      <DashboardCard className="!bg-white dark:!bg-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <Calendar size={20} className="text-gray-400" />
            <input
              type="date" value={from} onChange={e => setFrom(e.target.value)}
              className="border border-gray-200 dark:border-slate-700 rounded-lg px-4 py-2 text-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-shadow"
            />
            <span className="text-sm font-medium text-gray-500">to</span>
            <input
              type="date" value={to} onChange={e => setTo(e.target.value)}
              className="border border-gray-200 dark:border-slate-700 rounded-lg px-4 py-2 text-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-shadow"
            />
            <button onClick={loadReport} className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-dark transition-colors">Apply Filter</button>
          </div>
          <button onClick={handleExport} className="flex items-center gap-2 border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors shadow-sm">
            <Download size={16} /> Export CSV
          </button>
        </div>
      </DashboardCard>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total Revenue" value={formatRM(report?.totalRevenue ?? 0)} icon={DollarSign} iconBgColor="rgba(34, 197, 94, 0.1)" iconColor="#22c55e" />
        <StatCard title="Total Orders" value={report?.totalOrders ?? 0} icon={FileText} iconBgColor="rgba(59, 130, 246, 0.1)" iconColor="#3b82f6" />
        <StatCard title="Avg Order Value" value={formatRM(report?.avgOrderValue ?? 0)} icon={TrendingUp} iconBgColor="rgba(168, 85, 247, 0.1)" iconColor="#a855f7" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardCard>
          <div className="mb-4">
            <h3 className="text-base font-bold text-gray-900 dark:text-white">Top Selling Items</h3>
          </div>
          {(!report?.topItems || report.topItems.length === 0) ? (
            <AppEmptyState title="No sales data" icon={BarChart3} />
          ) : (
            <div className="overflow-x-auto">
              <AppTable columns={salesCols} data={report.topItems} keyExtractor={(item) => item.itemName} />
            </div>
          )}
        </DashboardCard>

        <DashboardCard>
          <div className="mb-4">
            <h3 className="text-base font-bold text-gray-900 dark:text-white">Staff Performance</h3>
          </div>
          {(!staffPerformance || staffPerformance.length === 0) ? (
            <AppEmptyState title="No staff data" icon={Users} />
          ) : (
            <div className="overflow-x-auto">
              <AppTable columns={staffCols} data={staffPerformance} keyExtractor={(item) => item.staffName} />
            </div>
          )}
        </DashboardCard>
      </div>
    </div>
  );
};

// ─── 3. Audit Logs Tab ────────────────────────────────────────────────────────
const AuditLogsContent: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();

  useEffect(() => {
    if (user?.role !== 'ADMIN') { setLoading(false); return; }
    staffService.getSecurityLogs(0, 100).then(res => {
      if (res.data?.content) setLogs(res.data.content);
    }).finally(() => setLoading(false));
  }, []);

  if (user?.role !== 'ADMIN') {
    return (
      <DashboardCard>
        <AppEmptyState
          title="Admin Access Required"
          description="Audit logs are restricted to Administrators only."
          icon={ShieldCheck}
        />
      </DashboardCard>
    );
  }

  const cols: Column<any>[] = [
    { header: 'Timestamp', render: (l: any) => new Date(l.createdAt).toLocaleString('en-MY') },
    { header: 'User', render: (l: any) => l.userEmail || 'System' },
    { header: 'Role', render: (l: any) => <StatusBadge status={l.userRole === 'ADMIN' ? 'danger' : 'info'} label={l.userRole || 'SYSTEM'} /> },
    { header: 'Event', accessor: 'action' },
    { header: 'Details', accessor: 'details' },
    { header: 'IP', render: (l: any) => l.ipAddress || '-' },
  ];

  if (loading) return <TableSkeleton rows={8} />;

  return (
    <DashboardCard noPadding>
      <div className="overflow-x-auto">
        <AppTable columns={cols} data={logs} keyExtractor={(l: any) => l.id || String(Math.random())} emptyMessage={<AppEmptyState title="No audit logs" icon={ShieldCheck} />} />
      </div>
    </DashboardCard>
  );
};

// ─── 4. Menu Analytics Tab ────────────────────────────────────────────────────
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
    { header: 'Profit', render: (i) => <span className="text-green-600 font-bold">{formatRM(i.estimatedProfit)}</span>, align: 'right' },
  ];

  if (loading) return <TableSkeleton rows={8} />;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <DashboardCard>
        <div className="mb-4">
          <h3 className="text-base font-bold text-gray-900 dark:text-white">Best Performers</h3>
        </div>
        <div className="overflow-x-auto">
          <AppTable columns={cols} data={analytics?.topSellers || []} keyExtractor={(i) => i.itemName} emptyMessage={<AppEmptyState title="No data" />} />
        </div>
      </DashboardCard>
      <DashboardCard>
        <div className="mb-4">
          <h3 className="text-base font-bold text-gray-900 dark:text-white">Needs Attention</h3>
        </div>
        <div className="overflow-x-auto">
          <AppTable columns={cols} data={analytics?.worstSellers || []} keyExtractor={(i) => i.itemName} emptyMessage={<AppEmptyState title="No data" />} />
        </div>
      </DashboardCard>
    </div>
  );
};

// ─── 5. Customer Insights Tab ─────────────────────────────────────────────────
const CustomerInsightsContent: React.FC = () => {
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    managerReportService.getCustomerInsights().then(res => setInsights(res.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <TableSkeleton rows={8} />;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Customers" value={insights?.totalUniqueCustomers || 0} icon={Users} iconBgColor="rgba(59, 130, 246, 0.1)" iconColor="#3b82f6" />
        <StatCard title="Repeat Customers" value={insights?.repeatCustomers || 0} icon={TrendingUp} iconBgColor="rgba(34, 197, 94, 0.1)" iconColor="#22c55e" />
        <StatCard title="Avg Customer LTV" value={formatRM(insights?.averageCustomerLtv || 0)} icon={DollarSign} iconBgColor="rgba(168, 85, 247, 0.1)" iconColor="#a855f7" />
        <StatCard title="Avg Rating" value={`${insights?.averageRating || 0} / 5`} icon={AlertCircle} iconBgColor="rgba(245, 158, 11, 0.1)" iconColor="#f59e0b" />
      </div>

      <DashboardCard>
        <div className="mb-6">
          <h3 className="text-base font-bold text-gray-900 dark:text-white">Recent Customer Feedback</h3>
        </div>
        {(!insights?.recentFeedback || insights.recentFeedback.length === 0) ? (
          <AppEmptyState title="No feedback yet" icon={MessageSquare} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {insights.recentFeedback.map((fb: any, idx: number) => (
              <div key={idx} className="p-5 border border-gray-100 dark:border-slate-700 rounded-xl bg-gray-50 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-800 transition-colors shadow-sm">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 text-primary flex items-center justify-center font-bold text-xs">
                      {fb.customerName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <span className="font-bold text-sm text-gray-900 dark:text-white block leading-tight">{fb.customerName}</span>
                      <span className="text-[0.65rem] text-gray-500">Order #{fb.orderNumber}</span>
                    </div>
                  </div>
                  <span className="text-[0.65rem] font-medium text-gray-400 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 px-2 py-1 rounded">{fb.date}</span>
                </div>
                <div className="flex items-center gap-0.5 mb-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} className={`text-sm ${i < fb.rating ? 'text-amber-400' : 'text-gray-300 dark:text-slate-600'}`}>★</span>
                  ))}
                </div>
                {fb.feedback && <p className="text-sm text-gray-700 dark:text-slate-300 italic">"{fb.feedback}"</p>}
              </div>
            ))}
          </div>
        )}
      </DashboardCard>
    </div>
  );
};

// ─── Manager Dashboard (Main Export) ─────────────────────────────────────────
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

  const allTabs = [
    { id: 'overview',  label: 'Executive Overview' },
    { id: 'reports',   label: 'Sales Reports' },
    { id: 'menu',      label: 'Menu Analytics' },
    { id: 'insights',  label: 'Customer Insights' },
    ...(user?.role === 'ADMIN' ? [{ id: 'logs', label: 'Audit Logs' }] : []),
  ];

  return (
    <ManagerLayout
      title="Dashboard"
      subtitle="Overview of your restaurant's performance"
      tabs={allTabs.map(t => ({
        id: t.id,
        label: t.label,
        active: activeTab === t.id,
        onClick: () => setActiveTab(t.id),
      }))}
    >
      {activeTab === 'overview'  && <OverviewContent report={report} lowStock={lowStock} onRefresh={loadData} loading={loading} onNavigate={setActiveTab} />}
      {activeTab === 'reports'   && <ReportsContent />}
      {activeTab === 'menu'      && <MenuAnalyticsContent />}
      {activeTab === 'insights'  && <CustomerInsightsContent />}
      {activeTab === 'logs'      && <AuditLogsContent />}
    </ManagerLayout>
  );
};

import React, { useState, useEffect } from 'react';
import {
  Users, TrendingUp, ShoppingBag, Download, Calendar, DollarSign, FileText,
  BarChart3, Package, AlertCircle, MessageSquare, ShieldCheck, CheckCircle2
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

// Layout
import { ManagerLayout } from '../../components/layout/ManagerLayout';

// UI Components
import { AppCard } from '../../components/ui/AppCard';
import { AppStatCard } from '../../components/ui/AppStatCard';
import { AppTable, Column } from '../../components/ui/AppTable';
import { AppBadge } from '../../components/ui/AppBadge';
import { AppButton } from '../../components/ui/AppButton';
import { AppEmptyState } from '../../components/ui/AppEmptyState';

// ─── 1. Overview Tab ──────────────────────────────────────────────────────────
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
                <AreaChart data={execData.peakHours.map((d: any) => ({ name: d.hour, Orders: d.orderCount }))}>
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

        <AppCard
          title="Inventory Alerts"
          subtitle="Items requiring restock"
          headerAction={
            <AppButton variant="ghost" size="sm" onClick={() => window.location.href = '/manager/inventory'}>Manage</AppButton>
          }
        >
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
                  <AppBadge
                    variant={item.status === 'CRITICAL' ? 'danger' : 'warning'}
                    text={`${item.currentStock}/${item.minStock} ${item.unit}`}
                  />
                </div>
              ))}
            </div>
          )}
        </AppCard>
      </div>

      {report?.topItems && report.topItems.length > 0 && (
        <AppCard
          title="Top Selling Items"
          subtitle="Best performing food items"
          headerAction={
            <AppButton variant="ghost" size="sm" onClick={() => onNavigate('reports')}>Full Report</AppButton>
          }
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {report.topItems.slice(0, 6).map((item: any, idx: number) => (
              <div key={idx} className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-[rgba(255,107,0,0.1)] flex items-center justify-center font-bold text-[var(--primary)] text-sm">
                  #{idx + 1}
                </div>
                <div>
                  <div className="font-semibold text-sm text-[var(--text-primary)]">{item.itemName}</div>
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
          <div className="flex items-center gap-3 flex-wrap">
            <Calendar size={18} className="text-[var(--primary)]" />
            <input
              type="date" value={from} onChange={e => setFrom(e.target.value)}
              className="border border-[var(--border)] rounded-lg px-3 py-1.5 text-sm bg-[var(--background)] text-[var(--text-primary)]"
            />
            <span className="text-sm text-[var(--text-secondary)]">to</span>
            <input
              type="date" value={to} onChange={e => setTo(e.target.value)}
              className="border border-[var(--border)] rounded-lg px-3 py-1.5 text-sm bg-[var(--background)] text-[var(--text-primary)]"
            />
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
      <AppCard>
        <AppEmptyState
          title="Admin Access Required"
          description="Audit logs are restricted to Administrators only."
          icon={ShieldCheck}
        />
      </AppCard>
    );
  }

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

// ─── 5. Customer Insights Tab ─────────────────────────────────────────────────
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
        <AppStatCard title="Avg Rating" value={`${insights?.averageRating || 0} / 5`} icon={AlertCircle} colorClass="text-orange-500" />
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
                    <span className="font-bold text-sm">{fb.customerName}</span>
                    <span className="text-xs bg-[var(--surface)] px-2 py-1 rounded text-[var(--text-secondary)]">
                      Order #{fb.orderNumber}
                    </span>
                  </div>
                  <span className="text-xs text-[var(--text-secondary)]">{fb.date}</span>
                </div>
                <div className="flex items-center gap-0.5 mb-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} style={{ color: i < fb.rating ? '#FBBF24' : 'var(--border)', fontSize: '1rem' }}>★</span>
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
    { id: 'overview',  label: 'Overview' },
    { id: 'reports',   label: 'Sales Reports' },
    { id: 'menu',      label: 'Menu Analytics' },
    { id: 'insights',  label: 'Customer Insights' },
    ...(user?.role === 'ADMIN' ? [{ id: 'logs', label: 'Audit Logs' }] : []),
  ];

  return (
    <ManagerLayout
      title="Dashboard"
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

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, BarChart3, Package, CheckCircle2,
  DollarSign, ShoppingBag, Users, Search, Download, Calendar, FileText,
  AlertCircle, MessageSquare, ShieldCheck, ArrowRight,
  Activity, AlertTriangle, BarChart2
} from 'lucide-react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, AreaChart, Area 
} from 'recharts';
import { useLocation } from 'react-router-dom';
import { reportService } from '../../services/report.service';
import { inventoryService } from '../../services/inventory.service';
import { reportService as managerReportService, staffService } from '../../services/manager.service';
import { formatRM } from '../../utils/formatCurrency';
import { KPISkeleton, TableSkeleton } from '../../components/ui/SkeletonLoader';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

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
import { AppPageHeader } from '../../components/ui/AppPageHeader';
import { AppStatCard } from '../../components/ui/AppStatCard';
import { AppCard } from '../../components/ui/AppCard';
import { AppButton } from '../../components/ui/AppButton';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';

// ─── 1. Overview Tab (New Analytics) ─────────────────────────────────────────
const OverviewContent: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [salesData, setSalesData] = useState<any>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      setError(false);
      try {
        const today = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);
        
        const fromStr = thirtyDaysAgo.toISOString().split('T')[0];
        const toStr = today.toISOString().split('T')[0];

        const [dashRes, salesRes] = await Promise.all([
          reportService.getExecutiveDashboard(fromStr, toStr),
          reportService.getDailySales(fromStr, toStr)
        ]);

        setDashboardData(dashRes.data);
        setSalesData(salesRes.data);
      } catch (err) {
        console.error('Failed to load analytics', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  const formatPercent = (val: number | undefined) => {
    if (val === undefined || val === null) return 0;
    return Number(val);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[var(--surface)] border border-[var(--border)] p-3 rounded-lg shadow-lg">
          <p className="font-bold text-[var(--text-primary)] mb-1">{label}</p>
          <p className="text-sm font-medium text-[var(--primary)]">
            Revenue: {formatRM(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomBarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[var(--surface)] border border-[var(--border)] p-3 rounded-lg shadow-lg">
          <p className="font-bold text-[var(--text-primary)] mb-1">{label}</p>
          <p className="text-sm font-medium text-emerald-500">
            Sold: {payload[0].payload.totalQuantity} items
          </p>
          <p className="text-sm font-medium text-[var(--primary)]">
            Revenue: {formatRM(payload[0].payload.totalRevenue)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in pb-6">
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : error ? (
        <AppCard className="py-12">
          <AppEmptyState 
            title="Failed to load analytics" 
            description="There was a problem fetching the data from the server. Please try again." 
            icon={AlertTriangle} 
          />
        </AppCard>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <AppStatCard 
              title="Revenue (30d)" 
              value={dashboardData?.revenue?.value || 'RM 0.00'} 
              icon={DollarSign} 
              colorClass="text-emerald-500"
              trend={formatPercent(dashboardData?.revenue?.percentChange)}
            />
            <AppStatCard 
              title="Total Orders" 
              value={dashboardData?.orders?.value || '0'} 
              icon={TrendingUp} 
              colorClass="text-blue-500"
              trend={formatPercent(dashboardData?.orders?.percentChange)}
            />
            <AppStatCard 
              title="Active Customers" 
              value={dashboardData?.customers?.value || '0'} 
              icon={Users} 
              colorClass="text-purple-500"
              trend={formatPercent(dashboardData?.customers?.percentChange)}
            />
            <AppStatCard 
              title="Profit" 
              value={dashboardData?.profit?.value || 'RM 0.00'} 
              icon={Activity} 
              colorClass="text-[var(--primary)]"
              trend={formatPercent(dashboardData?.profit?.percentChange)}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-2">
            <AppCard title="Revenue Trend" subtitle="Daily revenue over the selected period" className="min-h-[400px] flex flex-col">
              <div className="flex-1 w-full mt-4 min-h-[300px]">
                {salesData?.dailyRevenue?.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={salesData.dailyRevenue} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
                      <XAxis 
                        dataKey="date" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} 
                        tickFormatter={(val) => {
                          const d = new Date(val);
                          return `${d.getDate()}/${d.getMonth()+1}`;
                        }}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                        tickFormatter={(val) => `RM${val}`}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Area 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="var(--primary)" 
                        strokeWidth={3}
                        fillOpacity={1} 
                        fill="url(#colorRevenue)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <AppEmptyState title="No Revenue Data" description="No transactions recorded for this period." icon={DollarSign} />
                  </div>
                )}
              </div>
            </AppCard>
            
            <AppCard title="Top Selling Items" subtitle="Highest volume products" className="min-h-[400px] flex flex-col">
              <div className="flex-1 w-full mt-4 min-h-[300px]">
                {dashboardData?.topItems?.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={dashboardData.topItems.slice(0, 5)} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
                      <XAxis 
                        dataKey="itemName" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                        tickFormatter={(val) => val.length > 15 ? val.substring(0, 15) + '...' : val}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                      />
                      <Tooltip content={<CustomBarTooltip />} cursor={{ fill: 'var(--border)', opacity: 0.4 }} />
                      <Bar dataKey="totalQuantity" fill="var(--primary)" radius={[4, 4, 0, 0]} maxBarSize={50} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <AppEmptyState title="No Sales Data" description="No products were sold during this period." icon={TrendingUp} />
                  </div>
                )}
              </div>
            </AppCard>
          </div>
          
          {dashboardData?.lowStockAlerts?.length > 0 && (
            <AppCard title="Critical Stock Alerts" className="mt-2 border-red-200 dark:border-red-900/30">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-2">
                {dashboardData.lowStockAlerts.map((alert: any, idx: number) => (
                  <div key={idx} className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-lg p-4 flex items-start gap-3">
                    <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={18} />
                    <div>
                      <div className="font-bold text-red-700 dark:text-red-400 text-sm">{alert.itemName}</div>
                      <div className="text-xs text-red-600/80 dark:text-red-400/80 mt-1">
                        Current Stock: <span className="font-bold">{alert.currentStock}</span> (Min: {alert.minStock})
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </AppCard>
          )}
        </>
      )}
    </div>
  );
};

// ─── 2. Reports Tab (New Generate Reports) ────────────────────────────────────
const ReportsContent: React.FC = () => {
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  
  const [toDate, setToDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  const [exporting, setExporting] = useState(false);

  const handleExport = async (type: string) => {
    if (!fromDate || !toDate) {
      toast.error('Please select both start and end dates');
      return;
    }
    
    setExporting(true);
    try {
      const response = await reportService.exportCsv(fromDate, toDate);
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `bkb-${type}-report-${fromDate}-to-${toDate}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Report exported successfully');
    } catch (err) {
      console.error('Export error:', err);
      toast.error('Failed to export report');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in pb-6">
      <AppCard className="!p-4 mb-2 border-l-4 border-l-[var(--primary)]">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-[var(--text-primary)]">Global Report Date Range</h3>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">Select the period for your generated reports</p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2 bg-[var(--background)] border border-[var(--border)] rounded-lg px-3 py-1.5 focus-within:border-[var(--primary)] transition-colors w-full md:w-auto">
              <Calendar size={14} className="text-[var(--text-secondary)]" />
              <input 
                type="date" 
                value={fromDate} 
                onChange={e => setFromDate(e.target.value)}
                className="bg-transparent text-sm focus:outline-none text-[var(--text-primary)]"
              />
            </div>
            <span className="text-[var(--text-secondary)] font-medium text-sm">to</span>
            <div className="flex items-center gap-2 bg-[var(--background)] border border-[var(--border)] rounded-lg px-3 py-1.5 focus-within:border-[var(--primary)] transition-colors w-full md:w-auto">
              <Calendar size={14} className="text-[var(--text-secondary)]" />
              <input 
                type="date" 
                value={toDate} 
                onChange={e => setToDate(e.target.value)}
                className="bg-transparent text-sm focus:outline-none text-[var(--text-primary)]"
              />
            </div>
          </div>
        </div>
      </AppCard>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Sales Report Card */}
        <AppCard className="flex flex-col h-full hover:border-[var(--primary)]/30 transition-colors">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <BarChart2 size={24} />
            </div>
            <div>
              <h3 className="font-bold text-lg text-[var(--text-primary)]">Sales Report</h3>
              <p className="text-sm text-[var(--text-secondary)]">Revenue & transactions</p>
            </div>
          </div>
          <p className="text-sm text-[var(--text-secondary)] mb-6 flex-1">
            Comprehensive breakdown of daily, weekly, and monthly revenue, including best-selling items and peak hours.
          </p>
          <AppButton 
            variant="primary" 
            className="w-full" 
            icon={Download} 
            onClick={() => handleExport('sales')}
            isLoading={exporting}
          >
            Export CSV
          </AppButton>
        </AppCard>

        {/* Inventory Report Card */}
        <AppCard className="flex flex-col h-full hover:border-[var(--primary)]/30 transition-colors">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center shrink-0">
              <FileText size={24} />
            </div>
            <div>
              <h3 className="font-bold text-lg text-[var(--text-primary)]">Inventory Usage</h3>
              <p className="text-sm text-[var(--text-secondary)]">Stock & waste tracking</p>
            </div>
          </div>
          <p className="text-sm text-[var(--text-secondary)] mb-6 flex-1">
            Detailed tracking of ingredient usage against sales volume, identifying discrepancies and waste patterns.
          </p>
          <AppButton 
            variant="primary" 
            className="w-full" 
            icon={Download} 
            onClick={() => handleExport('inventory')}
            isLoading={exporting}
          >
            Export CSV
          </AppButton>
        </AppCard>

        {/* Staff Performance Card */}
        <AppCard className="flex flex-col h-full hover:border-[var(--primary)]/30 transition-colors">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <FileText size={24} />
            </div>
            <div>
              <h3 className="font-bold text-lg text-[var(--text-primary)]">Staff Performance</h3>
              <p className="text-sm text-[var(--text-secondary)]">Efficiency & shifts</p>
            </div>
          </div>
          <p className="text-sm text-[var(--text-secondary)] mb-6 flex-1">
            Metrics on order preparation times, shift coverage, and overall efficiency across different kitchen stations.
          </p>
          <AppButton 
            variant="primary" 
            className="w-full" 
            icon={Download} 
            onClick={() => handleExport('staff')}
            isLoading={exporting}
          >
            Export CSV
          </AppButton>
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
                    <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 text-[var(--primary)] flex items-center justify-center font-bold text-xs">
                      {fb.customerName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <span className="font-bold text-sm text-[var(--text-primary)] block leading-tight">{fb.customerName}</span>
                      <span className="text-[0.65rem] text-[var(--text-secondary)]">Order #{fb.orderNumber}</span>
                    </div>
                  </div>
                  <span className="text-[0.65rem] font-medium text-[var(--text-secondary)] bg-[var(--background)] border border-[var(--border)] px-2 py-1 rounded">{fb.date}</span>
                </div>
                <div className="flex items-center gap-0.5 mb-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} className={`text-sm ${i < fb.rating ? 'text-amber-400' : 'text-gray-300 dark:text-slate-600'}`}>★</span>
                  ))}
                </div>
                {fb.feedback && <p className="text-sm text-[var(--text-secondary)] italic">"{fb.feedback}"</p>}
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

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam) setActiveTab(tabParam.toLowerCase());
  }, [location]);

  const allTabs = [
    { id: 'overview',  label: 'Executive Overview' },
    { id: 'reports',   label: 'Generate Reports' },
    { id: 'menu',      label: 'Menu Analytics' },
    { id: 'insights',  label: 'Customer Insights' },
    ...(user?.role === 'ADMIN' ? [{ id: 'logs', label: 'Audit Logs' }] : []),
  ];

  return (
    <ManagerLayout
      title="Dashboard"
      subtitle="Overview of your restaurant's performance and reporting tools"
      tabs={allTabs.map(t => ({
        id: t.id,
        label: t.label,
        active: activeTab === t.id,
        onClick: () => setActiveTab(t.id),
      }))}
    >
      {activeTab === 'overview'  && <OverviewContent />}
      {activeTab === 'reports'   && <ReportsContent />}
      {activeTab === 'menu'      && <MenuAnalyticsContent />}
      {activeTab === 'insights'  && <CustomerInsightsContent />}
      {activeTab === 'logs'      && <AuditLogsContent />}
    </ManagerLayout>
  );
};

import React, { useState, useEffect } from 'react';
import {
  Users, TrendingUp, ShoppingBag, Download, Calendar, DollarSign, FileText,
  BarChart3, Package, AlertCircle, MessageSquare, ShieldCheck, CheckCircle2, ArrowRight
} from 'lucide-react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
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

  // Formatting chart data for the new Bar Chart
  const chartData = (execData?.peakHours || []).map((d: any) => ({
    name: d.hour,
    Orders: d.orderCount
  }));

  // Dummy rate for the "Popularity Rate" gauge UI
  const popularityRate = 87; 

  return (
    <div className="grid grid-cols-12 gap-5 pb-10">
      
      {/* Hero Widget */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="col-span-12 lg:col-span-8 bg-gradient-to-br from-[#FF6B00] to-[#E65100] rounded-[20px] p-6 text-white relative overflow-hidden shadow-sm flex flex-col justify-between"
      >
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-black/10 rounded-full blur-2xl pointer-events-none"></div>
        
        <div className="relative z-10">
          <h2 className="text-[18px] font-bold tracking-tight mb-8">Today's Overview</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-4">
            <div>
              <p className="text-[12px] text-orange-100 font-medium uppercase tracking-wider mb-1">Revenue</p>
              <div className="text-[32px] font-extrabold leading-none mb-2">{formatRM(execData?.revenue?.value ?? 0)}</div>
              <div className="text-[12px] text-emerald-300 font-bold flex items-center gap-1"><TrendingUp size={12}/> +12% vs yest</div>
            </div>
            <div>
              <p className="text-[12px] text-orange-100 font-medium uppercase tracking-wider mb-1">Orders</p>
              <div className="text-[32px] font-extrabold leading-none mb-2">{execData?.orders?.value ?? 0}</div>
              <div className="text-[12px] text-emerald-300 font-bold flex items-center gap-1"><TrendingUp size={12}/> +5% vs yest</div>
            </div>
            <div>
              <p className="text-[12px] text-orange-100 font-medium uppercase tracking-wider mb-1">Customers</p>
              <div className="text-[32px] font-extrabold leading-none mb-2">{execData?.customers?.value ?? 0}</div>
              <div className="text-[12px] text-orange-200 font-bold">Stable</div>
            </div>
            <div>
              <p className="text-[12px] text-orange-100 font-medium uppercase tracking-wider mb-1">Avg Order</p>
              <div className="text-[32px] font-extrabold leading-none mb-2">{formatRM(35.5)}</div>
              <div className="text-[12px] text-emerald-300 font-bold flex items-center gap-1"><TrendingUp size={12}/> +2%</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Rate Widget */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="col-span-12 lg:col-span-4 bg-white dark:bg-[#111111] rounded-[20px] p-6 border border-gray-200 dark:border-white/5 shadow-sm flex flex-col justify-between"
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-[18px] font-bold text-slate-900 dark:text-white">Completion Rate</h3>
          <span className="text-[12px] text-gray-500 font-medium bg-gray-100 dark:bg-white/5 px-2 py-1 rounded-md">Monthly</span>
        </div>
        
        <div className="flex items-center gap-6 mt-2">
          <div className="relative w-28 h-28 flex-shrink-0">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="56" cy="56" r="46" className="stroke-gray-100 dark:stroke-white/5" strokeWidth="12" fill="none" />
              <circle cx="56" cy="56" r="46" className="stroke-[#0F766E]" strokeWidth="12" fill="none" strokeDasharray="289" strokeDashoffset={289 - (289 * popularityRate / 100)} strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center flex-col">
              <span className="text-[24px] font-extrabold text-slate-900 dark:text-white leading-none">{popularityRate}%</span>
            </div>
          </div>
          
          <div className="flex-1">
            <div className="text-[14px] text-gray-500 font-medium mb-1">vs Last Month</div>
            <div className="flex items-center text-emerald-500 font-bold text-[14px] mb-3">
              <TrendingUp size={16} className="mr-1" /> +4%
            </div>
            <p className="text-[12px] text-gray-400 leading-tight">Increased efficiency during peak hours.</p>
          </div>
        </div>
      </motion.div>

      {/* Finance Performance */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="col-span-12 lg:col-span-7 bg-white dark:bg-[#111111] rounded-[20px] p-6 border border-gray-200 dark:border-white/5 shadow-sm flex flex-col min-h-[360px]"
      >
        <div className="flex justify-between items-center mb-8">
          <div>
            <h3 className="text-[18px] font-bold text-slate-900 dark:text-white tracking-tight">Finance Performance</h3>
            <p className="text-[12px] text-gray-500 font-medium mt-1">Comparing peak hour order volumes</p>
          </div>
          <div className="hidden sm:flex items-center gap-2 bg-gray-50 dark:bg-white/5 px-3 py-1.5 rounded-lg border border-gray-100 dark:border-white/5">
            <div className="w-6 h-6 bg-[#0F766E] text-white rounded flex items-center justify-center font-bold text-[12px]">$</div>
            <div className="text-[14px] font-bold text-slate-900 dark:text-white">{formatRM(execData?.revenue?.value ?? 0)}</div>
          </div>
        </div>
        
        <div className="flex-1 w-full h-full min-h-[220px]">
           {chartData.length === 0 ? (
              <AppEmptyState title="No data available" icon={BarChart3} />
           ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }} barSize={16}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.3} />
                  <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} dy={10} fontWeight={500} />
                  <YAxis stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} fontWeight={500} />
                  <Tooltip 
                    cursor={{ fill: 'var(--border)', opacity: 0.1 }}
                    contentStyle={{ background: '#111', border: 'none', borderRadius: '12px', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)', color: '#fff', fontSize: '12px', fontWeight: 'bold' }} 
                    itemStyle={{ color: '#fff' }}
                  />
                  <Bar dataKey="Orders" fill="#0F766E" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
           )}
        </div>
      </motion.div>

      {/* Top Performers */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="col-span-12 lg:col-span-5 bg-white dark:bg-[#111111] rounded-[20px] p-6 border border-gray-200 dark:border-white/5 shadow-sm flex flex-col"
      >
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-[18px] font-bold text-slate-900 dark:text-white tracking-tight">Top Performers</h3>
            <p className="text-[12px] text-gray-500 font-medium mt-1">Highest converting items</p>
          </div>
        </div>
        <div className="flex flex-col gap-2 flex-1">
          {(report?.topItems || []).slice(0, 5).map((item: any, idx: number) => (
            <div key={idx} className="flex items-center justify-between py-3 px-4 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center font-bold text-orange-600 dark:text-orange-400 overflow-hidden text-[14px] group-hover:scale-110 transition-transform">
                  <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${item.itemName}&backgroundColor=transparent`} alt="avatar" className="w-full h-full mix-blend-multiply dark:mix-blend-normal dark:invert opacity-80" />
                </div>
                <div>
                  <div className="font-bold text-[14px] text-slate-900 dark:text-white group-hover:text-orange-500 transition-colors">{item.itemName}</div>
                  <div className="text-[12px] text-gray-500 font-medium mt-0.5 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0F766E]"></span>
                    {item.totalQuantity} sold
                  </div>
                </div>
              </div>
              <div className="text-[14px] font-bold text-slate-900 dark:text-white">
                {formatRM(item.totalRevenue)}
              </div>
            </div>
          ))}
          {(!report?.topItems || report.topItems.length === 0) && (
             <div className="flex-1 flex items-center justify-center text-[14px] text-gray-400 font-medium">No sales data</div>
          )}
        </div>
      </motion.div>

      {/* Target Inventory */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="col-span-12 bg-white dark:bg-[#111111] rounded-[20px] p-6 border border-gray-200 dark:border-white/5 shadow-sm"
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-[18px] font-bold text-slate-900 dark:text-white">Inventory Health</h3>
          <span className="text-[12px] text-red-600 font-bold bg-red-50 dark:bg-red-900/20 px-2.5 py-1 rounded-md border border-red-100 dark:border-red-900/30">{lowStock.length} Alerts</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {lowStock.length === 0 ? (
             <div className="col-span-full flex flex-col items-center justify-center py-8 text-gray-400">
               <CheckCircle2 size={32} className="mb-2 text-[#0F766E] opacity-70" />
               <span className="text-[14px] font-bold tracking-wide">Stock levels healthy</span>
             </div>
          ) : (
            lowStock.slice(0, 4).map((item) => (
              <div key={item.id} className="bg-gray-50 dark:bg-white/5 p-4 rounded-xl border border-gray-100 dark:border-white/5 flex flex-col gap-3 hover:-translate-y-1 transition-transform cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.status === 'CRITICAL' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                    <Package size={16} />
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${item.status === 'CRITICAL' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                    Restock
                  </span>
                </div>
                <div>
                   <div className="font-bold text-[14px] text-slate-900 dark:text-white truncate">{item.itemName}</div>
                   <div className="text-[12px] text-gray-500 font-medium mt-1">
                     {item.currentStock} / {item.minimumStock} min
                   </div>
                </div>
                <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-1.5 mt-1 overflow-hidden">
                  <div className={`h-1.5 rounded-full ${item.status === 'CRITICAL' ? 'bg-red-500' : 'bg-amber-500'}`} style={{ width: `${Math.max(5, (item.currentStock / item.minimumStock) * 100)}%` }}></div>
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>
      
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

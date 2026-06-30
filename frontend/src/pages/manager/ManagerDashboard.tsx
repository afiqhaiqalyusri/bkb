import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, BarChart3, Package, CheckCircle2,
  DollarSign, ShoppingBag, Users, Search, Download, Calendar, FileText,
  AlertCircle, MessageSquare, ShieldCheck, ArrowRight
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
    <div className="space-y-5 pb-6">
      
      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Primary Brand (Total Revenue) */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-br from-[#FF6B00] to-[#E65100] rounded-xl p-5 text-white shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-6 -mt-6 w-24 h-24 bg-white/10 rounded-full blur-xl" />
          <div className="flex justify-between items-start z-10 mb-4">
            <span className="text-xs font-medium text-white/80">Total Revenue</span>
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <DollarSign size={15} strokeWidth={2.5} />
            </div>
          </div>
          <div className="z-10">
            <div className="text-2xl font-bold mb-0.5">{formatRM(execData?.revenue?.value ?? 0)}</div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold px-1.5 py-0.5 bg-white/20 rounded">+12%</span>
              <span className="text-[10px] text-white/60">vs last month</span>
            </div>
          </div>
        </motion.div>

        {/* Card 2: Orders */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-medium text-gray-500">Total Orders</span>
            <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
              <ShoppingBag size={14} strokeWidth={2.5} className="text-white" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 mb-0.5">{execData?.orders?.value ?? 0}</div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold px-1.5 py-0.5 bg-emerald-50 text-emerald-600 rounded">+5.2%</span>
              <span className="text-[10px] text-gray-400">vs last month</span>
            </div>
          </div>
        </motion.div>

        {/* Card 3: Customers */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-medium text-gray-500">Customers</span>
            <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
              <Users size={14} strokeWidth={2.5} className="text-orange-500" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 mb-0.5">{execData?.customers?.value ?? 0}</div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold px-1.5 py-0.5 bg-red-50 text-red-500 rounded">-1.5%</span>
              <span className="text-[10px] text-gray-400">vs last month</span>
            </div>
          </div>
        </motion.div>

        {/* Card 4: Avg Order Value */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-medium text-gray-500">Avg Order Value</span>
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
              <TrendingUp size={14} strokeWidth={2.5} className="text-blue-500" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 mb-0.5">{formatRM(35.50)}</div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold px-1.5 py-0.5 bg-emerald-50 text-emerald-600 rounded">+4.1%</span>
              <span className="text-[10px] text-gray-400">vs last month</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Performance Overview Chart */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="lg:col-span-8 bg-white border border-gray-100 rounded-xl p-5 shadow-sm flex flex-col h-[320px]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-[15px] font-bold text-gray-900 tracking-tight">Performance Overview</h3>
            <button className="text-xs font-semibold bg-gray-50 text-gray-600 px-3 py-1.5 rounded-lg border border-gray-200">This Week ⌄</button>
          </div>
          <div className="flex-1 w-full min-h-0">
             {chartData.length === 0 ? (
                <AppEmptyState title="No data available" icon={BarChart3} />
             ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }} barSize={28}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} dy={8} fontWeight={500} />
                    <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} fontWeight={500} />
                    <Tooltip
                      cursor={{ fill: '#f9fafb' }}
                      contentStyle={{ background: '#fff', border: '1px solid #f3f4f6', borderRadius: '10px', boxShadow: '0 4px 20px rgb(0 0 0 / 0.08)', color: '#111', fontSize: '12px', fontWeight: 'bold' }}
                    />
                    <Bar dataKey="Orders" fill="#FF6B00" radius={[5, 5, 5, 5]} />
                  </BarChart>
                </ResponsiveContainer>
             )}
          </div>
        </motion.div>

        {/* Sales Growth Gauge */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.42 }} className="lg:col-span-4 bg-white border border-gray-100 rounded-xl p-5 shadow-sm flex flex-col h-[320px]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-[15px] font-bold text-gray-900 tracking-tight">Sales Growth</h3>
            <button className="text-gray-400 hover:text-gray-900 text-lg leading-none">•••</button>
          </div>
          
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="relative w-44 h-22 overflow-hidden mb-3">
               <svg className="w-full h-full" viewBox="0 0 100 50">
                 <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#f3f4f6" strokeWidth="13" strokeLinecap="round" />
                 <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#FF6B00" strokeWidth="13" strokeLinecap="round" strokeDasharray="125" strokeDashoffset={125 - (125 * popularityRate / 100)} />
               </svg>
               <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center">
                 <span className="text-2xl font-extrabold text-gray-900">{popularityRate}%</span>
                 <span className="text-[9px] text-gray-400 font-semibold uppercase tracking-wider">Sales Growth</span>
               </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-50">
             <div>
               <div className="text-[10px] text-gray-400 font-medium mb-0.5">Number of Sales</div>
               <div className="text-base font-bold text-gray-900 flex items-center gap-1.5">
                 {execData?.orders?.value ?? 0} <span className="bg-amber-100 text-amber-700 text-[9px] px-1.5 py-0.5 rounded font-bold">+5%</span>
               </div>
             </div>
             <div>
               <div className="text-[10px] text-gray-400 font-medium mb-0.5">Total Revenue</div>
               <div className="text-base font-bold text-gray-900 flex items-center gap-1.5">
                 {formatRM(execData?.revenue?.value ?? 0)} <span className="bg-gray-100 text-gray-600 text-[9px] px-1.5 py-0.5 rounded font-bold">+12%</span>
               </div>
             </div>
          </div>
        </motion.div>
      </div>

      {/* Top Performers Table */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-[15px] font-bold text-gray-900 tracking-tight">Top Performers</h3>
          <div className="flex items-center gap-2">
             <div className="relative">
               <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
               <input type="text" placeholder="Search products..." className="pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-gray-50 text-gray-900 outline-none focus:ring-1 focus:ring-[#FF6B00] w-40" />
             </div>
             <button className="text-xs font-semibold bg-gray-50 text-gray-600 px-3 py-1.5 rounded-lg border border-gray-200 flex items-center gap-1">Sort by ⌄</button>
          </div>
        </div>
        
        <table className="w-full text-left border-collapse">
          <thead>
            <tr>
              <th className="pb-2 pt-1 px-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wide border-b border-gray-100">Product</th>
              <th className="pb-2 pt-1 px-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wide border-b border-gray-100">Category</th>
              <th className="pb-2 pt-1 px-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wide border-b border-gray-100">Status</th>
              <th className="pb-2 pt-1 px-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wide border-b border-gray-100">Units Sold</th>
              <th className="pb-2 pt-1 px-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wide border-b border-gray-100">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {(report?.topItems || []).slice(0, 5).map((item: any, idx: number) => (
              <tr key={idx} className="hover:bg-gray-50 transition-colors">
                <td className="py-2.5 px-2 border-b border-gray-50">
                  <div className="flex items-center gap-2.5">
                     <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                       <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${item.itemName}&backgroundColor=transparent`} alt="" className="w-full h-full mix-blend-multiply opacity-80" />
                     </div>
                     <span className="font-semibold text-[13px] text-gray-900">{item.itemName}</span>
                  </div>
                </td>
                <td className="py-2.5 px-2 border-b border-gray-50 text-[13px] text-gray-500">Main Menu</td>
                <td className="py-2.5 px-2 border-b border-gray-50">
                  <span className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase">Active</span>
                </td>
                <td className="py-2.5 px-2 border-b border-gray-50 text-[13px] font-semibold text-gray-900">{item.totalQuantity}</td>
                <td className="py-2.5 px-2 border-b border-gray-50 text-[13px] font-bold text-gray-900">{formatRM(item.totalRevenue)}</td>
              </tr>
            ))}
            {(!report?.topItems || report.topItems.length === 0) && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-sm text-gray-400">No data available</td>
              </tr>
            )}
          </tbody>
        </table>
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

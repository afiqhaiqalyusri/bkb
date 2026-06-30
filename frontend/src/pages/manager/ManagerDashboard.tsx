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
    <div className="space-y-8 pb-10">
      
      {/* TOP ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Hero Widget */}
        <div className="lg:col-span-2 bg-gradient-to-br from-[#FF6B00] to-[#E65100] rounded-[2rem] p-8 md:p-10 text-white relative overflow-hidden shadow-lg flex flex-col justify-between min-h-[320px]">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-black/10 rounded-full blur-2xl pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div>
              <p className="text-orange-100 font-semibold mb-2 tracking-wide uppercase text-sm">Today's Revenue</p>
              <h2 className="text-6xl md:text-7xl font-extrabold tracking-tighter mb-4">
                {formatRM(execData?.revenue?.value ?? 0)}
              </h2>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mt-8 gap-6">
              <div className="flex gap-8">
                <div>
                  <div className="flex items-center gap-2 text-orange-200 text-xs font-bold uppercase tracking-wider mb-1">
                    <ShoppingBag size={14} /> Orders
                  </div>
                  <div className="text-2xl font-bold">{execData?.orders?.value ?? 0}</div>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-orange-200 text-xs font-bold uppercase tracking-wider mb-1">
                    <Users size={14} /> Customers
                  </div>
                  <div className="text-2xl font-bold">{execData?.customers?.value ?? 0}</div>
                </div>
              </div>
              
              <button onClick={() => onNavigate('reports')} className="bg-[#0f172a] text-white px-6 py-3.5 rounded-full font-bold text-xs hover:bg-[#1e293b] transition-colors shadow-md flex items-center gap-2 whitespace-nowrap tracking-wider uppercase">
                View Full Statistic <ArrowRight size={14} strokeWidth={3} />
              </button>
            </div>
          </div>
          
          {/* Decorative Illustration (Using burger emoji) */}
          <div className="absolute right-10 top-1/2 -translate-y-1/2 hidden md:flex items-center justify-center opacity-[0.85] pointer-events-none select-none">
            <div className="text-[130px] filter drop-shadow-2xl grayscale-[20%] sepia-[10%]">🍔</div>
          </div>
        </div>

        {/* Rate Widget */}
        <div className="bg-[#FFEACF] dark:bg-[#3E2723] rounded-[2rem] p-8 relative overflow-hidden flex flex-col shadow-sm border border-orange-100 dark:border-orange-900/50 min-h-[320px]">
          <p className="text-orange-900 dark:text-orange-200 font-bold mb-4 tracking-wide">Completion Rate</p>
          <div className="flex items-start gap-2 relative z-10">
            <span className="text-[5.5rem] font-extrabold tracking-tighter text-gray-900 dark:text-white leading-none">{popularityRate}</span>
            <span className="text-3xl font-bold text-gray-900 dark:text-white mt-2 leading-none">%</span>
            <span className="bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-[10px] font-extrabold px-2 py-1 rounded-full shadow-sm mt-3 ml-2 border border-gray-100 dark:border-slate-700">
              +4%
            </span>
          </div>
          
          {/* Decorative Arc/Gauge */}
          <div className="absolute right-8 top-10 w-24 h-24 rounded-full border-[8px] border-orange-200 dark:border-orange-900/50 border-t-primary border-r-primary transform rotate-45 opacity-80 pointer-events-none"></div>

          <p className="text-xs text-gray-600 dark:text-gray-400 mt-auto leading-relaxed max-w-[200px] font-medium">
            Your rate has increased because of recent fast service times. <strong>Keep moving forward!</strong>
          </p>
          
          <div className="mt-5 flex items-center justify-between border-t border-orange-200/50 dark:border-orange-900/50 pt-5">
             <span className="text-[10px] font-bold text-orange-900/70 dark:text-orange-300 uppercase tracking-widest cursor-pointer hover:text-orange-900 dark:hover:text-orange-200 transition-colors">
               Manage Team
             </span>
             <button className="w-10 h-10 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center text-primary shadow-sm hover:scale-105 transition-transform border border-orange-50 dark:border-slate-700">
               <ArrowRight size={16} strokeWidth={3} />
             </button>
          </div>
        </div>
      </div>

      {/* BOTTOM ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Finance Performance */}
        <div className="bg-transparent rounded-[2rem] py-2 flex flex-col min-h-[300px]">
          <div className="flex items-center justify-between mb-8 px-2">
             <h3 className="font-extrabold text-gray-900 dark:text-white tracking-tight">Finance Performance</h3>
             <div className="flex items-center gap-3">
               <div className="flex items-center gap-3 bg-white dark:bg-slate-800 px-4 py-2 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
                  <div className="w-8 h-8 bg-[#0F766E] text-white rounded-lg flex items-center justify-center font-bold text-sm">$</div>
                  <div>
                    <div className="text-lg font-extrabold text-gray-900 dark:text-white leading-none">{formatRM(execData?.revenue?.value ?? 0)}</div>
                    <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider leading-none mt-1">Monthly Income</div>
                  </div>
               </div>
             </div>
          </div>
          
          <div className="flex-1 min-h-[220px]">
             {chartData.length === 0 ? (
                <AppEmptyState title="No data available" icon={BarChart3} />
             ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }} barSize={10}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.3} />
                    <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={10} tickLine={false} axisLine={false} dy={10} fontWeight={600} />
                    <YAxis stroke="var(--text-secondary)" fontSize={10} tickLine={false} axisLine={false} fontWeight={600} />
                    <Tooltip 
                      cursor={{ fill: 'var(--border)', opacity: 0.15 }}
                      contentStyle={{ background: 'var(--surface)', border: 'none', borderRadius: '16px', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }} 
                    />
                    <Bar dataKey="Orders" fill="#0F766E" radius={[4, 4, 4, 4]} />
                  </BarChart>
                </ResponsiveContainer>
             )}
          </div>
        </div>

        {/* Top Performers */}
        <div className="bg-transparent rounded-[2rem] py-2 flex flex-col min-h-[300px]">
          <div className="flex justify-between items-center mb-6 px-2">
            <h3 className="font-extrabold text-gray-900 dark:text-white tracking-tight uppercase">TOP Performers</h3>
          </div>
          <div className="flex flex-col gap-3 flex-1 px-2">
            {(report?.topItems || []).slice(0, 4).map((item: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between group py-3 border-b border-gray-100 dark:border-slate-800 last:border-0 hover:bg-gray-50 dark:hover:bg-slate-800/50 px-2 -mx-2 rounded-xl transition-colors cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#FFEACF] dark:bg-slate-800 flex items-center justify-center font-bold text-primary shadow-sm text-sm overflow-hidden">
                    {/* Placeholder Avatar style for items, mimicking the design's avatar list */}
                    <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${item.itemName}&backgroundColor=transparent`} alt="avatar" className="w-full h-full object-cover opacity-80 mix-blend-multiply dark:mix-blend-normal dark:invert" />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-gray-900 dark:text-white group-hover:text-primary transition-colors">{item.itemName}</div>
                    <div className="text-[10px] text-gray-400 font-bold tracking-wide mt-0.5 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#0F766E] animate-pulse"></span>
                      {item.totalQuantity} sold
                    </div>
                  </div>
                </div>
                <div className="text-sm font-extrabold text-gray-300 dark:text-slate-600">
                  {/* Mimic the 4.7, 4.3 ratings from the image with a dummy aesthetic rank */}
                  {(5.0 - (idx * 0.1)).toFixed(1)}
                </div>
              </div>
            ))}
            {(!report?.topItems || report.topItems.length === 0) && (
               <div className="flex-1 flex items-center justify-center text-sm text-gray-400 font-bold">No sales data</div>
            )}
          </div>
        </div>

        {/* Targeting by region (Replaced with Inventory Map/Card) */}
        <div className="bg-transparent rounded-[2rem] py-2 flex flex-col min-h-[300px] relative">
          
          <div className="flex justify-between items-center mb-6 px-2 relative z-10">
            <h3 className="font-extrabold text-gray-900 dark:text-white tracking-tight">Targeting by Inventory</h3>
          </div>
          
          <div className="bg-[#F8FAFC] dark:bg-slate-800/40 rounded-[2rem] p-6 flex flex-col gap-4 flex-1 relative border border-gray-100 dark:border-slate-800/60 overflow-hidden">
            {/* Minimalist World Map placeholder background */}
            <div className="absolute inset-0 opacity-10 dark:opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'radial-gradient(var(--text-secondary) 1px, transparent 1px)', backgroundSize: '16px 16px' }}></div>
            
            {lowStock.length === 0 ? (
               <div className="flex-1 flex flex-col items-center justify-center text-gray-400 relative z-10">
                 <CheckCircle2 size={32} className="mb-2 text-[#0F766E] opacity-70" />
                 <span className="text-xs font-bold uppercase tracking-widest">Stock healthy</span>
               </div>
            ) : (
              lowStock.slice(0, 3).map((item) => (
                <div key={item.id} className="bg-white dark:bg-slate-800 p-3 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 flex items-center gap-4 relative z-10 hover:-translate-y-0.5 transition-transform">
                  <div className={`w-10 h-10 rounded-xl flex flex-shrink-0 items-center justify-center ${item.status === 'CRITICAL' ? 'bg-red-50 text-red-500 dark:bg-red-900/20' : 'bg-amber-50 text-amber-500 dark:bg-amber-900/20'}`}>
                    <Package size={20} />
                  </div>
                  <div className="flex-1 min-w-0 pr-2">
                     <div className="font-bold text-xs text-gray-900 dark:text-white truncate">{item.itemName}</div>
                     <div className="text-[10px] text-gray-500 font-bold mt-1 flex items-center justify-between">
                       <span>{item.currentStock} left</span>
                       <span className={item.status === 'CRITICAL' ? 'text-red-500' : 'text-amber-500'}>
                         Restock
                       </span>
                     </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        
      </div>
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

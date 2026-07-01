import React, { useState, useEffect } from 'react';
import { TrendingUp, Users, DollarSign, Activity, AlertTriangle } from 'lucide-react';
import { ManagerLayout } from '../../components/layout/ManagerLayout';
import { AppPageHeader } from '../../components/ui/AppPageHeader';
import { AppStatCard } from '../../components/ui/AppStatCard';
import { AppCard } from '../../components/ui/AppCard';
import { AppEmptyState } from '../../components/ui/AppEmptyState';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { reportService } from '../../services/report.service';
import { formatRM } from '../../utils/formatCurrency';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';

export const ManagerAnalytics: React.FC = () => {
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
    <ManagerLayout title="Analytics">
      <div className="flex flex-col gap-6 max-w-[1200px] mx-auto w-full animate-fade-in">
        <AppPageHeader 
          title="Business Analytics" 
          subtitle="Visualize key performance indicators and track business growth trends."
        />

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
                    <ResponsiveContainer width="100%" height="100%">
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
                        <RechartsTooltip content={<CustomTooltip />} />
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
                    <ResponsiveContainer width="100%" height="100%">
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
                        <RechartsTooltip content={<CustomBarTooltip />} cursor={{ fill: 'var(--border)', opacity: 0.4 }} />
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
    </ManagerLayout>
  );
};

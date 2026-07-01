import React, { useState } from 'react';
import { FileText, Download, BarChart2, Calendar } from 'lucide-react';
import { ManagerLayout } from '../../components/layout/ManagerLayout';
import { AppPageHeader } from '../../components/ui/AppPageHeader';
import { AppCard } from '../../components/ui/AppCard';
import { AppButton } from '../../components/ui/AppButton';
import { reportService } from '../../services/report.service';
import toast from 'react-hot-toast';

export const ManagerReports: React.FC = () => {
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
    <ManagerLayout title="Reports">
      <div className="flex flex-col gap-6 max-w-[1200px] mx-auto w-full animate-fade-in">
        <AppPageHeader 
          title="System Reports" 
          subtitle="Generate and download detailed reports for sales, inventory, and business metrics based on actual data."
        />

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
    </ManagerLayout>
  );
};

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Star, Search, Filter, Calendar } from 'lucide-react';
import { ManagerLayout } from '../../components/layout/ManagerLayout';
import { AppEmptyState } from '../../components/ui/AppEmptyState';
import { orderService } from '../../services/order.service';
import { Order } from '../../types';

export const ManagerFeedback: React.FC = () => {
  const [feedback, setFeedback] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [ratingFilter, setRatingFilter] = useState<number | 'ALL'>('ALL');

  useEffect(() => {
    fetchFeedback();
  }, []);

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      const res = await orderService.getFeedbackHistory();
      // Filter out orders that don't have a rating
      setFeedback((res.data || []).filter(f => f.rating));
    } catch (err) {
      console.error('Failed to fetch feedback history', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredFeedback = useMemo(() => {
    return feedback.filter(f => {
      const matchesSearch = f.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            f.feedback?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            f.customerName?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRating = ratingFilter === 'ALL' || f.rating === ratingFilter;
      return matchesSearch && matchesRating;
    });
  }, [feedback, searchTerm, ratingFilter]);

  const averageRating = useMemo(() => {
    if (feedback.length === 0) return 0;
    const total = feedback.reduce((sum, f) => sum + (f.rating || 0), 0);
    return (total / feedback.length).toFixed(1);
  }, [feedback]);

  return (
    <ManagerLayout title="Feedback Management">
      <div className="flex flex-col gap-6 max-w-[1200px] mx-auto w-full animate-fade-in">
        {/* Header Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[rgba(255,107,0,0.1)] text-[var(--primary)] flex items-center justify-center">
              <MessageSquare size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-slate-400 font-medium">Total Feedback</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{feedback.length}</h3>
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-500 flex items-center justify-center">
              <Star size={24} fill="currentColor" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-slate-400 font-medium">Average Rating</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{averageRating} <span className="text-sm font-normal text-gray-500">/ 5.0</span></h3>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="relative w-full lg:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text"
              placeholder="Search by order #, name or comment..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all"
            />
          </div>
          <div className="flex items-center gap-2 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0 hide-scrollbar" style={{ WebkitOverflowScrolling: 'touch' }}>
            <Filter size={16} className="text-gray-400 flex-shrink-0 ml-1" />
            <div className="flex gap-2">
              <button 
                onClick={() => setRatingFilter('ALL')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${ratingFilter === 'ALL' ? 'bg-[var(--primary)] text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600'}`}
              >
                All
              </button>
              {[5, 4, 3, 2, 1].map(rating => (
                <button 
                  key={rating}
                  onClick={() => setRatingFilter(rating)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap flex items-center gap-1 transition-colors ${ratingFilter === rating ? 'bg-amber-500 text-white' : 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40'}`}
                >
                  {rating} <Star size={12} fill="currentColor" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Feedback List */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="w-10 h-10 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredFeedback.length === 0 ? (
          <div className="mt-8">
            <AppEmptyState 
              title="No feedback found" 
              description={searchTerm || ratingFilter !== 'ALL' ? "Try adjusting your filters" : "Customers haven't submitted any feedback yet."}
              icon={MessageSquare} 
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredFeedback.map((item, index) => (
              <motion.div 
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.05, 0.5) }}
                className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex flex-col">
                    <span className="font-bold text-gray-900 dark:text-white truncate max-w-[150px]">{item.customerName || 'Guest Customer'}</span>
                    <span className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                      <Calendar size={12} />
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-0.5 text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-lg border border-amber-100 dark:border-amber-900/50">
                    <span className="text-sm font-bold mr-1">{item.rating?.toFixed(1)}</span>
                    <Star size={14} fill="currentColor" />
                  </div>
                </div>
                
                <div className="text-sm text-gray-700 dark:text-slate-300 mt-2 mb-4 flex-1 italic bg-gray-50 dark:bg-slate-900/50 p-4 rounded-lg border border-gray-100 dark:border-slate-700/50 relative">
                  <span className="absolute -top-2 left-3 bg-white dark:bg-slate-800 text-gray-300 dark:text-slate-600 text-2xl leading-none font-serif">"</span>
                  {item.feedback || 'No written feedback provided.'}
                </div>

                <div className="mt-auto pt-3 border-t border-gray-100 dark:border-slate-700 flex justify-between items-center text-xs">
                  <span className="text-gray-500 dark:text-slate-400">Order Ref:</span>
                  <span className="font-bold font-mono text-[var(--primary)] bg-[rgba(255,107,0,0.1)] px-2 py-1 rounded">#{item.orderNumber}</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </ManagerLayout>
  );
};

import React, { useState, useEffect } from 'react';
import { AppModal } from '../../ui/AppModal';
import { Order } from '../../../types';
import api from '../../../services/api';
import toast from 'react-hot-toast';
import { Star } from 'lucide-react';

interface FeedbackHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FeedbackHistoryModal: React.FC<FeedbackHistoryModalProps> = ({ isOpen, onClose }) => {
  const [feedbackOrders, setFeedbackOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchFeedback();
    }
  }, [isOpen]);

  const fetchFeedback = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/orders/feedback');
      setFeedbackOrders(res.data.data || []);
    } catch (err: any) {
      toast.error('Failed to load feedback history');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppModal isOpen={isOpen} onClose={onClose} title="Customer Feedback History">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '60vh', overflowY: 'auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>Loading feedback...</div>
        ) : feedbackOrders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>No feedback available yet.</div>
        ) : (
          feedbackOrders.map(order => (
            <div key={order.id} style={{ padding: '16px', border: '1px solid var(--border)', borderRadius: '12px', background: 'var(--surface)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Order #{order.orderNumber}</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{new Date(order.createdAt).toLocaleDateString()}</span>
              </div>
              <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
                {[1, 2, 3, 4, 5].map(star => (
                  <Star
                    key={star}
                    size={16}
                    fill={star <= (order.rating || 0) ? '#F59E0B' : 'none'}
                    color={star <= (order.rating || 0) ? '#F59E0B' : 'var(--border)'}
                  />
                ))}
              </div>
              {order.feedback && (
                <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', fontStyle: 'italic', background: 'var(--cream-dark)', padding: '10px', borderRadius: '8px' }}>
                  "{order.feedback}"
                </div>
              )}
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
                Customer: {order.customerName || 'Guest'}
              </div>
            </div>
          ))
        )}
      </div>
    </AppModal>
  );
};

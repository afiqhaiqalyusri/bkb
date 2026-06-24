import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { PageShell } from '../components/PageShell';
import { FullScreenLoader } from '../components/ui/FullScreenLoader';
import { useCartStore } from '../store/cartStore';
import api from '../services/api';

export const PaymentResultPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const statusId = searchParams.get('status_id');
  const orderIdStr = searchParams.get('order_id');
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyPayment = async () => {
      const billcode = searchParams.get('billcode');
      const transactionId = searchParams.get('transaction_id');
      const amount = searchParams.get('amount');
      const msg = searchParams.get('msg') ?? searchParams.get('reason');

      // Fallback verification: Tell the backend to verify the payment
      // in case the server-to-server webhook failed or was delayed.
      // Forward ALL query params so the backend has full context.
      if (billcode && statusId) {
        try {
          await api.post('/api/payments/verify-redirect', {
            billcode,
            status_id: statusId,
            transaction_id: transactionId,
            order_id: orderIdStr,
            amount,
            msg,
          });
        } catch (err) {
          console.error("Failed to verify payment via redirect", err);
        }
      }

      if (statusId === '1') {
        // Clear the cart on successful payment
        useCartStore.getState().clearCart();
      }
      
      setLoading(false);
    };

    verifyPayment();
  }, [statusId, searchParams, orderIdStr]);

  const isSuccess = statusId === '1';
  const isPending = statusId === '2';
  const isFail = statusId === '3';

  if (loading) {
    return <FullScreenLoader message="Verifying your payment..." />;
  }

  return (
    <PageShell activeKey="/cart">
      <div className="page-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', paddingBottom: 60 }}>
        
        <div style={{
          background: 'var(--surface)',
          padding: '40px 30px',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-md)',
          textAlign: 'center',
          maxWidth: 400,
          width: '100%',
          border: '1.5px solid var(--border)'
        }}>
          
          {isSuccess && (
            <>
              <div style={{ fontSize: '4rem', marginBottom: 10 }}>🎉</div>
              <h2 style={{ fontFamily: 'Poppins', fontWeight: 800, color: 'var(--success)', marginBottom: 8 }}>Payment Successful!</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 24, lineHeight: 1.5 }}>
                Your order <strong>#{orderIdStr}</strong> has been paid successfully. We are preparing it now!
              </p>
              <button 
                onClick={() => navigate('/history', { replace: true })}
                style={{
                  background: 'var(--primary)',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: 10,
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  width: '100%'
                }}
              >
                View My Orders
              </button>
            </>
          )}

          {isPending && (
            <>
              <div style={{ fontSize: '4rem', marginBottom: 10 }}>⏳</div>
              <h2 style={{ fontFamily: 'Poppins', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>Payment Pending</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 24, lineHeight: 1.5 }}>
                Your payment for order <strong>#{orderIdStr}</strong> is currently pending verification.
              </p>
              <button 
                onClick={() => navigate('/history', { replace: true })}
                style={{
                  background: 'var(--primary)',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: 10,
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  width: '100%'
                }}
              >
                Check Order Status
              </button>
            </>
          )}

          {(!isSuccess && !isPending) && (
            <>
              <div style={{ fontSize: '4rem', marginBottom: 10 }}>❌</div>
              <h2 style={{ fontFamily: 'Poppins', fontWeight: 800, color: 'var(--danger)', marginBottom: 8 }}>Payment Failed</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 24, lineHeight: 1.5 }}>
                Oops, something went wrong with your payment for order <strong>#{orderIdStr}</strong>.
              </p>
              <button 
                onClick={() => navigate('/history', { replace: true })}
                style={{
                  background: 'var(--surface)',
                  color: 'var(--text-primary)',
                  border: '2px solid var(--border)',
                  padding: '12px 24px',
                  borderRadius: 10,
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  width: '100%',
                  marginBottom: 12
                }}
              >
                Back to Orders
              </button>
            </>
          )}

        </div>
      </div>
    </PageShell>
  );
};

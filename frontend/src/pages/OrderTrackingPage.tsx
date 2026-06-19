import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import { Order } from '../types';
import { orderService } from '../services/order.service';
import { formatRM } from '../utils/formatCurrency';
import {
  ORDER_STATUS_STEPS,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_DESCRIPTIONS,
  estimateWaitTime,
  getStatusIndex,
} from '../utils/orderStatus';
import toast from 'react-hot-toast';
import { PageShell } from '../components/PageShell';
import { BurgerLoader } from '../components/ui/BurgerLoader';
import { getFoodImage } from '../utils/foodImages';
import { useAuthStore } from '../store/authStore';
import { BurgerStackGame } from '../components/game/BurgerStackGame';

export const OrderTrackingPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  const handleCancelOrder = async () => {
    if (!order) return;
    const confirmed = window.confirm("Are you sure you want to cancel this scheduled order?");
    if (!confirmed) return;

    setCancelling(true);
    try {
      await orderService.cancel(order.id);
      toast.success("Order cancelled successfully!");
      fetchOrder();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to cancel order");
    } finally {
      setCancelling(false);
    }
  };

  const fetchOrder = async () => {
    if (!id) return;
    try {
      const res = await orderService.getById(Number(id));
      const newOrder = res.data;

      // Check status transitions
      if (order) {
        const prevStatus = order.status;
        const newStatus = newOrder.status;

        if (prevStatus !== newStatus) {
          let toastMessage = '';

          if (newStatus === 'ACCEPTED') {
            toastMessage = 'Your order has been accepted by the kitchen staff!';
          } else if ((newStatus === 'GRILLING' || newStatus === 'ASSEMBLING') && prevStatus !== 'GRILLING' && prevStatus !== 'ASSEMBLING') {
            toastMessage = 'Your burger is grilling and in assembly!';
          } else if (newStatus === 'READY') {
            toastMessage = 'Your order is ready for collection!';
          } else if (newStatus === 'COMPLETED') {
            toastMessage = 'Thank you for dining with BKB!';
          }

          if (toastMessage) {
            toast.success(toastMessage, { id: `status-${newStatus}`, duration: 5000 });
          }
        }
      }

      setOrder(newOrder);
    } catch {
      toast.error('Order not found');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
    // Poll every 8 seconds
    const interval = setInterval(fetchOrder, 8000);
    return () => clearInterval(interval);
  }, [id]);

  if (loading) return (
    <PageShell>
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'80vh' }}>
        <BurgerLoader message="Locating your order..." />
      </div>
    </PageShell>
  );

  if (!order) return (
    <PageShell>
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'80vh', padding:24 }}>
        <div style={{ fontSize:'4rem', marginBottom:16 }}>❓</div>
        <h2 style={{ fontFamily:'Poppins', fontWeight:800, color:'var(--text-primary)', marginBottom:8 }}>Order Not Found</h2>
        <p style={{ color:'var(--text-secondary)', marginBottom:24, textAlign:'center' }}>We couldn't find the order details.</p>
        <button onClick={() => navigate('/menu')} style={{ background:'var(--text-primary)', color:'var(--background)', border:'none', borderRadius:14, padding:'12px 24px', fontFamily:'Poppins', fontWeight:700, cursor:'pointer' }}>Back to Menu</button>
      </div>
    </PageShell>
  );

  const currentStepIndex = getStatusIndex(order.status);
  const isCancelled = order.status === 'CANCELLED';
  const isCompleted = order.status === 'COMPLETED';
  const waitTime = estimateWaitTime(order.status);

  return (
    <PageShell>
      <div className="page-content" style={{ paddingBottom: 60 }}>
        {/* Outer Split Layout */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          {/* Top Header Section */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-secondary)' }}>
                Order Tracking
              </span>
              <h1 style={{ fontFamily: 'Outfit', fontWeight: 900, fontSize: '1.75rem', color: 'var(--text-primary)', marginTop: 4 }}>
                Status for Order #{order.orderNumber}
              </h1>
            </div>
            <button
              onClick={() => navigate('/menu')}
              style={{
                background: 'var(--surface)',
                color: 'var(--text-primary)',
                border: '1.5px solid var(--border)',
                borderRadius: 12,
                padding: '10px 18px',
                fontFamily: 'Outfit',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: 'var(--shadow-sm)'
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              Back to Menu
            </button>
          </div>

          <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }} className="flex flex-col lg:flex-row">
            
            {/* Left Column: Timeline stepper and header status card */}
            <div style={{ flex: '1.6 1 600px', width: '100%', display: 'flex', flexDirection: 'column', gap: 20 }}>
              
              {/* Status Header card */}
              <div style={{
                background: 'var(--surface)',
                borderRadius: 'var(--radius-lg)',
                border: '1.5px solid var(--border)',
                padding: '24px',
                boxShadow: 'var(--shadow-sm)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                  <div style={{
                    width: 56, height: 56, borderRadius: '14px',
                    background: 'rgba(255,107,0,0.08)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.8rem',
                    flexShrink: 0
                  }}>
                    {isCancelled ? '❌' : isCompleted ? '🍔' : order.status === 'READY' ? '🎉' : '🔥'}
                  </div>
                  <div>
                    <h2 style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '1.25rem', color: 'var(--text-primary)' }}>
                      {isCancelled 
                        ? 'Order Cancelled' 
                        : isCompleted 
                          ? 'Thank You for Ordering!' 
                          : order.status === 'READY' 
                            ? 'Your Order is Ready for Collection!' 
                            : ORDER_STATUS_LABELS[order.status]}
                    </h2>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                      {ORDER_STATUS_DESCRIPTIONS[order.status]}
                    </p>
                  </div>
                </div>

                {waitTime && !isCancelled && !isCompleted && (
                  <div style={{
                    marginTop: 12, padding: '10px 14px', borderRadius: 10,
                    background: 'var(--cream-dark)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    fontSize: '0.82rem'
                  }}>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Estimated collection wait:</span>
                    <span style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '0.9rem' }}>{waitTime}</span>
                  </div>
                )}
              </div>

              {/* Stepper progress timeline */}
              {!isCancelled && (
                <div style={{
                  background: 'var(--surface)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1.5px solid var(--border)',
                  padding: '24px',
                  boxShadow: 'var(--shadow-sm)'
                }}>
                  <h3 style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: 20 }}>
                    Track Progression
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
                    {ORDER_STATUS_STEPS.filter(s => s !== 'CANCELLED').map((step, idx) => {
                      const done = idx < currentStepIndex;
                      const active = idx === currentStepIndex;
                      return (
                        <div key={step} style={{ display: 'flex', gap: 16, position: 'relative', paddingBottom: idx === 5 ? 0 : 28 }}>
                          {idx < 5 && (
                            <div style={{
                              position: 'absolute',
                              left: 15, top: 32, width: 2, height: 'calc(100% - 10px)',
                              background: done ? 'var(--primary)' : 'var(--cream-dark)',
                              zIndex: 1,
                              transition: 'background 0.3s ease',
                            }} />
                          )}

                          <div style={{
                            zIndex: 2,
                            width: 32, height: 32, borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: done ? 'var(--primary)' : active ? 'var(--surface)' : 'var(--cream-dark)',
                            border: `2px solid ${done || active ? 'var(--primary)' : 'var(--border)'}`,
                            color: done ? '#fff' : active ? 'var(--primary)' : 'var(--text-secondary)',
                            flexShrink: 0,
                            boxShadow: active ? '0 0 0 4px rgba(255,107,0,0.12)' : 'none',
                          }}>
                            {done ? (
                              <Check size={14} color="white" strokeWidth={3} />
                            ) : active ? (
                              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)', animation: 'pulse-red 1.2s infinite' }} />
                            ) : (
                              <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--text-secondary)' }} />
                            )}
                          </div>

                          <div style={{ flex: 1, paddingTop: 4 }}>
                            <div style={{
                              fontFamily: 'Outfit',
                              fontWeight: active ? 800 : done ? 700 : 600,
                              color: active ? 'var(--primary)' : done ? 'var(--text-primary)' : 'var(--text-secondary)',
                              fontSize: '0.88rem',
                              lineHeight: 1.2,
                            }}>
                              {ORDER_STATUS_LABELS[step]}
                            </div>
                            {(active || done) && (
                              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.4 }}>
                                {ORDER_STATUS_DESCRIPTIONS[step]}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Receipt Summary card */}
            <div style={{ flex: '1 1 380px', width: '100%', position: 'sticky', top: 24 }}>
              <div style={{
                background: 'var(--surface)',
                borderRadius: 'var(--radius-lg)',
                border: '1.5px solid var(--border)',
                padding: '20px',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <h3 style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: 16 }}>
                  Order Summary
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {order.items.map(item => (
                    <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
                      <img
                        src={getFoodImage('', item.menuItemName)}
                        alt={item.menuItemName}
                        style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'cover' }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '0.84rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.menuItemName}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                          Qty: {item.quantity} × {formatRM(item.unitPrice)}
                        </div>
                      </div>
                      <div style={{ fontWeight: 700, fontSize: '0.84rem', color: 'var(--text-primary)' }}>
                        {formatRM(item.unitPrice * item.quantity)}
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16, paddingTop: 14, borderTop: '2px dashed var(--border)', fontWeight: 800, fontSize: '1rem' }}>
                  <span style={{ color: 'var(--text-primary)' }}>Total Amount</span>
                  <span style={{ color: 'var(--primary)', fontFamily: 'Outfit', fontSize: '1.15rem' }}>{formatRM(order.total)}</span>
                </div>

                <div style={{
                  marginTop: 20,
                  padding: '14px',
                  background: 'var(--cream-dark)',
                  borderRadius: '12px',
                  fontSize: '0.78rem',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <strong>Customer Name:</strong>
                    <span>{order.customerName}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <strong>Payment Method:</strong>
                    <span>{order.paymentMethod === 'ONLINE' ? `Online (${order.paymentChannel || 'E-Wallet'})` : 'Cash at Counter'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <strong>Payment Status:</strong>
                    <span style={{
                      fontWeight: 700,
                      color: order.paymentStatus === 'PAID' ? 'var(--success)' : 'var(--warning)'
                    }}>
                      {order.paymentStatus}
                    </span>
                  </div>
                  {order.notes && (
                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: 6, marginTop: 4 }}>
                      <strong>Notes:</strong> "{order.notes}"
                    </div>
                  )}
                  {order.pickupTime && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: 6, marginTop: 4 }}>
                      <strong>Pickup Time:</strong>
                      <span>{new Date(order.pickupTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  )}
                  {order.status === 'ON_HOLD' && order.scheduledTime && (new Date(order.scheduledTime).getTime() - new Date().getTime()) > 30 * 60000 && (
                    <button
                      onClick={handleCancelOrder}
                      disabled={cancelling}
                      style={{
                        marginTop: 14,
                        width: '100%',
                        background: 'var(--red)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 10,
                        padding: '10px',
                        fontFamily: 'Outfit',
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        cursor: cancelling ? 'not-allowed' : 'pointer',
                        opacity: cancelling ? 0.7 : 1,
                        transition: 'all 0.2s',
                        boxShadow: '0 4px 12px rgba(220,38,38,0.2)'
                      }}
                    >
                      {cancelling ? 'Cancelling...' : '❌ Cancel Order'}
                    </button>
                  )}
                </div>
              </div>
            </div>

          </div>

          {/* Burger Stack Mini Game — shown only during active preparation */}
          <BurgerStackGame
            orderId={order.id}
            orderStatus={order.status}
          />

        </div>

      </div>    </PageShell>
  );
};

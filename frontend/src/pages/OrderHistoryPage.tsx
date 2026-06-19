import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Order } from '../types';
import { orderService } from '../services/order.service';
import { formatRM } from '../utils/formatCurrency';
import { PageShell } from '../components/PageShell';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import { OrderHistorySkeleton } from '../components/ui/SkeletonLoader';

const STATUS_STYLE: Record<string, { label: string; color: string; bg: string }> = {
  PENDING:    { label:'Received',   color:'#D97706', bg:'rgba(245,158,11,0.1)'  },
  ACCEPTED:   { label:'Accepted',   color:'var(--red)', bg:'rgba(255,107,0,0.1)'  },
  GRILLING:   { label:'Grilling',   color:'var(--primary)', bg:'rgba(255,107,0,0.1)'   },
  ASSEMBLING: { label:'Assembling', color:'#7C3AED', bg:'rgba(124,58,237,0.1)'  },
  READY:      { label:'Ready!',     color:'#16A34A', bg:'rgba(34,197,94,0.1)'   },
  COMPLETED:  { label:'Completed',  color:'#6B7280', bg:'rgba(107,114,128,0.08)'},
  CANCELLED:  { label:'Cancelled',  color:'#DC2626', bg:'rgba(220,38,38,0.08)'  },
};

const IcoChevron = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>;
const IcoRefresh = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>;

const FILTERS = ['All','Active','Completed','Cancelled'] as const;
type Filter = typeof FILTERS[number];

export const OrderHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<Filter>('All');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const fetchOrders = async (showLoader = false) => {
    if (showLoader) setRefreshing(true);
    try {
      const res = await orderService.getMyOrders();
      setOrders((res.data || []).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch { toast.error('Failed to load order history'); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchOrders();
    const iv = setInterval(() => fetchOrders(), 15000);
    return () => clearInterval(iv);
  }, [isAuthenticated]);

  const filtered = orders.filter(o => {
    if (filter==='All') return true;
    if (filter==='Active') return !['COMPLETED','CANCELLED'].includes(o.status);
    if (filter==='Completed') return o.status==='COMPLETED';
    if (filter==='Cancelled') return o.status==='CANCELLED';
    return true;
  });
  const activeCount = orders.filter(o => !['COMPLETED','CANCELLED'].includes(o.status)).length;

  return (
    <PageShell activeKey="/history">
      <div className="page-content" style={{ color: 'var(--text-primary)' }}>
        {/* Header */}
        <div style={{ marginBottom:24 }}>
          <p style={{ fontSize:'0.75rem', color:'var(--text-secondary)', marginBottom:2 }}>Your order activity</p>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <h1 style={{ fontFamily:'Poppins', fontWeight:800, fontSize:'1.5rem', color:'var(--text-primary)' }}>Order History</h1>
            <button onClick={() => fetchOrders(true)} style={{ width:38, height:38, borderRadius:12, background: refreshing?'var(--text-primary)':'var(--cream-dark)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color: refreshing?'var(--background)':'var(--text-primary)', transition:'all 0.2s' }}>
              <span style={{ animation: refreshing?'spin 0.8s linear infinite':'none', display:'flex' }}><IcoRefresh /></span>
            </button>
          </div>

          {/* Summary chips */}
          <div style={{ display:'flex', gap:8, marginTop:12 }}>
            {[{ label:`${orders.length} Total`, active:false }, { label:`${activeCount} Active`, active:activeCount>0 }].map(c => (
              <div key={c.label} style={{ padding:'4px 12px', borderRadius:999, background: c.active ? 'rgba(255,107,0,0.1)' : 'var(--cream-dark)', fontSize:'0.75rem', fontWeight:700, color: c.active ? 'var(--red)' : 'var(--text-secondary)' }}>{c.label}</div>
            ))}
          </div>
        </div>

        {/* Filter tabs */}
        <div style={{ display:'flex', gap:0, borderBottom:'1px solid var(--border)', marginBottom:16, overflowX:'auto', scrollbarWidth:'none' }}>
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              flexShrink:0, background:'none', border:'none', cursor:'pointer',
              padding:'8px 16px 10px',
              fontFamily:'Poppins', fontWeight: filter===f ? 700 : 500,
              fontSize:'0.84rem',
              color: filter===f ? 'var(--text-primary)' : 'var(--text-secondary)',
              position:'relative', transition:'color 0.2s',
            }}>
              {f}
              {f==='Active' && activeCount>0 && <span style={{ marginLeft:4, background:'var(--red)', color:'#fff', borderRadius:999, padding:'0 5px', fontSize:'0.6rem', fontWeight:800 }}>{activeCount}</span>}
              {filter===f && <div style={{ position:'absolute', bottom:0, left:16, right:16, height:2, background:'var(--text-primary)', borderRadius:1 }} />}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <OrderHistorySkeleton count={3} />
        ) : filtered.length === 0 ? (
          <div style={{ textAlign:'center', padding:'60px 20px' }}>
            <div style={{ fontSize:'3.5rem', marginBottom:14 }}>🥺</div>
            <p style={{ fontFamily:'Poppins', fontWeight:700, color:'var(--text-primary)', marginBottom:6 }}>{filter==='All'?'No orders yet':`No ${filter.toLowerCase()} orders`}</p>
            <p style={{ fontSize:'0.82rem', color:'var(--text-secondary)', marginBottom:20 }}>{filter==='All'?'Place your first order!':'Try a different filter'}</p>
            {filter==='All' && <button onClick={() => navigate('/menu')} style={{ background:'var(--red)', color:'#fff', border:'none', borderRadius:12, padding:'12px 24px', fontFamily:'Poppins', fontWeight:700, cursor:'pointer', boxShadow:'var(--shadow-red)' }}>Browse Menu</button>}
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {filtered.map(order => {
              const cfg = STATUS_STYLE[order.status] || STATUS_STYLE.PENDING;
              const isExpanded = expandedId === order.id;
              const isActive = !['COMPLETED','CANCELLED'].includes(order.status);
              const date = new Date(order.createdAt);
              const dateStr = date.toLocaleDateString('en-MY',{day:'numeric',month:'short',year:'numeric'});
              const timeStr = date.toLocaleTimeString('en-MY',{hour:'2-digit',minute:'2-digit'});

              return (
                <div key={order.id} style={{ background:'var(--surface)', borderRadius:16, overflow:'hidden', border: isActive ? `1.5px solid ${cfg.color}20` : '1.5px solid var(--border)', boxShadow: isActive ? `0 4px 20px ${cfg.color}10` : 'var(--shadow-sm)', transition:'all 0.2s' }}>
                  <div onClick={() => setExpandedId(isExpanded ? null : order.id)} style={{ padding:'14px 16px', display:'flex', alignItems:'center', gap:12, cursor:'pointer' }}>
                    <div style={{ width:44, height:44, borderRadius:12, background:cfg.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.3rem', flexShrink:0, position:'relative' }}>
                      🍔
                      {isActive && <div style={{ position:'absolute', bottom:2, right:2, width:8, height:8, borderRadius:'50%', background:cfg.color, border:'1.5px solid var(--surface)', animation: order.status==='GRILLING'||order.status==='ASSEMBLING' ? 'pingPulse 1.5s ease-in-out infinite' : 'none' }} />}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:3 }}>
                        <span style={{ fontSize:'0.64rem', fontWeight:800, color:cfg.color, background:cfg.bg, padding:'2px 7px', borderRadius:999 }}>{cfg.label}</span>
                      </div>
                      <div style={{ fontFamily:'Poppins', fontWeight:700, fontSize:'0.88rem', color:'var(--text-primary)' }}>#{order.orderNumber}</div>
                      <div style={{ fontSize:'0.7rem', color:'var(--text-secondary)' }}>{dateStr} · {timeStr} · {order.items.length} item{order.items.length!==1?'s':''}</div>
                    </div>
                    <div style={{ textAlign:'right', flexShrink:0 }}>
                      <div style={{ fontFamily:'Poppins', fontWeight:800, fontSize:'0.9rem', color:'var(--text-primary)' }}>{formatRM(order.total)}</div>
                      <div style={{ marginTop:4, transition:'transform 0.2s', transform: isExpanded?'rotate(90deg)':'rotate(0)', display:'flex', justifyContent:'flex-end', color:'var(--text-secondary)' }}><IcoChevron /></div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div style={{ borderTop:'1px solid var(--border)', padding:'12px 16px 14px', animation:'fadeIn 0.2s ease' }}>
                      {order.items.map(item => (
                        <div key={item.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'6px 0', borderBottom:'1px solid var(--border)', fontSize:'0.82rem' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                            <span>🍔</span>
                            <div>
                              <div style={{ fontWeight:600, color:'var(--text-primary)' }}>{item.quantity}× {item.menuItemName}</div>
                              {item.customisations && <div style={{ fontSize:'0.68rem', color:'var(--text-secondary)' }}>{item.customisations}</div>}
                            </div>
                          </div>
                          <span style={{ fontWeight:700, color:'var(--text-secondary)' }}>{formatRM(item.unitPrice * item.quantity)}</span>
                        </div>
                      ))}

                      <div style={{ marginTop:12, display:'flex', flexDirection:'column', gap:4 }}>
                        <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.8rem', color:'var(--text-secondary)' }}><span>Subtotal</span><span>{formatRM(order.subtotal)}</span></div>
                        <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.8rem', color:'var(--text-secondary)' }}><span>Tax</span><span>{formatRM(order.tax)}</span></div>
                        <div style={{ display:'flex', justifyContent:'space-between', fontFamily:'Poppins', fontWeight:800, fontSize:'0.9rem', color:'var(--text-primary)', marginTop:4 }}>
                          <span>Total</span><span style={{ color:'var(--red)' }}>{formatRM(order.total)}</span>
                        </div>
                      </div>

                      <div style={{ marginTop:12, padding:'8px 12px', background:'var(--cream-dark)', borderRadius:10, display:'flex', justifyContent:'space-between', fontSize:'0.75rem' }}>
                        <span style={{ color:'var(--text-secondary)' }}>Payment</span>
                        <span style={{ fontWeight:700, color: order.paymentStatus==='PAID'?'var(--success)':'var(--warning)' }}>{order.paymentMethod} · {order.paymentStatus}</span>
                      </div>

                      <div style={{ display:'flex', gap:8, marginTop:12 }}>
                        {isActive && (
                          <button onClick={() => navigate(`/order/${order.id}/tracking`)} style={{ flex:1, background:'var(--red)', color:'#fff', border:'none', borderRadius:10, padding:'10px', fontFamily:'Poppins', fontWeight:700, fontSize:'0.82rem', cursor:'pointer', boxShadow:'var(--shadow-red)' }}>
                            Track Order
                          </button>
                        )}
                        {order.status==='COMPLETED' && (
                          <button onClick={() => navigate('/menu')} style={{ flex:1, background:'var(--cream-dark)', color:'var(--text-primary)', border:'none', borderRadius:10, padding:'10px', fontFamily:'Poppins', fontWeight:700, fontSize:'0.82rem', cursor:'pointer' }}>
                            Order Again
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </PageShell>
  );
};

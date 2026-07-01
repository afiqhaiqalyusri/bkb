import React, { useState, useEffect, useCallback } from 'react';
import { ChefHat, Clock, History, Flame, Wrench, Settings, User } from 'lucide-react';
import { Order, MenuItem } from '../../types';
import { orderService } from '../../services/order.service';
import { paymentService } from '../../services/payment.service';
import { menuService } from '../../services/menu.service';
import { ingredientService, IngredientOutage } from '../../services/ingredient.service';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { FullScreenLoader } from '../../components/ui/FullScreenLoader';
import { formatRM } from '../../utils/formatCurrency';
import toast from 'react-hot-toast';
import { useConfirmation } from '../../components/ConfirmationProvider';

import { 
  playNotificationChime, computeGrillCounts, GRILL_CATALOG, getItemEmoji
} from './utils/kitchen.utils';
import { 
  PasswordModal, EditOrderModal, HistoryDrawer, OnHoldDrawer 
} from './components/KitchenDrawers';
import { 
  FrontOrderCard, GrillActiveCard, PrepCard 
} from './components/KitchenCards';
import { SectionHeader } from './components/SectionHeader';

const RESPONSIVE_CSS = `
  .order-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    align-items: start;
  }
  .grill-tile-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 14px;
    margin-bottom: 28px;
  }
  @media (max-width: 1200px) {
    .order-grid { grid-template-columns: repeat(3, 1fr); }
    .grill-tile-grid { grid-template-columns: repeat(4, 1fr); }
  }
  @media (max-width: 860px) {
    .order-grid { grid-template-columns: repeat(2, 1fr); }
    .grill-tile-grid { grid-template-columns: repeat(3, 1fr); }
  }
  @media (max-width: 540px) {
    .order-grid { grid-template-columns: 1fr; }
    .grill-tile-grid { grid-template-columns: repeat(2, 1fr); }
  }
`;

const TABS = [
  { key: 'FRONT', label: 'Front Counter', icon: <User size={18} /> },
  { key: 'GRILL', label: 'Grill Station', icon: <Flame size={18} /> },
  { key: 'PREP', label: 'Prep Line', icon: <Wrench size={18} /> },
  { key: 'SETTINGS', label: 'Settings', icon: <Settings size={18} /> },
];

export const KitchenPage: React.FC = () => {
  const { confirm } = useConfirmation();
  const [activeTab, setActiveTab] = useState('FRONT');
  const [soundEnabled, setSoundEnabled] = useState(() => localStorage.getItem('bkb-kitchen-sound') !== 'false');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showOnHold, setShowOnHold] = useState(false);
  const [cancellingOrderId, setCancellingOrderId] = useState<number | null>(null);

  const [pinModal, setPinModal] = useState<{ action: string; onConfirm: () => void; isManager?: boolean } | null>(null);

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [ingredientOutages, setIngredientOutages] = useState<IngredientOutage[]>([]);
  const [loadingOutages, setLoadingOutages] = useState(false);

  const { clearAuth } = useAuthStore();
  const prevOrderIds = React.useRef<Set<number>>(new Set());

  const fetchOrders = useCallback(async () => {
    try {
      const res = await orderService.getAll();
      const newOrders = [...res.data].sort((a: any, b: any) => a.id - b.id);
      if (prevOrderIds.current.size > 0) {
        const hasNewOrder = newOrders.some((o: any) => !prevOrderIds.current.has(o.id));
        if (hasNewOrder && soundEnabled) {
          playNotificationChime();
        }
      }
      prevOrderIds.current = new Set(newOrders.map((o: any) => o.id));
      setOrders(newOrders);
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchOutages = useCallback(async () => {
    setLoadingOutages(true);
    try {
      const [menuRes, ingRes] = await Promise.all([
        menuService.getAllItems(),
        ingredientService.getAll()
      ]);
      setMenuItems(menuRes.data);
      setIngredientOutages(ingRes.data);
    } catch {
      toast.error('Failed to load outages');
    } finally {
      setLoadingOutages(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  useEffect(() => {
    if (activeTab === 'SETTINGS') {
      fetchOutages();
    }
  }, [activeTab, fetchOutages]);

  useEffect(() => {
    const handler = () => setActiveMenuId(null);
    window.addEventListener('click', handler);
    return () => window.removeEventListener('click', handler);
  }, []);

  useEffect(() => {
    window.history.pushState(null, '', window.location.href);
    const preventBack = () => {
      window.history.pushState(null, '', window.location.href);
      toast('Navigation disabled for security', { icon: '🔒', id: 'nav-lock-kitchen' });
    };
    window.addEventListener('popstate', preventBack);
    return () => window.removeEventListener('popstate', preventBack);
  }, []);

  const updateStatus = async (orderId: number, status: string) => {
    if (status === 'COMPLETED') {
      const order = orders.find(o => o.id === orderId);
      if (order && order.paymentStatus !== 'PAID') {
        toast.error('Cannot complete order: Payment is unpaid');
        return;
      }
    }
    setUpdating(orderId);
    try {
      await orderService.updateStatus(orderId, status);
      await fetchOrders();
      toast.success(`Order ${status.toLowerCase()}`);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Failed to update order status';
      toast.error(msg);
      console.error('Update status error:', err);
    } finally {
      setUpdating(null);
    }
  };

  const confirmCash = async (orderId: number) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    const isPaid = order.paymentStatus === 'PAID';
    const confirmed = await confirm({
      title: isPaid ? 'Mark Payment Unpaid' : 'Confirm Cash Payment',
      message: isPaid 
        ? `Are you sure you want to mark order ${order.orderNumber} as UNPAID?`
        : `Are you sure you want to confirm cash payment of ${formatRM(order.total)} for order ${order.orderNumber}?`,
      confirmLabel: isPaid ? 'Mark Unpaid' : 'Confirm Cash',
      cancelLabel: 'Cancel',
      type: 'warning'
    });
    if (!confirmed) return;
    try {
      if (isPaid) {
        await paymentService.unconfirmCash(orderId);
        toast.success('Cash payment marked as UNPAID');
      } else {
        await paymentService.confirmCash(orderId);
        toast.success('Cash payment confirmed!');
      }
      await fetchOrders();
    } catch {
      toast.error('Failed to update payment status');
    }
  };

  const handleCancelOrderClick = async (order: Order) => {
    const confirmed = await confirm({
      title: 'Cancel Order',
      message: `Are you sure you want to cancel order ${order.orderNumber}?`,
      details: 'This action is irreversible and will cancel the order.',
      confirmLabel: 'Cancel Order',
      cancelLabel: 'Keep Order',
      type: 'danger'
    });
    if (!confirmed) return;
    withPin(`Cancel Order ${order.orderNumber}`, async () => {
      setCancellingOrderId(order.id);
      try {
        await orderService.updateStatus(order.id, 'CANCELLED');
        await fetchOrders();
        toast.success(`Order cancelled`);
      } catch {
        toast.error('Failed to cancel order');
      } finally {
        setCancellingOrderId(null);
      }
    });
  };

  const toggleMenuItem = async (id: number) => {
    try {
      await menuService.toggle(id);
      toast.success('Item availability toggled');
      setMenuItems(prev =>
        prev.map(item => (item.id === id ? { ...item, isAvailable: !item.isAvailable } : item))
      );
    } catch {
      toast.error('Failed to update item availability');
    }
  };

  const toggleIngredientOutage = async (name: string) => {
    try {
      await ingredientService.toggle(name);
      toast.success('Ingredient availability toggled');
      setIngredientOutages(prev =>
        prev.map(ing => (ing.name === name ? { ...ing, outOfStock: !ing.outOfStock } : ing))
      );
    } catch {
      toast.error('Failed to update ingredient availability');
    }
  };

  const handleSaveEdit = async (name: string, phone: string, notes: string, time: string) => {
    if (!editingOrder) return;
    setSavingEdit(true);
    try {
      await orderService.updateDetails(editingOrder.id, {
        guestName: name, guestPhone: phone, notes, pickupTime: time || undefined
      });
      toast.success('Order updated!');
      setEditingOrder(null);
      await fetchOrders();
    } catch {
      toast.error('Failed to update order');
    } finally {
      setSavingEdit(false);
    }
  };

  const withPin = (actionLabel: string, fn: () => void, isManager?: boolean) => {
    setPinModal({ action: actionLabel, onConfirm: fn, isManager });
  };

  const activeOrders = orders.filter(o => !['COMPLETED', 'CANCELLED'].includes(o.status));
  const onHoldOrders = activeOrders.filter(o => o.status === 'ON_HOLD');
  const incomingOrders = activeOrders
    .filter(o => o.status === 'INCOMING_ORDER' || o.status === 'PENDING')
    .sort((a, b) => {
      const timeA = a.queueEnteredAt ? new Date(a.queueEnteredAt).getTime() : new Date(a.createdAt).getTime();
      const timeB = b.queueEnteredAt ? new Date(b.queueEnteredAt).getTime() : new Date(b.createdAt).getTime();
      return timeA - timeB;
    });
  const acceptedOrders = activeOrders.filter(o => ['ACCEPTED', 'GRILLING', 'ASSEMBLING'].includes(o.status));
  const readyOrders = activeOrders.filter(o => o.status === 'READY');

  const grillOrders = orders.filter(o => ['ACCEPTED', 'GRILLING'].includes(o.status));
  const prepOrders = orders.filter(o => ['ACCEPTED', 'GRILLING', 'ASSEMBLING'].includes(o.status));

  const todayOrders = orders.filter(o => {
    const d = new Date(o.createdAt);
    const today = new Date();
    return d.getDate() === today.getDate() &&
           d.getMonth() === today.getMonth() &&
           d.getFullYear() === today.getFullYear() &&
           o.status !== 'CANCELLED';
  });

  const totalSalesToday = todayOrders.reduce((sum, o) => sum + o.total, 0);

  const itemCounts: Record<string, number> = {};
  todayOrders.forEach(o => {
    o.items.forEach(item => {
      itemCounts[item.menuItemName] = (itemCounts[item.menuItemName] || 0) + item.quantity;
    });
  });

  const bestSoldItems = Object.entries(itemCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)', fontFamily: 'Inter, sans-serif', color: 'var(--text-dark)' }}>
      {/* Top Nav */}
      <div style={{ background: 'var(--white)', borderBottom: '1px solid var(--bkb-border)', padding: '0 24px', position: 'sticky', top: 0, zIndex: 400 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 }}>
          <div style={{ display: 'flex', gap: 28, height: '100%' }}>
            {TABS.map(tab => {
              const active = activeTab === tab.key;
              const badge = tab.key === 'FRONT' ? incomingOrders.length : tab.key === 'GRILL' ? grillOrders.length : tab.key === 'PREP' ? prepOrders.length : 0;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none',
                    borderBottom: active ? '3px solid var(--red)' : '3px solid transparent',
                    color: active ? 'var(--red)' : 'var(--text-secondary)', fontFamily: 'Poppins', fontWeight: 700,
                    fontSize: '0.88rem', cursor: 'pointer', padding: '0 4px', height: '100%', transition: 'all 0.2s'
                  }}
                >
                  <span>{tab.icon}</span>
                  {tab.label}
                  {badge > 0 && (
                    <span style={{
                      background: 'var(--red)', color: '#fff', borderRadius: '50%', minWidth: 18, height: 18,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 800
                    }}>{badge}</span>
                  )}
                </button>
              );
            })}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ChefHat size={18} style={{ color: 'var(--red)' }} />
              <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--text-secondary)' }}>
                Kitchen Crew
              </span>
            </div>
            <button
              onClick={() => {
                clearAuth();
                useCartStore.getState().clearCart();
                toast.success('Logged out successfully');
                window.location.replace('/');
              }}
              style={{
                background: 'var(--cream-dark)', color: 'var(--red)', border: '1.5px solid var(--border)',
                borderRadius: 10, padding: '6px 12px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'var(--red)';
                e.currentTarget.style.color = '#fff';
                e.currentTarget.style.borderColor = 'var(--red)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'var(--cream-dark)';
                e.currentTarget.style.color = 'var(--red)';
                e.currentTarget.style.borderColor = 'var(--border)';
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <style>{RESPONSIVE_CSS}</style>

      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '24px 20px' }}>
        {/* Page header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
          <div>
            <h1 style={{ fontFamily: 'Poppins', fontWeight: 800, fontSize: '1.5rem', margin: 0, color: 'var(--text-dark)' }}>
              {activeTab === 'FRONT' ? 'Front Counter' : activeTab === 'GRILL' ? 'Grill Station' : activeTab === 'PREP' ? 'Prep Line' : 'Settings'}
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              {activeTab === 'FRONT'
                ? 'Accept, manage and complete customer orders'
                : activeTab === 'GRILL'
                ? 'Track patty requirements per order'
                : activeTab === 'PREP'
                ? 'Assemble orders and update status'
                : 'Manage outages, themes, and console settings'}
            </p>
          </div>
          {activeTab === 'FRONT' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                onClick={() => setShowOnHold(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7, background: 'var(--surface)',
                  border: '1.5px solid var(--border)', color: 'var(--text-primary)', borderRadius: 10,
                  padding: '9px 14px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
                }}
              >
                <Clock size={15} color="#7C3AED" /> Scheduled Orders
              </button>
              <button
                onClick={() => setShowHistory(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7, background: 'var(--surface)',
                  border: '1.5px solid var(--border)', color: 'var(--text-primary)', borderRadius: 10,
                  padding: '9px 14px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
                }}
              >
                <History size={15} /> Order History
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 80 }}>
            <LoadingSpinner size="lg" />
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: 12 }}>Loading orders...</p>
          </div>
        ) : (
          <>
            {/* FRONT COUNTER */}
            {activeTab === 'FRONT' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Dashboard Stats */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '16px',
                  marginBottom: '8px'
                }}>
                  <div style={{
                    background: 'linear-gradient(135deg, #16A34A 0%, #15803D 100%)',
                    borderRadius: 20, padding: '20px 24px', color: '#fff',
                    boxShadow: '0 10px 25px rgba(22, 163, 74, 0.15)',
                    display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '120px'
                  }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, opacity: 0.9, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Today's Total Sales
                    </div>
                    <div>
                      <div style={{ fontSize: '2.2rem', fontWeight: 900, fontFamily: 'Poppins', lineHeight: '1.2' }}>
                        {formatRM(totalSalesToday)}
                      </div>
                      <div style={{ fontSize: '0.72rem', opacity: 0.8, marginTop: 4 }}>
                        From {todayOrders.length} order{todayOrders.length !== 1 ? 's' : ''} (excluding cancelled)
                      </div>
                    </div>
                  </div>

                  <div style={{
                    background: 'linear-gradient(135deg, #FF9900 0%, #FF5E00 100%)',
                    borderRadius: 20, padding: '20px 24px', color: '#fff',
                    boxShadow: '0 10px 25px rgba(255, 94, 0, 0.15)',
                    display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '120px'
                  }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, opacity: 0.9, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Best Sold Items (Today)
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                      {bestSoldItems.length === 0 ? (
                        <div style={{ fontSize: '0.85rem', opacity: 0.9, fontStyle: 'italic' }}>
                          No items sold yet today
                        </div>
                      ) : (
                        bestSoldItems.map((item, idx) => (
                          <div key={item.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem' }}>
                            <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80%' }}>
                              {idx + 1}. {getItemEmoji(item.name)} {item.name}
                            </span>
                            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: 12, fontWeight: 800, fontSize: '0.75rem' }}>
                              {item.count} sold
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Incoming */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <SectionHeader
                    label="Incoming Orders"
                    count={incomingOrders.length}
                    color="#D97706"
                    bg="rgba(217,119,6,0.04)"
                    subtitle="Awaiting staff acceptance"
                  />
                  <div className="order-grid">
                    {incomingOrders.map(order => (
                      <FrontOrderCard
                        key={order.id}
                        order={order}
                        mode="incoming"
                        onAccept={() => updateStatus(order.id, 'ACCEPTED')}
                        onAdvance={() => {}}
                        onConfirmCash={() => confirmCash(order.id)}
                        onEdit={() => withPin(`Edit Order ${order.orderNumber}`, () => setEditingOrder(order))}
                        onCancel={() => handleCancelOrderClick(order)}
                        updating={updating === order.id}
                        activeMenuId={activeMenuId}
                        setActiveMenuId={setActiveMenuId}
                      />
                    ))}
                    {incomingOrders.length === 0 && (
                      <div style={{ textAlign: 'center', padding: '28px 20px', border: '1.5px dashed var(--border)', borderRadius: 14, color: 'var(--text-secondary)', fontSize: '0.8rem', gridColumn: '1 / -1' }}>
                        No incoming orders right now
                      </div>
                    )}
                  </div>
                </div>

                {/* Accepted */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <SectionHeader
                    label="Accepted Orders"
                    count={acceptedOrders.length}
                    color="var(--red)"
                    bg="rgba(255,107,0,0.04)"
                    subtitle="Orders being prepared"
                  />
                  <div className="order-grid">
                    {acceptedOrders.map(order => (
                      <FrontOrderCard
                        key={order.id}
                        order={order}
                        mode="active"
                        onAccept={() => {}}
                        onAdvance={() => updateStatus(order.id, 'READY')}
                        onConfirmCash={() => confirmCash(order.id)}
                        onEdit={() => withPin(`Edit Order ${order.orderNumber}`, () => setEditingOrder(order))}
                        onCancel={() => handleCancelOrderClick(order)}
                        updating={updating === order.id}
                        activeMenuId={activeMenuId}
                        setActiveMenuId={setActiveMenuId}
                      />
                    ))}
                    {acceptedOrders.length === 0 && (
                      <div style={{ textAlign: 'center', padding: '28px 20px', border: '1.5px dashed var(--border)', borderRadius: 14, color: 'var(--text-secondary)', fontSize: '0.8rem', gridColumn: '1 / -1' }}>
                        No orders currently in progress
                      </div>
                    )}
                  </div>
                </div>

                {/* Ready */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <SectionHeader
                    label="Ready for Pickup"
                    count={readyOrders.length}
                    color="#16A34A"
                    bg="rgba(22,163,74,0.04)"
                    subtitle="Call the customer!"
                  />
                  <div className="order-grid">
                    {readyOrders.map(order => (
                      <FrontOrderCard
                        key={order.id}
                        order={order}
                        mode="ready"
                        onAccept={() => {}}
                        onAdvance={() => updateStatus(order.id, 'COMPLETED')}
                        onConfirmCash={() => confirmCash(order.id)}
                        onEdit={() => withPin(`Edit Order ${order.orderNumber}`, () => setEditingOrder(order))}
                        onCancel={() => handleCancelOrderClick(order)}
                        updating={updating === order.id}
                        activeMenuId={activeMenuId}
                        setActiveMenuId={setActiveMenuId}
                      />
                    ))}
                    {readyOrders.length === 0 && (
                      <div style={{ textAlign: 'center', padding: '28px 20px', border: '1.5px dashed var(--border)', borderRadius: 14, color: 'var(--text-secondary)', fontSize: '0.8rem', gridColumn: '1 / -1' }}>
                        Nothing ready for pickup yet
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* GRILL STATION */}
            {activeTab === 'GRILL' && (() => {
              const grillCounts = computeGrillCounts(grillOrders);
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  <div className="grill-tile-grid">
                    {GRILL_CATALOG.map(item => {
                      const count = grillCounts[item.key] || 0;
                      return (
                        <div
                          key={item.key}
                          style={{
                            background: item.gradient, borderRadius: 18, padding: '18px 16px 32px',
                            display: 'flex', flexDirection: 'column', gap: 4, position: 'relative',
                            minHeight: 110, boxShadow: `0 6px 20px ${item.border}30`
                          }}
                        >
                          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.9)', fontFamily: 'Poppins' }}>{item.label}</div>
                          <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#fff', fontFamily: 'Poppins', lineHeight: 1.1, marginTop: 4 }}>{count}</div>
                          <div style={{
                            position: 'absolute', bottom: 0, left: 0, right: 0,
                            background: 'rgba(0,0,0,0.18)', borderRadius: '0 0 18px 18px',
                            padding: '5px 16px', fontSize: '0.68rem', fontWeight: 600,
                            color: 'rgba(255,255,255,0.85)', textAlign: 'center'
                          }}>
                            {count === 0 ? 'None needed' : `${count} to grill`}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <div style={{ fontFamily: 'Poppins', fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: 12 }}>
                      Active Grill Orders
                    </div>
                    {grillOrders.length === 0 ? (
                      <div style={{
                        textAlign: 'center', padding: '48px 20px', border: '1.5px dashed var(--border)', borderRadius: 18,
                        color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10
                      }}>
                        <Flame size={32} opacity={0.35} />
                        No burgers to cook right now
                      </div>
                    ) : (
                      <div className="order-grid">
                        {grillOrders.map(order => (
                          <GrillActiveCard
                            key={order.id}
                            order={order}
                            onDone={() => updateStatus(order.id, 'GRILLING')}
                            updating={updating === order.id}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* PREP LINE */}
            {activeTab === 'PREP' && (
              <div className="order-grid">
                {prepOrders.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-secondary)', fontSize: '0.85rem', gridColumn: '1 / -1' }}>
                    No items to prep right now
                  </div>
                ) : (
                  prepOrders.map(order => (
                    <PrepCard
                      key={order.id}
                      order={order}
                      onMarkReady={() => updateStatus(order.id, 'READY')}
                      updating={updating === order.id}
                    />
                  ))
                )}
              </div>
            )}

            {/* SETTINGS */}
            {activeTab === 'SETTINGS' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24, marginTop: 10 }}>
                {/* Theme Setting */}
                <div style={{
                  background: 'var(--surface)', borderRadius: 20, padding: 24, border: '1.5px solid var(--border)',
                  boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column', gap: 16
                }}>
                  <div>
                    <h3 style={{ fontFamily: 'Poppins', fontWeight: 800, fontSize: '1.1rem', margin: 0, color: 'var(--text-primary)' }}>General Settings</h3>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '4px 0 0' }}>Manage notification sounds and appearance.</p>
                  </div>
                  
                  {/* Sound Toggle */}
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px',
                    background: 'var(--cream-dark)', borderRadius: 14, border: '1px solid var(--border)'
                  }}>
                    <div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>Order Notifications (Sound)</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: 2 }}>Play a chime when a new order arrives.</div>
                    </div>
                    <div
                      onClick={() => {
                        const next = !soundEnabled;
                        setSoundEnabled(next);
                        localStorage.setItem('bkb-kitchen-sound', String(next));
                        if (next) playNotificationChime(); // test sound
                      }}
                      style={{
                        width: 44, height: 24, borderRadius: 99, background: soundEnabled ? '#16A34A' : 'var(--border)',
                        position: 'relative', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'background 0.2s'
                      }}
                    >
                      <div style={{
                        width: 18, height: 18, borderRadius: '50%', background: '#fff',
                        position: 'absolute', left: soundEnabled ? 23 : 3, boxShadow: '0 1px 3px rgba(0,0,0,0.15)', transition: 'left 0.2s'
                      }} />
                    </div>
                  </div>

                  {/* Theme Toggle */}
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px',
                    background: 'var(--cream-dark)', borderRadius: 14, border: '1px solid var(--border)'
                  }}>
                    <div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>Console Theme</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: 2 }}>Switch between light and Threads-style dark themes.</div>
                    </div>
                    <div style={{ display: 'flex', background: 'var(--background)', borderRadius: 10, padding: 4, border: '1px solid var(--border)' }}>
                      {[ { key: 'light', label: 'Light' }, { key: 'dark', label: 'Dark' } ].map(themeOpt => {
                        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
                        const isSelected = currentTheme === themeOpt.key;
                        return (
                          <button
                            key={themeOpt.key}
                            onClick={() => {
                              document.documentElement.setAttribute('data-theme', themeOpt.key);
                              localStorage.setItem('bkb-theme', themeOpt.key);
                              toast.success(`Switched to ${themeOpt.label}!`);
                              window.dispatchEvent(new Event('theme-change'));
                            }}
                            style={{
                              padding: '8px 16px', background: isSelected ? 'var(--red)' : 'transparent', color: isSelected ? '#fff' : 'var(--text-secondary)',
                              border: 'none', borderRadius: 8, fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer', transition: 'all 0.2s'
                            }}
                          >
                            {themeOpt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
                  {/* Menu Outages */}
                  <div style={{
                    background: 'var(--surface)', borderRadius: 20, padding: 24, border: '1.5px solid var(--border)',
                    boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column', gap: 16
                  }}>
                    <div>
                      <h3 style={{ fontFamily: 'Poppins', fontWeight: 800, fontSize: '1.1rem', margin: 0, color: 'var(--text-primary)' }}>Menu Items Availability</h3>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '4px 0 0' }}>Toggle menu items to make them visible/hidden to customers. (Requires Manager PIN)</p>
                    </div>
                    {loadingOutages ? (
                      <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><LoadingSpinner size="md" /></div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: '600px', overflowY: 'auto', paddingRight: '4px' }}>
                        {menuItems.map(item => (
                          <div key={item.id} style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px',
                            background: 'var(--cream-dark)', borderRadius: 14, border: '1px solid var(--border)'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <span style={{ fontSize: '1.3rem' }}>{getItemEmoji(item.name)}</span>
                              <div>
                                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>{item.name}</div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{item.category} · {formatRM(item.promoPrice ?? item.price)}</div>
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{
                                fontSize: '0.62rem', fontWeight: 800, textTransform: 'uppercase', padding: '3px 8px', borderRadius: 99,
                                background: item.isAvailable ? 'rgba(22,163,74,0.08)' : 'rgba(220,38,38,0.08)', color: item.isAvailable ? '#16A34A' : '#DC2626'
                              }}>
                                {item.isAvailable ? 'Available' : 'Out of Stock'}
                              </span>
                              <div
                                onClick={() => withPin(`Toggle Outage: ${item.name}`, () => toggleMenuItem(item.id), true)}
                                style={{ width: 40, height: 20, borderRadius: 99, background: item.isAvailable ? '#16A34A' : 'var(--border)', position: 'relative', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'background 0.2s' }}
                              >
                                <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#fff', position: 'absolute', left: item.isAvailable ? 23 : 3, boxShadow: '0 1px 3px rgba(0,0,0,0.15)', transition: 'left 0.2s' }} />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Ingredient Outages */}
                  <div style={{
                    background: 'var(--surface)', borderRadius: 20, padding: 24, border: '1.5px solid var(--border)',
                    boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column', gap: 16
                  }}>
                    <div>
                      <h3 style={{ fontFamily: 'Poppins', fontWeight: 800, fontSize: '1.1rem', margin: 0, color: 'var(--text-primary)' }}>Customisation Ingredients Availability</h3>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '4px 0 0' }}>Toggle customisation options. Out-of-stock options will be disabled for customers. (Requires Manager PIN)</p>
                    </div>
                    {loadingOutages ? (
                      <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><LoadingSpinner size="md" /></div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: '600px', overflowY: 'auto', paddingRight: '4px' }}>
                        {ingredientOutages.map(ing => {
                          const isAvailable = !ing.outOfStock;
                          return (
                            <div key={ing.name} style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px',
                              background: 'var(--cream-dark)', borderRadius: 14, border: '1px solid var(--border)'
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div>
                                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>{ing.name}</div>
                                </div>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{
                                  fontSize: '0.62rem', fontWeight: 800, textTransform: 'uppercase', padding: '3px 8px', borderRadius: 99,
                                  background: isAvailable ? 'rgba(22,163,74,0.08)' : 'rgba(220,38,38,0.08)', color: isAvailable ? '#16A34A' : '#DC2626'
                                }}>
                                  {isAvailable ? 'Available' : 'Out of Stock'}
                               </span>
                                <div
                                  onClick={() => withPin(`Toggle Outage: ${ing.name}`, () => toggleIngredientOutage(ing.name), true)}
                                  style={{ width: 40, height: 20, borderRadius: 99, background: isAvailable ? '#16A34A' : 'var(--border)', position: 'relative', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'background 0.2s' }}
                                >
                                  <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#fff', position: 'absolute', left: isAvailable ? 23 : 3, boxShadow: '0 1px 3px rgba(0,0,0,0.15)', transition: 'left 0.2s' }} />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {pinModal && <PasswordModal action={pinModal.action} onConfirm={pinModal.onConfirm} onClose={() => setPinModal(null)} isManager={pinModal.isManager} />}
      {editingOrder && <EditOrderModal order={editingOrder} onClose={() => setEditingOrder(null)} onSave={handleSaveEdit} saving={savingEdit} />}
      {showHistory && <HistoryDrawer orders={orders} onClose={() => setShowHistory(false)} />}
      {showOnHold && <OnHoldDrawer orders={orders} onClose={() => setShowOnHold(false)} />}
      {cancellingOrderId && <FullScreenLoader message="Cancelling order..." subtitle="Updating system records..." />}
    </div>
  );
};

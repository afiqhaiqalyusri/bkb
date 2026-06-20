import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { orderService } from '../services/order.service';
import { formatRM } from '../utils/formatCurrency';
import { PageShell } from '../components/PageShell';
import toast from 'react-hot-toast';
import { CustomiseModal } from '../components/CustomiseModal';
import { CartItem } from '../types';
import { useConfirmation } from '../components/ConfirmationProvider';
import { FullScreenLoader } from '../components/ui/FullScreenLoader';
import { getFoodImage } from '../utils/foodImages';
import api from '../services/api';

const PICKUP_SLOTS = (() => {
  const slots: string[] = ['NOW'];
  const now = new Date();
  now.setMinutes(Math.ceil(now.getMinutes() / 15) * 15, 0, 0);
  for (let i = 0; i < 8; i++) {
    const t = new Date(now.getTime() + i * 15 * 60000);
    slots.push(t.toTimeString().slice(0, 5));
  }
  return slots;
})();

const getItemEmoji = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('milo') || n.includes('air') || n.includes('drink')) return '🥤';
  if (n.includes('oblong')) return '🥖';
  return '🍔';
};

const CHANNELS = [
  {
    id: 'TOYYIBPAY' as const,
    name: 'ToyyibPay',
    desc: 'Pay with Online Banking or E-wallet',
    color: '#005fa9',
    bg: 'rgba(0,95,169,0.06)',
    logo: (
      <div style={{ fontWeight: 800, color: '#005fa9', fontSize: '0.8rem', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#e0f2fe', borderRadius: 8 }}>
        TP
      </div>
    )
  },
  {
    id: 'CASH' as const,
    name: 'Cash at Counter',
    desc: 'Pay cash when collecting order',
    color: 'var(--text-primary)',
    bg: 'var(--cream-dark)',
    logo: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="32" height="32" rx="8" fill="#4b5563" />
        <path d="M8 12H24M8 16H24M8 20H20" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
        <circle cx="23" cy="20" r="2" fill="#22c55e" />
      </svg>
    )
  }
];

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const { items, updateCustomisations } = useCartStore();
  const { user, isAuthenticated } = useAuthStore();
  
  const { confirm } = useConfirmation();

  const [editingItem, setEditingItem] = useState<any | null>(null);

  const getItemKey = (item: any) => {
    const custStr = item.customisations.map((c: any) => `${c.ingredient}:${c.level}`).join(',');
    return `${item.menuItem.id}-${custStr}-${item.isFree ? 'free' : 'paid'}`;
  };

  const [selectedKeys, setSelectedKeys] = useState<string[]>(() => {
    const selItems = location.state?.selectedItems as any[] | undefined;
    if (selItems && selItems.length > 0) {
      return selItems.map(getItemKey);
    }
    return items.map(getItemKey);
  });

  const checkoutItems = React.useMemo(() => {
    return items.filter(item => selectedKeys.includes(getItemKey(item)));
  }, [items, selectedKeys]);
  
  const [orderType, setOrderType] = useState<'NOW' | 'SCHEDULED'>('NOW');
  const [selectedTime, setSelectedTime] = useState<string>(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() + 30);
    return d.toTimeString().slice(0, 5);
  });
  
  const enabledChannels = React.useMemo(() => {
    return CHANNELS.filter(chan => localStorage.getItem(`bkb-pay-enabled-${chan.id}`) !== 'false');
  }, []);

  const [paymentChannel, setPaymentChannel] = useState<'TOYYIBPAY' | 'CASH'>(() => {
    const firstEnabled = CHANNELS.find(chan => localStorage.getItem(`bkb-pay-enabled-${chan.id}`) !== 'false');
    return (firstEnabled?.id || 'TOYYIBPAY') as any;
  });

  const [guestName, setGuestName] = useState(user?.name || '');
  const [guestPhone, setGuestPhone] = useState(user?.phone || '');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [storeClosed, setStoreClosed] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const orderSubmittedRef = useRef(false);

  // Workflow Protection: Redirect to menu if cart is empty (ignore if order was just submitted)
  useEffect(() => {
    if (!orderSubmittedRef.current && items.length === 0) {
      toast.error('Your checkout is empty. Please select items from the cart first.', { id: 'empty-checkout-redirect' });
      navigate('/menu', { replace: true });
    }
  }, [items.length, navigate]);

  useEffect(() => {
    orderService.getStoreStatus()
      .then(res => setStoreClosed(!res.data))
      .catch(() => {});

    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const sub = checkoutItems.reduce((sum: number, item: any) => {
    const price = item.isFree ? 0 : (item.menuItem.promoPrice ?? item.menuItem.price);
    return sum + price * item.quantity;
  }, 0);
  const tax = sub * 0.06;
  const tot = sub + tax;

  const handlePlaceOrder = async () => {
    if (checkoutItems.length === 0) return;
    if ((!isAuthenticated || user?.role === 'GUEST')) {
      if (!guestName.trim()) {
        toast.error('Please enter your name');
        return;
      }
      if (!guestPhone.trim()) {
        toast.error('Please enter your phone number');
        return;
      }
      const malaysianPhoneRegex = /^(?:\+?601|01)[0-46-9]\d{7,8}$/;
      if (!malaysianPhoneRegex.test(guestPhone.trim())) {
        toast.error('Please enter a valid Malaysian phone number (e.g. 0123456789 or +60123456789)');
        return;
      }
    }

    const confirmed = await confirm({
      title: 'Confirm Payment',
      message: 'Are you sure you want to proceed with placing this order?',
      type: 'warning',
      confirmLabel: 'Confirm & Pay',
      cancelLabel: 'Cancel',
      metadata: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Payment Method:</span>
            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
              {paymentChannel === 'CASH' ? 'Cash at Counter' : `Online (${paymentChannel})`}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Items Count:</span>
            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
              {checkoutItems.reduce((acc: number, item: any) => acc + item.quantity, 0)}
            </span>
          </div>
          <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>Total Amount:</span>
            <span style={{ fontWeight: 900, color: 'var(--red)', fontSize: '1.05rem' }}>{formatRM(tot)}</span>
          </div>
        </div>
      )
    });

    if (!confirmed) return;

    setLoading(true);
    try {
      const orderItems = checkoutItems.map((i: any) => ({
        menuItemId: i.menuItem.id,
        quantity: i.quantity,
        customisations: i.customisations,
        isFree: !!i.isFree
      }));

      let pickupTime: string | undefined = undefined;
      if (orderType === 'SCHEDULED') {
        if (!selectedTime) {
          toast.error('Please select a valid pickup time');
          setLoading(false);
          return;
        }
        const date = new Date();
        const [hours, minutes] = selectedTime.split(':').map(Number);
        date.setHours(hours, minutes, 0, 0);
        
        if (date.getTime() < Date.now() + 15 * 60000) {
          toast.error('Pickup time must be at least 15 minutes from now');
          setLoading(false);
          return;
        }
        pickupTime = date.toISOString();
      }

      const res = await orderService.placeOrder({
        items: orderItems,
        paymentMethod: paymentChannel === 'CASH' ? 'CASH' : 'ONLINE',
        paymentChannel: paymentChannel,
        pickupTime,
        notes: notes.trim() || undefined,
        guestName: (!isAuthenticated || user?.role === 'GUEST') ? guestName.trim() : undefined,
        guestPhone: (!isAuthenticated || user?.role === 'GUEST') ? guestPhone.trim() : undefined,
      });

      // Set orderSubmitted to true to prevent empty cart redirect logic
      orderSubmittedRef.current = true;

      // Remove checked out items from cart
      checkoutItems.forEach((item: any) => {
        useCartStore.getState().removeItem(item.menuItem.id, item.customisations, item.isFree);
      });

      if (paymentChannel !== 'CASH') {
        toast.success('Order created. Proceeding to online payment...');
        const payRes = await api.post(`/payments/toyyibpay/${res.data.id}`);
        window.location.href = payRes.data.data.paymentUrl;
      } else {
        toast.success('Order placed successfully! 🍔');
        navigate(`/order/${res.data.id}/tracking`, { replace: true });
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  const renderCustomisationsBrief = (customisations: any[] = []) => {
    const itemsBrief = customisations
      .filter(c => c.level.toUpperCase() !== 'MEDIUM' || c.ingredient.toLowerCase() === 'cheese')
      .map(c => {
        if (c.ingredient.toLowerCase() === 'cheese' && c.level.toUpperCase() === 'EXTRA') return '🧀 Cheese';
        return `${c.ingredient} (${c.level.toLowerCase()})`;
      });
    
    if (itemsBrief.length === 0) return null;
    return (
      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: 2 }}>
        {itemsBrief.join(', ')}
      </div>
    );
  };

  return (
    <PageShell activeKey="/cart">
      {loading && (
        <FullScreenLoader
          message="Creating your order..."
          subtitle="Please do not refresh or close the page."
        />
      )}
      <div className="page-content" style={{ color: 'var(--text-primary)', paddingBottom: 60 }}>
        
        {/* Back Link */}
        <div style={{ marginBottom: 20 }}>
          <button
            onClick={() => navigate('/cart')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', padding: 0 }}
          >
            ← Back to Cart
          </button>
        </div>

        <h1 style={{ fontFamily: 'Poppins', fontWeight: 900, fontSize: '1.5rem', marginBottom: 20 }}>
          Checkout
        </h1>

        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 24, alignItems: 'flex-start' }}>
          
          {/* Left Column: Form details */}
          <div style={{ flex: isMobile ? '1 1 auto' : '1.6 1 450px', width: '100%', display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Customer Details Box (Only for Guest / Not Logged In) */}
            {(!isAuthenticated || user?.role === 'GUEST') && (
              <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', padding: '20px', border: '1.5px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                <h3 style={{ fontFamily: 'Poppins', fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: 14 }}>
                  👤 Customer Details
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 12 : 16 }}>
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>NAME</label>
                    <input
                      className="input-field"
                      placeholder="e.g. John Doe"
                      value={guestName}
                      onChange={e => setGuestName(e.target.value)}
                      style={{ width: '100%', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>PHONE NUMBER</label>
                    <input
                      className="input-field"
                      placeholder="e.g. 0123456789"
                      value={guestPhone}
                      onChange={e => setGuestPhone(e.target.value)}
                      style={{ width: '100%', boxSizing: 'border-box' }}
                    />
                    {guestPhone && (
                      <div style={{ marginTop: 4, fontSize: '0.68rem', fontWeight: 700, color: /^(?:\+?601|01)[0-46-9]\d{7,8}$/.test(guestPhone.trim()) ? 'var(--success)' : 'var(--danger)' }}>
                        {/^(?:\+?601|01)[0-46-9]\d{7,8}$/.test(guestPhone.trim()) ? '✓ Valid Malaysian Phone' : '✕ Please enter a valid Malaysian format (e.g. 0123456789 or +60123456789)'}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Shopee-like: Products Ordered Card */}
            <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1.5px solid var(--border)', padding: 20, boxShadow: 'var(--shadow-sm)' }}>
              <h3 style={{ fontFamily: 'Poppins', fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-primary)', marginBottom: 14 }}>
                📦 Products Ordered
              </h3>
              {!isMobile ? (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 500 }}>
                    <thead>
                      <tr style={{ borderBottom: '1.5px solid var(--border)', color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        <th style={{ padding: '10px 8px' }}>Product</th>
                        <th style={{ padding: '10px 8px', width: 120 }}>Unit Price</th>
                        <th style={{ padding: '10px 8px', width: 80, textAlign: 'center' }}>Quantity</th>
                        <th style={{ padding: '10px 8px', width: 120, textAlign: 'right' }}>Item Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {checkoutItems.map((item: any, idx: number) => {
                        const itemPrice = item.isFree ? 0 : (item.menuItem.promoPrice ?? item.menuItem.price);
                        const itemSubtotal = itemPrice * item.quantity;
                        return (
                          <tr key={`${item.menuItem.id}-${idx}`} style={{ borderBottom: '1px solid var(--border)' }}>
                            <td style={{ padding: '12px 8px', verticalAlign: 'middle' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <img
                                  src={item.menuItem.imageUrl || getFoodImage(item.menuItem.category, item.menuItem.name)}
                                  alt={item.menuItem.name}
                                  style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }}
                                />
                                <div style={{ cursor: 'pointer' }} onClick={() => setEditingItem(item)} title="Click to edit customisation">
                                  <div style={{ fontFamily: 'Poppins', fontWeight: 700, fontSize: '0.84rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                                    {item.menuItem.name}
                                    <span style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--red)', background: 'rgba(255,107,0,0.06)', padding: '2px 6px', borderRadius: 4 }}>✏️ Edit</span>
                                  </div>
                                  {renderCustomisationsBrief(item.customisations)}
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: '12px 8px', verticalAlign: 'middle', fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                              {item.isFree ? <span style={{ color: 'var(--success)' }}>FREE</span> : formatRM(itemPrice)}
                            </td>
                            <td style={{ padding: '12px 8px', verticalAlign: 'middle', textAlign: 'center', fontSize: '0.84rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                              {item.quantity}
                            </td>
                            <td style={{ padding: '12px 8px', verticalAlign: 'middle', textAlign: 'right', fontSize: '0.84rem', fontWeight: 700, color: 'var(--red)' }}>
                              {item.isFree ? <span style={{ color: 'var(--success)' }}>FREE</span> : formatRM(itemSubtotal)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {checkoutItems.map((item: any, idx: number) => {
                    const itemPrice = item.isFree ? 0 : (item.menuItem.promoPrice ?? item.menuItem.price);
                    const itemSubtotal = itemPrice * item.quantity;
                    return (
                      <div key={`${item.menuItem.id}-${idx}`} style={{ display: 'flex', alignItems: 'center', gap: 12, borderBottom: idx !== checkoutItems.length - 1 ? '1px solid var(--border)' : 'none', paddingBottom: idx !== checkoutItems.length - 1 ? 12 : 0 }}>
                        <img
                          src={item.menuItem.imageUrl || getFoodImage(item.menuItem.category, item.menuItem.name)}
                          alt={item.menuItem.name}
                          style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ cursor: 'pointer' }} onClick={() => setEditingItem(item)} title="Click to edit customisation">
                            <div style={{ fontFamily: 'Poppins', fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.menuItem.name}</span>
                              <span style={{ fontSize: '0.6rem', fontWeight: 600, color: 'var(--red)', background: 'rgba(255,107,0,0.06)', padding: '2px 5px', borderRadius: 4, flexShrink: 0 }}>✏️ Edit</span>
                            </div>
                            {renderCustomisationsBrief(item.customisations)}
                          </div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                            {item.quantity} x {item.isFree ? 'FREE' : formatRM(itemPrice)}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', fontWeight: 700, fontSize: '0.84rem', color: 'var(--red)', flexShrink: 0 }}>
                          {item.isFree ? 'FREE' : formatRM(itemSubtotal)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Shopee-like: Notes (Message for Sellers) & Collection Option */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 20,
              background: 'var(--surface)',
              borderRadius: 'var(--radius-lg)',
              border: '1.5px solid var(--border)',
              padding: 20,
              boxShadow: 'var(--shadow-sm)'
            }}>
              {/* Message for Seller */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  💬 Message for Seller (Remarks)
                </label>
                <textarea
                  placeholder="e.g. Please pack sauces separately, no onions, etc."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  style={{
                    width: '100%',
                    height: '80px',
                    padding: '10px 12px',
                    borderRadius: 10,
                    border: '1.5px solid var(--border)',
                    background: 'var(--cream-dark)',
                    color: 'var(--text-dark)',
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '0.82rem',
                    outline: 'none',
                    resize: 'none',
                    transition: 'all 0.2s',
                    boxSizing: 'border-box'
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = 'var(--red)'}
                  onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'}
                />
              </div>

              {/* Pickup Type and Offset Selection */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  ⏰ Collection / Pickup Type
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => setOrderType('NOW')}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: 10,
                      border: '1.5px solid',
                      cursor: 'pointer',
                      borderColor: orderType === 'NOW' ? 'var(--primary)' : 'var(--border)',
                      background: orderType === 'NOW' ? 'rgba(255,107,0,0.06)' : 'transparent',
                      color: orderType === 'NOW' ? 'var(--primary)' : 'var(--text-secondary)',
                      fontFamily: 'Outfit',
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      transition: 'all 0.2s',
                    }}
                  >
                    ⚡ Order Now (ASAP)
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderType('SCHEDULED')}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: 10,
                      border: '1.5px solid',
                      cursor: 'pointer',
                      borderColor: orderType === 'SCHEDULED' ? 'var(--primary)' : 'var(--border)',
                      background: orderType === 'SCHEDULED' ? 'rgba(255,107,0,0.06)' : 'transparent',
                      color: orderType === 'SCHEDULED' ? 'var(--primary)' : 'var(--text-secondary)',
                      fontFamily: 'Outfit',
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      transition: 'all 0.2s',
                    }}
                  >
                    🕐 Schedule Order
                  </button>
                </div>

                {orderType === 'SCHEDULED' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, animation: 'fadeIn 0.2s' }}>
                    <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                      SELECT PICKUP TIME
                    </label>
                    <input
                      type="time"
                      value={selectedTime}
                      onChange={e => setSelectedTime(e.target.value)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: 10,
                        border: '1.5px solid var(--border)',
                        background: 'var(--cream-dark)',
                        color: 'var(--text-dark)',
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '0.9rem',
                        fontWeight: 700,
                        outline: 'none',
                        width: 'fit-content'
                      }}
                    />
                  </div>
                )}

                <div style={{ fontSize: '0.72rem', color: orderType === 'SCHEDULED' ? '#7C3AED' : 'var(--success)', fontWeight: 700, marginTop: 2 }}>
                  {orderType === 'NOW'
                    ? '⚡ ASAP — Your order will immediately enter the kitchen queue'
                    : `🕐 Scheduled — Your order will enter the queue closer to the pickup time`
                  }
                </div>
              </div>
            </div>

            {/* Codashop-like Payment Selection UI */}
            <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1.5px solid var(--border)', padding: 20, boxShadow: 'var(--shadow-sm)' }}>
              <h3 style={{ fontFamily: 'Poppins', fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: 14 }}>
                💳 Payment Method
              </h3>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? 'repeat(auto-fill, minmax(130px, 1fr))' : 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: isMobile ? 10 : 16
              }}>
                {enabledChannels.map(chan => {
                  const active = paymentChannel === chan.id;
                  return (
                    <button
                      key={chan.id}
                      type="button"
                      onClick={() => setPaymentChannel(chan.id)}
                      style={{
                        padding: isMobile ? '10px 12px' : '16px',
                        borderRadius: 12,
                        border: '2px solid',
                        borderColor: active ? chan.color : 'var(--border)',
                        background: active ? chan.bg : 'transparent',
                        boxShadow: active ? `0 4px 16px ${chan.color}18` : 'none',
                        cursor: 'pointer',
                        textAlign: 'left',
                        display: 'flex',
                        alignItems: 'center',
                        gap: isMobile ? 8 : 12,
                        position: 'relative',
                        transition: 'all 0.22s ease',
                        transform: active ? 'scale(1.02)' : 'none',
                        boxSizing: 'border-box',
                        width: '100%',
                      }}
                      onMouseEnter={e => {
                        if (!active) {
                          e.currentTarget.style.borderColor = chan.color;
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                        }
                      }}
                      onMouseLeave={e => {
                        if (!active) {
                          e.currentTarget.style.borderColor = 'var(--border)';
                          e.currentTarget.style.transform = 'none';
                          e.currentTarget.style.boxShadow = 'none';
                        }
                      }}
                    >
                      {/* Selected corner checkmark badge */}
                      {active && (
                        <div style={{
                          position: 'absolute',
                          top: -6,
                          right: -6,
                          background: chan.color,
                          color: 'white',
                          borderRadius: '50%',
                          width: 18,
                          height: 18,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.62rem',
                          fontWeight: 900,
                          boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                          border: '2px solid var(--surface)'
                        }}>
                          ✓
                        </div>
                      )}
                      
                      {/* Logo Container */}
                      <div style={{ flexShrink: 0 }}>
                        {chan.logo}
                      </div>
                      
                      {/* Text details */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontFamily: 'Poppins',
                          fontWeight: 800,
                          fontSize: isMobile ? '0.78rem' : '0.86rem',
                          color: 'var(--text-primary)',
                          marginBottom: 2
                        }}>
                          {chan.name}
                        </div>
                        {!isMobile && (
                          <div style={{
                            fontSize: '0.68rem',
                            color: 'var(--text-secondary)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {chan.desc}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Sticky Summary & Action Area */}
          <div style={{
            flex: isMobile ? '1 1 auto' : '1 1 280px',
            width: isMobile ? '100%' : 'auto',
            minWidth: isMobile ? undefined : 260,
            position: isMobile ? 'static' : 'sticky',
            top: isMobile ? undefined : 24,
            marginBottom: isMobile ? 80 : 0
          }}>
            <div style={{
              background: 'var(--surface)',
              borderRadius: 'var(--radius-lg)',
              border: '1.5px solid var(--border)',
              padding: '24px 20px',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              position: 'relative'
            }}>
              {/* Receipt Header Styling */}
              <div style={{ textAlign: 'center', borderBottom: '2px dashed var(--border)', paddingBottom: 16, marginBottom: 8 }}>
                <span style={{ fontSize: '0.62rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1.5, color: 'var(--text-secondary)' }}>BKB Checkout</span>
                <h3 style={{ fontFamily: 'Outfit', fontWeight: 900, fontSize: '1.15rem', color: 'var(--text-primary)', margin: '4px 0 0 0' }}>
                  RECEIPT PREVIEW
                </h3>
              </div>

              {/* Items List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, borderBottom: '2px dashed var(--border)', paddingBottom: 16 }}>
                {checkoutItems.map((item: any, idx: number) => {
                  const itemPrice = item.isFree ? 0 : (item.menuItem.promoPrice ?? item.menuItem.price);
                  return (
                    <div key={`${item.menuItem.id}-${idx}`} style={{ fontSize: '0.82rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: 'var(--text-primary)' }}>
                        <span>{item.menuItem.name} x {item.quantity}</span>
                        <span>{item.isFree ? 'FREE' : formatRM(itemPrice * item.quantity)}</span>
                      </div>
                      {/* Render customisations for this item */}
                      {item.customisations && item.customisations.length > 0 && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', paddingLeft: 8, marginTop: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                          {item.customisations
                            .filter((c: any) => c.ingredient.toLowerCase() !== 'remarks')
                            .map((c: any) => (
                              <div key={c.ingredient}>
                                • {c.ingredient}: {c.level}
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Bill Details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, borderBottom: '2px dashed var(--border)', paddingBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  <span>Merchandise Subtotal</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{formatRM(sub)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  <span>Tax (6% SST)</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{formatRM(tax)}</span>
                </div>
              </div>

              {/* Total Payment */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.86rem', fontWeight: 800, color: 'var(--text-primary)' }}>Total Payment:</span>
                <span style={{ fontFamily: 'Outfit', fontWeight: 950, color: 'var(--red)', fontSize: '1.25rem' }}>{formatRM(tot)}</span>
              </div>

              {/* Selected Payment Details */}
              <div style={{
                background: 'var(--cream-dark)',
                borderRadius: 8,
                padding: '10px 12px',
                fontSize: '0.74rem',
                color: 'var(--text-secondary)',
                marginTop: 4,
                display: 'flex',
                justifyContent: 'space-between',
                border: '1px solid var(--border)'
              }}>
                <strong>Payment Mode:</strong>
                <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>
                  {paymentChannel === 'CASH' ? 'Cash at Counter' : `${paymentChannel}`}
                </span>
              </div>

              {storeClosed && (
                <div style={{
                  background: 'rgba(220,38,38,0.08)',
                  border: '1.5px solid rgba(220,38,38,0.2)',
                  borderRadius: 12,
                  padding: '10px 12px',
                  color: '#DC2626',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  lineHeight: 1.4
                }}>
                  🚫 Store is currently closed. Order submission is unavailable.
                </div>
              )}

              {!isMobile && (
                <button
                  type="button"
                  onClick={handlePlaceOrder}
                  disabled={loading || storeClosed}
                  style={{
                    background: storeClosed ? 'var(--border)' : 'var(--red)',
                    color: storeClosed ? 'var(--text-muted)' : '#fff',
                    border: 'none',
                    borderRadius: 12,
                    padding: '14px',
                    fontFamily: 'Outfit',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    cursor: (loading || storeClosed) ? 'not-allowed' : 'pointer',
                    opacity: (loading || storeClosed) ? 0.75 : 1,
                    boxShadow: storeClosed ? 'none' : 'var(--shadow-red)',
                    transition: 'all 0.2s',
                    width: '100%',
                    marginTop: 8
                  }}
                >
                  {loading ? (
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2, borderTopColor: '#fff', margin: 0 }} />
                      Creating Order...
                    </span>
                  ) : (
                    'Place Order'
                  )}
                </button>
              )}
            </div>
          </div>

        </div>

        {/* Mobile Sticky bottom action bar */}
        {isMobile && (
          <div style={{
            position: 'fixed',
            bottom: 0,
            left: 76, right: 0,
            background: 'var(--surface)',
            borderTop: '1px solid var(--border)',
            padding: '10px 0',
            zIndex: 99,
            boxShadow: 'var(--shadow-lg)',
          }}>
            <div style={{
              maxWidth: 1200,
              margin: '0 auto',
              padding: '0 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8,
            }}>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  Total Payment
                </div>
                <div style={{ fontFamily: 'Poppins', fontWeight: 950, color: 'var(--red)', fontSize: '1.2rem' }}>
                  {formatRM(tot)}
                </div>
                <div style={{ fontSize: '0.58rem', color: 'var(--text-secondary)' }}>
                  SST incl. ({formatRM(tax)})
                </div>
              </div>

              <button
                type="button"
                onClick={handlePlaceOrder}
                disabled={loading || storeClosed}
                style={{
                  background: storeClosed ? 'var(--border)' : 'var(--red)',
                  color: storeClosed ? 'var(--text-muted)' : '#fff',
                  border: 'none',
                  borderRadius: 10,
                  padding: '10px 20px',
                  fontFamily: 'Poppins',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  cursor: (loading || storeClosed) ? 'not-allowed' : 'pointer',
                  opacity: (loading || storeClosed) ? 0.75 : 1,
                  boxShadow: storeClosed ? 'none' : 'var(--shadow-red)',
                  transition: 'all 0.2s',
                }}
              >
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <span className="spinner" style={{ width: 12, height: 12, borderWidth: 2, borderTopColor: '#fff', margin: 0 }} />
                    Creating Order...
                  </span>
                ) : (
                  'Place Order'
                )}
              </button>
            </div>
          </div>
        )}
      </div>
      {editingItem && (
        <CustomiseModal
          isOpen={!!editingItem}
          menuItem={editingItem.menuItem}
          initialCustomisations={editingItem.customisations}
          onClose={() => setEditingItem(null)}
          onSave={(newCusts) => {
            const oldKey = getItemKey(editingItem);
            const newKey = getItemKey({ menuItem: editingItem.menuItem, customisations: newCusts, isFree: editingItem.isFree });
            updateCustomisations(editingItem.menuItem.id, editingItem.customisations, newCusts, editingItem.isFree);
            setSelectedKeys(prev => {
              const next = prev.filter(k => k !== oldKey);
              if (!next.includes(newKey)) {
                next.push(newKey);
              }
              return next;
            });
            setEditingItem(null);
          }}
        />
      )}
    </PageShell>
  );
};

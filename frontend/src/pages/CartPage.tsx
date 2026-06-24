import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../store/cartStore';
import { formatRM } from '../utils/formatCurrency';
import { PageShell } from '../components/PageShell';
import { CartItem } from '../types';
import toast from 'react-hot-toast';
import { orderService } from '../services/order.service';
import { CustomiseModal } from '../components/CustomiseModal';
import { useConfirmation } from '../components/ConfirmationProvider';
import { getFoodImage } from '../utils/foodImages';
import { CartItemCard } from '../components/feature/cart/CartItemCard';
import { CartSummaryCard } from '../components/feature/cart/CartSummaryCard';

// Premium SVG Icons
const IcoPlus = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <path d="M12 5v14M5 12h14"/>
  </svg>
);

const IcoMinus = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <path d="M5 12h14"/>
  </svg>
);

const IcoTrash = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
    <line x1="10" y1="11" x2="10" y2="17"/>
    <line x1="14" y1="11" x2="14" y2="17"/>
  </svg>
);

const IcoEdit = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

const IcoAlert = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

const IcoArrowRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/>
    <polyline points="12 5 19 12 12 19"/>
  </svg>
);

const CustomCheckbox: React.FC<{ checked: boolean; onChange: () => void }> = ({ checked, onChange }) => (
  <div
    onClick={onChange}
    style={{
      width: 20,
      height: 20,
      borderRadius: 6,
      border: checked ? '2px solid var(--primary)' : '2px solid var(--border)',
      background: checked ? 'var(--primary)' : 'transparent',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      flexShrink: 0,
      boxShadow: checked ? '0 0 0 3px rgba(255,107,0,0.15)' : 'none',
    }}
    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
  >
    {checked && (
      <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
        <path d="M1.5 5L4.5 8L10.5 2" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )}
  </div>
);

export const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const { confirm } = useConfirmation();
  const { items, updateQuantity, removeItem, clearCart, updateCustomisations } = useCartStore();
  const [storeClosed, setStoreClosed] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [editingItem, setEditingItem] = useState<CartItem | null>(null);

  useEffect(() => {
    orderService.getStoreStatus()
      .then(res => setStoreClosed(!res.data))
      .catch(() => {});

    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getItemKey = (item: CartItem) => {
    const custStr = item.customisations.map(c => `${c.ingredient}:${c.level}`).join(',');
    return `${item.menuItem.id}-${custStr}-${item.isFree ? 'free' : 'paid'}`;
  };

  useEffect(() => {
    if (selectedKeys.length === 0 && items.length > 0) {
      setSelectedKeys(items.map(getItemKey));
    } else {
      const currentKeys = items.map(getItemKey);
      setSelectedKeys(prev => prev.filter(k => currentKeys.includes(k)));
    }
  }, [items]);

  const toggleSelectItem = (key: string) => {
    setSelectedKeys(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const toggleSelectAll = () => {
    if (selectedKeys.length === items.length) {
      setSelectedKeys([]);
    } else {
      setSelectedKeys(items.map(getItemKey));
    }
  };

  const handleDeleteSelected = async () => {
    const itemsToDelete = items.filter(item => selectedKeys.includes(getItemKey(item)));
    if (itemsToDelete.length === 0) return;
    const confirmed = await confirm({
      title: 'Remove Items',
      message: `Remove ${itemsToDelete.length} selected item(s) from your cart?`,
      type: 'warning',
      confirmLabel: 'Remove',
      cancelLabel: 'Cancel'
    });
    if (!confirmed) return;
    
    itemsToDelete.forEach(item => {
      removeItem(item.menuItem.id, item.customisations, item.isFree);
    });
    toast.success('Selected items removed');
  };

  const handleProceed = () => {
    const selectedItems = items.filter(item => selectedKeys.includes(getItemKey(item)));
    if (selectedItems.length === 0) {
      toast.error('Please select at least one item to checkout');
      return;
    }
    navigate('/checkout', { state: { selectedItems } });
  };

  const selectedItems = items.filter(item => selectedKeys.includes(getItemKey(item)));
  const subtotal = selectedItems.reduce((sum, item) => {
    const price = item.isFree ? 0 : (item.menuItem.promoPrice ?? item.menuItem.price);
    return sum + price * item.quantity;
  }, 0);
  const tax = subtotal * 0.06;
  const total = subtotal + tax;

  const isAllSelected = items.length > 0 && selectedKeys.length === items.length;

  const renderCustomisations = (customisations: CartItem['customisations']) => {
    if (!customisations || customisations.length === 0) return null;

    const formattedTags: { label: string; value: string; isDanger?: boolean }[] = [];

    customisations.forEach(c => {
      const isNone = c.level.toUpperCase() === 'NONE';
      if (c.ingredient.toLowerCase() === 'remarks') return;
      formattedTags.push({
        label: c.ingredient,
        value: c.level,
        isDanger: isNone
      });
    });

    const remarks = customisations.find(c => c.ingredient.toLowerCase() === 'remarks')?.level;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {formattedTags.map((tag, idx) => (
            <div
              key={idx}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '3px 8px',
                borderRadius: 6,
                background: tag.isDanger ? 'rgba(239, 68, 68, 0.08)' : 'var(--cream-dark)',
                border: `1px solid ${tag.isDanger ? 'rgba(239, 68, 68, 0.15)' : 'var(--border)'}`,
                fontSize: '0.72rem',
                fontWeight: 500,
                color: tag.isDanger ? 'var(--danger)' : 'var(--text-secondary)',
              }}
            >
              <span>{tag.label}: <strong style={{ color: tag.isDanger ? 'var(--danger)' : 'var(--text-primary)' }}>{tag.value}</strong></span>
            </div>
          ))}
        </div>
        {remarks && (
          <div style={{
            fontSize: '0.72rem',
            color: 'var(--primary)',
            background: 'rgba(255, 107, 0, 0.05)',
            borderLeft: '2px solid var(--primary)',
            padding: '4px 8px',
            borderRadius: '0 4px 4px 0',
            fontStyle: 'italic',
            fontWeight: 500,
            width: 'fit-content'
          }}>
            Note: "{remarks}"
          </div>
        )}
      </div>
    );
  };

  if (items.length === 0) return (
    <PageShell activeKey="/cart">
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '75vh',
        padding: 32,
        color: 'var(--text-primary)',
        textAlign: 'center'
      }}>
        <div style={{
          background: 'var(--cream-dark)',
          width: 100,
          height: 100,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 24,
          border: '1.5px solid var(--border)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="21" r="1"/>
            <circle cx="20" cy="21" r="1"/>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
          </svg>
        </div>
        <h2 style={{
          fontFamily: 'Outfit',
          fontWeight: 800,
          fontSize: '1.5rem',
          color: 'var(--text-primary)',
          marginBottom: 8
        }}>Your cart is empty</h2>
        <p style={{
          color: 'var(--text-secondary)',
          fontSize: '0.9rem',
          marginBottom: 32,
          maxWidth: 320,
          lineHeight: 1.5
        }}>
          Add items from our premium menu to begin crafting your perfect order.
        </p>
        <button
          onClick={() => navigate('/menu')}
          style={{
            background: 'var(--primary)',
            color: '#fff',
            border: 'none',
            borderRadius: 'var(--radius-lg)',
            padding: '12px 24px',
            fontFamily: 'Inter',
            fontWeight: 600,
            fontSize: '0.9rem',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            transition: 'transform 0.15s ease'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 8px 25px rgba(255,107,0,0.3)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'var(--shadow-red)';
          }}
        >
          Browse Menu <IcoArrowRight />
        </button>
      </div>
    </PageShell>
  );

  return (
    <PageShell activeKey="/cart">
      <div className="page-content" style={{ color: 'var(--text-primary)', paddingBottom: isMobile ? 120 : 60 }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', letterSpacing: 0.5, textTransform: 'uppercase', fontWeight: 600, marginBottom: 4 }}>Shopping Cart</p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h1 style={{ fontFamily: 'Outfit', fontWeight: 900, fontSize: '1.8rem', color: 'var(--text-primary)' }}>
              My Cart <span style={{ color: 'var(--text-secondary)', fontWeight: 500, fontSize: '1.05rem' }}>({items.length} {items.length === 1 ? 'item' : 'items'})</span>
            </h1>
            <button
              onClick={async () => {
                const confirmed = await confirm({
                  title: 'Clear Cart',
                  message: 'Are you sure you want to clear all items from your cart?',
                  type: 'warning',
                  confirmLabel: 'Clear All',
                  cancelLabel: 'Cancel'
                });
                if (confirmed) {
                  clearCart();
                  toast.success('Cart cleared');
                }
              }}
              style={{
                background: 'transparent',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                padding: '8px 16px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.color = 'var(--danger)';
                e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.2)';
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.05)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = 'var(--text-secondary)';
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.background = 'transparent';
              }}
            >
              Clear All
            </button>
          </div>
        </div>

        {/* Layout Grid */}
        <div style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          gap: 28,
          alignItems: 'flex-start'
        }}>
          {/* Left Side: Items List */}
          <div style={{ flex: 1, width: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Custom Checkbox Bar for Desktop */}
            {!isMobile && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 20px',
                background: 'var(--surface)',
                borderRadius: 12,
                border: '1.5px solid var(--border)',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <CustomCheckbox checked={isAllSelected} onChange={toggleSelectAll} />
                  <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Select All ({items.length} items)
                  </span>
                </div>
                {selectedKeys.length > 0 && (
                  <button
                    onClick={handleDeleteSelected}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--danger)',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6
                    }}
                  >
                    <IcoTrash /> Remove Selected ({selectedKeys.length})
                  </button>
                )}
              </div>
            )}

            {/* List of Cart Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {items.map((item) => {
                const key = getItemKey(item);
                const isSelected = selectedKeys.includes(key);
                return (
                  <CartItemCard
                    key={key}
                    item={item}
                    itemKey={key}
                    isSelected={isSelected}
                    toggleSelectItem={toggleSelectItem}
                    setEditingItem={setEditingItem}
                    isMobile={isMobile}
                  />
                );
              })}
            </div>
          </div>

          {/* Right Side: Sticky Checkout Summary Card & Mobile Bottom Bar */}
          <CartSummaryCard
            isMobile={isMobile}
            subtotal={subtotal}
            tax={tax}
            total={total}
            storeClosed={storeClosed}
            selectedItemsCount={selectedItems.length}
            handleProceed={handleProceed}
            isAllSelected={isAllSelected}
            toggleSelectAll={toggleSelectAll}
            selectedKeysCount={selectedKeys.length}
            handleDeleteSelected={handleDeleteSelected}
          />
      </div>
      </div>

      {editingItem && (
        <CustomiseModal
          isOpen={!!editingItem}
          menuItem={editingItem.menuItem}
          initialCustomisations={editingItem.customisations}
          onClose={() => setEditingItem(null)}
          onSave={(newCusts) => {
            updateCustomisations(editingItem.menuItem.id, editingItem.customisations, newCusts, editingItem.isFree);
            setEditingItem(null);
          }}
        />
      )}
    </PageShell>
  );
};

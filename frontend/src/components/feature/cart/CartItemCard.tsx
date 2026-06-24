import React from 'react';
import { CartItem } from '../../../types';
import { formatRM } from '../../../utils/formatCurrency';
import { getFoodImage } from '../../../utils/foodImages';
import { useCartStore } from '../../../store/cartStore';
import { useConfirmation } from '../../ConfirmationProvider';

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

interface CartItemCardProps {
  item: CartItem;
  itemKey: string;
  isSelected: boolean;
  toggleSelectItem: (key: string) => void;
  setEditingItem: (item: CartItem) => void;
  isMobile: boolean;
}

export const CartItemCard: React.FC<CartItemCardProps> = ({
  item,
  itemKey,
  isSelected,
  toggleSelectItem,
  setEditingItem,
  isMobile
}) => {
  const { updateQuantity, removeItem } = useCartStore();
  const { confirm } = useConfirmation();
  
  const itemPrice = item.isFree ? 0 : (item.menuItem.promoPrice ?? item.menuItem.price);
  const itemTotal = itemPrice * item.quantity;

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

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--surface)',
        borderRadius: 16,
        border: isSelected ? '1.5px solid var(--primary)' : '1.5px solid var(--border)',
        padding: 20,
        boxShadow: isSelected ? '0 4px 20px rgba(255,107,0,0.05)' : 'var(--shadow-sm)',
        transition: 'all 0.2s ease',
        boxSizing: 'border-box'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
        {/* Checkbox */}
        <div style={{ alignSelf: 'center' }}>
          <CustomCheckbox checked={isSelected} onChange={() => toggleSelectItem(itemKey)} />
        </div>

        {/* Image Block */}
        <div style={{
          width: 80,
          height: 80,
          borderRadius: 12,
          overflow: 'hidden',
          flexShrink: 0,
          border: '1px solid var(--border)'
        }}>
          <img
            src={item.menuItem.imageUrl || getFoodImage(item.menuItem.category, item.menuItem.name)}
            alt={item.menuItem.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>

        {/* Details & Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
            <div>
              <h3 style={{
                fontFamily: 'Outfit',
                fontWeight: 700,
                fontSize: '1rem',
                color: 'var(--text-primary)',
                lineHeight: 1.3
              }}>
                {item.menuItem.name}
              </h3>
              {item.isFree && (
                <span style={{
                  display: 'inline-block',
                  color: 'var(--success)',
                  background: 'rgba(34, 197, 94, 0.08)',
                  border: '1px solid rgba(34, 197, 94, 0.15)',
                  padding: '2px 8px',
                  borderRadius: 6,
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  marginTop: 4
                }}>
                  Reward Item (FREE)
                </span>
              )}
            </div>
            
            {/* Unit price for desktop */}
            {!isMobile && (
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <span style={{
                  fontSize: '0.85rem',
                  color: 'var(--text-secondary)',
                  display: 'block'
                }}>
                  Unit Price
                </span>
                <span style={{
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  color: 'var(--text-primary)'
                }}>
                  {item.isFree ? 'FREE' : formatRM(itemPrice)}
                </span>
              </div>
            )}
          </div>

          {/* Customisations Display & Edit CTA */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginTop: 4 }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              {renderCustomisations(item.customisations)}
            </div>
            <button
              onClick={() => setEditingItem(item)}
              style={{
                background: 'var(--cream-dark)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                padding: '5px 10px',
                fontSize: '0.72rem',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all 0.2s',
                alignSelf: 'flex-end'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.color = 'var(--primary)';
                e.currentTarget.style.borderColor = 'var(--primary)';
                e.currentTarget.style.background = 'rgba(255, 107, 0, 0.05)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = 'var(--text-secondary)';
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.background = 'var(--cream-dark)';
              }}
            >
              <IcoEdit /> Modify
            </button>
          </div>
        </div>
      </div>

      {/* Divider for Card footer containing actions & stepper */}
      <div style={{
        marginTop: 16,
        paddingTop: 16,
        borderTop: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* Delete item button */}
        <button
          onClick={async () => {
            const confirmed = await confirm({
              title: 'Remove Item',
              message: `Are you sure you want to remove ${item.menuItem.name} from your cart?`,
              type: 'warning',
              confirmLabel: 'Remove',
              cancelLabel: 'Cancel'
            });
            if (confirmed) {
              removeItem(item.menuItem.id, item.customisations, item.isFree);
            }
          }}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: '0.78rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 8px',
            borderRadius: 6,
            transition: 'all 0.2s'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.color = 'var(--danger)';
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.05)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.color = 'var(--text-secondary)';
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <IcoTrash /> Remove
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* Stepper pill */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 12,
            background: 'var(--cream-dark)',
            padding: '4px 10px',
            borderRadius: 'var(--radius-pill)',
            border: '1px solid var(--border)'
          }}>
            <button
              onClick={() => updateQuantity(item.menuItem.id, item.quantity - 1, item.customisations, item.isFree)}
              style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-primary)',
                padding: 0,
                transition: 'transform 0.1s'
              }}
              onMouseDown={e => e.currentTarget.style.transform = 'scale(0.9)'}
              onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              {item.quantity === 1 ? <IcoTrash /> : <IcoMinus />}
            </button>
            <span style={{
              fontFamily: 'Outfit',
              fontWeight: 800,
              fontSize: '0.88rem',
              minWidth: 16,
              textAlign: 'center',
              color: 'var(--text-primary)'
            }}>
              {item.quantity}
            </span>
            <button
              onClick={() => updateQuantity(item.menuItem.id, item.quantity + 1, item.customisations, item.isFree)}
              style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                background: 'var(--text-primary)',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--background)',
                padding: 0,
                transition: 'transform 0.1s'
              }}
              onMouseDown={e => e.currentTarget.style.transform = 'scale(0.9)'}
              onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              <IcoPlus />
            </button>
          </div>

          {/* Total Price */}
          <div style={{ textAlign: 'right', minWidth: 80 }}>
            <span style={{
              fontFamily: 'Outfit',
              fontWeight: 800,
              fontSize: '1.05rem',
              color: 'var(--red)'
            }}>
              {item.isFree ? 'FREE' : formatRM(itemTotal)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

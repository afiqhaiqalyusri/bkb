import React from 'react';
import { Plus } from 'lucide-react';
import { MenuItem } from '../../types';
import { formatRM } from '../../utils/formatCurrency';
import { useCartStore } from '../../store/cartStore';

interface Props {
  item: MenuItem;
  onClick: () => void;
}

export const MenuCard: React.FC<Props> = ({ item, onClick }) => {
  const addItem = useCartStore(s => s.addItem);

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    addItem(item);
  };

  return (
    <div
      className="bkb-card"
      onClick={onClick}
      style={{ cursor: 'pointer', position: 'relative', overflow: 'hidden' }}
    >
      {/* Image */}
      <div style={{
        height: 160,
        background: item.imageUrl
          ? `url(${item.imageUrl}) center/cover`
          : 'linear-gradient(135deg, rgba(232,69,10,0.2), rgba(26,26,26,0.8))',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '2.5rem',
        borderRadius: '11px 11px 0 0',
      }}>
        {!item.imageUrl && '🍔'}
      </div>

      {/* Promo badge */}
      {item.promoPrice && (
        <div style={{
          position: 'absolute', top: 8, left: 8,
          background: 'var(--bkb-orange)', color: 'white',
          borderRadius: '999px', padding: '2px 10px',
          fontSize: '0.7rem', fontWeight: 700,
        }}>PROMO</div>
      )}

      {/* Content */}
      <div style={{ padding: '12px 14px 14px' }}>
        <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 4, lineHeight: 1.3 }}>
          {item.name}
        </h3>
        {item.description && (
          <p style={{ fontSize: '0.75rem', color: 'var(--bkb-gray-400)', marginBottom: 10,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {item.description}
          </p>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            {item.promoPrice ? (
              <>
                <span style={{ color: 'var(--bkb-orange)', fontWeight: 700, fontSize: '1rem' }}>
                  {formatRM(item.promoPrice)}
                </span>
                <span style={{ color: 'var(--bkb-gray-400)', fontSize: '0.75rem',
                  textDecoration: 'line-through', marginLeft: 6 }}>
                  {formatRM(item.price)}
                </span>
              </>
            ) : (
              <span style={{ color: 'var(--bkb-orange)', fontWeight: 700, fontSize: '1rem' }}>
                {formatRM(item.price)}
              </span>
            )}
          </div>
          <button
            onClick={handleAdd}
            style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--bkb-orange), var(--bkb-orange-dark))',
              border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', transition: 'transform 0.15s',
            }}
            onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.9)')}
            onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
          >
            <Plus size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

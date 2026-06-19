import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFavouriteStore } from '../store/favouriteStore';
import { useCartStore } from '../store/cartStore';
import { PageShell } from '../components/PageShell';
import { formatRM } from '../utils/formatCurrency';
import { getFoodImage } from '../utils/foodImages';
import toast from 'react-hot-toast';

const IcoHeart = ({ filled }: { filled?: boolean }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? 'var(--red)' : 'none'} stroke="var(--red)" strokeWidth="2" strokeLinecap="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

const IcoPlus = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

const IcoCart = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
  </svg>
);

const IcoEmpty = () => (
  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.2" strokeLinecap="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

export const FavouritesPage: React.FC = () => {
  const navigate = useNavigate();
  const { items, toggle } = useFavouriteStore();
  const { addItem } = useCartStore();
  const [removing, setRemoving] = useState<number | null>(null);

  const handleRemove = (item: typeof items[0]) => {
    setRemoving(item.id);
    setTimeout(() => {
      toggle(item);
      setRemoving(null);
    }, 300);
  };

  const handleAddToCart = (item: typeof items[0]) => {
    if (!item.isAvailable) {
      toast.error('This item is currently unavailable.');
      return;
    }
    addItem(item, 1);
    toast.success(`${item.name} added to cart!`, { icon: '🍔', duration: 1400 });
  };

  return (
    <PageShell activeKey="/favourites">
      <div style={{ padding: '28px 24px', maxWidth: 720, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 6 }}>
            My Collection
          </div>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: '1.8rem', color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ color: 'var(--red)' }}>♥</span> Favourites
          </h1>
          {items.length > 0 && (
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 6 }}>
              {items.length} saved item{items.length !== 1 ? 's' : ''} · Tap the heart to remove
            </p>
          )}
        </div>

        {/* Empty State */}
        {items.length === 0 && (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '80px 20px', textAlign: 'center',
            background: 'var(--surface)', borderRadius: 20, border: '1px solid var(--border)'
          }}>
            <IcoEmpty />
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: 20, marginBottom: 8 }}>
              No favourites yet
            </div>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: 24, maxWidth: 280, lineHeight: 1.5 }}>
              Tap the ♥ on any menu item to save it here for quick access.
            </p>
            <button
              onClick={() => navigate('/menu')}
              style={{
                background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 12,
                padding: '12px 28px', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 8,
                boxShadow: '0 4px 16px rgba(255,107,0,0.35)',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.04)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              Browse Menu
            </button>
          </div>
        )}

        {/* Favourite Items Grid */}
        {items.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {items.map(item => {
              const price = item.promoPrice ?? item.price;
              const isRemoving = removing === item.id;
              const soldOut = !item.isAvailable;
              return (
                <div
                  key={item.id}
                  style={{
                    background: 'var(--surface)',
                    borderRadius: 18,
                    border: '1px solid var(--border)',
                    overflow: 'hidden',
                    boxShadow: 'var(--shadow-sm)',
                    transition: 'all 0.3s ease',
                    opacity: isRemoving ? 0 : 1,
                    transform: isRemoving ? 'scale(0.92)' : 'scale(1)',
                  }}
                >
                  {/* Image */}
                  <div style={{ position: 'relative', height: 140, overflow: 'hidden' }}>
                    <img
                      src={item.imageUrl || getFoodImage(item.category, item.name)}
                      alt={item.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' }}
                      onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.06)')}
                      onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                    />
                    {/* Overlays */}
                    {soldOut && (
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: '0.68rem', fontWeight: 900, color: '#fff', background: '#EF4444', padding: '4px 12px', borderRadius: 999, textTransform: 'uppercase' }}>Sold Out</span>
                      </div>
                    )}
                    {item.promoPrice && !soldOut && (
                      <div style={{ position: 'absolute', top: 8, left: 8, background: 'var(--primary)', color: '#fff', borderRadius: 999, padding: '3px 10px', fontSize: '0.6rem', fontWeight: 800 }}>PROMO</div>
                    )}
                    {/* Remove heart button */}
                    <button
                      onClick={() => handleRemove(item)}
                      title="Remove from favourites"
                      style={{
                        position: 'absolute', top: 8, right: 8,
                        width: 34, height: 34, borderRadius: '50%',
                        background: 'rgba(255,255,255,0.95)',
                        border: 'none', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                        transition: 'transform 0.2s ease',
                      }}
                      onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.15)'}
                      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      <IcoHeart filled />
                    </button>
                  </div>

                  {/* Info */}
                  <div style={{ padding: '14px 16px' }}>
                    <div style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 }}>{item.category}</div>
                    <div style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', lineHeight: 1.3, marginBottom: 10 }}>{item.name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '1rem', color: 'var(--red)' }}>{formatRM(price)}</div>
                        {item.promoPrice && (
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', textDecoration: 'line-through' }}>{formatRM(item.price)}</div>
                        )}
                      </div>
                      {!soldOut && (
                        <button
                          onClick={() => handleAddToCart(item)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            background: 'var(--text-primary)', color: 'var(--background)',
                            border: 'none', borderRadius: 10, padding: '9px 14px',
                            fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer',
                            transition: 'all 0.2s ease',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.background = 'var(--primary)'; }}
                          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = 'var(--text-primary)'; }}
                        >
                          <IcoCart /> Add
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Browse more CTA */}
        {items.length > 0 && (
          <div style={{ marginTop: 32, textAlign: 'center' }}>
            <button
              onClick={() => navigate('/menu')}
              style={{
                background: 'transparent', border: '1.5px solid var(--border)',
                borderRadius: 12, padding: '10px 24px',
                fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-secondary)',
                cursor: 'pointer', transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.color = 'var(--primary)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
            >
              + Browse More Items
            </button>
          </div>
        )}
      </div>
    </PageShell>
  );
};

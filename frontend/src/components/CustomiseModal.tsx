import React, { useState, useEffect } from 'react';
import { MenuItem, Customisation } from '../types';
import { ingredientService } from '../services/ingredient.service';
import { getFoodImage } from '../utils/foodImages';
import { formatRM } from '../utils/formatCurrency';
import toast from 'react-hot-toast';

const LEVELS = ['None', 'Less', 'Medium', 'Extra'] as const;
type Level = typeof LEVELS[number];
const LEVEL_COLORS: Record<Level, string> = { None: '#E5E7EB', Less: '#FFBC8B', Medium: '#FF8C42', Extra: 'var(--primary)' };

const getIngredientEmoji = (name: string): string => {
  const n = (name || '').toLowerCase().trim();
  if (n.includes('cheese')) return '🧀';
  if (n.includes('onion')) return '🧅';
  if (n.includes('tomato')) return '🍅';
  if (n.includes('salad') || n.includes('lettuce') || n.includes('cabbage')) return '🥗';
  if (n.includes('cucumber')) return '🥒';
  if (n.includes('chilli') || n.includes('chili') || n.includes('spicy')) return '🌶️';
  if (n.includes('pepper')) return '🫙';
  if (n.includes('mayo')) return '🫧';
  if (n.includes('egg')) return '🍳';
  if (n.includes('patty') || n.includes('meat') || n.includes('beef') || n.includes('chicken') || n.includes('lamb')) return '🥩';
  return '🍳';
};

const IcoPlus = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>;
const IcoMinus = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14"/></svg>;
const IcoClose = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>;
const IcoCart  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>;
const IcoBack  = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>;

interface CustomiseModalProps {
  isOpen: boolean;
  menuItem: MenuItem;
  initialCustomisations: Customisation[];
  onClose: () => void;
  onSave?: (customisations: Customisation[]) => void;
  showQty?: boolean;
  initialQuantity?: number;
  onSaveWithQty?: (customisations: Customisation[], quantity: number) => void;
}

export const CustomiseModal: React.FC<CustomiseModalProps> = ({
  isOpen,
  menuItem,
  initialCustomisations,
  onClose,
  onSave,
  showQty = false,
  initialQuantity = 1,
  onSaveWithQty,
}) => {
  const [outages, setOutages] = useState<Record<string, boolean>>({});
  const [customisationLevels, setCustomisationLevels] = useState<Record<string, Level>>({});
  const [remarks, setRemarks] = useState('');
  const [qty, setQty] = useState(initialQuantity);

  const price = menuItem.promoPrice ?? menuItem.price;

  const [addons, setAddons] = useState<Record<string, number>>({
    'Cheese': 0,
    'Egg': 0,
    'Patty': 0
  });

  const addonPrices: Record<string, number> = {
    'Cheese': 1.00,
    'Egg': 1.00,
    'Patty': 2.00,
  };

  const addonsTotal = Object.entries(addons).reduce((sum, [name, count]) => sum + (addonPrices[name] * count), 0);
  const totalPrice = price + addonsTotal;

  const validIngredients = (menuItem.ingredients || []).filter(ing => {
    const name = ing.ingredientName.toLowerCase();
    // Exclude buns entirely
    if (name.includes('bun')) return false;
    // Exclude paid add-ons from standard toppings
    if (name.includes('cheese') || name.includes('egg') || name.includes('patty') || name.includes('meat')) return false;
    return true;
  });

  const saucesList = validIngredients.filter(ing => {
    const name = ing.ingredientName.toLowerCase();
    return name.includes('sauce') || name.includes('chilli') || name.includes('pepper') || name.includes('mayo') || name.includes('ketchup') || name.includes('mustard');
  });

  const toppingsList = validIngredients.filter(ing => {
    const name = ing.ingredientName.toLowerCase();
    return !(name.includes('sauce') || name.includes('chilli') || name.includes('pepper') || name.includes('mayo') || name.includes('ketchup') || name.includes('mustard'));
  });

  // Load outages
  useEffect(() => {
    if (!isOpen) return;
    ingredientService.getAll()
      .then(res => {
        if (res.data) {
          const map: Record<string, boolean> = {};
          res.data.forEach(item => {
            if (item.outOfStock) {
              map[item.name.toLowerCase()] = true;
            }
          });
          setOutages(map);
        }
      })
      .catch(console.error);
  }, [isOpen]);

  // Load initial customisation states
  useEffect(() => {
    if (!isOpen) return;

    const initialLevels: Record<string, Level> = {};
    (menuItem.ingredients || []).forEach(ing => {
      const defaultLvl = ing.defaultLevel || 'MEDIUM';
      const mapped = (defaultLvl.charAt(0).toUpperCase() + defaultLvl.slice(1).toLowerCase()) as Level;
      initialLevels[ing.ingredientName] = mapped;
    });

    let initialRemarks = '';
    const addonsState: Record<string, number> = { 'Cheese': 0, 'Egg': 0, 'Patty': 0 };

    // Override with existing selection
    initialCustomisations.forEach(c => {
      const name = c.ingredient.toLowerCase().trim();
      
      if (name === 'remarks') {
        initialRemarks = c.level;
      } else if (name.startsWith('add ')) {
        // Find the actual key we use (Cheese, Egg, Patty)
        const possibleKeys = ['Cheese', 'Egg', 'Patty'];
        for (const key of possibleKeys) {
          if (name.includes(key.toLowerCase())) {
            addonsState[key] = parseInt(c.level) || 0;
          }
        }
      } else {
        const level = (c.level.charAt(0).toUpperCase() + c.level.slice(1).toLowerCase()) as Level;
        const match = validIngredients.find(ing => ing.ingredientName.toLowerCase().trim() === name);
        if (match) {
          initialLevels[match.ingredientName] = level;
        }
      }
    });

    setCustomisationLevels(initialLevels);
    setAddons(addonsState);
    setRemarks(initialRemarks);
    setQty(initialQuantity);
  }, [isOpen, menuItem, initialCustomisations, initialQuantity]);

  if (!isOpen) return null;

  const handleSave = () => {
    const custom = [
      ...validIngredients
        .map(ing => ({
          ingredient: ing.ingredientName,
          level: outages[ing.ingredientName.toLowerCase()] ? 'NONE' : (customisationLevels[ing.ingredientName] || 'Medium').toUpperCase()
        })),
      ...Object.entries(addons)
        .filter(([_, count]) => count > 0)
        .map(([name, count]) => ({
          ingredient: `Add ${name}`,
          level: count.toString()
        })),
      ...(remarks.trim() ? [{ ingredient: 'Remarks', level: remarks.trim() }] : []),
    ];

    if (showQty && onSaveWithQty) {
      onSaveWithQty(custom as any, qty);
    } else if (onSave) {
      onSave(custom as any);
      toast.success('Customisation updated');
    }
  };

  const LevelStepper: React.FC<{
    value: Level;
    onChange: (v: Level) => void;
    label: string;
    emoji: string;
    disabled?: boolean;
  }> = ({ value, onChange, label, emoji, disabled }) => {
    const displayValue = disabled ? 'None' : value;
    const idx = LEVELS.indexOf(displayValue);
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
        background: 'var(--cream-dark)',
        borderRadius: 14, border: '1.5px solid var(--border)',
        opacity: disabled ? 0.6 : 1
      }}>
        <span style={{ fontSize: '1.2rem', width: 28, textAlign: 'center', flexShrink: 0 }}>{emoji}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 5, display: 'flex', alignItems: 'center', gap: 6 }}>
            {label}
            {disabled && (
              <span style={{ fontSize: '0.58rem', fontWeight: 800, background: '#EF4444', color: '#fff', padding: '1px 5px', borderRadius: 99, textTransform: 'uppercase' }}>
                Out of stock
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 3 }}>
            {LEVELS.map((l, i) => (
              <div key={l} onClick={() => !disabled && onChange(l)} style={{
                flex: 1, height: 4, borderRadius: 2, cursor: disabled ? 'not-allowed' : 'pointer',
                background: i <= idx ? (disabled ? 'var(--text-secondary)' : LEVEL_COLORS[displayValue]) : 'var(--border)',
                transition: 'background 0.2s',
              }} />
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
          <button type="button" onClick={() => !disabled && idx > 0 && onChange(LEVELS[idx - 1])} disabled={disabled || idx === 0} style={{
            width: 26, height: 26, borderRadius: '50%', border: '1px solid var(--border)',
            background: (disabled || idx === 0) ? 'var(--cream-dark)' : 'var(--surface)',
            color: (disabled || idx === 0) ? 'var(--text-secondary)' : 'var(--text-primary)',
            cursor: (disabled || idx === 0) ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0
          }}><IcoMinus /></button>
          <span style={{ fontSize: '0.7rem', fontWeight: 800, color: disabled ? 'var(--text-secondary)' : (displayValue === 'None' ? 'var(--text-secondary)' : LEVEL_COLORS[displayValue]), minWidth: 42, textAlign: 'center' }}>{displayValue}</span>
          <button type="button" onClick={() => !disabled && idx < LEVELS.length - 1 && onChange(LEVELS[idx + 1])} disabled={disabled || idx === LEVELS.length - 1} style={{
            width: 26, height: 26, borderRadius: '50%', border: 'none',
            background: (disabled || idx === LEVELS.length - 1) ? 'var(--cream-dark)' : 'var(--text-primary)',
            color: (disabled || idx === LEVELS.length - 1) ? 'var(--text-secondary)' : 'var(--surface)',
            cursor: (disabled || idx === LEVELS.length - 1) ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0
          }}><IcoPlus /></button>
        </div>
      </div>
    );
  };

  const isBeverage = menuItem.category?.toLowerCase() === 'drinks' || menuItem.category?.toLowerCase() === 'beverage';

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, backdropFilter: 'blur(4px)'
    }} onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 480,
          background: 'var(--surface)', border: '1.5px solid var(--border)',
          borderRadius: 24, display: 'flex', flexDirection: 'column',
          maxHeight: '92vh', overflow: 'hidden', boxShadow: 'var(--shadow-lg)'
        }}
      >
        {/* Hero Image */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200, flexShrink: 0, overflow: 'hidden' }}>
          <img
            src={menuItem.imageUrl || getFoodImage(menuItem.category, menuItem.name)}
            alt={menuItem.name}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.6))' }} />
          {menuItem.promoPrice && (
            <div style={{ position: 'absolute', top: 16, right: 16, background: 'var(--primary)', color: '#fff', borderRadius: 999, padding: '4px 12px', fontSize: '0.68rem', fontWeight: 800, zIndex: 3 }}>🔥 PROMO</div>
          )}
        </div>

        {/* Header Back Link */}
        <div style={{ padding: '16px 20px 0', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <button
            onClick={onClose}
            style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--cream-dark)', border: 'none', borderRadius: 12, padding: '9px 14px', cursor: 'pointer', color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.84rem' }}
          >
            <IcoBack /> Back
          </button>
          {menuItem.promoPrice && (
            <span style={{ marginLeft: 'auto', fontSize: '0.68rem', fontWeight: 700, color: 'var(--red)', background: 'rgba(255,107,0,0.08)', padding: '4px 10px', borderRadius: 999 }}>
              Save {formatRM(menuItem.price - menuItem.promoPrice)}
            </span>
          )}
        </div>

        {/* Scrollable Customisation Fields */}
        <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 20 }}>
          <div style={{ padding: '16px 20px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 3 }}>{menuItem.category}</div>
                <h2 style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '1.25rem', color: 'var(--text-primary)', lineHeight: 1.2, margin: 0 }}>{menuItem.name}</h2>
                {menuItem.description && <p style={{ fontSize: '0.79rem', color: 'var(--text-secondary)', marginTop: 6, lineHeight: 1.5 }}>{menuItem.description}</p>}
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '1.35rem', color: 'var(--red)' }}>{formatRM(totalPrice)}</div>
                {menuItem.promoPrice && <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', textDecoration: 'line-through' }}>{formatRM(menuItem.price)}</div>}
              </div>
            </div>
          </div>

          <div style={{ height: 1, background: 'var(--border)', margin: '16px 20px' }} />

          <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>
            {isBeverage ? (
              <div style={{ textAlign: 'center', padding: '20px 10px', background: 'var(--cream-dark)', borderRadius: 14, border: '1px solid var(--border)' }}>
                <span style={{ fontSize: '1.5rem', display: 'block', marginBottom: 6 }}>🥤</span>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>Standard Configuration</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: 2 }}>Beverages do not require toppings or sauces modifications.</div>
              </div>
            ) : (
              <>
                {/* Toppings list */}
                {toppingsList.length > 0 && (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                      <div style={{ width: 3, height: 14, background: 'var(--red)', borderRadius: 2 }} />
                      <span style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Toppings</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {toppingsList.map(t => (
                        <LevelStepper
                          key={t.id}
                          label={t.ingredientName}
                          emoji={getIngredientEmoji(t.ingredientName)}
                          value={customisationLevels[t.ingredientName] || 'Medium'}
                          onChange={v => setCustomisationLevels(p => ({ ...p, [t.ingredientName]: v }))}
                          disabled={outages[t.ingredientName.toLowerCase()]}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Sauces list */}
                {saucesList.length > 0 && (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                      <div style={{ width: 3, height: 14, background: 'var(--red)', borderRadius: 2 }} />
                      <span style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Sauces</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {saucesList.map(s => (
                        <LevelStepper
                          key={s.id}
                          label={s.ingredientName}
                          emoji={getIngredientEmoji(s.ingredientName)}
                          value={customisationLevels[s.ingredientName] || 'Medium'}
                          onChange={v => setCustomisationLevels(p => ({ ...p, [s.ingredientName]: v }))}
                          disabled={outages[s.ingredientName.toLowerCase()]}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {(!menuItem.ingredients || validIngredients.length === 0) && (
                  <div style={{ textAlign: 'center', padding: '20px 10px', background: 'var(--cream-dark)', borderRadius: 14, border: '1px solid var(--border)' }}>
                    <span style={{ fontSize: '1.5rem', display: 'block', marginBottom: 6 }}>🍔</span>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>Standard Configuration</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: 2 }}>This item has no standard customization ingredients.</div>
                  </div>
                )}
              </>
            )}

            {/* Paid Add-ons */}
            {!isBeverage && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <div style={{ width: 3, height: 14, background: 'var(--red)', borderRadius: 2 }} />
                  <span style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Add-ons</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {Object.keys(addons).map(addon => (
                    <div key={addon} style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                      background: addons[addon] > 0 ? 'rgba(255,107,0,0.05)' : 'var(--cream-dark)',
                      borderRadius: 14, border: `1.5px solid ${addons[addon] > 0 ? 'var(--red)' : 'var(--border)'}`
                    }}>
                      <span style={{ fontSize: '1.2rem', width: 28, textAlign: 'center', flexShrink: 0 }}>
                        {getIngredientEmoji(addon)}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {addon} <span style={{ color: 'var(--red)', fontWeight: 800, fontSize: '0.75rem' }}>+ {formatRM(addonPrices[addon])}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                        <button type="button" onClick={() => setAddons(p => ({ ...p, [addon]: Math.max(0, p[addon] - 1) }))} disabled={addons[addon] === 0} style={{
                          width: 26, height: 26, borderRadius: '50%', border: '1px solid var(--border)',
                          background: addons[addon] === 0 ? 'var(--cream-dark)' : 'var(--surface)',
                          color: addons[addon] === 0 ? 'var(--text-secondary)' : 'var(--text-primary)',
                          cursor: addons[addon] === 0 ? 'not-allowed' : 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0
                        }}><IcoMinus /></button>
                        <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)', minWidth: 16, textAlign: 'center' }}>
                          {addons[addon]}
                        </span>
                        <button type="button" onClick={() => setAddons(p => ({ ...p, [addon]: p[addon] + 1 }))} style={{
                          width: 26, height: 26, borderRadius: '50%', border: 'none',
                          background: 'var(--text-primary)', color: 'var(--surface)',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0
                        }}><IcoPlus /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Special Remarks */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <div style={{ width: 3, height: 14, background: 'var(--red)', borderRadius: 2 }} />
                <span style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Special Remarks</span>
              </div>
              <textarea
                placeholder="e.g. no onion, extra spicy, sauce on the side..."
                rows={2}
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 14,
                  border: '1.5px solid var(--border)',
                  background: 'var(--cream-dark)',
                  color: 'var(--text-primary)',
                  fontSize: '0.82rem',
                  fontFamily: 'Inter, sans-serif',
                  outline: 'none',
                  resize: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => e.currentTarget.style.borderColor = 'var(--red)'}
                onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'}
              />
            </div>

            {/* Save / Quantity Section */}
            {showQty ? (
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '20px 0 10px', borderTop: '1px solid var(--border)', marginTop: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--cream-dark)', borderRadius: 'var(--radius-md)', padding: '8px 12px' }}>
                  <button type="button" onClick={() => setQty(Math.max(1, qty - 1))} style={{ width: 24, height: 24, borderRadius: '50%', background: qty === 1 ? 'var(--border)' : 'var(--text-primary)', border: 'none', cursor: qty === 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: qty === 1 ? 'var(--text-secondary)' : 'var(--background)' }}><IcoMinus /></button>
                  <span style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: '0.9rem', minWidth: 16, textAlign: 'center', color: 'var(--text-primary)' }}>{qty}</span>
                  <button type="button" onClick={() => setQty(qty + 1)} style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--text-primary)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--background)' }}><IcoPlus /></button>
                </div>
                <button type="button" onClick={handleSave} className="btn-primary" style={{ flex: 1, padding: '12px 20px', borderRadius: 'var(--radius-md)', fontSize: '0.88rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <IcoCart /> Add to Order · {formatRM(totalPrice * qty)}
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 10, padding: '20px 0 10px', borderTop: '1px solid var(--border)', marginTop: 10 }}>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    flex: 1, padding: '12px', background: 'var(--cream-dark)', color: 'var(--text-primary)',
                    border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', fontWeight: 700, cursor: 'pointer', fontSize: '0.84rem', fontFamily: 'Outfit'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  style={{
                    flex: 1, padding: '12px', background: 'var(--primary)', color: '#fff',
                    border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 700, cursor: 'pointer', fontSize: '0.84rem', fontFamily: 'Outfit',
                    boxShadow: '0 4px 14px rgba(255, 107, 0, 0.2)'
                  }}
                >
                  Apply Changes
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

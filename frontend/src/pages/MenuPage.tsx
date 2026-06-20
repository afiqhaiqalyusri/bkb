import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MenuItem, Promotion, Order } from '../types';
import { menuService } from '../services/menu.service';
import { ingredientService } from '../services/ingredient.service';
import { orderService } from '../services/order.service';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { useMenuStore } from '../store/menuStore';
import { useFavouriteStore } from '../store/favouriteStore';
import { formatRM } from '../utils/formatCurrency';
import { PageShell } from '../components/PageShell';
import { ErrorState } from '../components/ui/ErrorState';
import toast from 'react-hot-toast';
import { BurgerLoader } from '../components/ui/BurgerLoader';
import { getFoodImage } from '../utils/foodImages';
import { CustomiseModal } from '../components/CustomiseModal';

/* ─── Food emojis ─── */
const getFoodEmoji = (category: string): string => {
  const norm = (category || '').toLowerCase().trim();
  if (norm === 'all') return '🍽️';
  if (norm.includes('burger')) return '🍔';
  if (norm.includes('oblong')) return '🥖';
  if (norm.includes('special')) return '⭐';
  if (norm.includes('drink') || norm.includes('beverage')) return '🥤';
  if (norm.includes('side') || norm.includes('fries') || norm.includes('snack')) return '🍟';
  if (norm.includes('dessert') || norm.includes('sweet') || norm.includes('cake') || norm.includes('ice')) return '🍦';
  return '🍽️';
};

/* ─── Status config ─── */
const STATUS_CFG: Record<string, { label: string; color: string; bg: string; pulse: boolean }> = {
  PENDING:    { label:'Order Received',     color:'#D97706', bg:'rgba(245,158,11,0.1)',   pulse:false },
  ACCEPTED:   { label:'Accepted',           color:'var(--primary)', bg:'rgba(255,107,0,0.1)',   pulse:false },
  GRILLING:   { label:'🔥 Grilling',        color:'var(--primary)', bg:'rgba(255,107,0,0.1)',    pulse:true  },
  ASSEMBLING: { label:'🏗️ Assembling',      color:'#7C3AED', bg:'rgba(124,58,237,0.1)',   pulse:true  },
  READY:      { label:'✅ Ready for pickup!',color:'#16A34A', bg:'rgba(34,197,94,0.1)',   pulse:false },
};
/* ─── SVG Icons ─── */
const IcoBack  = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>;
const IcoPlus  = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>;
const IcoMinus = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14"/></svg>;
const IcoCheck = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>;
const IcoCart  = () => <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>;
const IcoClose = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>;
const IcoSearch= () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>;
const IcoChevR = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>;

/* ─── Category Icons ─── */
const CAT_ICONS: Record<string, React.ReactNode> = {
  All:     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>,
  Burger:  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M3 7h18M3 12h18M3 17h18"/><path d="M6 7C6 5 7.5 4 12 4s6 1 6 3"/><path d="M6 17c0 2 1.5 3 6 3s6-1 6-3"/></svg>,
  Oblong:  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="2" y="8" width="20" height="8" rx="4"/><path d="M8 8V6M12 8V5M16 8V6"/></svg>,
  Special: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  Drinks:  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M8 2h8l1 8H7L8 2z"/><path d="M7 10c0 5 2 9 5 9s5-4 5-9"/><path d="M10 6h4"/></svg>,
  Sides:   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="5" y="6" width="14" height="14" rx="2"/><path d="M5 10h14M9 6V4m6 2V4"/></svg>,
};

/* ─── Customization ─── */
const LEVELS = ['None','Less','Medium','Extra'] as const;
type Level = typeof LEVELS[number];
const LEVEL_COLORS: Record<Level, string> = { None:'#E5E7EB', Less:'#FFBC8B', Medium:'#FF8C42', Extra:'var(--primary)' };
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


/* ─── Level Stepper ─── */
const LevelStepper: React.FC<{ value:Level; onChange:(v:Level)=>void; label:string; emoji:string; disabled?:boolean }> = ({ value, onChange, label, emoji, disabled }) => {
  const displayValue = disabled ? 'None' : value;
  const idx = LEVELS.indexOf(displayValue);
  return (
    <div style={{
      display:'flex', alignItems:'center', gap:10, padding:'10px 14px',
      background: disabled ? 'var(--cream-dark)' : 'var(--cream-dark)',
      borderRadius:14, border:'1.5px solid var(--border)',
      opacity: disabled ? 0.7 : 1
    }}>
      <span style={{ fontSize:'1.2rem', width:28, textAlign:'center', flexShrink:0 }}>{emoji}</span>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:'0.81rem', fontWeight:600, color:'var(--text-primary)', marginBottom:5, display:'flex', alignItems:'center', gap:6 }}>
          {label}
          {disabled && (
            <span style={{ fontSize:'0.58rem', fontWeight:800, background:'#EF4444', color:'#fff', padding:'1px 5px', borderRadius:99, textTransform:'uppercase' }}>
              Out of stock
            </span>
          )}
        </div>
        <div style={{ display:'flex', gap:3 }}>
          {LEVELS.map((l,i) => (
            <div key={l} onClick={() => !disabled && onChange(l)} style={{
              flex:1, height:4, borderRadius:2, cursor: disabled ? 'not-allowed' : 'pointer',
              background: i <= idx ? (disabled ? 'var(--text-secondary)' : LEVEL_COLORS[displayValue]) : 'var(--border)',
              transition:'background 0.2s',
            }} />
          ))}
        </div>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:5, flexShrink:0 }}>
        <button onClick={() => !disabled && idx>0 && onChange(LEVELS[idx-1])} disabled={disabled || idx===0} style={{
          width:26, height:26, borderRadius:'50%', border:'1px solid var(--border)',
          background: (disabled || idx===0) ? 'var(--cream-dark)' : 'var(--white)',
          color: (disabled || idx===0) ? 'var(--text-muted)' : 'var(--text-primary)',
          cursor: (disabled || idx===0) ? 'not-allowed' : 'pointer',
          display:'flex', alignItems:'center', justifyContent:'center',
        }}><IcoMinus /></button>
        <span style={{ fontSize:'0.68rem', fontWeight:800, color: disabled ? 'var(--text-muted)' : (displayValue==='None' ? 'var(--text-secondary)' : LEVEL_COLORS[displayValue]), minWidth:42, textAlign:'center' }}>{displayValue}</span>
        <button onClick={() => !disabled && idx<LEVELS.length-1 && onChange(LEVELS[idx+1])} disabled={disabled || idx===LEVELS.length-1} style={{
          width:26, height:26, borderRadius:'50%', border:'none',
          background: (disabled || idx===LEVELS.length-1) ? 'var(--cream-dark)' : 'var(--text-primary)',
          color: (disabled || idx===LEVELS.length-1) ? 'var(--text-muted)' : 'var(--background)',
          cursor: (disabled || idx===LEVELS.length-1) ? 'not-allowed' : 'pointer',
          display:'flex', alignItems:'center', justifyContent:'center',
        }}><IcoPlus /></button>
      </div>
    </div>
  );
};

/* ─── Active Order Popup ─── */
const ActiveOrderPopup: React.FC<{ orders:Order[]; onDismiss:(id:number)=>void; onTrack:(order:Order)=>void }> = ({ orders, onDismiss, onTrack }) => {
  if (orders.length === 0) return null;
  const order = orders[0];
  const cfg = STATUS_CFG[order.status] || STATUS_CFG.PENDING;
  return (
    <div style={{
      position:'fixed', bottom:80, left:'50%', transform:'translateX(-50%)',
      width:'calc(100% - 32px)', maxWidth:420,
      background:'var(--surface)', borderRadius:18,
      boxShadow:'var(--shadow-lg)',
      padding:'14px 16px', zIndex:400,
      animation:'slideUpPop 0.4s cubic-bezier(0.34,1.56,0.64,1)',
      border:`1.5px solid var(--border)`,
    }}>
      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
        <div style={{ width:42, height:42, borderRadius:12, background:cfg.bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, position:'relative' }}>
          <span style={{ fontSize:'1.2rem' }}>🍔</span>
          {cfg.pulse && <div style={{ position:'absolute', inset:0, borderRadius:12, border:`2px solid ${cfg.color}`, animation:'pingPulse 1.5s ease-in-out infinite' }} />}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:2 }}>
            <span style={{ fontSize:'0.64rem', fontWeight:800, color:cfg.color, background:cfg.bg, padding:'2px 8px', borderRadius:999 }}>{cfg.label}</span>
            {orders.length > 1 && <span style={{ fontSize:'0.65rem', color:'var(--text-secondary)' }}>+{orders.length-1} more</span>}
          </div>
          <div style={{ fontSize:'0.82rem', fontWeight:700, color:'var(--text-primary)' }}>Order #{order.orderNumber}</div>
          <div style={{ fontSize:'0.7rem', color:'var(--text-secondary)' }}>{order.items.length} item{order.items.length!==1?'s':''} · {formatRM(order.total)}</div>
        </div>
        <div style={{ display:'flex', gap:6 }}>
          <button onClick={() => onTrack(order)} style={{ background:'var(--red)', color:'#fff', border:'none', borderRadius:10, padding:'8px 12px', fontSize:'0.75rem', fontWeight:700, cursor:'pointer' }}>Track</button>
          <button onClick={() => onDismiss(order.id)} style={{ background:'var(--cream-dark)', color:'var(--text-secondary)', border:'none', borderRadius:10, width:32, height:32, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}><IcoClose /></button>
        </div>
      </div>
    </div>
  );
};

/* ─── Menu Card ─── */
const MenuCard: React.FC<{ item:MenuItem; delay:number; onSelect:()=>void; onQuickAdd:()=>void }> = ({ item, delay, onSelect, onQuickAdd }) => {
  const price = item.promoPrice ?? item.price;
  const soldOut = !item.isAvailable;
  const { toggle, isFavourite } = useFavouriteStore();
  const fav = isFavourite(item.id);
  const [heartAnim, setHeartAnim] = useState(false);

  const handleFav = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggle(item);
    setHeartAnim(true);
    setTimeout(() => setHeartAnim(false), 400);
    if (!fav) toast.success('Added to favourites!', { icon: '♥', duration: 1200 });
  };

  return (
    <div
      className="bkb-menu-card animate-fade-in"
      style={{ animationDelay:`${delay}s`, opacity: soldOut ? 0.65 : 1, cursor: soldOut ? 'not-allowed' : 'pointer' }}
      onClick={soldOut ? undefined : onSelect}
    >
      <div className="bkb-card-gradient-bg" style={{ borderRadius:14, marginBottom:10, height:130, display:'flex', alignItems:'center', justifyContent:'center', position:'relative', overflow:'hidden' }}>
        {item.promoPrice && !soldOut && (
          <div style={{ position:'absolute', top:8, left:8, background:'var(--primary)', color:'#fff', borderRadius:999, padding:'3px 10px', fontSize:'0.6rem', fontWeight:800, zIndex: 5 }}>PROMO</div>
        )}
        {soldOut && (
          <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:5 }}>
            <span style={{ fontSize:'0.68rem', fontWeight:900, color:'#fff', background:'#EF4444', padding:'4px 12px', borderRadius:999, textTransform:'uppercase', letterSpacing:'0.05em' }}>Sold Out</span>
          </div>
        )}
        <img
          src={item.imageUrl || getFoodImage(item.category, item.name)}
          alt={item.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' }}
          className="menu-item-img-tag"
        />
        {/* Favourite Heart Button */}
        <button
          onClick={handleFav}
          title={fav ? 'Remove from favourites' : 'Add to favourites'}
          style={{
            position: 'absolute', top: 6, right: 6, zIndex: 6,
            width: 28, height: 28, borderRadius: '50%',
            background: 'rgba(255,255,255,0.92)',
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
            transform: heartAnim ? 'scale(1.35)' : 'scale(1)',
            transition: 'transform 0.25s cubic-bezier(0.34,1.56,0.64,1)',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill={fav ? 'var(--red)' : 'none'} stroke="var(--red)" strokeWidth="2.2" strokeLinecap="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>
        {!soldOut && (
          <div className="bkb-badge-customise" style={{ position:'absolute', bottom:8, right:8, borderRadius:999, padding:'4px 10px', fontSize:'0.62rem', fontWeight:700, display:'flex', alignItems:'center', gap:2, zIndex: 4, boxShadow: 'var(--shadow-sm)' }}>
            Customise <IcoChevR />
          </div>
        )}
      </div>
      <div style={{ flex:1, display:'flex', flexDirection:'column' }}>
        <div style={{ fontSize:'0.6rem', fontWeight:700, color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:0.5, marginBottom:2 }}>{item.category}</div>
        <div style={{ fontFamily:'Outfit', fontWeight:700, fontSize:'0.84rem', color:'var(--text-primary)', lineHeight:1.3, marginBottom:4, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
          {item.name}
        </div>
        <div style={{ marginTop:'auto', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <div style={{ fontFamily:'Outfit', fontWeight:800, fontSize:'0.88rem', color:'var(--primary)' }}>{formatRM(price)}</div>
            {item.promoPrice && <div style={{ fontSize:'0.65rem', color:'var(--text-secondary)', textDecoration:'line-through' }}>{formatRM(item.price)}</div>}
          </div>
          {!soldOut && (
            <button
              onClick={e => { e.stopPropagation(); onQuickAdd(); }}
              style={{ width:28, height:28, borderRadius:'50%', background:'var(--primary)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'white', transition:'all 0.15s ease' }}
              onMouseEnter={e => e.currentTarget.style.transform='scale(1.12)'}
              onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}
            ><IcoPlus /></button>
          )}
        </div>
      </div>
    </div>
  );
};





/* ══════════════════════════════════════════════
   MAIN MenuPage
   ══════════════════════════════════════════════ */
export const MenuPage: React.FC = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const { activeCategory, setActiveCategory } = useMenuStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<number>>(new Set());
  const [outages, setOutages] = useState<Record<string, boolean>>({});

  const { addItem, itemCount, total } = useCartStore();
  const { user } = useAuthStore();

  const loadData = () => {
    setLoading(true);
    setError(false);
    Promise.all([
      menuService.getAll(),
      menuService.getPromotions()
    ])
      .then(([i, p]) => {
        setItems(i.data);
        setPromotions(p.data);
        setError(false);
      })
      .catch((err) => {
        setError(true);
        toast.error('Failed to load menu data');
        console.error(err);
      })
      .finally(() => setLoading(false));
  };


  useEffect(() => {
    ingredientService.getAll().then(res => {
      const mapped: Record<string, boolean> = {};
      res.data.forEach(item => {
        mapped[item.name.toLowerCase()] = item.outOfStock;
      });
      setOutages(mapped);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      try {
        const res = await orderService.getMyOrders();
        setActiveOrders((res.data||[]).filter(o => !['COMPLETED','CANCELLED'].includes(o.status) && !dismissedIds.has(o.id)));
      } catch {}
    };
    fetch();
    const iv = setInterval(fetch, 8000);
    return () => clearInterval(iv);
  }, [user, dismissedIds]);

  // Show ALL items (including unavailable) — unavailable show as 'Sold Out'
  const filtered = (activeCategory==='All' ? items : items.filter(i => i.category===activeCategory))
    .filter(i => !searchQuery || i.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const cartCount = itemCount();
  const cartTotal = total();
  const promo = promotions[0];

  if (loading) return (
    <div className="loading-screen" style={{ background: 'var(--background)' }}>
      <BurgerLoader message="Loading Menu..." />
    </div>
  );

  if (error) return (
    <PageShell activeKey="/menu">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 120px)', padding: 16 }}>
        <ErrorState onRetry={loadData} retrying={loading} />
      </div>
    </PageShell>
  );

  return (
    <PageShell activeKey="/menu">
      {/* ── Slide container ── */}
      <div style={{ position:'relative', overflow:'hidden', minHeight:'100vh' }}>

        {/* Screen 1: Browse */}
        <div style={{
          position:'absolute', inset:0,
          overflowY: selectedItem ? 'hidden' : 'auto',
          display:'flex',
        }}>
          {/* Items area */}
          <div className="menu-items-area" style={{ paddingBottom:80 }}>
            {/* Header */}
            <div style={{ padding:'20px 16px 0' }}>
              <p style={{ fontSize:'0.75rem', color:'var(--text-secondary)', marginBottom:2 }}>
                {user ? `Hello, ${user.name.split(' ')[0]} 👋` : 'Hello there 👋'}
              </p>
              <h1 style={{ fontFamily:'Poppins', fontWeight:800, fontSize:'1.35rem', color:'var(--text-primary)', lineHeight:1.2, marginBottom:12 }}>
                Find your <span style={{ color:'var(--red)' }}>favourite</span>
              </h1>

              {/* Search */}
              <div style={{ display:'flex', alignItems:'center', gap:8, background:'var(--surface)', borderRadius:12, padding:'9px 14px', border:'1px solid var(--border)', boxShadow:'var(--shadow-sm)', marginBottom:14 }}>
                <IcoSearch />
                <input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search menu..."
                  style={{ flex:1, border:'none', outline:'none', fontSize:'0.86rem', background:'transparent', color:'var(--text-primary)' }}
                />
                {searchQuery && <button onClick={() => setSearchQuery('')} style={{ border:'none', background:'none', cursor:'pointer', color:'var(--text-secondary)', fontSize:'0.9rem' }}>✕</button>}
              </div>

              {/* Promo banner */}
              {promo && (
                <div style={{ background:'linear-gradient(135deg,#1A1008,#3D1F1C)', borderRadius:14, padding:'12px 14px', marginTop:12, display:'flex', justifyContent:'space-between', alignItems:'center', overflow:'hidden', position:'relative' }}>
                  <div>
                    <div style={{ fontSize:'0.62rem', fontWeight:700, color:'rgba(255,255,255,0.6)', marginBottom:1 }}>🔥 LIMITED OFFER</div>
                    <div style={{ fontFamily:'Poppins', fontWeight:700, fontSize:'0.85rem', color:'#fff' }}>{promo.title}</div>
                  </div>
                  <span style={{ fontSize:'2rem', opacity:0.2, position:'absolute', right:10, bottom:-2 }}>🍔</span>
                </div>
              )}
            </div>

            {/* Items label + count */}
            <div style={{ padding:'14px 16px 8px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ fontFamily:'Poppins', fontWeight:700, fontSize:'0.88rem', color:'var(--text-primary)' }}>{activeCategory==='All'?'All Items':activeCategory}</span>
              <span style={{ fontSize:'0.72rem', color:'var(--text-secondary)' }}>{filtered.length} items</span>
            </div>

            {/* Grid */}
            {filtered.length > 0 ? (
              <div className="menu-items-grid" style={{ padding:'0 16px' }}>
                {filtered.map((item, i) => (
                  <MenuCard key={item.id} item={item} delay={i*0.04}
                    onSelect={() => { if (item.isAvailable) setSelectedItem(item); }}
                    onQuickAdd={() => { if (item.isAvailable) { addItem(item,1); toast.success(`${item.name} added!`,{icon:'🍔',duration:1400}); } }}
                  />
                ))}
              </div>
            ) : (
              <div style={{ textAlign:'center', padding:'60px 20px' }}>
                <div style={{ fontSize:'3rem', marginBottom:10 }}>🥺</div>
                <p style={{ color:'var(--text-secondary)', fontSize:'0.86rem' }}>No items found</p>
              </div>
            )}
          </div>
        </div>

      </div>
      {selectedItem && (
        <CustomiseModal
          isOpen={!!selectedItem}
          menuItem={selectedItem}
          initialCustomisations={[]}
          onClose={() => setSelectedItem(null)}
          showQty={true}
          onSaveWithQty={(custom, qty) => {
            addItem(selectedItem, qty, custom);
            toast.success(`${selectedItem.name} added!`, { icon: '🍔', duration: 1400 });
            setSelectedItem(null);
          }}
        />
      )}



      {/* Active Order Popup */}
      <ActiveOrderPopup
        orders={activeOrders}
        onDismiss={id => setDismissedIds(p => new Set([...p,id]))}
        onTrack={order => navigate(order.guestToken ? `/track/${order.guestToken}` : `/order/${order.id}/tracking`)}
      />
    </PageShell>
  );
};

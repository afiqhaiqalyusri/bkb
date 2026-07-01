import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { BkbLogo } from '../components/ui/BkbLogo';
import { Search, ShoppingBag, Truck, Utensils, Star, Moon, Sun, ChevronRight } from 'lucide-react';
import { advertisementService, Advertisement } from '../services/advertisement.service';
import { IngredientOutageBanner } from '../components/IngredientOutageBanner';
import { formatRM } from '../utils/formatCurrency';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('bkb-theme') as 'light' | 'dark') || 'light';
  });

  const [ads, setAds] = useState<Advertisement[]>([]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('bkb-theme', newTheme);
  };

  useEffect(() => {
    advertisementService.getAll(true, 'LANDING').then(res => setAds(res.data)).catch(() => {});
  }, []);

  const handleOrderNow = () => {
    navigate(isAuthenticated ? '/menu' : '/login');
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)', color: 'var(--text-primary)', fontFamily: 'Outfit, sans-serif', overflowX: 'hidden' }}>
      <IngredientOutageBanner />

      {/* Navbar */}
      <header style={{ maxWidth: 1200, margin: '0 auto', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <BkbLogo size={42} showText={true} />
        </div>

        <nav className="hidden md:flex" style={{ gap: 40, fontWeight: 700, fontSize: '0.95rem' }}>
          <a href="#" style={{ color: 'var(--primary)', textDecoration: 'none' }}>Home</a>
          <a href="#menu" onClick={(e) => { e.preventDefault(); navigate('/menu'); }} style={{ color: 'var(--text-primary)', textDecoration: 'none' }}>Menu</a>
          <a href="#services" style={{ color: 'var(--text-primary)', textDecoration: 'none' }}>Services</a>
          <a href="#contact" style={{ color: 'var(--text-primary)', textDecoration: 'none' }}>Contact</a>
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <button onClick={toggleTheme} style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex' }}>
            {theme === 'light' ? <Moon size={22} /> : <Sun size={22} />}
          </button>
          <button onClick={() => navigate('/menu')} style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex' }}>
            <Search size={22} />
          </button>
          <button onClick={() => navigate('/cart')} style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', position: 'relative' }}>
            <ShoppingBag size={22} />
            <span style={{ position: 'absolute', top: -5, right: -5, background: 'var(--primary)', color: 'white', fontSize: '0.65rem', fontWeight: 800, width: 16, height: 16, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>0</span>
          </button>
          {!isAuthenticated && (
            <button onClick={() => navigate('/login')} style={{ marginLeft: 10, padding: '8px 20px', background: 'var(--cream-dark)', border: '1px solid var(--border)', borderRadius: 99, fontWeight: 700, color: 'var(--text-primary)', cursor: 'pointer', fontSize: '0.9rem' }}>
              Login
            </button>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section style={{ maxWidth: 1200, margin: '40px auto 80px', padding: '0 24px', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 60 }}>
        
        {/* Hero Left Content */}
        <div style={{ flex: '1 1 400px', zIndex: 2 }}>
          <span style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: 2 }}>Welcome</span>
          <h1 style={{ fontSize: 'clamp(3rem, 5vw, 4.5rem)', fontWeight: 900, lineHeight: 1.1, margin: '15px 0 24px', letterSpacing: '-1px' }}>
            Enjoy Your <br />
            <span style={{ color: 'var(--primary)' }}>Delicious Food</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.6, marginBottom: 40, maxWidth: 450, fontWeight: 500 }}>
            Taste the best street grills, juicy burgers, and spicy crispy chicken, made fresh just for you. Delivery is fast and food is always hot.
          </p>
          <button onClick={handleOrderNow} className="hover-scale" style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '14px 32px', borderRadius: 99, fontWeight: 800, fontSize: '1rem', display: 'inline-flex', alignItems: 'center', gap: 12, cursor: 'pointer', boxShadow: '0 10px 25px rgba(255, 107, 0, 0.3)' }}>
            Order Now 
            <span style={{ background: 'white', color: 'var(--primary)', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ChevronRight size={16} strokeWidth={3} />
            </span>
          </button>
        </div>

        {/* Hero Right Visuals */}
        <div style={{ flex: '1 1 500px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          
          {/* Abstract Orange Shape */}
          <div style={{ width: 320, height: 420, background: 'var(--primary)', borderRadius: '40px 100px 40px 40px', position: 'absolute', right: '15%' }}></div>
          
          {/* Floating Burger Image */}
          <img src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=800&auto=format&fit=crop&bg=transparent" alt="Delicious Burger" style={{ width: '85%', maxWidth: 500, position: 'relative', zIndex: 2, transform: 'rotate(-5deg) translateY(-20px)', filter: 'drop-shadow(0 30px 30px rgba(0,0,0,0.3))' }} />
          
          {/* Floating Features List */}
          <div className="hidden md:flex" style={{ flexDirection: 'column', gap: 30, position: 'absolute', right: -20, zIndex: 3 }}>
            {[
              { title: 'Fast delivery', sub: 'Delivery within 30 mins', icon: Truck },
              { title: 'Pick up', sub: 'Pickup in 15 mins', icon: ShoppingBag },
              { title: 'Dine In', sub: 'Enjoy your food here', icon: Utensils }
            ].map((feat, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 14, background: 'var(--surface)', padding: '12px 20px 12px 12px', borderRadius: 99, boxShadow: '0 10px 30px rgba(0,0,0,0.08)', transform: `translateX(${idx === 1 ? -20 : 0}px)` }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255, 107, 0, 0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <feat.icon size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.85rem' }}>{feat.title}</div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.7rem' }}>{feat.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Ads / Promos Section */}
      <section style={{ maxWidth: 1200, margin: '80px auto', padding: '0 24px', display: 'flex', flexWrap: 'wrap', gap: 20 }}>
        <div style={{ flex: '2 1 400px', height: 280, borderRadius: 24, overflow: 'hidden', position: 'relative', background: '#111' }}>
          <img src="https://images.unsplash.com/photo-1598514982205-f36b96d1e8d4?q=80&w=1200&auto=format&fit=crop" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7 }} alt="Promo" />
          <div style={{ position: 'absolute', top: 40, left: 40, color: 'white' }}>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 900, lineHeight: 1.2, textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>Buy 2<br/>Get 1 free</h2>
            <p style={{ marginTop: 10, fontSize: '0.9rem', opacity: 0.9 }}>Available on weekends only.</p>
          </div>
        </div>
        <div style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ flex: 1, height: 130, borderRadius: 24, background: '#222', overflow: 'hidden', position: 'relative' }}>
            <img src="https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=600&auto=format&fit=crop" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6 }} alt="Pizza" />
            <span style={{ position: 'absolute', bottom: 15, right: 20, color: 'white', fontWeight: 800, letterSpacing: 1 }}>PIZZA DEALS</span>
          </div>
          <div style={{ flex: 1, height: 130, borderRadius: 24, background: '#222', overflow: 'hidden', position: 'relative' }}>
            <img src="https://images.unsplash.com/photo-1547592180-85f173990554?q=80&w=600&auto=format&fit=crop" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6 }} alt="Soup" />
            <span style={{ position: 'absolute', bottom: 15, right: 20, color: 'white', fontWeight: 800, letterSpacing: 1 }}>HOT SOUPS</span>
          </div>
        </div>
      </section>

      {/* Best Products Section */}
      <section style={{ maxWidth: 1200, margin: '100px auto', padding: '0 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 60 }}>
          <h2 style={{ fontSize: '2.2rem', fontWeight: 900, letterSpacing: '-0.5px' }}>Best <span style={{ color: 'var(--primary)' }}>Products</span></h2>
          <button onClick={() => navigate('/menu')} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', letterSpacing: 1 }}>
            VIEW ALL <ChevronRight size={14} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '50px 20px' }}>
          {[
            { name: 'Beefy Bites', price: 9.95, img: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=400&auto=format&fit=crop', active: true },
            { name: 'Max Burger', price: 12.00, img: 'https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=400&auto=format&fit=crop' },
            { name: 'Roll Basket', price: 5.00, img: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?q=80&w=400&auto=format&fit=crop' },
            { name: 'Veggie Voyage', price: 8.50, img: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=400&auto=format&fit=crop' },
            { name: 'Chicken Wings', price: 15.50, img: 'https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?q=80&w=400&auto=format&fit=crop' },
            { name: 'Supreme Symphony', price: 18.00, img: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=400&auto=format&fit=crop' },
            { name: 'Pepperoni Paradise', price: 22.00, img: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?q=80&w=400&auto=format&fit=crop' },
            { name: 'Roast Chicken', price: 25.00, img: 'https://images.unsplash.com/photo-1598514982205-f36b96d1e8d4?q=80&w=400&auto=format&fit=crop' }
          ].map((item, idx) => (
            <div key={idx} style={{ 
              background: item.active ? 'var(--primary)' : 'var(--cream-dark)', 
              color: item.active ? 'white' : 'var(--text-primary)',
              borderRadius: 24, 
              padding: '30px 20px 24px', 
              position: 'relative', 
              boxShadow: item.active ? '0 20px 40px rgba(255, 107, 0, 0.25)' : 'none',
              border: item.active ? 'none' : '1px solid rgba(255,107,0,0.1)'
            }}>
              {/* Floating Product Image */}
              <div style={{ position: 'absolute', top: -50, left: '50%', transform: 'translateX(-50%)', width: 120, height: 120, borderRadius: '50%', background: '#f5f5f5', overflow: 'hidden', boxShadow: '0 10px 20px rgba(0,0,0,0.15)' }}>
                <img src={item.img} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>

              <div style={{ marginTop: 70 }}>
                <h3 style={{ fontWeight: 800, fontSize: '1.05rem', margin: '0 0 8px' }}>{item.name}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#f59e0b', fontSize: '0.8rem', marginBottom: 12 }}>
                  <Star fill="currentColor" size={12} />
                  <Star fill="currentColor" size={12} />
                  <Star fill="currentColor" size={12} />
                  <Star fill="currentColor" size={12} />
                  <Star fill="currentColor" size={12} />
                  <span style={{ color: item.active ? 'rgba(255,255,255,0.7)' : 'var(--text-secondary)', marginLeft: 4 }}>(1k)</span>
                </div>
                <p style={{ fontSize: '0.75rem', color: item.active ? 'rgba(255,255,255,0.8)' : 'var(--text-secondary)', lineHeight: 1.4, marginBottom: 20 }}>
                  Delicious taste for your tastebuds, made fresh every day.
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 800, fontSize: '1.2rem' }}>{formatRM(item.price)}</span>
                  <button style={{ 
                    width: 36, height: 36, borderRadius: '50%', 
                    background: item.active ? 'white' : 'rgba(255, 107, 0, 0.1)', 
                    color: item.active ? 'var(--primary)' : 'var(--primary)', 
                    border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' 
                  }}>
                    <ShoppingBag size={16} strokeWidth={3} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Stories Section */}
      <section style={{ maxWidth: 1200, margin: '120px auto 100px', padding: '0 24px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 60 }}>
        
        <div style={{ flex: '1 1 400px', position: 'relative', display: 'flex', justifyContent: 'flex-start' }}>
          <div style={{ width: '85%', height: 450, background: 'var(--primary)', borderRadius: '40px 100px 40px 40px', position: 'absolute', bottom: 0, left: 0 }}></div>
          <img src="https://images.unsplash.com/photo-1542385151-efd9000785a0?q=80&w=800&auto=format&fit=crop&bg=transparent" alt="Happy Customer" style={{ width: '90%', position: 'relative', zIndex: 2, filter: 'drop-shadow(10px 20px 30px rgba(0,0,0,0.2))', marginLeft: '5%' }} />
        </div>

        <div style={{ flex: '1 1 400px' }}>
          <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 2 }}>The Experience</span>
          <h2 style={{ fontSize: 'clamp(2.5rem, 4vw, 3.5rem)', fontWeight: 900, lineHeight: 1.1, margin: '15px 0 24px', letterSpacing: '-1px' }}>
            Our <span style={{ color: 'var(--primary)' }}>Stories</span> Have<br/>Adventures.
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.7, marginBottom: 40, fontWeight: 500 }}>
            There are many variations of food, but only a few bring true happiness. Over the years we have served thousands of satisfied customers who return for our authentic flavors and premium quality ingredients.
          </p>
          <div style={{ display: 'flex', gap: 15, flexWrap: 'wrap' }}>
            {[
              { stat: '12k+', label: 'Success Food' },
              { stat: '16k+', label: 'Happy Customers' },
              { stat: '20k+', label: 'Foods Delivery' }
            ].map((st, i) => (
              <div key={i} style={{ flex: 1, minWidth: 100, background: 'rgba(255, 107, 0, 0.05)', border: '1px solid rgba(255, 107, 0, 0.1)', padding: '24px 16px', borderRadius: 20, textAlign: 'center' }}>
                <div style={{ color: 'var(--primary)', fontWeight: 900, fontSize: '1.6rem', marginBottom: 6 }}>{st.stat}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>{st.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { BkbLogo } from '../components/ui/BkbLogo';
import { Search, ShoppingBag, Truck, Utensils, Star, Moon, Sun, ChevronRight, Facebook, Twitter, Instagram, MapPin, Phone, Mail } from 'lucide-react';
import { advertisementService, Advertisement } from '../services/advertisement.service';
import { menuService } from '../services/menu.service';
import { MenuItem } from '../types';
import { IngredientOutageBanner } from '../components/IngredientOutageBanner';
import { formatRM } from '../utils/formatCurrency';
import { getImageUrl } from '../utils/imageUtils';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('bkb-theme') as 'light' | 'dark') || 'light';
  });

  const [ads, setAds] = useState<Advertisement[]>([]);
  const [bestProducts, setBestProducts] = useState<MenuItem[]>([]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('bkb-theme', newTheme);
  };

  useEffect(() => {
    // Fetch Ads
    advertisementService.getAll(true, 'LANDING').then(res => setAds(res.data)).catch(() => {});
    
    // Fetch real Menu Items for the "Best Products" grid
    menuService.getAll().then(res => {
      // Just take the first 8 items for the showcase
      setBestProducts(res.data.slice(0, 8));
    }).catch(() => {});
  }, []);

  const handleOrderNow = () => {
    navigate(isAuthenticated ? '/menu' : '/login');
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)', color: 'var(--text-primary)', fontFamily: 'Outfit, sans-serif', overflowX: 'hidden' }}>
      <IngredientOutageBanner />

      {/* Navbar */}
      <header className="px-6 py-5 md:py-6" style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => window.scrollTo(0, 0)}>
          <BkbLogo size={42} showText={true} />
        </div>

        <nav className="hidden md:flex items-center gap-10 font-bold" style={{ fontSize: '0.95rem' }}>
          <a href="#" style={{ color: 'var(--primary)', textDecoration: 'none' }}>Home</a>
          <a href="#menu" onClick={(e) => { e.preventDefault(); navigate('/menu'); }} style={{ color: 'var(--text-primary)', textDecoration: 'none' }} className="hover:text-[var(--primary)] transition-colors">Menu</a>
          <a href="#services" style={{ color: 'var(--text-primary)', textDecoration: 'none' }} className="hover:text-[var(--primary)] transition-colors">Services</a>
          <a href="#contact" onClick={(e) => { e.preventDefault(); window.scrollTo(0, document.body.scrollHeight); }} style={{ color: 'var(--text-primary)', textDecoration: 'none' }} className="hover:text-[var(--primary)] transition-colors">Contact</a>
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={toggleTheme} className="hover:text-[var(--primary)] transition-colors" style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex' }}>
            {theme === 'light' ? <Moon size={22} /> : <Sun size={22} />}
          </button>
          <button onClick={() => navigate('/menu')} className="hidden sm:flex hover:text-[var(--primary)] transition-colors" style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}>
            <Search size={22} />
          </button>
          <button onClick={() => navigate('/cart')} className="hover:text-[var(--primary)] transition-colors" style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', position: 'relative' }}>
            <ShoppingBag size={22} />
            <span style={{ position: 'absolute', top: -5, right: -5, background: 'var(--primary)', color: 'white', fontSize: '0.65rem', fontWeight: 800, width: 16, height: 16, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>0</span>
          </button>
          {!isAuthenticated && (
            <button onClick={() => navigate('/login')} className="ml-2 px-5 py-2 hover:bg-[var(--primary)] hover:text-white hover:border-[var(--primary)] transition-all" style={{ background: 'var(--cream-dark)', border: '1px solid var(--border)', borderRadius: 99, fontWeight: 700, color: 'var(--text-primary)', cursor: 'pointer', fontSize: '0.9rem' }}>
              Login
            </button>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="px-6 flex flex-col md:flex-row items-center gap-12 md:gap-16 lg:gap-20" style={{ maxWidth: 1200, margin: '40px auto 80px' }}>
        
        {/* Hero Left Content */}
        <div className="flex-1 w-full text-center md:text-left" style={{ zIndex: 2 }}>
          <span style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: 2 }}>Welcome</span>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-black leading-tight my-4 md:my-5" style={{ letterSpacing: '-1px' }}>
            Enjoy Your <br />
            <span style={{ color: 'var(--primary)' }}>Delicious Food</span>
          </h1>
          <p className="mx-auto md:mx-0 text-base md:text-lg mb-8" style={{ color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: 450, fontWeight: 500 }}>
            Taste the best street grills, juicy burgers, and spicy crispy chicken, made fresh just for you. Delivery is fast and food is always hot.
          </p>
          <button onClick={handleOrderNow} className="hover-scale inline-flex items-center gap-3 px-8 py-3.5 rounded-full font-bold text-[1rem]" style={{ background: 'var(--primary)', color: 'white', border: 'none', cursor: 'pointer', boxShadow: '0 10px 25px rgba(255, 107, 0, 0.3)' }}>
            Order Now 
            <span style={{ background: 'white', color: 'var(--primary)', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ChevronRight size={16} strokeWidth={3} />
            </span>
          </button>
        </div>

        {/* Hero Right Visuals */}
        <div className="flex-1 w-full flex justify-center relative mt-10 md:mt-0">
          {/* Abstract Orange Shape */}
          <div className="absolute right-[5%] md:right-[15%] w-[260px] md:w-[320px] h-[350px] md:h-[420px]" style={{ background: 'var(--primary)', borderRadius: '40px 100px 40px 40px' }}></div>
          
          {/* Floating Burger Image */}
          <img src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=800&auto=format&fit=crop&bg=transparent" alt="Delicious Burger" className="w-[80%] max-w-[500px] relative z-10" style={{ transform: 'rotate(-5deg) translateY(-20px)', filter: 'drop-shadow(0 30px 30px rgba(0,0,0,0.3))' }} />
          
          {/* Floating Features List */}
          <div className="hidden lg:flex flex-col gap-6 absolute -right-6 z-20">
            {[
              { title: 'Fast delivery', sub: 'Delivery within 30 mins', icon: Truck },
              { title: 'Pick up', sub: 'Pickup in 15 mins', icon: ShoppingBag },
              { title: 'Dine In', sub: 'Enjoy your food here', icon: Utensils }
            ].map((feat, idx) => (
              <div key={idx} className="flex items-center gap-3.5 px-4 py-3 rounded-full" style={{ background: 'var(--surface)', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', transform: `translateX(${idx === 1 ? -20 : 0}px)` }}>
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
      <section className="px-6 flex flex-col md:flex-row gap-5" style={{ maxWidth: 1200, margin: '80px auto' }}>
        <div className="flex-[2_1_400px] h-[200px] md:h-[280px] rounded-3xl overflow-hidden relative bg-[#111]">
          <img src="https://images.unsplash.com/photo-1598514982205-f36b96d1e8d4?q=80&w=1200&auto=format&fit=crop" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7 }} alt="Promo" />
          <div className="absolute top-6 left-6 md:top-10 md:left-10 text-white">
            <h2 className="text-3xl md:text-4xl font-black leading-tight" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>Buy 2<br/>Get 1 free</h2>
            <p className="mt-2 text-sm opacity-90 hidden sm:block">Available on weekends only.</p>
          </div>
        </div>
        <div className="flex-[1_1_200px] flex flex-row md:flex-col gap-5">
          <div className="flex-1 h-[130px] rounded-3xl bg-[#222] overflow-hidden relative cursor-pointer hover:opacity-90 transition-opacity">
            <img src="https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=600&auto=format&fit=crop" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6 }} alt="Pizza" />
            <span className="absolute bottom-4 right-5 text-white font-black tracking-wider text-sm md:text-base">PIZZA DEALS</span>
          </div>
          <div className="flex-1 h-[130px] rounded-3xl bg-[#222] overflow-hidden relative cursor-pointer hover:opacity-90 transition-opacity">
            <img src="https://images.unsplash.com/photo-1547592180-85f173990554?q=80&w=600&auto=format&fit=crop" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6 }} alt="Soup" />
            <span className="absolute bottom-4 right-5 text-white font-black tracking-wider text-sm md:text-base">HOT SOUPS</span>
          </div>
        </div>
      </section>

      {/* Best Products Section (Real Menu Items) */}
      <section className="px-6" style={{ maxWidth: 1200, margin: '100px auto' }}>
        <div className="flex justify-between items-end mb-16">
          <h2 className="text-3xl md:text-4xl font-black tracking-tight">Best <span style={{ color: 'var(--primary)' }}>Products</span></h2>
          <button onClick={() => navigate('/menu')} className="hover:text-[var(--primary)] transition-colors flex items-center gap-1.5 font-bold text-sm tracking-wide bg-transparent border-none cursor-pointer" style={{ color: 'var(--text-secondary)' }}>
            VIEW ALL <ChevronRight size={14} />
          </button>
        </div>

        <div className="grid gap-x-5 gap-y-14" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
          {bestProducts.length > 0 ? bestProducts.map((item, idx) => {
            const active = idx === 0;
            return (
              <div key={item.id} className="rounded-3xl p-6 pt-8 relative mt-10" style={{ 
                background: active ? 'var(--primary)' : 'var(--cream-dark)', 
                color: active ? 'white' : 'var(--text-primary)',
                boxShadow: active ? '0 20px 40px rgba(255, 107, 0, 0.25)' : 'none',
                border: active ? 'none' : '1px solid rgba(255,107,0,0.1)'
              }}>
                {/* Floating Product Image */}
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-28 h-28 rounded-full overflow-hidden bg-[#f5f5f5]" style={{ boxShadow: '0 10px 20px rgba(0,0,0,0.15)' }}>
                  <img 
                    src={getImageUrl(item.imageUrl) || 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=400&auto=format&fit=crop'} 
                    alt={item.name} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  />
                </div>

                <div className="mt-16">
                  <h3 className="font-extrabold text-[1.1rem] m-0 mb-2 truncate">{item.name}</h3>
                  <div className="flex items-center gap-1 text-[#f59e0b] text-xs mb-3">
                    <Star fill="currentColor" size={12} />
                    <Star fill="currentColor" size={12} />
                    <Star fill="currentColor" size={12} />
                    <Star fill="currentColor" size={12} />
                    <Star fill="currentColor" size={12} />
                    <span className="ml-1" style={{ color: active ? 'rgba(255,255,255,0.7)' : 'var(--text-secondary)' }}>(1k)</span>
                  </div>
                  <p className="text-xs leading-relaxed mb-5 line-clamp-2" style={{ color: active ? 'rgba(255,255,255,0.8)' : 'var(--text-secondary)' }}>
                    {item.description || "Delicious taste for your tastebuds, made fresh every day."}
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="font-extrabold text-[1.25rem]">{formatRM(item.price)}</span>
                    <button onClick={() => navigate('/menu')} className="w-10 h-10 rounded-full border-none flex items-center justify-center cursor-pointer hover:scale-110 transition-transform" style={{ 
                      background: active ? 'white' : 'rgba(255, 107, 0, 0.1)', 
                      color: active ? 'var(--primary)' : 'var(--primary)'
                    }}>
                      <ShoppingBag size={18} strokeWidth={2.5} />
                    </button>
                  </div>
                </div>
              </div>
            );
          }) : (
            <p style={{ color: 'var(--text-secondary)' }}>Loading our delicious menu...</p>
          )}
        </div>
      </section>

      {/* Stories Section */}
      <section className="px-6 flex flex-col md:flex-row items-center gap-10 md:gap-16" style={{ maxWidth: 1200, margin: '120px auto 100px' }}>
        
        <div className="flex-1 w-full relative flex justify-start">
          <div className="absolute bottom-0 left-0 w-[85%] h-[350px] md:h-[450px]" style={{ background: 'var(--primary)', borderRadius: '40px 100px 40px 40px' }}></div>
          <img src="https://images.unsplash.com/photo-1542385151-efd9000785a0?q=80&w=800&auto=format&fit=crop&bg=transparent" alt="Happy Customer" className="w-[90%] relative z-10 ml-[5%]" style={{ filter: 'drop-shadow(10px 20px 30px rgba(0,0,0,0.2))' }} />
        </div>

        <div className="flex-1 w-full text-center md:text-left mt-8 md:mt-0">
          <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 2 }}>The Experience</span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-black leading-tight my-4 md:my-5" style={{ letterSpacing: '-1px' }}>
            Our <span style={{ color: 'var(--primary)' }}>Stories</span> Have<br/>Adventures.
          </h2>
          <p className="mx-auto md:mx-0 text-base mb-10" style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontWeight: 500, maxWidth: 500 }}>
            There are many variations of food, but only a few bring true happiness. Over the years we have served thousands of satisfied customers who return for our authentic flavors and premium quality ingredients.
          </p>
          <div className="flex flex-wrap justify-center md:justify-start gap-4">
            {[
              { stat: '12k+', label: 'Success Food' },
              { stat: '16k+', label: 'Happy Customers' },
              { stat: '20k+', label: 'Foods Delivery' }
            ].map((st, i) => (
              <div key={i} className="flex-1 min-w-[110px] p-4 md:p-5 rounded-3xl text-center" style={{ background: 'rgba(255, 107, 0, 0.05)', border: '1px solid rgba(255, 107, 0, 0.1)' }}>
                <div className="font-black text-2xl md:text-3xl mb-1.5" style={{ color: 'var(--primary)' }}>{st.stat}</div>
                <div className="text-[0.7rem] md:text-xs font-bold uppercase" style={{ color: 'var(--text-secondary)' }}>{st.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer Section */}
      <footer style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', padding: '60px 24px 30px', marginTop: 100 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '40px' }}>
          
          {/* Brand Col */}
          <div>
            <BkbLogo size={36} showText={true} />
            <p className="mt-4 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)', maxWidth: 300 }}>
              Serving the best crispy chicken, grilled burgers, and fresh sides. Your satisfaction is our delicious priority.
            </p>
            <div className="flex gap-4 mt-6">
              <a href="#" className="w-10 h-10 rounded-full flex items-center justify-center hover:-translate-y-1 transition-transform" style={{ background: 'rgba(255,107,0,0.1)', color: 'var(--primary)' }}>
                <Facebook size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full flex items-center justify-center hover:-translate-y-1 transition-transform" style={{ background: 'rgba(255,107,0,0.1)', color: 'var(--primary)' }}>
                <Twitter size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full flex items-center justify-center hover:-translate-y-1 transition-transform" style={{ background: 'rgba(255,107,0,0.1)', color: 'var(--primary)' }}>
                <Instagram size={18} />
              </a>
            </div>
          </div>

          {/* Links Col */}
          <div>
            <h4 className="font-bold text-lg mb-5">Quick Links</h4>
            <div className="flex flex-col gap-3 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              <a href="#" className="hover:text-[var(--primary)] transition-colors no-underline text-inherit">Home</a>
              <a href="#menu" onClick={() => navigate('/menu')} className="hover:text-[var(--primary)] transition-colors no-underline text-inherit">Our Menu</a>
              <a href="#services" className="hover:text-[var(--primary)] transition-colors no-underline text-inherit">Our Services</a>
              <a href="#about" className="hover:text-[var(--primary)] transition-colors no-underline text-inherit">About Us</a>
              <a href="/login" onClick={(e) => { e.preventDefault(); navigate('/login'); }} className="hover:text-[var(--primary)] transition-colors no-underline text-inherit">Staff Login</a>
            </div>
          </div>

          {/* Contact Col */}
          <div>
            <h4 className="font-bold text-lg mb-5">Contact Us</h4>
            <div className="flex flex-col gap-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
              <div className="flex items-start gap-3">
                <MapPin size={18} className="mt-0.5" style={{ color: 'var(--primary)' }} />
                <span>123 Food Street, Culinary District, FK 90210</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone size={18} style={{ color: 'var(--primary)' }} />
                <span>+60 12-345 6789</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail size={18} style={{ color: 'var(--primary)' }} />
                <span>hello@bukankedaiburger.com</span>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mt-16 pt-8 border-t border-[var(--border)] text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
          &copy; {new Date().getFullYear()} Bukan Kedai Burger. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { BkbLogo } from '../components/ui/BkbLogo';
import { ArrowRight, Flame, Star, Award, ShieldCheck, Moon, Sun, ShoppingBag } from 'lucide-react';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('bkb-theme') as 'light' | 'dark') || 'light';
  });

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('bkb-theme', newTheme);
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const handleOrderNow = () => {
    if (isAuthenticated) {
      navigate('/menu');
    } else {
      navigate('/login');
    }
  };

  const signatureItems = [
    { 
      name: 'BKB Double Beef Burger', 
      desc: 'Double flame-grilled beef patties with melted cheddar cheese and signature special sauce.', 
      price: 'RM16.90', 
      image: '/bkb_double_beef_burger.png', 
      rating: '4.9',
      tag: 'BESTSELLER'
    },
    { 
      name: 'BKB Special Oblong', 
      desc: 'Oblong beef patty wrapped in egg, grilled with local onions and black pepper sauce.', 
      price: 'RM12.50', 
      image: '/bkb_special_oblong.png', 
      rating: '4.8',
      tag: 'LOCAL FAVOURITE'
    },
    { 
      name: 'Crispy Chicken Zesty', 
      desc: 'Crispy deep-fried chicken thigh topped with fresh lettuce and zesty mayonnaise.', 
      price: 'RM14.20', 
      image: '/bkb_crispy_chicken_burger.png', 
      rating: '4.7',
      tag: 'NEW RELEASE'
    }
  ];

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--background)',
        color: 'var(--text-primary)',
        transition: 'all 0.3s ease',
        overflowX: 'hidden'
      }}
    >
      {/* Premium Header */}
      <header
        style={{
          width: '100%',
          borderBottom: '1px solid var(--border)',
          transition: 'border-color 0.3s ease',
          background: 'var(--background)',
          position: 'relative',
          zIndex: 100
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '18px 40px',
            width: '100%',
            margin: '0 auto'
          }}
        >
          <BkbLogo size={40} horizontal={true} />
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            {/* Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="premium-nav-theme-toggle"
              style={{
                background: 'var(--cream-dark)',
                border: 'none',
                width: 38,
                height: 38,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'var(--text-dark)',
                transition: 'all 0.2s ease',
              }}
            >
              {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            </button>

            {isAuthenticated ? (
              <button
                onClick={() => navigate('/menu')}
                className="premium-nav-btn-primary"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '9px 18px',
                  fontSize: '0.82rem',
                  fontFamily: 'Inter',
                  fontWeight: 600,
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  color: 'white',
                  background: 'var(--primary)',
                  transition: 'all 0.15s ease'
                }}
              >
                <ShoppingBag size={14} /> Enter Store
              </button>
            ) : (
              <>
                <button
                  onClick={() => navigate('/login')}
                  className="premium-nav-btn-text"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-primary)',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    fontFamily: 'Inter',
                    padding: '8px 12px'
                  }}
                >
                  Sign In
                </button>
                <button
                  onClick={() => navigate('/register')}
                  className="premium-nav-btn-primary"
                  style={{
                    padding: '9px 18px',
                    fontSize: '0.82rem',
                    fontFamily: 'Inter',
                    fontWeight: 600,
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    color: 'white',
                    background: 'var(--primary)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  Join Us
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '60px 24px',
          alignItems: 'center',
          width: '100%'
        }}
        className="landing-hero-grid"
      >
        {/* Left Side: Brand Story & Slogan */}
        <div style={{ zIndex: 2 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(255, 107, 0, 0.08)',
              color: 'var(--primary)',
              padding: '6px 12px',
              borderRadius: '99px',
              fontSize: '0.78rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '1px',
              marginBottom: '24px'
            }}
          >
            <Flame size={14} fill="currentColor" /> Premium Street Burgers
          </div>

          <h1
            style={{
              fontSize: '3.6rem',
              fontWeight: 900,
              lineHeight: 1.1,
              letterSpacing: '-1.5px',
              color: 'var(--text-dark)',
              marginBottom: '20px'
            }}
          >
            <span style={{ color: 'var(--primary)' }}>Crafted Fresh.</span>
            <br />
            Served Fast.
            <br />
            Loved by Everyone.
          </h1>

          <p
            style={{
              fontSize: '1.05rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
              maxWidth: '480px',
              marginBottom: '32px'
            }}
          >
            Welcome to Bukan Kedai Burger. We craft premium, mouth-watering street burgers freshly grilled upon request. Indulge in local culinary excellence today!
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
            <button
              onClick={handleOrderNow}
              className="btn-primary"
              style={{
                width: 'auto',
                padding: '12px 28px',
                fontSize: '0.9rem'
              }}
            >
              Order Online Now <ArrowRight size={16} style={{ marginLeft: 4 }} />
            </button>
            {!isAuthenticated && (
              <button
                onClick={() => navigate('/login')}
                className="btn-outline"
                style={{
                  width: 'auto',
                  padding: '11px 28px',
                  fontSize: '0.9rem'
                }}
              >
                Continue as Guest
              </button>
            )}
          </div>

          {/* Social Proof */}
          <div style={{ display: 'flex', gap: '28px', marginTop: '48px', borderTop: '1px solid var(--border)', paddingTop: '28px' }}>
            <div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-dark)' }}>4.9 ★</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Customer Satisfaction Rating</div>
            </div>
            <div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-dark)' }}>10K+</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Burgers Served Freshly</div>
            </div>
            <div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-dark)' }}>100%</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Halal & Premium Ingredients</div>
            </div>
          </div>
        </div>

        {/* Right Side: Visual Image & Floating Elements */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', width: '100%' }}>
          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '520px',
              height: '460px',
              borderRadius: '24px',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-lg)',
              border: '1.5px solid var(--border)'
            }}
          >
            <img 
              src="/bkb_premium_hero_burger.png" 
              alt="Signature BKB Gourmet Burger" 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            />
            {/* Visual gradient overlay to blend */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to bottom, rgba(0,0,0,0) 50%, rgba(0,0,0,0.7) 100%)',
                zIndex: 1
              }}
            />
            
            {/* Floating Hot Badge */}
            <div
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'rgba(255, 107, 0, 0.9)',
                color: 'white',
                padding: '6px 12px',
                borderRadius: '99px',
                fontSize: '0.7rem',
                fontWeight: 800,
                letterSpacing: '0.8px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 10px rgba(255,107,0,0.35)',
                zIndex: 3
              }}
            >
              <Flame size={12} fill="white" /> HOT & FRESH
            </div>

            {/* Mini Glassmorphism Card */}
            <div
              style={{
                position: 'absolute',
                bottom: '24px',
                left: '24px',
                right: '24px',
                background: 'rgba(26, 26, 26, 0.65)',
                backdropFilter: 'blur(16px) saturate(140%)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '16px',
                padding: '20px',
                zIndex: 4,
                boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.25)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#FFF' }}>
                <Award size={18} style={{ color: 'var(--secondary)' }} />
                <span style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase' }}>BKB Loyalty Club</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#FFF', opacity: 0.9, marginTop: '6px', fontWeight: 500, lineHeight: 1.4 }}>
                Earn points with every bite. Join today to get your first free burger!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Signature Showcase Section */}
      <section
        style={{
          background: 'var(--secondary-bg)',
          transition: 'all 0.3s ease',
          padding: '80px 24px',
          borderTop: '1px solid var(--border)',
          borderBottom: '1px solid var(--border)'
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-dark)' }}>
              Explore Our Signature BKB Menu
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '8px' }}>
              Hand-pressed patties, flame-grilled and packed with delicious local flavors.
            </p>
          </div>

          <div
            className="items-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '24px'
            }}
          >
            {signatureItems.map((item, idx) => (
              <div
                key={idx}
                className="card card-hover"
                style={{
                  background: 'var(--background)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px'
                }}
              >
                <div
                  style={{
                    height: '200px',
                    borderRadius: 'var(--radius-md)',
                    overflow: 'hidden',
                    position: 'relative',
                    boxShadow: 'inset 0 0 20px rgba(0,0,0,0.02)'
                  }}
                >
                  <img 
                    src={item.image} 
                    alt={item.name} 
                    className="signature-card-img"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  />
                  {item.tag && (
                    <span style={{
                      position: 'absolute',
                      top: '12px',
                      left: '12px',
                      background: 'rgba(26, 26, 26, 0.75)',
                      backdropFilter: 'blur(4px)',
                      color: 'white',
                      padding: '4px 10px',
                      borderRadius: '99px',
                      fontSize: '0.62rem',
                      fontWeight: 800,
                      letterSpacing: '0.5px'
                    }}>
                      {item.tag}
                    </span>
                  )}
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-dark)' }}>
                      {item.name}
                    </h3>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 3 }}>
                      ★ {item.rating}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '6px', lineHeight: 1.4 }}>
                    {item.desc}
                  </p>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: 'auto',
                    paddingTop: '12px',
                    borderTop: '1px solid var(--border)'
                  }}
                >
                  <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--primary)' }}>
                    {item.price}
                  </span>
                  <button
                    onClick={() => navigate('/login')}
                    style={{
                      background: 'rgba(255, 107, 0, 0.06)',
                      color: 'var(--primary)',
                      border: '1.5px solid rgba(255, 107, 0, 0.15)',
                      borderRadius: '8px',
                      padding: '8px 14px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      fontFamily: 'Outfit'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'var(--primary)';
                      e.currentTarget.style.color = 'white';
                      e.currentTarget.style.borderColor = 'var(--primary)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'rgba(255, 107, 0, 0.06)';
                      e.currentTarget.style.color = 'var(--primary)';
                      e.currentTarget.style.borderColor = 'rgba(255, 107, 0, 0.15)';
                    }}
                  >
                    Order Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section style={{ padding: '60px 24px', maxWidth: '1200px', margin: '0 auto' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '32px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
            <div style={{ color: 'var(--primary)', background: 'rgba(255,107,0,0.08)', padding: '12px', borderRadius: '12px' }}>
              <ShieldCheck size={24} />
            </div>
            <div>
              <h4 style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-dark)' }}>Strict Quality Standards</h4>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.4 }}>Only the freshest local beef, chicken, and bread, sourced daily.</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
            <div style={{ color: 'var(--primary)', background: 'rgba(255,107,0,0.08)', padding: '12px', borderRadius: '12px' }}>
              <Flame size={24} />
            </div>
            <div>
              <h4 style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-dark)' }}>Flame Grilled Fresh</h4>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.4 }}>Every single patty is grilled on-the-spot upon receiving your order.</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
            <div style={{ color: 'var(--primary)', background: 'rgba(255,107,0,0.08)', padding: '12px', borderRadius: '12px' }}>
              <Award size={24} />
            </div>
            <div>
              <h4 style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-dark)' }}>Earn Star Rewards</h4>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.4 }}>Redeem exclusive discount vouchers, merchandise, or free meals.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          borderTop: '1px solid var(--border)',
          transition: 'all 0.3s ease',
          padding: '24px 24px',
          textAlign: 'center',
          fontSize: '0.78rem',
          color: 'var(--text-secondary)'
        }}
      >
        <p>© 2026 Bukan Kedai Burger (BKB). Crafted with passion for burger lovers.</p>
      </footer>

      <style>{`
        .landing-hero-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 40px;
          width: 100%;
        }
        @media (min-width: 1024px) {
          .landing-hero-grid {
            grid-template-columns: 1.15fr 0.85fr;
            gap: 60px;
          }
        }
        .signature-card-img {
          transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .card-hover:hover .signature-card-img {
          transform: scale(1.05);
        }

        /* ─── Premium Navigation Styles ─── */
        .premium-nav-theme-toggle {
          transition: all 0.2s ease;
        }
        .premium-nav-theme-toggle:hover {
          transform: scale(1.08);
          background: var(--border) !important;
        }
        .premium-nav-btn-text:hover {
          color: var(--primary) !important;
        }
        .premium-nav-btn-primary:hover {
          transform: translateY(-1.5px);
          box-shadow: 0 6px 16px rgba(255, 107, 0, 0.35) !important;
          filter: brightness(1.05);
        }
        .premium-nav-btn-primary:active {
          transform: translateY(0);
        }
      `}</style>
    </div>
  );
};

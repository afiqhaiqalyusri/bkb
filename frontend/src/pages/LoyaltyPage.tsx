import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Gift } from 'lucide-react';
import { LoyaltyAccount, LoyaltyReward } from '../types';
import { loyaltyService } from '../services/loyalty.service';
import { menuService } from '../services/menu.service';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import { PageShell } from '../components/PageShell';
import { ErrorState } from '../components/ui/ErrorState';
import toast from 'react-hot-toast';
import { useConfirmation } from '../components/ConfirmationProvider';
import { BurgerLoader } from '../components/ui/BurgerLoader';
import { getFoodImage } from '../utils/foodImages';

export const LoyaltyPage: React.FC = () => {
  const navigate = useNavigate();
  const { confirm } = useConfirmation();
  const { user, isAuthenticated } = useAuthStore();
  const cartCount = useCartStore(s => s.itemCount());
  
  const [account, setAccount] = useState<LoyaltyAccount | null>(null);
  const [rewards, setRewards] = useState<LoyaltyReward[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [redeeming, setRedeeming] = useState<number | null>(null);

  const loadLoyaltyData = () => {
    setLoading(true);
    setError(false);
    const promises = [
      loyaltyService.getRewards().then(r => setRewards(r.data))
    ];
    if (isAuthenticated && user?.role === 'CUSTOMER') {
      promises.push(loyaltyService.getAccount().then(r => setAccount(r.data)) as any);
    }
    Promise.all(promises)
      .then(() => setError(false))
      .catch((err) => {
        setError(true);
        toast.error('Failed to load loyalty data');
        console.error(err);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadLoyaltyData();
  }, [isAuthenticated, user]);

  const handleRedeem = async (rewardId: number) => {
    const reward = rewards.find(r => r.id === rewardId);
    if (!reward) return;
    const confirmed = await confirm({
      title: 'Redeem Reward',
      message: `Are you sure you want to spend ${reward.pointsCost} points to redeem "${reward.name}"?`,
      type: 'warning',
      confirmLabel: 'Redeem',
      cancelLabel: 'Cancel'
    });
    if (!confirmed) return;

    setRedeeming(rewardId);
    try {
      await loyaltyService.redeem(rewardId);
      const res = await loyaltyService.getAccount();
      setAccount(res.data);
      toast.success('Reward redeemed! 🎉', { icon: '🎁', duration: 2500 });

      if (reward.menuItemId) {
        try {
          const itemRes = await menuService.getById(reward.menuItemId);
          if (itemRes.data) {
            useCartStore.getState().addItem(itemRes.data, 1, [], true);
            toast.success(`"${itemRes.data.name}" has been added to your cart for free! 🛒`);
          }
        } catch (itemErr) {
          toast.error('Points redeemed, but failed to automatically add the item to your cart.');
          console.error(itemErr);
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Redemption failed');
    } finally {
      setRedeeming(null);
    }
  };

  if (loading) return (
    <PageShell activeKey="/loyalty">
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'80vh' }}>
        <BurgerLoader message="Loading rewards..." />
      </div>
    </PageShell>
  );

  if (error) return (
    <PageShell activeKey="/loyalty">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 120px)', padding: 16 }}>
        <ErrorState onRetry={loadLoyaltyData} retrying={loading} />
      </div>
    </PageShell>
  );

  return (
    <PageShell activeKey="/loyalty">
      <div className="page-content" style={{ paddingBottom: 60 }}>
        
        {/* Header Section */}
        <div style={{ marginBottom: 24 }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-secondary)' }}>
            Loyalty Club
          </span>
          <h1 style={{ fontFamily: 'Outfit', fontWeight: 900, fontSize: '1.75rem', color: 'var(--text-primary)', marginTop: 4 }}>
            BKB Rewards Club
          </h1>
        </div>
 
        <div style={{ display: 'flex', flexDirection: window.innerWidth < 1024 ? 'column' : 'row', gap: 24, alignItems: 'flex-start' }}>
          
          {/* Left Column: Points balance card & instructions */}
          <div style={{ flex: '1 1 350px', width: '100%', display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Points Card */}
            {isAuthenticated && user?.role === 'CUSTOMER' && account ? (
              <div className="animate-fade-in" style={{
                background: 'var(--primary)',
                borderRadius: 'var(--radius-lg)',
                padding: '24px',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-sm)',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.1)'
              }}>
                <div style={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
                <div style={{ position: 'absolute', bottom: -30, right: 30, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', fontWeight: 800, letterSpacing: '0.5px' }}>
                    <Gift size={14} color="white" /> BKB REWARDS MEMBER
                  </div>
                  <div style={{ fontSize: '0.65rem', fontWeight: 700, padding: '3px 8px', borderRadius: 99, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)' }}>
                    ACTIVE
                  </div>
                </div>
                
                <div style={{ fontSize: '3.2rem', fontWeight: 900, fontFamily: 'Outfit', marginTop: 16, lineHeight: 1.0 }}>
                  {account.points} <span style={{ fontSize: '1.1rem', fontWeight: 600, opacity: 0.9 }}>pts</span>
                </div>

                <div style={{ fontSize: '0.78rem', opacity: 0.9, marginTop: 4 }}>
                  Estimated Value: <span style={{ fontWeight: 700 }}>RM {(account.points * 0.1).toFixed(2)}</span>
                </div>
                
                <div style={{ fontSize: '0.9rem', fontWeight: 700, marginTop: 16, opacity: 0.9 }}>
                  {user.name}
                </div>
              </div>
            ) : (
              <div style={{
                background: 'var(--surface)',
                borderRadius: 'var(--radius-lg)',
                border: '1.5px solid var(--border)',
                padding: '24px',
                textAlign: 'center',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <div style={{
                  width: 56, height: 56, borderRadius: '14px',
                  background: 'rgba(255,107,0,0.08)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.8rem', margin: '0 auto 16px auto', color: 'var(--primary)'
                }}>
                  ⭐
                </div>
                <h3 style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-primary)', marginBottom: 6 }}>
                  Join BKB Rewards Club
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 18, lineHeight: 1.4 }}>
                  Earn points with every purchase and redeem them for free signature burgers!
                </p>
                <button
                  onClick={() => navigate('/login')}
                  className="btn-primary"
                  style={{ width: '100%', height: 42 }}
                >
                  Create Account / Sign In
                </button>
              </div>
            )}
 
            {/* How it works info */}
            <div style={{
              background: 'var(--surface)',
              borderRadius: 'var(--radius-lg)',
              border: '1.5px solid var(--border)',
              padding: '24px',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <h3 style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: 16 }}>
                How It Works
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[
                  { n: 1, text: 'Order burgers or oblongs from BKB' },
                  { n: 2, text: 'Earn points (1 pt per RM10 spend)' },
                  { n: 3, text: 'Redeem points for FREE meals!' },
                ].map(step => (
                  <div key={step.n} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%',
                      background: 'var(--cream-dark)',
                      color: 'var(--primary)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 800, fontSize: '0.85rem', flexShrink: 0,
                    }}>{step.n}</div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                      {step.text}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
 
          {/* Right Column: Available Rewards Grid */}
          <div style={{ flex: '1.6 1 500px', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                Available Vouchers
              </h3>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                Redeem instantly
              </span>
            </div>
 
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 20 }}>
              {rewards.map(reward => {
                const canRedeem = account && account.points >= reward.pointsCost;
                const pointsNeeded = account ? reward.pointsCost - account.points : reward.pointsCost;
                const displayImage = reward.imageUrl || reward.menuItemImageUrl || getFoodImage('', reward.name);
 
                return (
                  <div
                    key={reward.id}
                    style={{
                      background: 'var(--surface)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 10,
                      minHeight: 290,
                      border: '1.5px solid var(--border)',
                      borderRadius: 'var(--radius-lg)',
                      padding: 12,
                      boxShadow: 'var(--shadow-sm)',
                      transition: 'all 0.22s ease-in-out',
                      position: 'relative'
                    }}
                    className="hover:-translate-y-1 hover:shadow-md"
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = 'translateY(-3px)';
                      e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                      e.currentTarget.style.borderColor = 'var(--primary)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'none';
                      e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                      e.currentTarget.style.borderColor = 'var(--border)';
                    }}
                  >
                    <img
                      src={displayImage}
                      alt={reward.name}
                      style={{ width: '100%', height: 125, borderRadius: 'var(--radius-md)', objectFit: 'cover', background: 'var(--cream-dark)' }}
                    />
                    <div style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '0.88rem', color: 'var(--text-primary)', lineHeight: 1.25 }}>
                      {reward.name}
                    </div>
                    {reward.description && (
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
                        {reward.description}
                      </div>
                    )}
                    <div style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                      ⭐ {reward.pointsCost} pts
                    </div>
                    
                    <div style={{ marginTop: 'auto', paddingTop: 8 }}>
                      {isAuthenticated && user?.role === 'CUSTOMER' ? (
                        canRedeem ? (
                          <button
                            onClick={() => handleRedeem(reward.id)}
                            disabled={redeeming === reward.id}
                            style={{
                              padding: '10px 12px',
                              fontSize: '0.8rem',
                              borderRadius: 10,
                              height: 38,
                              width: '100%',
                              background: 'var(--primary)',
                              color: 'white',
                              border: 'none',
                              fontFamily: 'Outfit',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.15s'
                            }}
                          >
                            {redeeming === reward.id ? (
                              <div className="spinner" style={{ width: 16, height: 16, borderWidth: 1.5, borderColor: '#fff', borderTopColor: 'transparent' }} />
                            ) : (
                              <>Redeem Voucher</>
                            )}
                          </button>
                        ) : (
                          <div style={{
                            padding: '10px 4px',
                            background: 'var(--cream-dark)',
                            borderRadius: '10px',
                            fontSize: '0.74rem',
                            color: 'var(--text-secondary)',
                            fontWeight: 700,
                            border: '1.5px solid var(--border)',
                            textAlign: 'center'
                          }}>
                            Need {pointsNeeded} more pts
                          </div>
                        )
                      ) : (
                        <div style={{
                          padding: '10px 4px',
                          background: 'var(--cream-dark)',
                          borderRadius: '10px',
                          fontSize: '0.74rem',
                          color: 'var(--text-secondary)',
                          fontWeight: 700,
                          border: '1.5px solid var(--border)',
                          textAlign: 'center'
                        }}>
                          Sign In to Redeem
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
 
        </div>

        {/* Transactions History Section */}
        {isAuthenticated && user?.role === 'CUSTOMER' && account && (
          <div style={{ marginTop: 40, borderTop: '1px solid var(--border)', paddingTop: 30 }}>
            <h3 style={{ fontFamily: 'Outfit', fontWeight: 900, fontSize: '1.25rem', color: 'var(--text-primary)', marginBottom: 20 }}>
              Points History
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth < 768 ? '1fr' : '1fr 1fr', gap: 24 }}>
              {/* Points Earned History */}
              <div style={{ background: 'var(--surface)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 20, boxShadow: 'var(--shadow-sm)' }}>
                <h4 style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                  📈 Points History
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 250, overflowY: 'auto' }}>
                  {account.transactions?.filter(t => t.type === 'EARN').length > 0 ? (
                    account.transactions.filter(t => t.type === 'EARN').map(t => (
                      <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem', paddingBottom: 8, borderBottom: '1px solid var(--border)' }}>
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Points Earned</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                            {t.orderNumber ? `Order #${t.orderNumber}` : ''} • {new Date(t.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <div style={{ color: 'var(--success)', fontWeight: 800 }}>+{t.points} pts</div>
                      </div>
                    ))
                  ) : (
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textAlign: 'center', padding: '20px 0' }}>No points earned yet.</div>
                  )}
                </div>
              </div>

              {/* Redemption History */}
              <div style={{ background: 'var(--surface)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 20, boxShadow: 'var(--shadow-sm)' }}>
                <h4 style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                  🎁 Reward Redemption History
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 250, overflowY: 'auto' }}>
                  {account.transactions?.filter(t => t.type === 'REDEEM').length > 0 ? (
                    account.transactions.filter(t => t.type === 'REDEEM').map(t => (
                      <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem', paddingBottom: 8, borderBottom: '1px solid var(--border)' }}>
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Reward Redeemed</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{new Date(t.createdAt).toLocaleDateString()}</div>
                        </div>
                        <div style={{ color: 'var(--red)', fontWeight: 800 }}>-{t.points} pts</div>
                      </div>
                    ))
                  ) : (
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textAlign: 'center', padding: '20px 0' }}>No rewards redeemed yet.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
};

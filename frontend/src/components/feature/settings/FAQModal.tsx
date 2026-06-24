import React from 'react';
import { FAQItem } from './FAQItem';

export const FAQModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const faqData = [
    { q: 'How do I place an order?', a: 'Browse the menu, customise your item, add it to your cart and proceed to checkout. You can pay via card or e-wallet.' },
    { q: 'Can I customise my burger?', a: 'Yes! Tap on any menu item and use the customiser to adjust toppings and sauce levels to your taste.' },
    { q: 'How do I track my order?', a: 'After placing an order, go to the Order Tracking page (accessible from Settings > Order History or the active order pop-up) to see real-time status.' },
    { q: 'What are Loyalty Stars?', a: 'You earn 1 star for every RM1 spent. Stars can be redeemed for free items and exclusive vouchers via the Rewards page.' },
    { q: 'How do I apply a voucher?', a: 'Vouchers can be applied during checkout. Enter your voucher code in the "Promo Code" field before proceeding to payment.' },
    { q: 'Can I cancel my order?', a: 'Orders can only be cancelled before they are accepted by the kitchen. Contact our staff immediately if you need to cancel.' },
    { q: 'Is my payment information secure?', a: 'Yes. All payments are processed via encrypted channels. We do not store your card details on our servers.' },
    { q: 'How do I update my profile?', a: 'Go to Settings > Account > Edit Profile Details to update your name, email, or phone number.' },
  ];

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 2000,
        background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
        animation: 'modal-backdrop-fade-in 0.2s ease'
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 560,
          background: 'var(--white)', borderRadius: 24,
          boxShadow: '0 24px 80px rgba(0,0,0,0.28)',
          maxHeight: '85vh', display: 'flex', flexDirection: 'column',
          animation: 'modal-card-scale-up 0.25s cubic-bezier(0.34,1.56,0.64,1)',
          overflow: 'hidden',
        }}
      >
        <div style={{
          padding: '24px 24px 20px',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(255,107,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              </div>
              <div>
                <h2 style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '1.15rem', color: 'var(--text-primary)', margin: 0 }}>Help Center & FAQ</h2>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0, marginTop: 2 }}>Frequently asked questions</p>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ width: 32, height: 32, borderRadius: '50%', border: 'none', background: 'var(--cream-dark)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', transition: 'transform 0.2s ease' }}
            onMouseEnter={e => e.currentTarget.style.transform = 'rotate(90deg)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'rotate(0deg)'}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <div style={{ overflowY: 'auto', padding: '16px 24px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {faqData.map((item, i) => (
            <FAQItem key={i} q={item.q} a={item.a} />
          ))}
        </div>
      </div>
    </div>
  );
};

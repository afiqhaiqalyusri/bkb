import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { orderService } from '../services/order.service';
import { paymentService } from '../services/payment.service';
import { formatRM } from '../utils/formatCurrency';
import { PageShell } from '../components/PageShell';
import { useAuthStore } from '../store/authStore';
import { ShieldCheck, Timer, RefreshCw, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { BurgerLoader } from '../components/ui/BurgerLoader';
import { FullScreenLoader } from '../components/ui/FullScreenLoader';
import { QRSkeleton } from '../components/ui/SkeletonLoader';

// Dynamic details for payment channels matching Codashop experience
const THEMES: Record<string, {
  name: string;
  gradient: string;
  primaryColor: string;
  borderColor: string;
  glowColor: string;
  logo: React.ReactNode;
  instructions: string[];
}> = {
  TNG: {
    name: "Touch 'n Go eWallet",
    gradient: "linear-gradient(135deg, #005fa9, #0082c8)",
    primaryColor: "#005fa9",
    borderColor: "#005fa9",
    glowColor: "rgba(0, 95, 169, 0.25)",
    logo: (
      <svg width="42" height="42" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="32" height="32" rx="8" fill="#005fa9" />
        <path d="M6 10H14M10 10V22M15 14C15 12 17 12 17 12H23C23 12 25 12 25 14V18C25 20 23 20 23 20H17M15 20V22M18 16H22" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
        <circle cx="21" cy="21" r="2.5" fill="#fbc02d" />
      </svg>
    ),
    instructions: [
      "Open your Touch 'n Go eWallet application on your phone.",
      "Tap the 'Scan' scanner button on the main screen.",
      "Point your camera at the DuitNow QR code above.",
      "Verify the payment details and enter your 6-digit e-Wallet PIN.",
      "Keep this browser page open until the authorization succeeds."
    ]
  },
  SHOPEEPAY: {
    name: "ShopeePay",
    gradient: "linear-gradient(135deg, #ee4d2d, #ff6b35)",
    primaryColor: "#ee4d2d",
    borderColor: "#ee4d2d",
    glowColor: "rgba(238, 77, 45, 0.25)",
    logo: (
      <svg width="42" height="42" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="32" height="32" rx="8" fill="#ee4d2d" />
        <path d="M16 6C10.5 6 10 10 10 12.5C10 17 22 17.5 22 20.5C22 22 20.5 23 16 23C11 23 10.5 21 10.5 20" stroke="white" strokeWidth="3" strokeLinecap="round"/>
        <circle cx="16" cy="14.5" r="2.5" fill="white" />
      </svg>
    ),
    instructions: [
      "Open your Shopee app and select ShopeePay.",
      "Tap on the Scan icon and point it at the dynamic QR code.",
      "Ensure the payment amount matches and choose payment balance.",
      "Input your ShopeePay security code to authorize.",
      "Wait here for confirmation to automatically refresh."
    ]
  },
  GRABPAY: {
    name: "GrabPay",
    gradient: "linear-gradient(135deg, #00b14f, #00c75c)",
    primaryColor: "#00b14f",
    borderColor: "#00b14f",
    glowColor: "rgba(0, 177, 79, 0.25)",
    logo: (
      <svg width="42" height="42" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="32" height="32" rx="8" fill="#00b14f" />
        <path d="M8 12C12 12 13 8 20 8M12 24C19 24 20 20 24 20M7 18C12 18 13 14 25 14" stroke="white" strokeWidth="3.2" strokeLinecap="round"/>
      </svg>
    ),
    instructions: [
      "Open your Grab mobile application.",
      "Navigate to Payments -> Scan to Pay.",
      "Scan the DuitNow transaction QR code shown above.",
      "Select GrabPay Wallet as the funding source.",
      "Confirm payment and check your tracking page status."
    ]
  },
  BOOST: {
    name: "Boost eWallet",
    gradient: "linear-gradient(135deg, #ee2e24, #ff4c42)",
    primaryColor: "#ee2e24",
    borderColor: "#ee2e24",
    glowColor: "rgba(238, 46, 36, 0.25)",
    logo: (
      <svg width="42" height="42" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="32" height="32" rx="8" fill="#ee2e24" />
        <rect x="8" y="8" width="16" height="16" rx="4" fill="white" />
        <path d="M12 12V20H15.5C17.5 20 18.5 19 18.5 17.5C18.5 16.5 17.5 15.8 16 15.8C17.5 15.8 18 15 18 14C18 12.8 17 12 15 12H12ZM14.2 13.8H15.2C15.8 13.8 16.1 14.1 16.1 14.5C16.1 14.9 15.8 15.2 15.2 15.2H14.2V13.8ZM14.2 16.7H15.5C16.2 16.7 16.6 17 16.6 17.5C16.6 18 16.2 18.3 15.5 18.3H14.2V16.7Z" fill="#ee2e24" />
      </svg>
    ),
    instructions: [
      "Launch your Boost app and select Scan & Pay.",
      "Direct your mobile scanner to the dynamic QR code above.",
      "Check the outlet details and confirm the order amount.",
      "Tap authorize and enter your security PIN code.",
      "Wait on this page for the completion signal."
    ]
  },
  DUITNOW: {
    name: "DuitNow QR",
    gradient: "linear-gradient(135deg, #d91b5c, #9f0b3e)",
    primaryColor: "#d91b5c",
    borderColor: "#d91b5c",
    glowColor: "rgba(217, 27, 92, 0.25)",
    logo: (
      <svg width="42" height="42" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="32" height="32" rx="8" fill="#d91b5c" />
        <circle cx="16" cy="16" r="8" fill="white" />
        <circle cx="16" cy="16" r="4.5" fill="#d91b5c" />
        <circle cx="16" cy="16" r="2.2" fill="#005fa9" />
      </svg>
    ),
    instructions: [
      "Open your banking or e-wallet application (TNG, MAE, GrabPay, Boost).",
      "Tap the QR / Scan option on the dashboard.",
      "Scan the DuitNow QR code rendered above.",
      "Confirm amount and authorize via biometric or PIN.",
      "Do not close this page; tracking will resume automatically."
    ]
  }
};

export const PaymentPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>(); // acts as order reference number (e.g. ORD12345)
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();

  const searchParams = new URLSearchParams(location.search);
  const channel = searchParams.get('channel') || 'DUITNOW';
  const token = searchParams.get('token') || '';

  const activeTheme = THEMES[channel.toUpperCase()] || THEMES.DUITNOW;

  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes countdown
  const [scanStatus, setScanStatus] = useState<'waiting' | 'detected' | 'verifying' | 'authorizing' | 'success' | 'failed'>('waiting');
  const [logs, setLogs] = useState<string[]>([]);
  const [qrLoaded, setQrLoaded] = useState(false);

  const consoleRef = useRef<HTMLDivElement>(null);

  const addLog = (msg: string) => {
    const time = new Date().toTimeString().slice(0, 8);
    setLogs(prev => [...prev, `[${time}] ${msg}`]);
  };

  const loadOrder = async () => {
    if (!orderId) {
      setErrorMsg("Missing Order Reference Parameter.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setErrorMsg(null);
      
      // Fetch using secure reference endpoint and token validation
      const res = await orderService.getOrderByRef(orderId, token);
      const orderData = res.data;

      // Validate ownership for secure payment protection
      if (orderData.customerId && user && user.role !== 'GUEST') {
        if (orderData.customerId !== user.id) {
          setErrorMsg("Access Denied: You do not own this order transaction.");
          setLoading(false);
          return;
        }
      }

      setOrder(orderData);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to retrieve secure payment session details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrder();
  }, [orderId, token]);

  // Countdown timer logic
  useEffect(() => {
    if (loading || errorMsg || !order || scanStatus === 'success') return;
    if (timeLeft <= 0) {
      addLog("Payment session window expired.");
      toast.error('Payment time window expired.', { id: 'timer-expiry' });
      setTimeout(() => navigate('/menu', { replace: true }), 1500);
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, loading, errorMsg, order, navigate, scanStatus]);

  // Initialize status logs console
  useEffect(() => {
    if (!order) return;
    setLogs([]);
    const initLogs = async () => {
      addLog("Dynamic payment session initialized.");
      await new Promise(r => setTimeout(r, 400));
      addLog("Connecting to secure simulated backend gateway...");
      await new Promise(r => setTimeout(r, 500));
      addLog("Dynamic payload successfully constructed.");
      await new Promise(r => setTimeout(r, 400));
      addLog(`Dynamic QR generated for: ${activeTheme.name}`);
      await new Promise(r => setTimeout(r, 400));
      addLog("Listening for transaction callbacks...");
      await new Promise(r => setTimeout(r, 400));
      addLog("Waiting for customer to scan QR code...");
    };
    initLogs();
  }, [order, channel]);

  // Page Exit Guard during active payment processing
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (paying) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [paying]);

  // Scroll transaction log to bottom
  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [logs]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Simulate Payment States Success / Failure
  const handleSimulatePayment = async (success: boolean) => {
    if (!order || paying || scanStatus === 'success') return;
    setPaying(true);

    // Transition 1: QR Scanned / Detected
    setScanStatus('detected');
    addLog(`Incoming scan connection detected from ${activeTheme.name} client`);
    await new Promise(r => setTimeout(r, 1000));

    // Transition 2: Verifying transaction signature
    setScanStatus('verifying');
    addLog("Analyzing e-wallet signature token...");
    await new Promise(r => setTimeout(r, 800));
    addLog("Verification success. Transmitting transaction payload.");
    await new Promise(r => setTimeout(r, 800));

    // Transition 3: Authorizing with Server Host
    setScanStatus('authorizing');
    addLog("Contacting bank gateway host auth services...");
    await new Promise(r => setTimeout(r, 1000));
    addLog(`Processing checkout authorization request of ${formatRM(order.total)}...`);
    await new Promise(r => setTimeout(r, 1200));

    if (success) {
      try {
        // Trigger simulated success API on backend
        await paymentService.simulateSuccess(order.orderNumber);
        
        setScanStatus('success');
        addLog("Gateway Response: APPROVED (Authorization Code: BKB-839210)");
        addLog("Order payment status updated in database: PAID");
        addLog("Secure transaction successfully finalized.");
        toast.success(`Payment verified successfully via ${activeTheme.name}!`, { icon: '🎉', duration: 3000 });
        
        setTimeout(() => {
          navigate(`/order/${order.id}/tracking`, { replace: true });
        }, 1800);
      } catch (err: any) {
        setScanStatus('waiting');
        addLog(`Gateway transmission error: ${err.response?.data?.message || 'Authorization failed'}`);
        toast.error('Simulation Failed.');
        setPaying(false);
      }
    } else {
      try {
        // Trigger simulated failure API on backend
        await paymentService.simulateFailure(order.orderNumber);

        setScanStatus('failed');
        addLog("Gateway Response: DECLINED (Code: 51 - Insufficient Funds)");
        addLog("Order payment status updated in database: FAILED");
        addLog("Transaction authorization declined by card network.");
        toast.error('Transaction declined: Insufficient Balance. Please try again.', { icon: '❌', duration: 4000 });
      } catch (err: any) {
        addLog(`Communication failed: ${err.message}`);
      } finally {
        setPaying(false);
      }
    }
  };

  const handleRetryPayment = () => {
    setScanStatus('waiting');
    setPaying(false);
    setLogs([]);
    addLog("Resetting secure payment gateway session...");
    addLog("Regenerating dynamic QR transaction...");
    addLog("Waiting for customer scan...");
  };

  if (loading) {
    return (
      <PageShell activeKey="/cart">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
          <BurgerLoader message="Loading secure payment session..." />
        </div>
      </PageShell>
    );
  }

  // Error boundary or validation failures (e.g. invalid token, wrong owner)
  if (errorMsg) {
    return (
      <PageShell activeKey="/cart">
        <div style={{ maxWidth: 480, margin: '60px auto', padding: '0 16px' }}>
          <div style={{
            background: 'var(--surface)',
            borderRadius: 'var(--radius-lg)',
            border: '2px solid rgba(220,38,38,0.2)',
            padding: 30,
            textAlign: 'center',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <XCircle size={48} style={{ color: 'var(--red)', marginBottom: 16 }} />
            <h2 style={{ fontFamily: 'Poppins', fontWeight: 800, fontSize: '1.2rem', color: 'var(--text-primary)', marginBottom: 10 }}>
              Access Denied
            </h2>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 20 }}>
              {errorMsg}
            </p>
            <button
              onClick={() => navigate('/menu')}
              className="bkb-button-outline"
              style={{ padding: '8px 20px', fontSize: '0.82rem', fontWeight: 700 }}
            >
              Back to Menu
            </button>
          </div>
        </div>
      </PageShell>
    );
  }

  // Double payment prevention: Display Already Paid screen
  if (order && order.paymentStatus === 'PAID') {
    return (
      <PageShell activeKey="/cart">
        <div style={{ maxWidth: 480, margin: '60px auto', padding: '0 16px' }}>
          <div style={{
            background: 'var(--surface)',
            borderRadius: 'var(--radius-lg)',
            border: '2px solid rgba(34,197,94,0.2)',
            padding: '30px 24px',
            textAlign: 'center',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <CheckCircle2 size={54} style={{ color: 'var(--success)', marginBottom: 16 }} />
            <h2 style={{ fontFamily: 'Poppins', fontWeight: 800, fontSize: '1.25rem', color: 'var(--text-primary)', marginBottom: 10 }}>
              Payment Already Completed
            </h2>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 24 }}>
              This transaction has already been finalized and paid. Your order is being processed by our kitchen crew.
            </p>
            <button
              onClick={() => navigate(`/order/${order.id}/tracking`, { replace: true })}
              style={{
                background: 'var(--success)',
                color: '#white',
                border: 'none',
                borderRadius: 10,
                padding: '12px 24px',
                fontFamily: 'Poppins',
                fontWeight: 700,
                fontSize: '0.86rem',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(34,197,94,0.2)'
              }}
            >
              Go to Order Tracking
            </button>
          </div>
        </div>
      </PageShell>
    );
  }

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&color=${activeTheme.primaryColor.replace('#', '')}&data=duitnow://pay?id=bkb-outlet-1%26amount=${order.total}%26ref=${order.orderNumber}%26token=${token}`;

  return (
    <PageShell activeKey="/cart">
      {paying && (
        <FullScreenLoader
          message={
            scanStatus === 'detected' ? 'QR Scanned...' :
            scanStatus === 'verifying' ? 'Verifying payment...' :
            scanStatus === 'authorizing' ? 'Authorizing transaction...' :
            scanStatus === 'success' ? 'Confirming order...' :
            'Processing payment...'
          }
          subtitle="Please do not refresh or leave this page."
        />
      )}
      <div className="page-content" style={{ color: 'var(--text-primary)', maxWidth: 520, margin: '0 auto', paddingBottom: 60 }}>
        
        {/* Style block injection for keyframe animations (Scanner Laser & Pulsing Glow) */}
        <style>{`
          @keyframes scan-laser {
            0% { top: 0%; }
            50% { top: 100%; }
            100% { top: 0%; }
          }
          @keyframes pulse-glow {
            0% { box-shadow: 0 0 8px rgba(0,0,0,0.1); }
            50% { box-shadow: 0 0 20px ${activeTheme.glowColor}; }
            100% { box-shadow: 0 0 8px rgba(0,0,0,0.1); }
          }
          .laser-scanner-line {
            position: absolute;
            left: 0;
            right: 0;
            height: 3px;
            background: linear-gradient(90deg, transparent, ${activeTheme.primaryColor}, transparent);
            boxShadow: 0 0 10px ${activeTheme.primaryColor};
            animation: scan-laser 2.5s infinite linear;
            z-index: 5;
          }
          .pulse-qr-container {
            position: relative;
            padding: 10px;
            background: white;
            border-radius: var(--radius-lg);
            border: 2px solid ${activeTheme.borderColor};
            animation: pulse-glow 3s infinite ease-in-out;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justifyContent: center;
            width: 210px;
            height: 210px;
            overflow: hidden;
          }
        `}</style>

        {/* Codashop-inspired Dynamic QR Card */}
        <div style={{
          background: 'var(--surface)',
          borderRadius: 'var(--radius-lg)',
          border: '1.5px solid var(--border)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          flexDirection: 'column',
        }}>
          {/* Header styling dynamically matching selected channel */}
          <div style={{
            background: activeTheme.gradient,
            color: 'white',
            padding: '24px 20px',
            textAlign: 'center',
            position: 'relative'
          }}>
            {/* Logo simulation */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'white',
              padding: '6px',
              borderRadius: '50%',
              marginBottom: 10,
              boxShadow: '0 4px 10px rgba(0,0,0,0.15)'
            }}>
              {activeTheme.logo}
            </div>

            <div style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.8, opacity: 0.9 }}>
              {activeTheme.name} Payment
            </div>
            
            <div style={{ fontFamily: 'Poppins', fontWeight: 900, fontSize: '1.9rem', marginTop: 4, marginBottom: 4 }}>
              {formatRM(order.total)}
            </div>
            
            <div style={{ fontSize: '0.78rem', opacity: 0.95 }}>
              Order Reference: <strong>#{order.orderNumber}</strong>
            </div>
          </div>

          {/* Body content */}
          <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
            
            {/* Live Countdown Timer */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: timeLeft < 60 ? 'rgba(239,68,68,0.12)' : 'rgba(255,107,0,0.06)',
              border: timeLeft < 60 ? '1.5px solid rgba(239,68,68,0.3)' : '1.5px solid rgba(255,107,0,0.15)',
              color: timeLeft < 60 ? '#ef4444' : 'var(--red)',
              padding: '6px 14px',
              borderRadius: 20,
              fontSize: '0.8rem',
              fontWeight: 800,
              animation: timeLeft < 60 ? 'pulse 1s infinite' : 'none'
            }}>
              <Timer size={14} />
              <span>Complete payment within: {formatTime(timeLeft)}</span>
            </div>

            {/* QR Code Container with Pulsing Border & Laser Scanner Line */}
            <div className="pulse-qr-container" style={{ position: 'relative' }}>
              {!qrLoaded && (
                <div style={{ position: 'absolute', inset: 0, background: 'white', zIndex: 4 }}>
                  <QRSkeleton />
                </div>
              )}
              <img
                src={qrUrl}
                alt="DuitNow Payment QR Code"
                onLoad={() => setQrLoaded(true)}
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  borderRadius: 8, 
                  opacity: qrLoaded ? 1 : 0,
                  transition: 'opacity 0.4s ease-in-out'
                }}
              />
              
              {/* Laser scanner line element */}
              {qrLoaded && scanStatus !== 'success' && scanStatus !== 'failed' && (
                <div className="laser-scanner-line" />
              )}
              
              {/* Scan Overlay Success State */}
              {scanStatus === 'success' && (
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(255,255,255,0.92)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--success)',
                  gap: 8,
                  borderRadius: 10
                }}>
                  <CheckCircle2 size={46} />
                  <span style={{ fontWeight: 800, fontSize: '0.86rem' }}>Payment Authorized</span>
                </div>
              )}

              {/* Scan Overlay Failure State */}
              {scanStatus === 'failed' && (
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(255,255,255,0.92)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--red)',
                  gap: 8,
                  borderRadius: 10
                }}>
                  <XCircle size={46} />
                  <span style={{ fontWeight: 800, fontSize: '0.86rem' }}>Authorization Failed</span>
                </div>
              )}
            </div>

            {/* Dynamic Status Progress Bar */}
            <div style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: 12,
              background: 'var(--cream-dark)',
              border: '1.5px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              fontSize: '0.78rem',
              fontWeight: 700,
              color: 'var(--text-primary)'
            }}>
              {scanStatus === 'waiting' && (
                <>
                  <RefreshCw size={14} className="animate-spin" style={{ color: activeTheme.primaryColor }} />
                  <span>Waiting for scan code authorization...</span>
                </>
              )}
              {scanStatus === 'detected' && (
                <>
                  <RefreshCw size={14} className="animate-spin" style={{ color: '#d97706' }} />
                  <span style={{ color: '#d97706' }}>E-wallet scanned! PIN validation pending...</span>
                </>
              )}
              {scanStatus === 'verifying' && (
                <>
                  <RefreshCw size={14} className="animate-spin" style={{ color: '#3b82f6' }} />
                  <span style={{ color: '#3b82f6' }}>Verifying transaction signature...</span>
                </>
              )}
              {scanStatus === 'authorizing' && (
                <>
                  <RefreshCw size={14} className="animate-spin" style={{ color: '#7c3aed' }} />
                  <span style={{ color: '#7c3aed' }}>Contacting bank host authorization...</span>
                </>
              )}
              {scanStatus === 'success' && (
                <>
                  <CheckCircle2 size={14} style={{ color: 'var(--success)' }} />
                  <span style={{ color: 'var(--success)' }}>Transaction Success! Redirecting...</span>
                </>
              )}
              {scanStatus === 'failed' && (
                <>
                  <XCircle size={14} style={{ color: 'var(--red)' }} />
                  <span style={{ color: 'var(--red)' }}>Transaction Declined / Failed</span>
                </>
              )}
            </div>

            {/* Real-time Activity Console Log */}
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                📟 Real-Time Transaction Logs
              </div>
              <div
                ref={consoleRef}
                style={{
                  background: '#0d1117',
                  borderRadius: 10,
                  padding: '12px',
                  fontFamily: 'Courier New, monospace',
                  fontSize: '0.74rem',
                  color: '#4ade80',
                  maxHeight: 120,
                  overflowY: 'auto',
                  textAlign: 'left',
                  border: '1.5px solid #21262d',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                  boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.5)'
                }}
              >
                {logs.length === 0 ? (
                  <div style={{ color: '#8b949e' }}>Booting secure transaction channel...</div>
                ) : (
                  logs.map((log, index) => (
                    <div key={index} style={{ wordBreak: 'break-all' }}>
                      <span style={{ color: '#58a6ff' }}>{log.slice(0, 10)}</span>
                      <span>{log.slice(10)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* instructions list based on selected payment channel */}
            <div style={{
              fontSize: '0.74rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.5,
              width: '100%',
              borderTop: '1px solid var(--border)',
              paddingTop: 16
            }}>
              <div style={{ fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                📖 Payment Instructions:
              </div>
              <ol style={{ paddingLeft: 16, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {activeTheme.instructions.map((inst, index) => (
                  <li key={index}>{inst}</li>
                ))}
              </ol>
            </div>
          </div>

          {/* Development / Scan Simulator */}
          <div style={{
            background: 'var(--cream-dark)',
            borderTop: '1px solid var(--border)',
            padding: '16px 20px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>
              ⚙️ FYP Payment Demonstration Simulator
            </div>
            
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => handleSimulatePayment(true)}
                disabled={paying || scanStatus === 'success'}
                style={{
                  flex: 1,
                  background: 'linear-gradient(135deg, #16a34a, #15803d)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  padding: '10px 14px',
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  cursor: paying || scanStatus === 'success' ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  boxShadow: '0 2px 6px rgba(22,163,74,0.2)',
                  transition: 'opacity 0.2s',
                  opacity: (paying || scanStatus === 'success') ? 0.6 : 1
                }}
              >
                Simulate Scan Success
              </button>
              
              {scanStatus === 'failed' ? (
                <button
                  type="button"
                  onClick={handleRetryPayment}
                  style={{
                    flex: 1,
                    background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 8,
                    padding: '10px 14px',
                    fontWeight: 700,
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6
                  }}
                >
                  Retry Payment
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSimulatePayment(false)}
                  disabled={paying || scanStatus === 'success'}
                  style={{
                    flex: 1,
                    background: 'transparent',
                    color: 'var(--text-secondary)',
                    border: '1.5px solid var(--border)',
                    borderRadius: 8,
                    padding: '10px 14px',
                    fontWeight: 700,
                    fontSize: '0.78rem',
                    cursor: paying || scanStatus === 'success' ? 'not-allowed' : 'pointer',
                    transition: 'opacity 0.2s',
                    opacity: (paying || scanStatus === 'success') ? 0.6 : 1
                  }}
                >
                  Simulate Payment Failure
                </button>
              )}
            </div>
          </div>

          {/* Bottom Security Footer */}
          <div style={{
            padding: '12px',
            textAlign: 'center',
            fontSize: '0.68rem',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            background: 'var(--surface)'
          }}>
            <ShieldCheck size={14} style={{ color: 'var(--success)' }} />
            <span>FYP Secure Simulated Gateway. No actual financial capture occurs.</span>
          </div>
        </div>

      </div>
    </PageShell>
  );
};

export default PaymentPage;

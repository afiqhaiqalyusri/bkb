import React from 'react';
import { useNavigate } from 'react-router-dom';
import { StateLayout } from '../../components/ui/StateLayout';
import { PaymentErrorIllustration } from '../../components/ui/illustrations/PaymentErrorIllustration';

export const PaymentErrorPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[var(--cream)] flex items-center justify-center p-6">
      <StateLayout
        illustration={<PaymentErrorIllustration />}
        title="Payment Declined"
        description="We couldn't process your payment. Don't worry, your order is saved in your cart. Please try another payment method."
        primaryAction={
          <button onClick={() => navigate('/checkout')} className="btn-primary w-full sm:w-auto">
            Return to Checkout
          </button>
        }
        secondaryAction={
          <button onClick={() => navigate('/cart')} className="btn-outline w-full sm:w-auto">
            View Cart
          </button>
        }
      />
    </div>
  );
};

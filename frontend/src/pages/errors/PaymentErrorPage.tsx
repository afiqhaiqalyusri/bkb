import React from 'react';
import { ErrorState } from '../../components/ui/ErrorState';
import { CreditCard, RefreshCw, ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const PaymentErrorPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <ErrorState
      title="Payment Unsuccessful"
      message="Your payment could not be completed. Please try again or choose another payment method."
      icon={<CreditCard size={48} />}
      showHomeButton={false}
      actions={
        <>
          <button
            onClick={() => navigate('/checkout')}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-br from-primary to-primary-dark text-white font-bold rounded-xl shadow-red hover:-translate-y-0.5 hover:shadow-red-lg transition-all focus:ring-4 focus:ring-red-100 active:scale-95"
          >
            <RefreshCw size={18} />
            Retry Payment
          </button>
          <button
            onClick={() => navigate('/cart')}
            className="flex items-center gap-2 px-6 py-3 bg-white text-gray-700 font-bold rounded-xl border border-gray-200 hover:bg-gray-50 hover:text-gray-900 transition-all focus:ring-4 focus:ring-gray-100 active:scale-95"
          >
            <ShoppingCart size={18} />
            Back to Cart
          </button>
        </>
      }
    />
  );
};

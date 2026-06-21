import React, { useEffect } from 'react';
import { ErrorState } from '../../components/ui/ErrorState';
import { Lock, LogIn } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

export const UnauthorizedPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/login', { state: { from: location.pathname } });
    }, 5000);
    return () => clearTimeout(timer);
  }, [navigate, location]);

  return (
    <ErrorState
      title="Session Expired"
      message="Please log in again to continue. You will be redirected automatically in 5 seconds."
      icon={<Lock size={48} />}
      showHomeButton={true}
      actions={
        <button
          onClick={() => navigate('/login', { state: { from: location.pathname } })}
          className="flex items-center gap-2 px-6 py-3 bg-white text-gray-700 font-bold rounded-xl border border-gray-200 hover:bg-gray-50 hover:text-gray-900 transition-all focus:ring-4 focus:ring-gray-100 active:scale-95"
        >
          <LogIn size={18} />
          Login Now
        </button>
      }
    />
  );
};

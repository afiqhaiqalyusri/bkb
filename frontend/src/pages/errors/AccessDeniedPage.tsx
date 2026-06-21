import React from 'react';
import { ErrorState } from '../../components/ui/ErrorState';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const AccessDeniedPage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <ErrorState
      title="Access Denied"
      message="You don't have permission to access this page."
      icon={<ShieldAlert size={48} />}
      showHomeButton={true}
      actions={
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-6 py-3 bg-white text-gray-700 font-bold rounded-xl border border-gray-200 hover:bg-gray-50 hover:text-gray-900 transition-all focus:ring-4 focus:ring-gray-100 active:scale-95"
        >
          <ArrowLeft size={18} />
          Go Back
        </button>
      }
    />
  );
};

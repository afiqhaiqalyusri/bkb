import React from 'react';
import { ErrorState } from '../../components/ui/ErrorState';
import { FileQuestion, Search, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <ErrorState
      title="Oops! Page Not Found"
      message="The page you're looking for doesn't exist or may have been moved."
      icon={<FileQuestion size={48} />}
      showHomeButton={false}
      actions={
        <>
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-br from-primary to-primary-dark text-white font-bold rounded-xl shadow-red hover:-translate-y-0.5 hover:shadow-red-lg transition-all focus:ring-4 focus:ring-red-100 active:scale-95"
          >
            <Home size={18} />
            Go Home
          </button>
          <button
            onClick={() => navigate('/menu')}
            className="flex items-center gap-2 px-6 py-3 bg-white text-gray-700 font-bold rounded-xl border border-gray-200 hover:bg-gray-50 hover:text-gray-900 transition-all focus:ring-4 focus:ring-gray-100 active:scale-95"
          >
            <Search size={18} />
            Browse Menu
          </button>
        </>
      }
    />
  );
};

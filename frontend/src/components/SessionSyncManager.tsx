import React, { useEffect, useState } from 'react';
import { STORAGE_KEYS } from '../constants/storage';
import { useAuthStore } from '../store/authStore';

export const SessionSyncManager: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const { user, clearAuth } = useAuthStore();

  useEffect(() => {
    // Development mode uses sessionStorage, so tabs are naturally isolated.
    // The storage event only fires for localStorage changes in OTHER tabs.
    // If DEV mode, we might not get this event, which is intended.
    
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'bkb-auth' || e.key === STORAGE_KEYS.ACCESS_TOKEN) {
        // We only care if they are authenticated in this tab.
        // If a new login happens in another tab, the state in this tab is now stale.
        const currentUserInThisTab = useAuthStore.getState().user;
        
        if (currentUserInThisTab) {
          setShowModal(true);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleRefresh = () => {
    // Reloads the page to pick up the new state from localStorage
    window.location.reload();
  };

  const handleLoginAgain = () => {
    // Completely clear out everything and start fresh
    clearAuth();
    setShowModal(false);
    window.location.href = '/login';
  };

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[99999] flex items-center justify-center animate-fade-in p-4">
      <div className="bg-[var(--background)] rounded-2xl max-w-md w-full p-8 shadow-2xl border border-[var(--border)] animate-scale-in text-center">
        
        <div className="w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-900/30 text-primary flex items-center justify-center mx-auto mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
        </div>

        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-3 tracking-tight">
          Session Changed
        </h2>
        
        <p className="text-[var(--text-secondary)] dark:text-slate-400 mb-8 leading-relaxed">
          Another account has signed in using this browser. Your current session in this tab is no longer active and has been securely locked.
        </p>

        <div className="flex flex-col gap-3">
          <button 
            onClick={handleRefresh}
            className="w-full bg-primary text-white font-bold py-3 px-4 rounded-xl hover:bg-red-dark transition-all transform hover:-translate-y-0.5 shadow-lg shadow-orange-500/30"
          >
            Switch to New Session
          </button>
          
          <button 
            onClick={handleLoginAgain}
            className="w-full bg-transparent text-[var(--text-secondary)] dark:text-slate-400 font-bold py-3 px-4 rounded-xl border-2 border-[var(--border)] hover:bg-[var(--background)] dark:hover:bg-slate-800 transition-colors"
          >
            Log Out & Sign In
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import api from '../services/api';
import { ApiResponse } from '../types';

interface IngredientOutage {
  name: string;
  outOfStock: boolean;
}

export const IngredientOutageBanner: React.FC = () => {
  const [outages, setOutages] = useState<IngredientOutage[]>([]);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const fetchOutages = async () => {
      try {
        const response = await api.get<ApiResponse<IngredientOutage[]>>('/api/ingredients/outage/active');
        setOutages(response.data.data || []);
      } catch (err) {
        console.error('Failed to fetch ingredient outages', err);
      }
    };
    fetchOutages();
    
    // Poll every 30 seconds to get the latest status
    const interval = setInterval(fetchOutages, 30000);
    return () => clearInterval(interval);
  }, []);

  if (outages.length === 0 || dismissed) {
    return null;
  }

  const names = outages.map(o => o.name).join(', ');

  return (
    <div style={{
      background: 'rgba(239, 68, 68, 0.1)',
      borderBottom: '1px solid rgba(239, 68, 68, 0.2)',
      padding: '12px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 16
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ color: 'var(--danger)' }}>
          <AlertTriangle size={20} />
        </div>
        <div>
          <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Notice: Ingredient Unavailability
          </p>
          <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            We are currently out of stock for: <strong>{names}</strong>. Affected menu items may be unavailable or modified.
          </p>
        </div>
      </div>
      <button
        onClick={() => setDismissed(true)}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--text-secondary)',
          cursor: 'pointer',
          padding: 4,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 4
        }}
      >
        <X size={18} />
      </button>
    </div>
  );
};
